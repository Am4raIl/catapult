package japa.project.seeder;

import japa.project.entity.User;
import japa.project.entity.Category;
import japa.project.factory.CategoryFactory;
import japa.project.factory.ProductFactory;
import japa.project.repository.CategoryRepository;
import japa.project.repository.ProductRepository;
import japa.project.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@Profile("dev")
public class DataSeeder implements CommandLineRunner {
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String defaultAdminUsername;
    private final String defaultAdminPassword;

    public DataSeeder(CategoryRepository categoryRepository,
                      ProductRepository productRepository,
                      UserRepository userRepository,
                      PasswordEncoder passwordEncoder,
                      @Value("${app.default-admin.username:admin}") String defaultAdminUsername,
                      @Value("${app.default-admin.password:}") String defaultAdminPassword) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.defaultAdminUsername = defaultAdminUsername;
        this.defaultAdminPassword = defaultAdminPassword;
    }

    @Override
    public void run(String... args) {
        configureDefaultAdmin();

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

    private void configureDefaultAdmin() {
        if (defaultAdminPassword == null || defaultAdminPassword.isBlank()) {
            return;
        }

        User user = userRepository.findByUsername(defaultAdminUsername)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setUsername(defaultAdminUsername);
                    return newUser;
                });

        if (user.getPassword() == null || !passwordEncoder.matches(defaultAdminPassword, user.getPassword())) {
            user.setPassword(passwordEncoder.encode(defaultAdminPassword));
            userRepository.save(user);
        }
    }
}
