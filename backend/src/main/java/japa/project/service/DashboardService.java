package japa.project.service;

import japa.project.dto.dashboard.DashboardSummaryDTO;
import japa.project.dto.dashboard.PriceRangeDTO;
import japa.project.dto.dashboard.ProductsByCategoryDTO;
import japa.project.entity.Product;
import japa.project.repository.CategoryRepository;
import japa.project.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class DashboardService {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public DashboardService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    public DashboardSummaryDTO getSummary() {
        Long totalProducts = productRepository.count();
        Long totalCategories = categoryRepository.count();
        BigDecimal totalInventoryValue = productRepository.sumInventoryValue();
        BigDecimal averageProductPrice = productRepository.averageProductPrice();
        Long productsWithoutPhoto = productRepository.countProductsWithoutPhoto();
        Long lowStockCount = productRepository.countLowStockProducts();

        if (totalInventoryValue == null) {
            totalInventoryValue = BigDecimal.ZERO;
        }
        if (averageProductPrice == null) {
            averageProductPrice = BigDecimal.ZERO;
        }
        if (productsWithoutPhoto == null) {
            productsWithoutPhoto = 0L;
        }
        if (lowStockCount == null) {
            lowStockCount = 0L;
        }
        if (totalProducts == null) {
            totalProducts = 0L;
        }
        if (totalCategories == null) {
            totalCategories = 0L;
        }

        return new DashboardSummaryDTO(
                totalProducts,
                totalCategories,
                totalInventoryValue,
                averageProductPrice,
                productsWithoutPhoto,
                lowStockCount
        );
    }

    public List<ProductsByCategoryDTO> getProductsByCategory() {
        List<Product> products = productRepository.findAll();
        Map<UUID, ProductsByCategoryAccumulator> map = new HashMap<>();

        for (Product product : products) {
            if (product.getCategory() == null) {
                continue;
            }
            UUID categoryId = product.getCategory().getId();
            String categoryName = product.getCategory().getName();
            BigDecimal productValue = product.getPrice() != null && product.getStockQuantity() != null
                    ? product.getPrice().multiply(BigDecimal.valueOf(product.getStockQuantity()))
                    : BigDecimal.ZERO;

            map.computeIfAbsent(categoryId, k -> new ProductsByCategoryAccumulator(categoryId, categoryName))
                    .add(productValue);
        }

        List<ProductsByCategoryDTO> result = new ArrayList<>();
        for (ProductsByCategoryAccumulator acc : map.values()) {
            result.add(new ProductsByCategoryDTO(acc.categoryId, acc.categoryName, acc.productCount, acc.totalValue));
        }
        return result;
    }

    public List<PriceRangeDTO> getPriceRanges() {
        List<Product> products = productRepository.findAll();
        long range1 = 0;
        long range2 = 0;
        long range3 = 0;

        for (Product product : products) {
            BigDecimal price = product.getPrice();
            if (price == null) {
                continue;
            }
            if (price.compareTo(new BigDecimal("50")) <= 0) {
                range1++;
            } else if (price.compareTo(new BigDecimal("200")) <= 0) {
                range2++;
            } else {
                range3++;
            }
        }

        List<PriceRangeDTO> result = new ArrayList<>();
        result.add(new PriceRangeDTO("R$ 0 - R$ 50", range1));
        result.add(new PriceRangeDTO("R$ 51 - R$ 200", range2));
        result.add(new PriceRangeDTO("R$ 201+", range3));
        return result;
    }

    private static class ProductsByCategoryAccumulator {
        UUID categoryId;
        String categoryName;
        long productCount;
        BigDecimal totalValue;

        ProductsByCategoryAccumulator(UUID categoryId, String categoryName) {
            this.categoryId = categoryId;
            this.categoryName = categoryName;
            this.productCount = 0;
            this.totalValue = BigDecimal.ZERO;
        }

        void add(BigDecimal productValue) {
            this.productCount++;
            if (productValue != null) {
                this.totalValue = this.totalValue.add(productValue);
            }
        }
    }
}
