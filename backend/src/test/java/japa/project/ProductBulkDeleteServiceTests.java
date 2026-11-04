package japa.project;

import japa.project.entity.Product;
import japa.project.repository.ProductRepository;
import japa.project.service.CategoryService;
import japa.project.service.ImageStorageService;
import japa.project.service.ProductService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProductBulkDeleteServiceTests {
    private ProductRepository repository;
    private ImageStorageService storage;
    private ProductService service;
    private final UUID first = new UUID(0, 1), second = new UUID(0, 2);

    @BeforeEach
    void setup() {
        repository = mock(ProductRepository.class);
        storage = mock(ImageStorageService.class);
        service = new ProductService(repository, mock(CategoryService.class), storage);
        TransactionSynchronizationManager.initSynchronization();
    }

    @AfterEach
    void cleanup() { TransactionSynchronizationManager.clearSynchronization(); }

    @Test
    void locksUniqueIdsInCheckoutOrderAndCleansFilesOnlyAfterCommit() {
        Product a = product(first, "a.png"), b = product(second, "b.pdf");
        service.deleteMany(List.of(second, first, second));
        var order = inOrder(repository);
        order.verify(repository).findLockedById(first);
        order.verify(repository).findLockedById(second);
        order.verify(repository).deleteAll(List.of(a, b));
        order.verify(repository).flush();
        verifyNoInteractions(storage);
        TransactionSynchronizationManager.getSynchronizations().forEach(sync -> sync.afterCommit());
        verify(storage).delete("a.png");
        verify(storage).delete("b.pdf");
    }

    @Test
    void missingProductPreservesEntireSelectionAndFiles() {
        product(first, "a.png");
        when(repository.findLockedById(second)).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> service.deleteMany(List.of(first, second)));
        verify(repository, never()).deleteAll(anyList());
        verify(repository, never()).flush();
        verifyNoInteractions(storage);
        assertTrue(TransactionSynchronizationManager.getSynchronizations().isEmpty());
    }

    @Test
    void databaseFailurePreservesAllFiles() {
        product(first, "a.png");
        doThrow(new IllegalStateException("DB failure")).when(repository).flush();
        assertThrows(IllegalStateException.class, () -> service.deleteMany(List.of(first)));
        verifyNoInteractions(storage);
        assertTrue(TransactionSynchronizationManager.getSynchronizations().isEmpty());
    }

    @Test
    void fileCleanupFailureDoesNotStopOtherFilesOrReportCommittedDeletionAsFailed() {
        product(first, "a.png");
        product(second, "b.png");
        doThrow(new IllegalStateException("Storage failure")).when(storage).delete("a.png");
        service.deleteMany(List.of(first, second));
        assertDoesNotThrow(() -> TransactionSynchronizationManager.getSynchronizations().forEach(sync -> sync.afterCommit()));
        verify(storage).delete("b.png");
    }

    private Product product(UUID id, String photo) {
        Product product = new Product();
        product.setId(id);
        product.setPhoto(photo);
        when(repository.findLockedById(id)).thenReturn(Optional.of(product));
        return product;
    }
}
