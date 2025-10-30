-- Migração para adicionar campos consultor_id nas tabelas existentes
-- ao invés de criar uma nova tabela de relacionamento

-- 1. Adicionar campo consultor_id na tabela usuarios_clientes (se não existir)
ALTER TABLE usuarios_clientes 
ADD COLUMN IF NOT EXISTS consultor_id BIGINT REFERENCES consultores(id);

-- 2. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_clientes_consultor_id ON usuarios_clientes(consultor_id);

-- 3. Garantir que a tabela solicitacao_orcamentos já tem consultor_id
-- (verificar se existe, caso contrário adicionar)
ALTER TABLE solicitacao_orcamentos 
ADD COLUMN IF NOT EXISTS consultor_id BIGINT REFERENCES consultores(id);

-- 4. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_solicitacao_orcamentos_consultor_id ON solicitacao_orcamentos(consultor_id);

-- 5. Atualizar política RLS da tabela usuarios_clientes para consultores
DROP POLICY IF EXISTS "Consultores can view their assigned clients" ON usuarios_clientes;
CREATE POLICY "Consultores can view their assigned clients" ON usuarios_clientes
  FOR SELECT USING (
    -- Admin pode ver todos
    EXISTS (
      SELECT 1 FROM consultores 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
    OR
    -- Consultor pode ver apenas clientes atribuídos a ele
    EXISTS (
      SELECT 1 FROM consultores 
      WHERE auth_user_id = auth.uid() 
      AND id = usuarios_clientes.consultor_id
    )
  );

-- 6. Política para consultores criarem/editarem clientes
DROP POLICY IF EXISTS "Consultores can manage their clients" ON usuarios_clientes;
CREATE POLICY "Consultores can manage their clients" ON usuarios_clientes
  FOR ALL USING (
    -- Admin pode gerenciar todos
    EXISTS (
      SELECT 1 FROM consultores 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
    OR
    -- Consultor pode gerenciar apenas seus clientes
    EXISTS (
      SELECT 1 FROM consultores 
      WHERE auth_user_id = auth.uid() 
      AND id = usuarios_clientes.consultor_id
    )
  );

-- 7. Atualizar política RLS da tabela solicitacao_orcamentos para consultores
DROP POLICY IF EXISTS "Consultores can view their assigned budgets" ON solicitacao_orcamentos;
CREATE POLICY "Consultores can view their assigned budgets" ON solicitacao_orcamentos
  FOR SELECT USING (
    -- Admin pode ver todos
    EXISTS (
      SELECT 1 FROM consultores 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
    OR
    -- Consultor pode ver apenas orçamentos atribuídos a ele
    EXISTS (
      SELECT 1 FROM consultores 
      WHERE auth_user_id = auth.uid() 
      AND id = solicitacao_orcamentos.consultor_id
    )
  );

-- 8. Política para criação de orçamentos por consultores
DROP POLICY IF EXISTS "Consultores can create budgets for their clients" ON solicitacao_orcamentos;
CREATE POLICY "Consultores can create budgets for their clients" ON solicitacao_orcamentos
  FOR INSERT WITH CHECK (
    -- Admin pode criar qualquer orçamento
    EXISTS (
      SELECT 1 FROM consultores 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
    OR
    -- Consultor pode criar orçamentos apenas para clientes atribuídos a ele
    (
      EXISTS (
        SELECT 1 FROM consultores 
        WHERE auth_user_id = auth.uid() 
        AND id = solicitacao_orcamentos.consultor_id
      )
      AND
      -- Cliente deve estar atribuído ao consultor
      EXISTS (
        SELECT 1 FROM usuarios_clientes 
        WHERE id = solicitacao_orcamentos.user_id 
        AND consultor_id = solicitacao_orcamentos.consultor_id
      )
    )
  );

-- 9. Política para atualização de orçamentos por consultores
DROP POLICY IF EXISTS "Consultores can update their budgets" ON solicitacao_orcamentos;
CREATE POLICY "Consultores can update their budgets" ON solicitacao_orcamentos
  FOR UPDATE USING (
    -- Admin pode atualizar qualquer orçamento
    EXISTS (
      SELECT 1 FROM consultores 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
    OR
    -- Consultor pode atualizar apenas orçamentos atribuídos a ele
    EXISTS (
      SELECT 1 FROM consultores 
      WHERE auth_user_id = auth.uid() 
      AND id = solicitacao_orcamentos.consultor_id
    )
  );

-- 10. Conceder permissões para as tabelas
GRANT SELECT, INSERT, UPDATE ON usuarios_clientes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON solicitacao_orcamentos TO authenticated;
GRANT SELECT ON consultores TO authenticated;

-- Comentário: Esta migração adiciona campos consultor_id diretamente nas tabelas
-- existentes, criando um relacionamento direto entre consultores e clientes/orçamentos
-- sem necessidade de tabelas de relacionamento separadas.