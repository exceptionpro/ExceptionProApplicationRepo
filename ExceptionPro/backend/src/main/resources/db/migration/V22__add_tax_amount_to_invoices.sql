ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10, 2) DEFAULT 0.00;
UPDATE invoices SET tax_amount = 0.00 WHERE tax_amount IS NULL;
