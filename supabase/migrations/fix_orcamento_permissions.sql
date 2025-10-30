-- Verificar e corrigir políticas RLS para solicitacao_orcamentos

-- Primeiro, vamos remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view their own orcamentos" ON solicitacao_orcamentos;
DROP POLICY IF EXISTS "Consultores can view assigned orcamentos" ON solicitacao_orcamentos;
DROP POLICY IF EXISTS "Admin can view all orcamentos" ON solicitacao_orcamentos;

-- Política para permitir que usuários vejam seus próprios orçamentos
CREATE POLICY "Users can view their own orcamentos" ON solicitacao_orcamentos
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM usuarios_clientes 
            WHERE user_id = auth.uid()
        )
    );

-- Política para permitir que consultores vejam orçamentos atribuídos a eles
CREATE POLICY "Consultores can view assigned orcamentos" ON solicitacao_orcamentos
    FOR SELECT USING (
        consultor_id IN (
            SELECT id FROM consultores 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Política para permitir que admins vejam todos os orçamentos
-- Admin é identificado por não estar na tabela consultores
CREATE POLICY "Admin can view all orcamentos" ON solicitacao_orcamentos
    FOR SELECT USING (
        NOT EXISTS (
            SELECT 1 FROM consultores 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Garantir que as permissões básicas estejam configuradas
GRANT SELECT ON solicitacao_orcamentos TO authenticated;
GRANT SELECT ON usuarios_clientes TO authenticated;
GRANT SELECT ON consultores TO authenticated;

-- Verificar se RLS está habilitado
ALTER TABLE solicitacao_orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultores ENABLE ROW LEVEL SECURITY;