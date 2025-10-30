-- Corrigir políticas RLS da tabela consultores que causam recursão infinita
-- Remover todas as políticas existentes para evitar conflitos

DROP POLICY IF EXISTS "Admins can view all consultores" ON consultores;
DROP POLICY IF EXISTS "Consultores can view own data" ON consultores;
DROP POLICY IF EXISTS "Only admins can insert consultores" ON consultores;
DROP POLICY IF EXISTS "Only admins can update consultores" ON consultores;
DROP POLICY IF EXISTS "Only admins can delete consultores" ON consultores;
DROP POLICY IF EXISTS "Allow insert for admin setup" ON consultores;
DROP POLICY IF EXISTS "Allow select for consultores" ON consultores;
DROP POLICY IF EXISTS "Allow update own record or admin" ON consultores;

-- Criar políticas RLS simplificadas e sem recursão

-- Política de SELECT: Admins veem todos, consultores veem apenas seus dados
CREATE POLICY "consultores_select_policy" ON consultores
    FOR SELECT USING (
        -- Admin pode ver todos
        (auth.jwt() ->> 'role' = 'admin') OR
        -- Consultor pode ver apenas seus próprios dados
        (auth_user_id = auth.uid())
    );

-- Política de INSERT: Apenas admins podem inserir
CREATE POLICY "consultores_insert_policy" ON consultores
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Política de UPDATE: Admins podem atualizar todos, consultores apenas seus dados
CREATE POLICY "consultores_update_policy" ON consultores
    FOR UPDATE USING (
        -- Admin pode atualizar todos
        (auth.jwt() ->> 'role' = 'admin') OR
        -- Consultor pode atualizar apenas seus próprios dados
        (auth_user_id = auth.uid())
    );

-- Política de DELETE: Apenas admins podem deletar
CREATE POLICY "consultores_delete_policy" ON consultores
    FOR DELETE USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Garantir permissões básicas
GRANT SELECT, INSERT, UPDATE, DELETE ON consultores TO authenticated;
GRANT SELECT ON consultores TO anon;
GRANT USAGE, SELECT ON SEQUENCE consultores_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE consultores_id_seq TO anon;