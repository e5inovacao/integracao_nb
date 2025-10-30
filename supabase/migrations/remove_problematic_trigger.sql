-- Remover trigger problemático que está causando erro na criação de usuários

-- Remover o trigger
DROP TRIGGER IF EXISTS on_auth_user_created_set_role ON auth.users;

-- Remover a função do trigger
DROP FUNCTION IF EXISTS set_user_role_on_signup();

-- Comentário
COMMENT ON SCHEMA public IS 'Trigger problemático removido para permitir criação de usuários';