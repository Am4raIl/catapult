package japa.project.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductSummaryResponseDTO(
        UUID id,
        String name,
        BigDecimal price,
        String photo
) {
}
