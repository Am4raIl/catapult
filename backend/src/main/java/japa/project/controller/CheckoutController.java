package japa.project.controller;

import jakarta.validation.Valid;
import japa.project.dto.CheckoutRequestDTO;
import japa.project.dto.CheckoutResponseDTO;
import japa.project.service.CheckoutService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {
    private final CheckoutService service;

    public CheckoutController(CheckoutService service) { this.service = service; }

    @PostMapping
    public CheckoutResponseDTO checkout(@Valid @RequestBody CheckoutRequestDTO request) {
        return service.checkout(request);
    }
}
