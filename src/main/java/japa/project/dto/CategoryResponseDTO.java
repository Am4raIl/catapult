package japa.project.dto;

import java.util.List;
import java.util.UUID;

public record CategoryResponseDTO(
        UUID id,
        String name,
        List<ProductSummaryResponseDTO> products
) {
}
