package japa.project.factory;

import japa.project.entity.Category;
import japa.project.entity.Product;
import net.datafaker.Faker;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

public class ProductFactory {
    private static final Faker faker = new Faker();
    private static final Path UPLOADS_DIR = Paths.get("uploads/products");
    private static final String DEFAULT_PHOTO = "/images/default-product.png";

    public static Product create(Category category) {
        Product product = new Product();
        product.setName(faker.commerce().productName());
        product.setPrice(BigDecimal.valueOf(faker.number().numberBetween(100, 9999900)).movePointLeft(2));
        product.setCategory(category);
        product.setPhoto(generateDummyImage());
        product.setStockQuantity(faker.number().numberBetween(0, 100));
        BigDecimal costPrice = product.getPrice().multiply(BigDecimal.valueOf(0.6 + Math.random() * 0.3));
        product.setCostPrice(costPrice.setScale(2, java.math.RoundingMode.HALF_UP));
        product.setActive(Boolean.TRUE);
        return product;
    }

    private static String generateDummyImage() {
        try (InputStream in = ProductFactory.class.getResourceAsStream(DEFAULT_PHOTO)) {
            if (in == null) {
                return null;
            }
            Files.createDirectories(UPLOADS_DIR);
            String filename = UUID.randomUUID() + ".png";
            Files.copy(in, UPLOADS_DIR.resolve(filename));
            return filename;
        } catch (IOException e) {
            return null;
        }
    }
}
