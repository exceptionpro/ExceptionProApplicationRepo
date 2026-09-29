package com.exceptionpro.repository;

import com.exceptionpro.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    List<Payment> findByBuyerIdOrderByCreatedAtDesc(UUID buyerId);

    List<Payment> findBySupplierIdOrderByCreatedAtDesc(UUID supplierId);

    Optional<Payment> findByPaymentId(String paymentId);

    Optional<Payment> findByPoNumber(String poNumber);

    Optional<Payment> findByInvoiceNumber(String invoiceNumber);
}
