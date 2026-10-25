ALTER TABLE purchase_receipts ADD COLUMN IF NOT EXISTS po_quantity INT;
ALTER TABLE purchase_receipts ADD COLUMN IF NOT EXISTS received_quantity INT;
ALTER TABLE purchase_receipts ADD COLUMN IF NOT EXISTS pending_quantity INT;
UPDATE purchase_receipts SET received_quantity = quantity WHERE received_quantity IS NULL;
UPDATE purchase_receipts SET po_quantity = quantity WHERE po_quantity IS NULL;
UPDATE purchase_receipts SET pending_quantity = 0 WHERE pending_quantity IS NULL;
