package japa.project.dto.dashboard;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductsByCategoryDTO(
        UUID category_id,
        String category_name,
        Long product_count,
        BigDecimal total_value
) {
}
