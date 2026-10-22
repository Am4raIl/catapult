package japa.project.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductResponseDTO(
        UUID id,
        String name,
        BigDecimal price,
        CategorySummaryResponseDTO category,
        String photo
) {
}
