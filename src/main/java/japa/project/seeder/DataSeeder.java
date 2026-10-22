package japa.project.seeder;

import japa.project.entity.Category;
import japa.project.factory.CategoryFactory;
import japa.project.factory.ProductFactory;
import japa.project.repository.CategoryRepository;
import japa.project.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@Profile("dev")
public class DataSeeder implements CommandLineRunner {
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public DataSeeder(CategoryRepository categoryRepository,
                      ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {
        if (categoryRepository.count() > 0) {
            return;
        }

        List<Category> categories = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            categories.add(categoryRepository.save(CategoryFactory.create()));
        }

        for (Category category : categories) {
            for (int i = 0; i < 4; i++) {
                productRepository.save(ProductFactory.create(category));
            }
        }

        System.out.println("Seeder: 5 categorias e 20 produtos criados com sucesso.");
    }
}
