package japa.project.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateStockRequestDTO(
        @NotNull(message = "A quantidade em estoque é obrigatória")
        @Min(value = 0, message = "A quantidade deve ser maior ou igual a 0")
        Integer stock_quantity
) {
}
