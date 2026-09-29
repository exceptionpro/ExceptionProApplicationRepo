package com.exceptionpro.repository;

import com.exceptionpro.entity.Requisition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface RequisitionRepository extends JpaRepository<Requisition, UUID> {

    @Query("SELECT r FROM Requisition r LEFT JOIN FETCH r.buyer LEFT JOIN FETCH r.supplier LEFT JOIN FETCH r.items WHERE r.buyer.id = :buyerId ORDER BY r.createdAt DESC")
    List<Requisition> findByBuyerIdOrderByCreatedAtDesc(@Param("buyerId") UUID buyerId);

    @Query("SELECT r FROM Requisition r LEFT JOIN FETCH r.buyer LEFT JOIN FETCH r.supplier LEFT JOIN FETCH r.items WHERE r.supplier.id = :supplierId ORDER BY r.createdAt DESC")
    List<Requisition> findBySupplierIdOrderByCreatedAtDesc(@Param("supplierId") UUID supplierId);

    @Query("SELECT MAX(r.reqNumber) FROM Requisition r")
    Integer findMaxReqNumber();

    @Query("SELECT DISTINCT r FROM Requisition r LEFT JOIN FETCH r.buyer LEFT JOIN FETCH r.supplier LEFT JOIN FETCH r.items WHERE r.supplier.id = :supplierId AND r.status IN :statuses ORDER BY r.createdAt DESC")
    List<Requisition> findBySupplierIdAndStatusInOrderByCreatedAtDesc(@Param("supplierId") UUID supplierId, @Param("statuses") List<String> statuses);
}
