-- Corrigir políticas RLS da tabela propostas para permitir acesso adequado

-- Verificar políticas atuais
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'propostas';

-- Remover políticas existentes que podem estar muito restritivas
DROP POLICY IF EXISTS "Allow authenticated users to view propostas" ON propostas;
DROP POLICY IF EXISTS "Allow authenticated users to insert propostas" ON propostas;
DROP POLICY IF EXISTS "Allow authenticated users to update propostas" ON propostas;
DROP POLICY IF EXISTS "Allow authenticated users to delete propostas" ON propostas;

-- Criar políticas mais específicas baseadas no papel do usuário

-- 1. Política para admins - acesso total
CREATE POLICY "Admin full access to propostas" ON propostas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM consultores 
      WHERE consultores.auth_user_id = auth.uid() 
      AND consultores.role = 'admin'
    )
  );

-- 2. Política para consultores - podem ver propostas dos orçamentos atribuídos a eles
CREATE POLICY "Consultores can view assigned propostas" ON propostas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM solicitacao_orcamentos so
      JOIN consultores c ON c.id = so.consultor_id
      WHERE so.solicitacao_id = propostas.orcamento_id
      AND c.auth_user_id = auth.uid()
    )
  );

-- 3. Política para consultores - podem inserir propostas nos orçamentos atribuídos
CREATE POLICY "Consultores can insert propostas for assigned orcamentos" ON propostas
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM solicitacao_orcamentos so
      JOIN consultores c ON c.id = so.consultor_id
      WHERE so.solicitacao_id = propostas.orcamento_id
      AND c.auth_user_id = auth.uid()
    )
  );

-- 4. Política para consultores - podem atualizar propostas dos orçamentos atribuídos
CREATE POLICY "Consultores can update assigned propostas" ON propostas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM solicitacao_orcamentos so
      JOIN consultores c ON c.id = so.consultor_id
      WHERE so.solicitacao_id = propostas.orcamento_id
      AND c.auth_user_id = auth.uid()
    )
  );

-- 5. Política para consultores - podem deletar propostas dos orçamentos atribuídos
CREATE POLICY "Consultores can delete assigned propostas" ON propostas
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM solicitacao_orcamentos so
      JOIN consultores c ON c.id = so.consultor_id
      WHERE so.solicitacao_id = propostas.orcamento_id
      AND c.auth_user_id = auth.uid()
    )
  );

-- 6. Política para clientes - podem ver apenas suas próprias propostas
CREATE POLICY "Clients can view own propostas" ON propostas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM solicitacao_orcamentos so
      WHERE so.solicitacao_id = propostas.orcamento_id
      AND so.user_id = auth.uid()
    )
    AND NOT EXISTS (
      SELECT 1 FROM consultores 
      WHERE consultores.auth_user_id = auth.uid()
    )
  );

-- Garantir permissões adequadas
GRANT ALL ON propostas TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE propostas_id_seq TO authenticated;

-- Verificar políticas após as alterações
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'propostas'
ORDER BY policyname;