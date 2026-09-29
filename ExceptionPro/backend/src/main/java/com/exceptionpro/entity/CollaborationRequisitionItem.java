package com.exceptionpro.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "collaboration_requisition_items")
public class CollaborationRequisitionItem {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collaboration_requisition_id", nullable = false)
    private CollaborationRequisition collaborationRequisition;

    @Column(name = "item_type", nullable = false)
    private String itemType = "NON_CATALOG";

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "full_description", columnDefinition = "TEXT")
    private String fullDescription;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_measure")
    private String unitMeasure;

    @Column(nullable = false)
    private BigDecimal price;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public CollaborationRequisition getCollaborationRequisition() {
        return collaborationRequisition;
    }

    public void setCollaborationRequisition(CollaborationRequisition collaborationRequisition) {
        this.collaborationRequisition = collaborationRequisition;
    }

    public String getItemType() {
        return itemType;
    }

    public void setItemType(String itemType) {
        this.itemType = itemType;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getFullDescription() {
        return fullDescription;
    }

    public void setFullDescription(String fullDescription) {
        this.fullDescription = fullDescription;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getUnitMeasure() {
        return unitMeasure;
    }

    public void setUnitMeasure(String unitMeasure) {
        this.unitMeasure = unitMeasure;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }
}
