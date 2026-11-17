CREATE TABLE IF NOT EXISTS platform_sponsorships (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sponsor_name VARCHAR(255) NOT NULL,
    email_id VARCHAR(255) NOT NULL,
    phone_number VARCHAR(100),
    amount_range VARCHAR(100) NOT NULL,
    currency VARCHAR(50) NOT NULL,
    account_type VARCHAR(100),
    submitted_by_email VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
