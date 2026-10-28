package japa.project.controller;

import jakarta.validation.Valid;
import japa.project.dto.CategoryRequestDTO;
import japa.project.dto.CategoryResponseDTO;
import japa.project.service.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {
    private final CategoryService service;

    public CategoryController(CategoryService service){
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponseDTO>> index(){
        return ResponseEntity.ok(service.listAll());
    }

    @PostMapping
    public ResponseEntity<CategoryResponseDTO> store(@Valid @RequestBody CategoryRequestDTO request) {
        CategoryResponseDTO criada = service.save(request);
        return ResponseEntity
                .created(URI.create("/api/categories/" + criada.id()))
                .body(criada);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponseDTO> show(@PathVariable UUID id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponseDTO> update(
            @PathVariable UUID id, @Valid @RequestBody CategoryRequestDTO request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> destroy(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
