-- Remove foreign key constraint from usuarios_sistema.user_id to allow NULL values
-- This is needed because we're not using real Supabase auth for quote requests

-- Drop the foreign key constraint
ALTER TABLE usuarios_sistema DROP CONSTRAINT IF EXISTS usuarios_sistema_user_id_fkey;

-- Update the ensure_client_exists function to use NULL for user_id
CREATE OR REPLACE FUNCTION ensure_client_exists(p_email TEXT, p_nome TEXT DEFAULT NULL, p_telefone TEXT DEFAULT NULL, p_empresa TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    client_id UUID;
BEGIN
    -- Try to find existing user by email
    SELECT id INTO client_id
    FROM usuarios_sistema
    WHERE email = p_email;
    
    -- If not found, create new user
    IF client_id IS NULL THEN
        INSERT INTO usuarios_sistema (user_id, nome, email, telefone, empresa)
        VALUES (
            NULL, -- No auth user_id for anonymous quote requests
            COALESCE(p_nome, 'Cliente'),
            p_email,
            p_telefone,
            p_empresa
        )
        RETURNING id INTO client_id;
    END IF;
    
    RETURN client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION ensure_client_exists(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_client_exists(TEXT, TEXT, TEXT, TEXT) TO anon;