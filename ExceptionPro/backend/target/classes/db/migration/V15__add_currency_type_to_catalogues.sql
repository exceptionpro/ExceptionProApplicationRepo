ALTER TABLE catalogues ADD COLUMN IF NOT EXISTS currency_type VARCHAR(50) DEFAULT 'USD';
UPDATE catalogues SET currency_type = 'USD' WHERE currency_type IS NULL;
