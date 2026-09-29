ALTER TABLE requisitions ADD COLUMN req_number INT;

WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
    FROM requisitions
)
UPDATE requisitions r
SET req_number = n.rn
FROM numbered n
WHERE r.id = n.id;

UPDATE requisitions SET status = 'PR' WHERE status = 'Submitted';
