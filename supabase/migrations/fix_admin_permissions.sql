-- Verificar políticas RLS atuais para solicitacao_orcamentos
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'solicitacao_orcamentos';

-- Verificar permissões atuais para as roles anon e authenticated
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'solicitacao_orcamentos' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Remover políticas RLS restritivas existentes se houver
DROP POLICY IF EXISTS "Users can view their own orcamentos" ON solicitacao_orcamentos;
DROP POLICY IF EXISTS "Consultores can view assigned orcamentos" ON solicitacao_orcamentos;
DROP POLICY IF EXISTS "Users can insert their own orcamentos" ON solicitacao_orcamentos;
DROP POLICY IF EXISTS "Users can update their own orcamentos" ON solicitacao_orcamentos;
DROP POLICY IF EXISTS "Users can delete their own orcamentos" ON solicitacao_orcamentos;

-- Criar política permissiva para usuários autenticados (incluindo admin)
-- Esta política permite acesso total para usuários autenticados
CREATE POLICY "Authenticated users can access all orcamentos" ON solicitacao_orcamentos
    FOR ALL USING (auth.role() = 'authenticated');

-- Garantir que a role authenticated tenha todas as permissões necessárias
GRANT ALL PRIVILEGES ON solicitacao_orcamentos TO authenticated;
GRANT SELECT ON solicitacao_orcamentos TO anon;

-- Verificar se as políticas foram aplicadas corretamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'solicitacao_orcamentos';

-- Verificar permissões após as alterações
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'solicitacao_orcamentos' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;