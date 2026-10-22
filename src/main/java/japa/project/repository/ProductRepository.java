package japa.project.repository;

import japa.project.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    Page<Product> findByNameContainingIgnoreCase(String name, Pageable pageable);

    boolean existsByCategoryId(UUID category_id);

    @Query("SELECT COALESCE(SUM(p.price * p.stockQuantity), 0) FROM Product p")
    BigDecimal sumInventoryValue();

    @Query("SELECT COALESCE(AVG(p.price), 0) FROM Product p")
    BigDecimal averageProductPrice();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.photo IS NULL")
    Long countProductsWithoutPhoto();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.stockQuantity <= 5")
    Long countLowStockProducts();
}
