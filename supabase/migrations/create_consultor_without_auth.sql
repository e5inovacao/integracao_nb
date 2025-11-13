-- Função para criar consultor sem criar usuário de autenticação
-- O usuário de autenticação será criado separadamente via API

CREATE OR REPLACE FUNCTION create_consultor_without_auth(
  p_nome VARCHAR(255),
  p_email VARCHAR(255),
  p_telefone VARCHAR(20) DEFAULT '',
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
    ativo,
    role,
    created_at,
    updated_at
  ) VALUES (
    p_nome,
    p_email,
    p_telefone,
    p_ativo,
    p_role,
    NOW(),
    NOW()
  ) RETURNING id INTO v_consultor_id;

  -- Retornar resultado
  v_result := json_build_object(
    'success', true,
    'consultor_id', v_consultor_id,
    'message', 'Consultor criado com sucesso'
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

-- Função para vincular consultor com usuário de autenticação
CREATE OR REPLACE FUNCTION link_consultor_with_auth_user(
  p_consultor_id BIGINT,
  p_auth_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM consultores 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem vincular consultores';
  END IF;

  -- Verificar se o consultor existe
  IF NOT EXISTS (SELECT 1 FROM consultores WHERE id = p_consultor_id) THEN
    RAISE EXCEPTION 'Consultor não encontrado';
  END IF;

  -- Atualizar o consultor com o auth_user_id
  UPDATE consultores 
  SET 
    auth_user_id = p_auth_user_id,
    updated_at = NOW()
  WHERE id = p_consultor_id;

  -- Retornar resultado
  v_result := json_build_object(
    'success', true,
    'message', 'Consultor vinculado com usuário de autenticação com sucesso'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Retornar erro
    v_result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Erro ao vincular consultor: ' || SQLERRM
    );
    
    RETURN v_result;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION create_consultor_without_auth(
  VARCHAR(255),
  VARCHAR(255),
  VARCHAR(20),
  BOOLEAN,
  VARCHAR(50)
) TO authenticated;

GRANT EXECUTE ON FUNCTION link_consultor_with_auth_user(
  BIGINT,
  UUID
) TO authenticated;

-- Comentários
COMMENT ON FUNCTION create_consultor_without_auth IS 'Cria um consultor sem criar usuário de autenticação. O usuário de autenticação deve ser criado separadamente.';
COMMENT ON FUNCTION link_consultor_with_auth_user IS 'Vincula um consultor existente com um usuário de autenticação.';