package com.exceptionpro.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.exceptionpro.entity.Requisition;

public interface RequisitionRepository extends JpaRepository<Requisition, UUID> {

    @Query("SELECT r FROM Requisition r LEFT JOIN FETCH r.buyer LEFT JOIN FETCH r.supplier LEFT JOIN FETCH r.items WHERE r.buyer.id = :buyerId ORDER BY r.createdAt DESC")
    List<Requisition> findByBuyerIdOrderByCreatedAtDesc(@Param("buyerId") UUID buyerId);

    @Query("SELECT r FROM Requisition r LEFT JOIN FETCH r.buyer LEFT JOIN FETCH r.supplier LEFT JOIN FETCH r.items WHERE r.supplier.id = :supplierId ORDER BY r.createdAt DESC")
    List<Requisition> findBySupplierIdOrderByCreatedAtDesc(@Param("supplierId") UUID supplierId);

    @Query("SELECT DISTINCT r FROM Requisition r LEFT JOIN FETCH r.buyer LEFT JOIN FETCH r.supplier LEFT JOIN FETCH r.items WHERE (r.supplier.id = :supplierId OR EXISTS (SELECT 1 FROM RequisitionItem item WHERE item.requisition = r AND item.supplier.id = :supplierId)) ORDER BY r.createdAt DESC")
    List<Requisition> findAllBySupplierIdOrderByCreatedAtDesc(@Param("supplierId") UUID supplierId);

    @Query("SELECT DISTINCT r FROM Requisition r LEFT JOIN FETCH r.buyer LEFT JOIN FETCH r.supplier LEFT JOIN FETCH r.items WHERE (r.supplier.id = :supplierId OR EXISTS (SELECT 1 FROM RequisitionItem item WHERE item.requisition = r AND item.supplier.id = :supplierId)) AND r.status IN :statuses ORDER BY r.createdAt DESC")
    List<Requisition> findAllBySupplierIdAndStatusInOrderByCreatedAtDesc(@Param("supplierId") UUID supplierId, @Param("statuses") List<String> statuses);

    @Query("SELECT MAX(r.reqNumber) FROM Requisition r")
    Integer findMaxReqNumber();

    @Query("SELECT DISTINCT r FROM Requisition r LEFT JOIN FETCH r.buyer LEFT JOIN FETCH r.supplier LEFT JOIN FETCH r.items WHERE r.supplier.id = :supplierId AND r.status IN :statuses ORDER BY r.createdAt DESC")
    List<Requisition> findBySupplierIdAndStatusInOrderByCreatedAtDesc(@Param("supplierId") UUID supplierId, @Param("statuses") List<String> statuses);

    @Query("SELECT DISTINCT r FROM Requisition r LEFT JOIN FETCH r.buyer LEFT JOIN FETCH r.supplier LEFT JOIN FETCH r.items WHERE r.buyer.id = :buyerId AND r.status IN :statuses ORDER BY r.createdAt DESC")
    List<Requisition> findByBuyerIdAndStatusInOrderByCreatedAtDesc(@Param("buyerId") UUID buyerId, @Param("statuses") List<String> statuses);

    @Query("SELECT DISTINCT r FROM Requisition r LEFT JOIN FETCH r.buyer LEFT JOIN FETCH r.supplier LEFT JOIN FETCH r.items WHERE r.collaborationRequisitionId = :collabId ORDER BY r.createdAt DESC")
    List<Requisition> findByCollaborationRequisitionIdOrderByCreatedAtDesc(@Param("collabId") UUID collabId);
}
