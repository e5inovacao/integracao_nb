-- Test manual insertion into orcamentos_sistema table
-- This will help identify RLS policies and constraints issues

-- First, let's check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'orcamentos_sistema';

-- Check if we have any users in usuarios_sistema
SELECT id, nome, email, telefone FROM usuarios_sistema LIMIT 5;

-- Try to insert a test quote with a valid user_id
-- First, check if test user exists, if not create one
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM usuarios_sistema WHERE email = 'test@example.com') THEN
    INSERT INTO usuarios_sistema (nome, email, telefone, user_id)
    VALUES ('Test User', 'test@example.com', '11999999999', null);
  END IF;
END $$;

-- Now try to insert into orcamentos_sistema
WITH test_user AS (
  SELECT id FROM usuarios_sistema WHERE email = 'test@example.com' LIMIT 1
),
next_number AS (
  SELECT 'ORC' || LPAD((COALESCE(MAX(CAST(SUBSTRING(numero_orcamento FROM 4) AS INTEGER)), 0) + 1)::text, 6, '0') as numero
  FROM orcamentos_sistema
)
INSERT INTO orcamentos_sistema (
  numero_orcamento,
  usuario_id,
  data_evento,
  observacoes,
  status,
  valor_total
)
SELECT 
  next_number.numero,
  test_user.id,
  CURRENT_DATE + INTERVAL '30 days',
  'Teste de inserção manual',
  'pendente',
  100.00
FROM test_user, next_number
RETURNING *;

-- Check if the insertion was successful
SELECT * FROM orcamentos_sistema WHERE observacoes = 'Teste de inserção manual';