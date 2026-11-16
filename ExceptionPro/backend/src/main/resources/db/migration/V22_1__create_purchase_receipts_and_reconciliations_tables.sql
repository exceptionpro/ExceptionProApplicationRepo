-- Purchase Receipts table (required before V23, V25, V26)
CREATE TABLE IF NOT EXISTS purchase_receipts (
    id UUID PRIMARY KEY,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receipt_no VARCHAR(100) NOT NULL,
    receipt_date DATE NOT NULL,
    purchase_order_id UUID REFERENCES requisitions(id) ON DELETE SET NULL,
    received_from_supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    quantity INT NOT NULL,
    received_status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Reconciliations table (required before V27)
CREATE TABLE IF NOT EXISTS reconciliations (
    id UUID PRIMARY KEY,
    reconciliation_number VARCHAR(100) NOT NULL UNIQUE,
    reconciliation_date DATE NOT NULL,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    requisition_id UUID REFERENCES requisitions(id) ON DELETE SET NULL,
    po_number VARCHAR(100),
    receipt_grn_number VARCHAR(100),
    invoice_number VARCHAR(100),
    currency VARCHAR(20) DEFAULT 'INR',
    status VARCHAR(50) DEFAULT 'EXCEPTION',
    po_quantity INT DEFAULT 0,
    receipt_quantity INT DEFAULT 0,
    invoice_quantity INT DEFAULT 0,
    po_vs_receipt_qty_variance INT DEFAULT 0,
    receipt_vs_invoice_qty_variance INT DEFAULT 0,
    po_vs_invoice_qty_variance INT DEFAULT 0,
    quantity_match_status VARCHAR(50) DEFAULT 'PARTIAL',
    po_unit_price NUMERIC(12, 2) DEFAULT 0,
    invoice_unit_price NUMERIC(12, 2) DEFAULT 0,
    price_variance NUMERIC(12, 2) DEFAULT 0,
    price_variance_percentage NUMERIC(8, 2) DEFAULT 0,
    price_match_status VARCHAR(50) DEFAULT 'MISMATCH',
    po_amount NUMERIC(14, 2) DEFAULT 0,
    receipt_amount NUMERIC(14, 2) DEFAULT 0,
    invoice_amount NUMERIC(14, 2) DEFAULT 0,
    po_vs_receipt_amt_variance NUMERIC(14, 2) DEFAULT 0,
    receipt_vs_invoice_amt_variance NUMERIC(14, 2) DEFAULT 0,
    po_vs_invoice_amt_variance NUMERIC(14, 2) DEFAULT 0,
    amount_match_status VARCHAR(50) DEFAULT 'PARTIAL',
    overall_result VARCHAR(50) DEFAULT 'EXCEPTION',
    remarks TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

