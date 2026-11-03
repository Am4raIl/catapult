CREATE TABLE checkout_receipt (
    id BINARY(16) NOT NULL PRIMARY KEY,
    request_signature VARCHAR(64) NOT NULL,
    total DECIMAL(30, 2) NOT NULL,
    item_count INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
