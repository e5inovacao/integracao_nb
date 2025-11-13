-- Função para atualizar consultor com senha
CREATE OR REPLACE FUNCTION update_consultor_with_password(
  p_consultor_id UUID,
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
  v_result JSON;
BEGIN
  -- Buscar o auth_user_id do consultor
  SELECT auth_user_id INTO v_auth_user_id
  FROM consultores
  WHERE id = p_consultor_id;

  -- Se não encontrou o consultor, retornar erro
  IF v_auth_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Consultor não encontrado'
    );
  END IF;

  -- Atualizar os dados do consultor
  UPDATE consultores
  SET 
    nome = p_nome,
    email = p_email,
    telefone = p_telefone,
    ativo = p_ativo,
    updated_at = NOW()
  WHERE id = p_consultor_id;

  -- Se uma nova senha foi fornecida, atualizar no auth.users
  IF p_nova_senha IS NOT NULL THEN
    UPDATE auth.users
    SET 
      encrypted_password = crypt(p_nova_senha, gen_salt('bf')),
      updated_at = NOW()
    WHERE id = v_auth_user_id;
  END IF;

  -- Retornar sucesso
  RETURN json_build_object(
    'success', true,
    'message', 'Consultor atualizado com sucesso'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Função para criar consultor completo com usuário de autenticação
CREATE OR REPLACE FUNCTION create_consultor_complete(
  p_nome VARCHAR(255),
  p_email VARCHAR(255),
  p_telefone VARCHAR(20),
  p_senha TEXT,
  p_ativo BOOLEAN DEFAULT true,
  p_role VARCHAR(50) DEFAULT 'consultor'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_consultor_id UUID;
  v_auth_user_id UUID;
  v_result JSON;
BEGIN
  -- Verificar se o email já existe
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email já está em uso'
    );
  END IF;

  -- Criar usuário de autenticação
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_senha, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    json_build_object('nome', p_nome, 'role', p_role),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO v_auth_user_id;

  -- Criar registro do consultor
  INSERT INTO consultores (
    nome,
    email,
    telefone,
    ativo,
    auth_user_id,
    created_at,
    updated_at
  ) VALUES (
    p_nome,
    p_email,
    p_telefone,
    p_ativo,
    v_auth_user_id,
    NOW(),
    NOW()
  ) RETURNING id INTO v_consultor_id;

  -- Retornar sucesso
  RETURN json_build_object(
    'success', true,
    'consultor_id', v_consultor_id,
    'auth_user_id', v_auth_user_id,
    'message', 'Consultor criado com sucesso'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION update_consultor_with_password(UUID, VARCHAR(255), VARCHAR(255), VARCHAR(20), BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_consultor_complete(VARCHAR(255), VARCHAR(255), VARCHAR(20), TEXT, BOOLEAN, VARCHAR(50)) TO authenticated;