package japa.project.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
import java.util.UUID;

public record CheckoutRequestDTO(
        @NotNull UUID request_id,
        @NotEmpty @Size(max = 100) List<@NotNull @Valid Item> items
) {
    public record Item(@NotNull UUID product_id, @NotNull @Min(1) Integer quantity) {}
}
