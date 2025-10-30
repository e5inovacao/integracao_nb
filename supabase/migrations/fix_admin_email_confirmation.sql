-- Fix admin email confirmation and add role column to consultores table

-- Add role column to consultores table if it doesn't exist
ALTER TABLE consultores ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'consultor';

-- Update the admin user to mark email as confirmed
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    updated_at = NOW()
WHERE email = 'admin@naturezabrindes.com.br';

-- Create or update the admin user in consultores table
INSERT INTO consultores (
    nome,
    email,
    role,
    ativo,
    auth_user_id,
    created_at,
    updated_at
)
SELECT 
    'Administrador',
    u.email,
    'admin',
    true,
    u.id,
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'admin@naturezabrindes.com.br'
AND NOT EXISTS (
    SELECT 1 FROM consultores c WHERE c.email = u.email
)
ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    ativo = true,
    auth_user_id = EXCLUDED.auth_user_id,
    updated_at = NOW();

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON consultores TO authenticated;
GRANT SELECT ON consultores TO anon;