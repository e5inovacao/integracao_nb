-- Verificar políticas RLS atuais da tabela propostas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'propostas'
ORDER BY policyname;

-- Verificar se há dados na tabela propostas
SELECT COUNT(*) as total_propostas FROM propostas;

-- Verificar se há dados na tabela consultores
SELECT COUNT(*) as total_consultores FROM consultores;

-- Verificar se há dados na tabela solicitacao_orcamentos
SELECT COUNT(*) as total_solicitacao_orcamentos FROM solicitacao_orcamentos;

-- Verificar se o usuário atual tem role de admin
SELECT 
  auth.uid() as current_user_id,
  c.id as consultor_id,
  c.role as consultor_role,
  c.nome as consultor_nome
FROM consultores c 
WHERE c.auth_user_id = auth.uid();

-- Verificar permissões da tabela propostas
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'propostas' 
  AND grantee IN ('anon', 'authenticated');