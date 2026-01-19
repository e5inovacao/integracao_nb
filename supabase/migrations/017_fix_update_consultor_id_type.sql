-- Ajusta função update_consultor_with_password para usar BIGINT no ID
DROP FUNCTION IF EXISTS update_consultor_with_password(UUID, VARCHAR(255), VARCHAR(255), VARCHAR(20), BOOLEAN, TEXT);

CREATE OR REPLACE FUNCTION update_consultor_with_password(
  p_consultor_id BIGINT,
  p_nome VARCHAR(255),
  p_email VARCHAR(255),
  p_telefone VARCHAR(20),
  p_ativo BOOLEAN,
  p_nova_senha TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_user_id UUID;
BEGIN
  SELECT auth_user_id INTO v_auth_user_id
  FROM consultores
  WHERE id = p_consultor_id;

  IF v_auth_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Consultor não encontrado');
  END IF;

  UPDATE consultores
  SET 
    nome = p_nome,
    email = p_email,
    telefone = p_telefone,
    ativo = p_ativo,
    updated_at = NOW()
  WHERE id = p_consultor_id;

  IF p_nova_senha IS NOT NULL THEN
    UPDATE auth.users
    SET encrypted_password = crypt(p_nova_senha, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = v_auth_user_id;
  END IF;

  RETURN json_build_object('success', true, 'message', 'Consultor atualizado com sucesso');
END;
$$;

GRANT EXECUTE ON FUNCTION update_consultor_with_password(BIGINT, VARCHAR(255), VARCHAR(255), VARCHAR(20), BOOLEAN, TEXT) TO authenticated;
