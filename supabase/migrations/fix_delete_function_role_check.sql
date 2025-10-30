-- Corrigir função delete_consultor_and_auth_user para usar raw_user_meta_data
-- O problema é que a função está verificando auth.jwt() ->> 'role' 
-- mas o sistema usa raw_user_meta_data->>'role'

CREATE OR REPLACE FUNCTION delete_consultor_and_auth_user(consultor_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    auth_user_uuid UUID;
    result BOOLEAN := FALSE;
    current_user_role TEXT;
BEGIN
    -- Verificar se o usuário atual é admin usando raw_user_meta_data
    SELECT raw_user_meta_data->>'role' INTO current_user_role
    FROM auth.users 
    WHERE id = auth.uid();
    
    -- Também verificar se é admin pelo email (fallback)
    IF current_user_role != 'admin' THEN
        SELECT CASE 
            WHEN email LIKE '%admin%' THEN 'admin'
            ELSE 'consultor'
        END INTO current_user_role
        FROM auth.users 
        WHERE id = auth.uid();
    END IF;
    
    -- Se não é admin, lançar exceção
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Apenas administradores podem excluir consultores';
    END IF;

    -- Buscar o auth_user_id do consultor
    SELECT auth_user_id INTO auth_user_uuid
    FROM consultores
    WHERE id = consultor_id;

    -- Se não encontrou o consultor, retornar false
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Deletar o consultor (isso deve ser feito primeiro devido às foreign keys)
    DELETE FROM consultores WHERE id = consultor_id;

    -- Se havia um auth_user_id, tentar deletar o usuário do Auth
    IF auth_user_uuid IS NOT NULL THEN
        BEGIN
            -- Deletar o usuário do Auth (requer permissões de service_role)
            DELETE FROM auth.users WHERE id = auth_user_uuid;
        EXCEPTION
            WHEN OTHERS THEN
                -- Se falhar ao deletar do Auth, apenas logar o erro
                -- O consultor já foi deletado, então não falhar a operação
                RAISE WARNING 'Não foi possível deletar usuário do Auth: %', SQLERRM;
        END;
    END IF;

    result := TRUE;
    RETURN result;
END;
$$;

-- Conceder permissão para executar a função
GRANT EXECUTE ON FUNCTION delete_consultor_and_auth_user(BIGINT) TO authenticated;

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Allow admin to execute delete function" ON consultores;

-- Criar política RLS corrigida
CREATE POLICY "Allow admin to execute delete function" ON consultores
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (
                auth.users.raw_user_meta_data->>'role' = 'admin' 
                OR auth.users.email LIKE '%admin%'
            )
        )
    );