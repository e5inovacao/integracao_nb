-- Função segura para criar consultor com usuário de autenticação
-- Esta função resolve o problema de permissão negada para a tabela auth.users

CREATE OR REPLACE FUNCTION create_consultor_with_auth_user(
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
  v_auth_user_id UUID;
  v_consultor_id BIGINT;
  v_result JSON;
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM consultores 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem criar consultores';
  END IF;

  -- Verificar se o email já existe
  IF EXISTS (SELECT 1 FROM consultores WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email já está em uso';
  END IF;

  -- Criar usuário no auth.users usando admin API
  -- Nota: Esta função precisa ser executada com privilégios de service_role
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    p_email,
    crypt(p_senha, gen_salt('bf')),
    NOW(),
    json_build_object('role', p_role, 'nome', p_nome),
    NOW(),
    NOW()
  ) RETURNING id INTO v_auth_user_id;

  -- Criar registro na tabela consultores
  INSERT INTO consultores (
    nome,
    email,
    telefone,
    senha,
    ativo,
    auth_user_id,
    role,
    created_at,
    updated_at
  ) VALUES (
    p_nome,
    p_email,
    p_telefone,
    p_senha,
    p_ativo,
    v_auth_user_id,
    p_role,
    NOW(),
    NOW()
  ) RETURNING id INTO v_consultor_id;

  -- Retornar resultado
  v_result := json_build_object(
    'success', true,
    'consultor_id', v_consultor_id,
    'auth_user_id', v_auth_user_id,
    'message', 'Consultor criado com sucesso'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, tentar limpar o usuário criado
    IF v_auth_user_id IS NOT NULL THEN
      DELETE FROM auth.users WHERE id = v_auth_user_id;
    END IF;
    
    -- Retornar erro
    v_result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Erro ao criar consultor: ' || SQLERRM
    );
    
    RETURN v_result;
END;
$$;

-- Conceder permissões para executar a função
GRANT EXECUTE ON FUNCTION create_consultor_with_auth_user(
  VARCHAR(255),
  VARCHAR(255),
  VARCHAR(20),
  TEXT,
  BOOLEAN,
  VARCHAR(50)
) TO authenticated;

-- Função alternativa mais simples que usa RPC do Supabase
CREATE OR REPLACE FUNCTION create_consultor_simple(
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
  v_consultor_id BIGINT;
  v_result JSON;
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM consultores 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem criar consultores';
  END IF;

  -- Verificar se o email já existe
  IF EXISTS (SELECT 1 FROM consultores WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email já está em uso';
  END IF;

  -- Criar registro na tabela consultores (sem auth_user_id por enquanto)
  INSERT INTO consultores (
    nome,
    email,
    telefone,
    senha,
    ativo,
    role,
    created_at,
    updated_at
  ) VALUES (
    p_nome,
    p_email,
    p_telefone,
    p_senha,
    p_ativo,
    p_role,
    NOW(),
    NOW()
  ) RETURNING id INTO v_consultor_id;

  -- Retornar resultado
  v_result := json_build_object(
    'success', true,
    'consultor_id', v_consultor_id,
    'message', 'Consultor criado com sucesso. Usuário de autenticação deve ser criado separadamente.'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Retornar erro
    v_result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Erro ao criar consultor: ' || SQLERRM
    );
    
    RETURN v_result;
END;
$$;

-- Conceder permissões para executar a função simples
GRANT EXECUTE ON FUNCTION create_consultor_simple(
  VARCHAR(255),
  VARCHAR(255),
  VARCHAR(20),
  TEXT,
  BOOLEAN,
  VARCHAR(50)
) TO authenticated;