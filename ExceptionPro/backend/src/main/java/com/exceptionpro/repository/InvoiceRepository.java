package com.exceptionpro.repository;

import com.exceptionpro.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    @Query("SELECT DISTINCT i FROM Invoice i LEFT JOIN FETCH i.requisition LEFT JOIN FETCH i.collaborationRequisition LEFT JOIN FETCH i.supplier LEFT JOIN FETCH i.buyer WHERE i.supplier.id = :supplierId ORDER BY i.createdAt DESC")
    List<Invoice> findBySupplierIdOrderByCreatedAtDesc(@Param("supplierId") UUID supplierId);

    @Query("SELECT DISTINCT i FROM Invoice i LEFT JOIN FETCH i.requisition LEFT JOIN FETCH i.collaborationRequisition LEFT JOIN FETCH i.supplier LEFT JOIN FETCH i.buyer WHERE i.buyer.id = :buyerId ORDER BY i.createdAt DESC")
    List<Invoice> findByBuyerIdOrderByCreatedAtDesc(@Param("buyerId") UUID buyerId);

    boolean existsByInvoiceNumber(String invoiceNumber);
}
