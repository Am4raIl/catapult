package japa.project.controller;

import japa.project.dto.dashboard.DashboardSummaryDTO;
import japa.project.dto.dashboard.PriceRangeDTO;
import japa.project.dto.dashboard.ProductsByCategoryDTO;
import japa.project.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDTO> getSummary() {
        return ResponseEntity.ok(dashboardService.getSummary());
    }

    @GetMapping("/products-by-category")
    public ResponseEntity<List<ProductsByCategoryDTO>> getProductsByCategory() {
        return ResponseEntity.ok(dashboardService.getProductsByCategory());
    }

    @GetMapping("/price-ranges")
    public ResponseEntity<List<PriceRangeDTO>> getPriceRanges() {
        return ResponseEntity.ok(dashboardService.getPriceRanges());
    }
}
