CREATE TABLE requisitions (
    id UUID PRIMARY KEY,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    ship_to VARCHAR(255) NOT NULL,
    deliver_to VARCHAR(255) NOT NULL,
    need_by_date DATE NOT NULL,
    comments TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Submitted',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE requisition_items (
    id UUID PRIMARY KEY,
    requisition_id UUID NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL,
    catalogue_id UUID,
    product_name VARCHAR(255) NOT NULL,
    full_description TEXT,
    quantity INT NOT NULL,
    unit_measure VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    supplier_id UUID REFERENCES users(id) ON DELETE SET NULL
);
