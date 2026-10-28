package japa.project.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ProductResponseDTO(
        UUID id,
        String name,
        BigDecimal price,
        CategorySummaryResponseDTO category,
        String photo,
        Integer stock_quantity,
        BigDecimal cost_price,
        LocalDateTime created_at,
        LocalDateTime updated_at,
        Boolean active
) {
    public ProductResponseDTO(UUID id, String name, BigDecimal price, CategorySummaryResponseDTO category, String photo) {
        this(id, name, price, category, photo, null, null, null, null, true);
    }
}
