-- Main collaboration requisition table
CREATE TABLE IF NOT EXISTS collaboration_requisitions (
    id UUID PRIMARY KEY,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    ship_to VARCHAR(255) NOT NULL,
    deliver_to VARCHAR(255) NOT NULL,
    need_by_date DATE NOT NULL,
    comments TEXT,
    status VARCHAR(255) NOT NULL DEFAULT 'Collaborating',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers associated with collaboration requisitions
CREATE TABLE IF NOT EXISTS collaboration_requisition_suppliers (
    collaboration_requisition_id UUID NOT NULL
        REFERENCES collaboration_requisitions(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (collaboration_requisition_id, supplier_id)
);

-- Collaboration requisition items
CREATE TABLE IF NOT EXISTS collaboration_requisition_items (
    id UUID PRIMARY KEY,
    collaboration_requisition_id UUID NOT NULL
        REFERENCES collaboration_requisitions(id) ON DELETE CASCADE,
    item_type VARCHAR(255) NOT NULL DEFAULT 'NON_CATALOG',
    product_name VARCHAR(255) NOT NULL,
    full_description TEXT,
    quantity INTEGER NOT NULL,
    unit_measure VARCHAR(255),
    price NUMERIC(38, 2) NOT NULL
);

-- Supplier collaboration proposals
CREATE TABLE IF NOT EXISTS collaboration_proposals (
    id UUID PRIMARY KEY,
    collaboration_requisition_id UUID NOT NULL
        REFERENCES collaboration_requisitions(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    proposal_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

