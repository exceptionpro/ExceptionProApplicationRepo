ALTER TABLE purchase_receipts ADD COLUMN IF NOT EXISTS supplier_approval_status VARCHAR(50) DEFAULT 'Pending Approval';
ALTER TABLE purchase_receipts ADD COLUMN IF NOT EXISTS supplier_confirmation_message TEXT;
ALTER TABLE purchase_receipts ADD COLUMN IF NOT EXISTS supplier_approved_pending_quantity INT;
ALTER TABLE purchase_receipts ADD COLUMN IF NOT EXISTS supplier_approved_at TIMESTAMP;
UPDATE purchase_receipts SET supplier_approval_status = 'Pending Approval' WHERE supplier_approval_status IS NULL;
