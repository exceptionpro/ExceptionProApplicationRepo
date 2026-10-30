-- Migration V27: Add tax reconciliation fields to reconciliations table
ALTER TABLE reconciliations
    ADD COLUMN IF NOT EXISTS tax_percentage NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(14, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS calculated_tax_amount NUMERIC(14, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tax_variance NUMERIC(14, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tax_match_status VARCHAR(50) DEFAULT 'MATCHED',
    ADD COLUMN IF NOT EXISTS invoice_base_amount NUMERIC(14, 2) DEFAULT 0;
