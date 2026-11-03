package japa.project;

import japa.project.entity.Category;
import japa.project.entity.Product;
import japa.project.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.profiles.active=test",
        "spring.datasource.url=${CHECKOUT_TEST_DB_URL:jdbc:mysql://127.0.0.1:13316/catapult_checkout_test?createDatabaseIfNotExist=true&allowPublicKeyRetrieval=true&useSSL=false}",
        "spring.datasource.username=root",
        "spring.datasource.password=catapult-checkout-test",
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect",
        "spring.flyway.enabled=true"
})
@AutoConfigureMockMvc
class CheckoutIntegrationTests {
    @Autowired MockMvc mvc;
    @Autowired ProductRepository products;
    @Autowired CategoryRepository categories;
    @Autowired CheckoutReceiptRepository receipts;

    @BeforeEach @AfterEach
    void clean() { receipts.deleteAll(); products.deleteAll(); categories.deleteAll(); }

    @Test
    void publicCheckoutDecrementsAllItemsAndReplaysWithoutAnotherDeduction() throws Exception {
        Product a = product("A", 5, true), b = product("B", 8, true);
        String body = body(UUID.randomUUID(), item(a, 2) + "," + item(b, 3));
        for (int retry = 0; retry < 2; retry++) {
            mvc.perform(post("/api/checkout").contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(62.5))
                    .andExpect(jsonPath("$.item_count").value(5));
        }
        assertEquals(3, stock(a)); assertEquals(5, stock(b)); assertEquals(1, receipts.count());
    }

    @Test
    void stockConflictRollsBackEntireBagAndReceipt() throws Exception {
        Product a = product("A", 8, true), b = product("B", 1, true);
        mvc.perform(post("/api/checkout").contentType(MediaType.APPLICATION_JSON)
                        .content(body(UUID.randomUUID(), item(a, 2) + "," + item(b, 2))))
                .andExpect(status().isConflict());
        assertEquals(8, stock(a)); assertEquals(1, stock(b)); assertEquals(0, receipts.count());
    }

    @Test
    void repeatedProductIdsCannotBypassStockValidation() throws Exception {
        Product a = product("A", 5, true);
        mvc.perform(post("/api/checkout").contentType(MediaType.APPLICATION_JSON)
                        .content(body(UUID.randomUUID(), item(a, 3) + "," + item(a, 3))))
                .andExpect(status().isConflict());
        assertEquals(5, stock(a));
    }

    @Test
    void rejectsInactiveMissingZeroNegativeAndEmptyPurchases() throws Exception {
        Product inactive = product("Inativo", 5, false), active = product("Ativo", 5, true);
        for (String entry : new String[]{item(inactive, 1), "{\"product_id\":\"" + UUID.randomUUID() + "\",\"quantity\":1}"}) {
            mvc.perform(post("/api/checkout").contentType(MediaType.APPLICATION_JSON)
                    .content(body(UUID.randomUUID(), entry))).andExpect(status().isConflict());
        }
        for (String entry : new String[]{item(active, 0), item(active, -1), "", "null"}) {
            mvc.perform(post("/api/checkout").contentType(MediaType.APPLICATION_JSON)
                    .content(body(UUID.randomUUID(), entry))).andExpect(status().isBadRequest());
        }
        assertEquals(5, stock(active)); assertEquals(5, stock(inactive));
    }

    @Test
    void anIdempotencyKeyCannotBeReusedWithDifferentItems() throws Exception {
        Product a = product("A", 5, true); UUID id = UUID.randomUUID();
        mvc.perform(post("/api/checkout").contentType(MediaType.APPLICATION_JSON).content(body(id, item(a, 1))))
                .andExpect(status().isOk());
        mvc.perform(post("/api/checkout").contentType(MediaType.APPLICATION_JSON).content(body(id, item(a, 2))))
                .andExpect(status().isUnprocessableEntity());
        assertEquals(4, stock(a));
    }

    @Test
    void simultaneousPurchasesCannotOversell() throws Exception {
        Product a = product("Disputado", 5, true);
        int[] statuses = race(body(UUID.randomUUID(), item(a, 4)), body(UUID.randomUUID(), item(a, 4)));
        java.util.Arrays.sort(statuses);
        assertArrayEquals(new int[]{200, 409}, statuses);
        assertEquals(1, stock(a)); assertEquals(1, receipts.count());
    }

    @Test
    void simultaneousRetriesOnlyDeductOnce() throws Exception {
        Product a = product("Disputado", 5, true);
        String request = body(UUID.randomUUID(), item(a, 2));
        assertArrayEquals(new int[]{200, 200}, race(request, request));
        assertEquals(3, stock(a)); assertEquals(1, receipts.count());
    }

    @Test
    void activeFilterKeepsPublicPageCountsAccurate() throws Exception {
        product("Visível", 5, true); product("Oculto", 5, false);
        mvc.perform(get("/api/products").param("active", "true").param("size", "1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.totalPages").value(1)).andExpect(jsonPath("$.content[0].name").value("Visível"));
    }

    private int[] race(String first, String second) throws Exception {
        CountDownLatch start = new CountDownLatch(1);
        try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
            Future<Integer> one = executor.submit(() -> { start.await(); return submit(first); });
            Future<Integer> two = executor.submit(() -> { start.await(); return submit(second); });
            start.countDown();
            return new int[]{one.get(20, TimeUnit.SECONDS), two.get(20, TimeUnit.SECONDS)};
        }
    }
    private int submit(String body) throws Exception {
        return mvc.perform(post("/api/checkout").contentType(MediaType.APPLICATION_JSON).content(body))
                .andReturn().getResponse().getStatus();
    }
    private String body(UUID id, String items) { return "{\"request_id\":\"" + id + "\",\"items\":[" + items + "]}"; }
    private String item(Product product, int quantity) { return "{\"product_id\":\"" + product.getId() + "\",\"quantity\":" + quantity + "}"; }
    private int stock(Product product) { return products.findById(product.getId()).orElseThrow().getStockQuantity(); }
    private Product product(String name, int stock, boolean active) {
        Category category = new Category(); category.setName("Categoria " + name); categories.saveAndFlush(category);
        Product product = new Product(); product.setName(name); product.setCategory(category);
        product.setPrice(new BigDecimal("12.50")); product.setStockQuantity(stock); product.setActive(active);
        return products.saveAndFlush(product);
    }
}
