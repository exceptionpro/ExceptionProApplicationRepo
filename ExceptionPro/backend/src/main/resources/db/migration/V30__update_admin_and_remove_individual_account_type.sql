-- Ensure admin@exceptionpro.com and ROLE_ADMIN users have Account Type 'Admin'
UPDATE users
SET account_type = 'Admin'
WHERE LOWER(email) = 'admin@exceptionpro.com' OR role = 'ROLE_ADMIN';

-- Remove 'Individual' account type from any non-admin users (set to 'Buyer')
UPDATE users
SET account_type = 'Buyer'
WHERE LOWER(account_type) = 'individual'
  AND LOWER(email) <> 'admin@exceptionpro.com'
  AND (role IS NULL OR role <> 'ROLE_ADMIN');
