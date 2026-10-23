ALTER TABLE collaboration_proposals ADD COLUMN IF NOT EXISTS file_url VARCHAR(500);
ALTER TABLE collaboration_proposals ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
