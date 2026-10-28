package japa.project.factory;

import japa.project.entity.Category;
import net.datafaker.Faker;

public class CategoryFactory {
    private static final Faker faker = new Faker();

    public static Category create(){
        Category category = new Category();
        category.setName(faker.commerce().productName());
        return category;
    }
}
