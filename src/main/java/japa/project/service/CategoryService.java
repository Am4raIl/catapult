package japa.project.service;

import japa.project.dto.CategoryRequestDTO;
import japa.project.dto.CategoryResponseDTO;
import japa.project.dto.ProductSummaryResponseDTO;
import japa.project.entity.Category;
import japa.project.repository.CategoryRepository;
import japa.project.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class CategoryService {
    private final CategoryRepository repository;
    private final ProductRepository productRepository;

    public CategoryService(CategoryRepository repository, ProductRepository productRepository){
        this.repository = repository;
        this.productRepository = productRepository;
    }

    public List<CategoryResponseDTO> listAll(){
        return repository.findAll().stream().map(this::toResponseDTO).toList();
    }

    public Category findEntityById(UUID id) {
        return repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria não encontrada."));
    }

    public CategoryResponseDTO findById(UUID id) {
        return toResponseDTO(findEntityById(id));
    }

    public CategoryResponseDTO save(CategoryRequestDTO dto) {
        Category category = new Category(null, dto.name(), new ArrayList<>());
        return toResponseDTO(repository.save(category));
    }

    public CategoryResponseDTO update(UUID id, CategoryRequestDTO dto) {
        Category category = findEntityById(id);
        category.setName(dto.name());
        return toResponseDTO(repository.save(category));
    }

    public void delete(UUID id) {
        Category category = findEntityById(id);
        if (productRepository.existsByCategoryId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Não é possível excluir uma categoria que possui produtos vinculados.");
        }
        repository.delete(category);
    }

    private CategoryResponseDTO toResponseDTO(Category e) {
        List<ProductSummaryResponseDTO> products = e.getProducts().stream()
                .map(p -> {
                    String photo = (p.getPhoto() == null)
                            ? null
                            : "/api/products/" + p.getId() + "/photo";
                    return new ProductSummaryResponseDTO(p.getId(), p.getName(), p.getPrice(), photo);
                })
                .toList();
        return new CategoryResponseDTO(e.getId(), e.getName(), products);
    }
}
