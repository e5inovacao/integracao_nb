-- Corrigir políticas RLS da tabela consultores - versão final
-- O problema é que as políticas estão usando auth.jwt() ->> 'role' 
-- mas o sistema usa raw_user_meta_data->>'role'

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "consultores_select_policy" ON consultores;
DROP POLICY IF EXISTS "consultores_insert_policy" ON consultores;
DROP POLICY IF EXISTS "consultores_update_policy" ON consultores;
DROP POLICY IF EXISTS "consultores_delete_policy" ON consultores;
DROP POLICY IF EXISTS "Admins can view all consultores" ON consultores;
DROP POLICY IF EXISTS "Consultores can view own data" ON consultores;
DROP POLICY IF EXISTS "Only admins can insert consultores" ON consultores;
DROP POLICY IF EXISTS "Only admins can update consultores" ON consultores;
DROP POLICY IF EXISTS "Only admins can delete consultores" ON consultores;
DROP POLICY IF EXISTS "Allow insert for admin setup" ON consultores;
DROP POLICY IF EXISTS "Allow select for consultores" ON consultores;
DROP POLICY IF EXISTS "Allow update own record or admin" ON consultores;

-- Criar políticas RLS corretas usando raw_user_meta_data

-- Política de SELECT: Usuários autenticados podem ver consultores
CREATE POLICY "consultores_select_policy" ON consultores
    FOR SELECT USING (
        -- Usuários autenticados podem ver consultores
        auth.uid() IS NOT NULL
    );

-- Política de INSERT: Admins podem inserir novos consultores
CREATE POLICY "consultores_insert_policy" ON consultores
    FOR INSERT WITH CHECK (
        -- Verificar se o usuário é admin através do raw_user_meta_data
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.email LIKE '%admin%')
        )
    );

-- Política de UPDATE: Admins podem atualizar todos, consultores apenas seus dados
CREATE POLICY "consultores_update_policy" ON consultores
    FOR UPDATE USING (
        -- Admin pode atualizar todos
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.email LIKE '%admin%')
        ) OR
        -- Consultor pode atualizar apenas seus próprios dados
        (auth_user_id = auth.uid())
    );

-- Política de DELETE: Apenas admins podem deletar
CREATE POLICY "consultores_delete_policy" ON consultores
    FOR DELETE USING (
        -- Verificar se o usuário é admin
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.email LIKE '%admin%')
        )
    );

-- Garantir que as permissões estão corretas
GRANT SELECT, INSERT, UPDATE, DELETE ON consultores TO authenticated;
GRANT SELECT ON consultores TO anon;
GRANT USAGE, SELECT ON SEQUENCE consultores_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE consultores_id_seq TO anon;

-- Verificar se a tabela tem RLS habilitado
ALTER TABLE consultores ENABLE ROW LEVEL SECURITY;