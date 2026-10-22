CREATE TABLE product(
    id BINARY(16) NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    photo VARCHAR(255) NULL,
    category_id BINARY(16) NOT NULL,
    PRIMARY KEY(id),
    CONSTRAINT fk_product_category
        FOREIGN KEY(category_id) REFERENCES category (id)
);
