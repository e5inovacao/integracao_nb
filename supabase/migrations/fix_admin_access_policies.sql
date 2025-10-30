-- Verificar e ajustar políticas RLS para garantir acesso total do admin aos orçamentos

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Admin can view all solicitacao_orcamentos" ON solicitacao_orcamentos;
DROP POLICY IF EXISTS "Admin can insert solicitacao_orcamentos" ON solicitacao_orcamentos;
DROP POLICY IF EXISTS "Admin can update solicitacao_orcamentos" ON solicitacao_orcamentos;
DROP POLICY IF EXISTS "Admin can delete solicitacao_orcamentos" ON solicitacao_orcamentos;
DROP POLICY IF EXISTS "Consultores can view their solicitacao_orcamentos" ON solicitacao_orcamentos;
DROP POLICY IF EXISTS "Consultores can update their solicitacao_orcamentos" ON solicitacao_orcamentos;

-- Criar políticas para solicitacao_orcamentos
-- Admin tem acesso total
CREATE POLICY "Admin can view all solicitacao_orcamentos" ON solicitacao_orcamentos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM consultores 
            WHERE consultores.auth_user_id = auth.uid() 
            AND consultores.role = 'admin'
        )
    );

CREATE POLICY "Admin can insert solicitacao_orcamentos" ON solicitacao_orcamentos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM consultores 
            WHERE consultores.auth_user_id = auth.uid() 
            AND consultores.role = 'admin'
        )
    );

CREATE POLICY "Admin can update solicitacao_orcamentos" ON solicitacao_orcamentos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM consultores 
            WHERE consultores.auth_user_id = auth.uid() 
            AND consultores.role = 'admin'
        )
    );

CREATE POLICY "Admin can delete solicitacao_orcamentos" ON solicitacao_orcamentos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM consultores 
            WHERE consultores.auth_user_id = auth.uid() 
            AND consultores.role = 'admin'
        )
    );

-- Consultores podem ver apenas seus próprios orçamentos
CREATE POLICY "Consultores can view their solicitacao_orcamentos" ON solicitacao_orcamentos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM consultores 
            WHERE consultores.auth_user_id = auth.uid() 
            AND consultores.role = 'consultor'
            AND consultores.id = solicitacao_orcamentos.consultor_id
        )
    );

CREATE POLICY "Consultores can update their solicitacao_orcamentos" ON solicitacao_orcamentos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM consultores 
            WHERE consultores.auth_user_id = auth.uid() 
            AND consultores.role = 'consultor'
            AND consultores.id = solicitacao_orcamentos.consultor_id
        )
    );

-- Garantir permissões para as roles anon e authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON solicitacao_orcamentos TO authenticated;
GRANT SELECT ON solicitacao_orcamentos TO anon;

-- Garantir permissões para a tabela consultores
GRANT SELECT, INSERT, UPDATE, DELETE ON consultores TO authenticated;
GRANT SELECT ON consultores TO anon;

-- Garantir permissões para a tabela usuarios_clientes
GRANT SELECT, INSERT, UPDATE, DELETE ON usuarios_clientes TO authenticated;
GRANT SELECT ON usuarios_clientes TO anon;

-- Verificar se o usuário admin existe e tem o role correto
UPDATE consultores 
SET role = 'admin' 
WHERE email = 'admin@naturezabrindes.com.br' AND role != 'admin';

-- Inserir admin se não existir
INSERT INTO consultores (nome, email, role, ativo, auth_user_id)
SELECT 
    'Administrador',
    'admin@naturezabrindes.com.br',
    'admin',
    true,
    auth.users.id
FROM auth.users 
WHERE auth.users.email = 'admin@naturezabrindes.com.br'
AND NOT EXISTS (
    SELECT 1 FROM consultores 
    WHERE consultores.email = 'admin@naturezabrindes.com.br'
);