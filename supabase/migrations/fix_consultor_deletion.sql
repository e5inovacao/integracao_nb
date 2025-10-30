-- Criar função para deletar consultor e usuário do Auth
CREATE OR REPLACE FUNCTION delete_consultor_and_auth_user(consultor_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    auth_user_uuid UUID;
    result BOOLEAN := FALSE;
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT (auth.jwt() ->> 'role' = 'admin') THEN
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

-- Criar uma política RLS mais específica para a função
CREATE POLICY "Allow admin to execute delete function" ON consultores
    FOR DELETE USING (
        auth.jwt() ->> 'role' = 'admin'
    );