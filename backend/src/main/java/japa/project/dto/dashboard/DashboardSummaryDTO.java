package japa.project.dto.dashboard;

import java.math.BigDecimal;

public record DashboardSummaryDTO(
        Long total_products,
        Long total_categories,
        BigDecimal total_inventory_value,
        BigDecimal average_product_price,
        Long products_without_photo,
        Long low_stock_count
) {
}
