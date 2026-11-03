package japa.project.repository;

import japa.project.entity.CheckoutReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface CheckoutReceiptRepository extends JpaRepository<CheckoutReceipt, UUID> {}
