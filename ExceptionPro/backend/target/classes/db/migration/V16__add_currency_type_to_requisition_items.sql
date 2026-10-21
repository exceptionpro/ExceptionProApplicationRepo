ALTER TABLE requisition_items ADD COLUMN IF NOT EXISTS currency_type VARCHAR(50) DEFAULT 'USD';
UPDATE requisition_items SET currency_type = 'USD' WHERE currency_type IS NULL;
