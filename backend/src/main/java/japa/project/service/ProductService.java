package japa.project.service;

import jakarta.persistence.criteria.Predicate;
import japa.project.dto.CategorySummaryResponseDTO;
import japa.project.dto.ProductRequestDTO;
import japa.project.dto.ProductResponseDTO;
import japa.project.entity.Category;
import japa.project.entity.Product;
import japa.project.repository.ProductRepository;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ProductService {
    private final ProductRepository repository;
    private final CategoryService categoryService;
    private final ImageStorageService imageStorageService;

    public ProductService(ProductRepository repository, CategoryService categoryService,
                          ImageStorageService imageStorageService) {
        this.repository = repository;
        this.categoryService = categoryService;
        this.imageStorageService = imageStorageService;
    }

    public Page<ProductResponseDTO> listAll(String nome, Pageable pageable) {
        return listAll(nome, null, null, null, null, null, null, pageable);
    }

    public Page<ProductResponseDTO> listAll(String nome, UUID categoryId, BigDecimal minPrice,
                                           BigDecimal maxPrice, Boolean hasPhoto,
                                           String stockStatus, Boolean active, Pageable pageable) {
        Specification<Product> spec = buildSpecification(nome, categoryId, minPrice, maxPrice, hasPhoto, stockStatus, active);
        return repository.findAll(spec, pageable)
                .map(this::toResponseDTO);
    }

    private Specification<Product> buildSpecification(String nome, UUID categoryId, BigDecimal minPrice,
                                                     BigDecimal maxPrice, Boolean hasPhoto,
                                                     String stockStatus, Boolean active) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (active != null) predicates.add(cb.equal(root.get("active"), active));

            if (nome != null && !nome.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + nome.toLowerCase() + "%"));
            }

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }

            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            if (hasPhoto != null) {
                if (Boolean.TRUE.equals(hasPhoto)) {
                    predicates.add(cb.isNotNull(root.get("photo")));
                } else {
                    predicates.add(cb.isNull(root.get("photo")));
                }
            }

            if (stockStatus != null && !stockStatus.isBlank()) {
                String status = stockStatus.trim().toUpperCase();
                if ("OUT_OF_STOCK".equals(status)) {
                    predicates.add(cb.equal(root.get("stockQuantity"), 0));
                } else if ("LOW_STOCK".equals(status)) {
                    predicates.add(cb.greaterThan(root.get("stockQuantity"), 0));
                    predicates.add(cb.lessThanOrEqualTo(root.get("stockQuantity"), 5));
                } else if ("IN_STOCK".equals(status)) {
                    predicates.add(cb.greaterThan(root.get("stockQuantity"), 5));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public Product findEntityById(UUID id) {
        return repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado."));
    }

    public ProductResponseDTO findById(UUID id) {
        return toResponseDTO(findEntityById(id));
    }

    private Product findForUpdate(UUID id) {
        return repository.findLockedById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado."));
    }

    public ProductResponseDTO save(ProductRequestDTO dto) {
        return save(dto, null);
    }

    @Transactional
    public ProductResponseDTO save(ProductRequestDTO dto, MultipartFile image) {
        Category category = categoryService.findEntityById(dto.category_id());
        String filename = imageStorageService.store(image);
        try {
            Product produto = new Product();
            produto.setName(dto.name());
            produto.setPrice(dto.price());
            produto.setCategory(category);
            produto.setPhoto(filename);
            produto.setStockQuantity(dto.stock_quantity() != null ? dto.stock_quantity() : 0);
            produto.setCostPrice(dto.cost_price());
            produto.setActive(dto.active() != null ? dto.active() : Boolean.TRUE);
            return toResponseDTO(repository.saveAndFlush(produto));
        } catch (RuntimeException e) {
            imageStorageService.delete(filename);
            throw e;
        }
    }

    public ProductResponseDTO update(UUID id, ProductRequestDTO dto) {
        return update(id, dto, null);
    }

    @Transactional
    public ProductResponseDTO update(UUID id, ProductRequestDTO dto, MultipartFile image) {
        Product produto = findForUpdate(id);
        Category category = categoryService.findEntityById(dto.category_id());
        String oldImage = produto.getPhoto();
        String newImage = null;
        if (image != null && !image.isEmpty()) {
            newImage = imageStorageService.store(image);
            produto.setPhoto(newImage);
        } else {
            produto.setPhoto(null);
        }
        produto.setName(dto.name());
        produto.setPrice(dto.price());
        produto.setCategory(category);
        if (dto.stock_quantity() != null) {
            produto.setStockQuantity(dto.stock_quantity());
        }
        if (dto.cost_price() != null) {
            produto.setCostPrice(dto.cost_price());
        }
        if (dto.active() != null) {
            produto.setActive(dto.active());
        }
        Product salvo = repository.saveAndFlush(produto);
        if (oldImage != null && !oldImage.equals(newImage)) {
            imageStorageService.delete(oldImage);
        }
        return toResponseDTO(salvo);
    }

    @Transactional
    public ProductResponseDTO updateStock(UUID id, Integer stockQuantity) {
        Product produto = findForUpdate(id);
        if (stockQuantity == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A quantidade em estoque é obrigatória");
        }
        if (stockQuantity < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A quantidade deve ser maior ou igual a 0");
        }
        produto.setStockQuantity(stockQuantity);
        Product salvo = repository.saveAndFlush(produto);
        return toResponseDTO(salvo);
    }

    @Transactional
    public void delete(UUID id) {
        Product produto = findForUpdate(id);
        String image = produto.getPhoto();
        repository.delete(produto);
        repository.flush();
        imageStorageService.delete(image);
    }

    public Resource loadImage(UUID id) {
        Product produto = findEntityById(id);
        if (produto.getPhoto() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não possui imagem.");
        }
        return imageStorageService.load(produto.getPhoto());
    }

    private ProductResponseDTO toResponseDTO(Product p) {
        CategorySummaryResponseDTO category = new CategorySummaryResponseDTO(
                p.getCategory().getId(), p.getCategory().getName());
        String photo = (p.getPhoto() == null)
                ? null
                : "/api/products/" + p.getId() + "/photo";
        return new ProductResponseDTO(p.getId(), p.getName(), p.getPrice(), category, photo,
                p.getStockQuantity(), p.getCostPrice(), p.getCreatedAt(), p.getUpdatedAt(),
                p.getActive() != null ? p.getActive() : Boolean.TRUE);
    }
}
