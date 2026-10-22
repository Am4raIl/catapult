package japa.project.service;

import japa.project.dto.CategorySummaryResponseDTO;
import japa.project.dto.ProductRequestDTO;
import japa.project.dto.ProductResponseDTO;
import japa.project.entity.Category;
import japa.project.entity.Product;
import japa.project.repository.ProductRepository;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class ProductService {
    private final ProductRepository repository;
    private final CategoryService categoryService;
    private final ImageStorageService imageStorageService;

    public ProductService(ProductRepository repository, CategoryService categoryService,
                          ImageStorageService imageStorageService){
        this.repository = repository;
        this.categoryService = categoryService;
        this.imageStorageService = imageStorageService;
    }

    public Page<ProductResponseDTO> listAll(String nome, Pageable pageable) {
        String filtro = (nome == null) ? "" : nome;
        return repository.findByNameContainingIgnoreCase(filtro, pageable)
                .map(this::toResponseDTO);
    }

    public Product findEntityById(UUID id) {
        return repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado."));
    }

    public ProductResponseDTO findById(UUID id) {
        return toResponseDTO(findEntityById(id));
    }

    public ProductResponseDTO save(ProductRequestDTO dto) {
        return save(dto, null);
    }

    @Transactional
    public ProductResponseDTO save(ProductRequestDTO dto, MultipartFile image) {
        Category category = categoryService.findEntityById(dto.category_id());
        String filename = imageStorageService.store(image);
        try {
            Product produto = new Product(null, dto.name(), dto.price(), category, filename);
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
        Product produto = findEntityById(id);
        Category category = categoryService.findEntityById(dto.category_id());
        String oldImage = produto.getPhoto();
        String newImage = (image != null && !image.isEmpty())
                ? imageStorageService.store(image)
                : null;
        produto.setName(dto.name());
        produto.setPrice(dto.price());
        produto.setCategory(category);
        produto.setPhoto(newImage);
        Product salvo = repository.saveAndFlush(produto);
        if (oldImage != null && !oldImage.equals(newImage)) {
            imageStorageService.delete(oldImage);
        }
        return toResponseDTO(salvo);
    }

    @Transactional
    public void delete(UUID id) {
        Product produto = findEntityById(id);
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
        return new ProductResponseDTO(p.getId(), p.getName(), p.getPrice(), category, photo);
    }
}
