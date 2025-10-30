-- Habilitar registro de consultores através do frontend
-- Esta migração permite que consultores se registrem usando o sistema de auth do Supabase

-- Função para registrar um novo consultor
CREATE OR REPLACE FUNCTION register_consultor(
  p_nome VARCHAR(255),
  p_email VARCHAR(255),
  p_telefone VARCHAR(20),
  p_senha TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_consultor_id BIGINT;
  v_auth_user_id UUID;
  v_result JSON;
BEGIN
  -- Verificar se já existe um consultor pré-cadastrado com este email
  SELECT id INTO v_consultor_id 
  FROM consultores 
  WHERE email = p_email AND auth_user_id IS NULL;
  
  IF v_consultor_id IS NULL THEN
    RAISE EXCEPTION 'Email não encontrado ou já vinculado a um usuário. Entre em contato com o administrador.';
  END IF;
  
  -- Obter o ID do usuário que acabou de se registrar
  v_auth_user_id := auth.uid();
  
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Vincular o usuário autenticado ao consultor
  UPDATE consultores 
  SET 
    auth_user_id = v_auth_user_id,
    nome = p_nome,
    telefone = p_telefone,
    updated_at = NOW()
  WHERE id = v_consultor_id;
  
  -- Retornar sucesso
  v_result := json_build_object(
    'success', true,
    'consultor_id', v_consultor_id,
    'auth_user_id', v_auth_user_id,
    'message', 'Consultor registrado com sucesso'
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    v_result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Erro ao registrar consultor: ' || SQLERRM
    );
    
    RETURN v_result;
END;
$$;

-- Função para verificar se um email pode se registrar como consultor
CREATE OR REPLACE FUNCTION can_register_as_consultor(
  p_email VARCHAR(255)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se existe um consultor pré-cadastrado com este email
  RETURN EXISTS (
    SELECT 1 FROM consultores 
    WHERE email = p_email AND auth_user_id IS NULL
  );
END;
$$;

-- Trigger para definir role do usuário após registro
CREATE OR REPLACE FUNCTION set_user_role_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_consultor_role VARCHAR(50);
BEGIN
  -- Verificar se existe um consultor pré-cadastrado com este email
  SELECT role INTO v_consultor_role
  FROM consultores 
  WHERE email = NEW.email AND auth_user_id IS NULL;
  
  -- Se encontrou um consultor, definir a role nos metadados
  IF v_consultor_role IS NOT NULL THEN
    NEW.raw_user_meta_data := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', v_consultor_role);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS on_auth_user_created_set_role ON auth.users;
CREATE TRIGGER on_auth_user_created_set_role
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION set_user_role_on_signup();

-- Conceder permissões
GRANT EXECUTE ON FUNCTION register_consultor(
  VARCHAR(255),
  VARCHAR(255),
  VARCHAR(20),
  TEXT
) TO authenticated, anon;

GRANT EXECUTE ON FUNCTION can_register_as_consultor(VARCHAR(255)) TO authenticated, anon;

-- Comentários
COMMENT ON FUNCTION register_consultor IS 'Função para registrar consultor após signup no auth';
COMMENT ON FUNCTION can_register_as_consultor IS 'Verifica se um email pode se registrar como consultor';
COMMENT ON FUNCTION set_user_role_on_signup IS 'Define role do usuário baseado no consultor pré-cadastrado';