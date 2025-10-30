-- Verificar políticas RLS atuais para solicitacao_orcamentos
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'solicitacao_orcamentos';

-- Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Users can view their own orcamentos" ON solicitacao_orcamentos;
DROP POLICY IF EXISTS "Consultores can view assigned orcamentos" ON solicitacao_orcamentos;
DROP POLICY IF EXISTS "Admin can view all orcamentos" ON solicitacao_orcamentos;
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON solicitacao_orcamentos;

-- Política específica para email administrativo - acesso total
CREATE POLICY "Admin email full access" ON solicitacao_orcamentos
    FOR ALL USING (
        auth.jwt() ->> 'email' = 'admin@naturezabrindes.com.br'
    );

-- Política para consultores - apenas orçamentos atribuídos
CREATE POLICY "Consultores can view assigned orcamentos" ON solicitacao_orcamentos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM consultores 
            WHERE consultores.auth_user_id = auth.uid() 
            AND consultores.id = solicitacao_orcamentos.consultor_id
        )
        AND auth.jwt() ->> 'email' != 'admin@naturezabrindes.com.br'
    );

-- Política para usuários clientes - apenas seus próprios orçamentos
CREATE POLICY "Users can view their own orcamentos" ON solicitacao_orcamentos
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM usuarios_clientes 
            WHERE user_id = auth.uid()
        )
        AND auth.jwt() ->> 'email' != 'admin@naturezabrindes.com.br'
        AND NOT EXISTS (
            SELECT 1 FROM consultores 
            WHERE consultores.auth_user_id = auth.uid()
        )
    );

-- Verificar se as políticas foram criadas corretamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'solicitacao_orcamentos'
ORDER BY policyname;