package japa.project;

import japa.project.entity.Category;
import japa.project.entity.Product;
import japa.project.repository.CategoryRepository;
import japa.project.repository.ProductRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.profiles.active=test",
        "spring.datasource.url=jdbc:mysql://localhost:3306/project_api_test_5?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true",
        "spring.datasource.username=root",
        "spring.datasource.password=1234",
        "spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver",
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MariaDBDialect",
        "spring.jpa.properties.hibernate.boot.allow_jdbc_metadata_access=false",
        "spring.flyway.enabled=true",
        "spring.flyway.locations=classpath:db/migration"
})
@AutoConfigureMockMvc
class ApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @BeforeEach
    @AfterEach
    void cleanCatalog() {
        productRepository.deleteAll();
        categoryRepository.deleteAll();
    }

    @Test
    void authCheckAndDashboardRequireSessionAndReturnExpectedMetrics() throws Exception {
        Category electronics = category("Eletrônicos");
        Category home = category("Casa");
        product(electronics, "Fone", "25.00", 0, null);
        product(electronics, "Monitor", "100.00", 2, "monitor.png");
        product(home, "Sofá", "250.00", 10, "sofa.png");

        mockMvc.perform(get("/api/auth/check"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Autenticação necessária. Faça login para continuar."));
        mockMvc.perform(get("/api/dashboard/summary"))
                .andExpect(status().isUnauthorized());

        MockHttpSession session = login();

        mockMvc.perform(get("/api/auth/check").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.username").value("admin"));

        mockMvc.perform(get("/api/dashboard/summary").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total_products").value(3))
                .andExpect(jsonPath("$.total_categories").value(2))
                .andExpect(jsonPath("$.total_inventory_value").value(2700))
                .andExpect(jsonPath("$.average_product_price").value(125))
                .andExpect(jsonPath("$.products_without_photo").value(1))
                .andExpect(jsonPath("$.low_stock_count").value(2));

        mockMvc.perform(get("/api/dashboard/products-by-category").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
        mockMvc.perform(get("/api/dashboard/price-ranges").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].range").value("R$ 0 - R$ 50"))
                .andExpect(jsonPath("$[0].count").value(1))
                .andExpect(jsonPath("$[1].count").value(1))
                .andExpect(jsonPath("$[2].count").value(1));
    }

    @Test
    void productFiltersCombineAndUnknownStockStatusIsIgnored() throws Exception {
        Category category = category("Móveis");
        product(category, "Cadeira", "25.00", 0, null);
        product(category, "Mesa", "150.00", 3, "mesa.png");
        product(category, "Armário", "300.00", 9, "armario.png");

        mockMvc.perform(get("/api/products")
                        .param("nome", "cadeira")
                        .param("category_id", category.getId().toString())
                        .param("min_price", "20")
                        .param("max_price", "30")
                        .param("has_photo", "false")
                        .param("stock_status", "out_of_stock"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Cadeira"));

        mockMvc.perform(get("/api/products").param("stock_status", "LOW_STOCK"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Mesa"));
        mockMvc.perform(get("/api/products").param("stock_status", "IN_STOCK"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Armário"));
        mockMvc.perform(get("/api/products").param("stock_status", "UNKNOWN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3));
    }

    @Test
    void stockPatchRequiresAuthenticationValidatesItsPayloadAndPersistsTheValue() throws Exception {
        Product product = product(category("Papelaria"), "Caderno", "20.00", 1, null);
        String endpoint = "/api/products/" + product.getId() + "/stock";

        mockMvc.perform(patch(endpoint)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"stock_quantity\":7}"))
                .andExpect(status().isUnauthorized());

        MockHttpSession session = login();
        mockMvc.perform(patch(endpoint).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(patch(endpoint).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"stock_quantity\":-1}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(patch(endpoint).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"stock_quantity\":7}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stock_quantity").value(7));

        org.junit.jupiter.api.Assertions.assertEquals(7,
                productRepository.findById(product.getId()).orElseThrow().getStockQuantity());
    }

    @Test
    void authenticatedCreateMapsNewProductFieldsAndUsesDefaults() throws Exception {
        Category category = category("Livros");
        MockHttpSession session = login();

        mockMvc.perform(post("/api/products").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Livro","price":49.90,"category_id":"%s","stock_quantity":4,"cost_price":20.50,"active":false}
                                """.formatted(category.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.stock_quantity").value(4))
                .andExpect(jsonPath("$.cost_price").value(20.5))
                .andExpect(jsonPath("$.active").value(false))
                .andExpect(jsonPath("$.created_at").exists())
                .andExpect(jsonPath("$.updated_at").exists());
    }

    private MockHttpSession login() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"1234\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private Category category(String name) {
        Category category = new Category();
        category.setName(name);
        return categoryRepository.saveAndFlush(category);
    }

    private Product product(Category category, String name, String price, int stockQuantity, String photo) {
        Product product = new Product();
        product.setName(name);
        product.setPrice(new BigDecimal(price));
        product.setCategory(category);
        product.setStockQuantity(stockQuantity);
        product.setPhoto(photo);
        product.setActive(Boolean.TRUE);
        return productRepository.saveAndFlush(product);
    }
}
