-- Fix ensure_client_exists function to use usuarios_sistema instead of clientes_sistema

-- Drop the old function
DROP FUNCTION IF EXISTS ensure_client_exists(TEXT, TEXT, TEXT, TEXT);

-- Create new function that works with usuarios_sistema
CREATE OR REPLACE FUNCTION ensure_client_exists(p_email TEXT, p_nome TEXT DEFAULT NULL, p_telefone TEXT DEFAULT NULL, p_empresa TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    client_id UUID;
    auth_user_id UUID;
BEGIN
    -- Try to find existing user by email
    SELECT id INTO client_id
    FROM usuarios_sistema
    WHERE email = p_email;
    
    -- If not found, create new user
    IF client_id IS NULL THEN
        -- Generate a random UUID for auth user_id (since we don't have real auth)
        auth_user_id := gen_random_uuid();
        
        INSERT INTO usuarios_sistema (user_id, nome, email, telefone, empresa)
        VALUES (
            auth_user_id,
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