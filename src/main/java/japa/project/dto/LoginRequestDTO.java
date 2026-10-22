package japa.project.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequestDTO(
        @NotBlank(message = "O campo username é obrigatório.") String username,
        @NotBlank(message = "O campo password é obrigatório.") String password) {
}
