-- Corrigir erro no INSERT da função create_consultor_with_auth_user

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

  -- Verificar se o email já existe na tabela consultores
  IF EXISTS (SELECT 1 FROM consultores WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email já está em uso na tabela consultores';
  END IF;

  -- Verificar se o email já existe no auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email já está em uso no sistema de autenticação';
  END IF;

  -- Criar registro na tabela consultores sem auth_user_id por enquanto
  -- O usuário será criado quando fizer o primeiro login
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
    p_ativo,  -- Corrigido: adicionado o valor para ativo
    NULL,     -- auth_user_id será preenchido no primeiro login
    p_role,
    NOW(),
    NOW()
  ) RETURNING id INTO v_consultor_id;

  -- Retornar resultado de sucesso
  v_result := json_build_object(
    'success', true,
    'consultor_id', v_consultor_id,
    'message', 'Consultor criado com sucesso. O usuário de autenticação será criado no primeiro login.',
    'instructions', 'O consultor deve fazer o primeiro login usando a funcionalidade de "Criar Conta" no sistema.'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Retornar erro detalhado
    v_result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Erro ao criar consultor: ' || SQLERRM
    );
    
    RETURN v_result;
END;
$$;

-- Comentário explicativo
COMMENT ON FUNCTION create_consultor_with_auth_user IS 'Função corrigida para criar consultor. O usuário de autenticação será criado no primeiro login.';