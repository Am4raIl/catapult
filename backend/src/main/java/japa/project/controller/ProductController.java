package japa.project.controller;

import jakarta.validation.Valid;
import japa.project.dto.ProductRequestDTO;
import japa.project.dto.ProductResponseDTO;
import japa.project.dto.UpdateStockRequestDTO;
import japa.project.service.ProductService;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<ProductResponseDTO>> index(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) UUID category_id,
            @RequestParam(required = false) BigDecimal min_price,
            @RequestParam(required = false) BigDecimal max_price,
            @RequestParam(required = false) Boolean has_photo,
            @RequestParam(required = false) String stock_status,
            @RequestParam(required = false) Boolean active,
            @PageableDefault(size = 10, sort = "name") Pageable pageable) {
        return ResponseEntity.ok(service.listAll(nome, category_id, min_price, max_price, has_photo, stock_status, active, pageable));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ProductResponseDTO> store(
            @Valid @RequestBody ProductRequestDTO request) {
        ProductResponseDTO criada = service.save(request);
        return ResponseEntity
                .created(URI.create("/api/products/" + criada.id()))
                .body(criada);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProductResponseDTO> storeMultipart(
            @Valid @ModelAttribute ProductRequestDTO request,
            @RequestPart(value = "photo", required = false) MultipartFile photo,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        MultipartFile file = (photo != null && !photo.isEmpty()) ? photo : image;
        ProductResponseDTO criada = service.save(request, file);
        return ResponseEntity
                .created(URI.create("/api/products/" + criada.id()))
                .body(criada);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponseDTO> show(@PathVariable UUID id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping(value = {"/{id}/photo", "/{id}/image"})
    public ResponseEntity<Resource> showImage(@PathVariable UUID id) {
        Resource resource = service.loadImage(id);
        MediaType mediaType = MediaTypeFactory.getMediaType(resource)
                .orElse(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.ok()
                .contentType(mediaType)
                .body(resource);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ProductResponseDTO> update(
            @PathVariable UUID id, @Valid @RequestBody ProductRequestDTO request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProductResponseDTO> updateMultipart(
            @PathVariable UUID id,
            @Valid @ModelAttribute ProductRequestDTO request,
            @RequestPart(value = "photo", required = false) MultipartFile photo,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        MultipartFile file = (photo != null && !photo.isEmpty()) ? photo : image;
        return ResponseEntity.ok(service.update(id, request, file));
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<ProductResponseDTO> updateStock(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStockRequestDTO request) {
        return ResponseEntity.ok(service.updateStock(id, request.stock_quantity()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> destroy(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
