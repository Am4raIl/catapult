package japa.project.service;

import japa.project.dto.CheckoutRequestDTO;
import japa.project.dto.CheckoutResponseDTO;
import japa.project.entity.CheckoutReceipt;
import japa.project.entity.Product;
import japa.project.repository.ProductRepository;
import japa.project.repository.CheckoutReceiptRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

@Service
public class CheckoutService {
    private final ProductRepository products;
    private final CheckoutReceiptRepository receipts;
    private final TransactionTemplate transaction;

    public CheckoutService(ProductRepository products, CheckoutReceiptRepository receipts,
                           PlatformTransactionManager manager) {
        this.products = products;
        this.receipts = receipts;
        this.transaction = new TransactionTemplate(manager);
    }

    public CheckoutResponseDTO checkout(CheckoutRequestDTO request) {
        // Every purchase locks products in the same order, including repeated IDs.
        SortedMap<UUID, Integer> quantities = new TreeMap<>();
        try {
            for (var item : request.items()) quantities.merge(item.product_id(), item.quantity(), Math::addExact);
            quantities.values().stream().reduce(0, Math::addExact);
        } catch (ArithmeticException error) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantidade inválida.");
        }
        String signature = signature(quantities);
        try {
            return transaction.execute(status -> {
                var previous = receipts.findById(request.request_id()).orElse(null);
                if (previous != null) return replay(previous, signature);

                var receipt = new CheckoutReceipt();
                receipt.setId(request.request_id());
                receipt.setRequestSignature(signature);
                // The unique ID serializes retries; this insert rolls back on any stock conflict.
                receipts.saveAndFlush(receipt);

                List<Product> locked = new ArrayList<>();
                for (var entry : quantities.entrySet()) {
                    Product product = products.findLockedById(entry.getKey()).orElseThrow(() ->
                            new ResponseStatusException(HttpStatus.CONFLICT, "Um produto da sacola não está mais disponível."));
                    if (!Boolean.TRUE.equals(product.getActive()) || product.getStockQuantity() < entry.getValue()) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "O estoque de um produto mudou. Revise as quantidades da sacola.");
                    }
                    locked.add(product);
                }
                BigDecimal total = BigDecimal.ZERO;
                int count = 0;
                for (Product product : locked) {
                    int quantity = quantities.get(product.getId());
                    total = total.add(product.getPrice().multiply(BigDecimal.valueOf(quantity)));
                    count = Math.addExact(count, quantity);
                    product.setStockQuantity(product.getStockQuantity() - quantity);
                }
                receipt.setTotal(total);
                receipt.setItemCount(count);
                products.flush();
                return response(receipt);
            });
        } catch (DataIntegrityViolationException error) {
            // A simultaneous retry may have committed while this request waited on its unique ID.
            return transaction.execute(status -> {
                var previous = receipts.findById(request.request_id()).orElse(null);
                if (previous == null) throw error;
                return replay(previous, signature);
            });
        }
    }

    private CheckoutResponseDTO replay(CheckoutReceipt receipt, String signature) {
        if (!receipt.getRequestSignature().equals(signature)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Esta identificação de compra já foi utilizada com outros itens.");
        }
        return response(receipt);
    }

    private CheckoutResponseDTO response(CheckoutReceipt receipt) {
        return new CheckoutResponseDTO(receipt.getId(), receipt.getTotal(), receipt.getItemCount());
    }

    private String signature(SortedMap<UUID, Integer> quantities) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(quantities.toString().getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException(impossible);
        }
    }
}
