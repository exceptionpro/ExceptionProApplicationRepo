ALTER TABLE invoices ADD COLUMN IF NOT EXISTS po_amount DECIMAL(10, 2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_percentage DECIMAL(10, 2) DEFAULT 0.00;
UPDATE invoices SET po_amount = total_amount WHERE po_amount IS NULL;
UPDATE invoices SET tax_percentage = 0.00 WHERE tax_percentage IS NULL;
