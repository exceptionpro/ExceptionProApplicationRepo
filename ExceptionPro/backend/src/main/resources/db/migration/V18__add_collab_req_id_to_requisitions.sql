ALTER TABLE requisitions
ADD COLUMN IF NOT EXISTS collaboration_requisition_id UUID REFERENCES collaboration_requisitions(id) ON DELETE SET NULL;
