package japa.project.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductRequestDTO(
        @NotBlank(message = "O nome do produto é obrigatório")
        String name,

        @NotNull
        @DecimalMin(value = "0.01", message = "O preço deve ser válido")
        BigDecimal price,

        @NotNull(message = "A categoria é obrigatória")
        UUID category_id,

        Integer stock_quantity,

        BigDecimal cost_price,

        Boolean active
) {
    public ProductRequestDTO(String name, BigDecimal price, UUID category_id) {
        this(name, price, category_id, 0, null, true);
    }
}
