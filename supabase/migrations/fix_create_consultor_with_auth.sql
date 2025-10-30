-- Corrigir função para criar consultor com usuário de autenticação
-- Esta versão usa auth.admin_create_user() corretamente

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
  v_auth_result JSON;
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

  -- Criar usuário usando auth.admin_create_user()
  -- Nota: Esta função precisa ser executada com privilégios adequados
  SELECT auth.admin_create_user(
    json_build_object(
      'email', p_email,
      'password', p_senha,
      'email_confirm', true,
      'user_metadata', json_build_object(
        'role', p_role,
        'nome', p_nome
      )
    )
  ) INTO v_auth_result;

  -- Extrair o ID do usuário criado
  v_auth_user_id := (v_auth_result->>'id')::UUID;

  -- Verificar se o usuário foi criado com sucesso
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Falha ao criar usuário de autenticação: %', v_auth_result;
  END IF;

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

  -- Retornar resultado de sucesso
  v_result := json_build_object(
    'success', true,
    'consultor_id', v_consultor_id,
    'auth_user_id', v_auth_user_id,
    'message', 'Consultor e usuário de autenticação criados com sucesso'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, tentar limpar o usuário criado (se possível)
    IF v_auth_user_id IS NOT NULL THEN
      BEGIN
        PERFORM auth.admin_delete_user(v_auth_user_id);
      EXCEPTION
        WHEN OTHERS THEN
          -- Ignorar erros de limpeza
          NULL;
      END;
    END IF;
    
    -- Retornar erro detalhado
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

-- Comentário explicativo
COMMENT ON FUNCTION create_consultor_with_auth_user IS 'Função corrigida para criar consultor com usuário de autenticação usando auth.admin_create_user()';