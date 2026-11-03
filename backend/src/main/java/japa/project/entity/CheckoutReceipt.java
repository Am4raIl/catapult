package japa.project.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "checkout_receipt")
@Getter
@Setter
@NoArgsConstructor
public class CheckoutReceipt implements Persistable<UUID> {
    @Id
    private UUID id;
    @Column(name = "request_signature", nullable = false, length = 64)
    private String requestSignature;
    @Column(nullable = false, precision = 30, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;
    @Column(name = "item_count", nullable = false)
    private int itemCount;

    @Transient
    private boolean newReceipt = true;

    @Override
    public boolean isNew() { return newReceipt; }

    @PostLoad
    @PostPersist
    private void persisted() { newReceipt = false; }
}
