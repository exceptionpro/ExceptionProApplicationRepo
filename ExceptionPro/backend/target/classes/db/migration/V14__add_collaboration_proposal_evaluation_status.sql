ALTER TABLE collaboration_proposals ADD COLUMN IF NOT EXISTS evaluation_status VARCHAR(255) DEFAULT 'Need to Evaluate';

CREATE TABLE IF NOT EXISTS collaboration_supplier_responses (
    id UUID PRIMARY KEY,
    collaboration_requisition_id UUID NOT NULL REFERENCES collaboration_requisitions(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
