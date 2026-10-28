package japa.project.dto;

import java.util.UUID;

public record CategorySummaryResponseDTO(
        UUID id,
        String name
) {
}
