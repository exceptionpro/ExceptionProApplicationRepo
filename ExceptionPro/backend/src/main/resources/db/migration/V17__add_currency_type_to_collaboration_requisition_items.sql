ALTER TABLE collaboration_requisition_items ADD COLUMN IF NOT EXISTS currency_type VARCHAR(50) DEFAULT 'USD';
UPDATE collaboration_requisition_items SET currency_type = 'USD' WHERE currency_type IS NULL;
