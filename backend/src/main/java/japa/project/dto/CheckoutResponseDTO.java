package japa.project.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record CheckoutResponseDTO(UUID id, BigDecimal total, int item_count) {}
