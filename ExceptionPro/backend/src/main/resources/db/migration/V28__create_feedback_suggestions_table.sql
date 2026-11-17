CREATE TABLE IF NOT EXISTS feedback_suggestions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    account_type VARCHAR(100),
    submission_type VARCHAR(100) NOT NULL,
    feedback_text TEXT,
    suggestion_text TEXT,
    screenshot_url VARCHAR(1024),
    screenshot_file_name VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
