-- Criar tabela de relacionamento entre consultores e clientes
CREATE TABLE IF NOT EXISTS consultor_clientes (
  id BIGSERIAL PRIMARY KEY,
  consultor_id BIGINT NOT NULL REFERENCES consultores(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES usuarios_clientes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(consultor_id, cliente_id)
);

-- Habilitar RLS na tabela
ALTER TABLE consultor_clientes ENABLE ROW LEVEL SECURITY;

-- Política para admins (acesso total) - baseada na role do consultor
CREATE POLICY "Admins can manage all consultor_clientes" ON consultor_clientes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM consultores 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Política para consultores (apenas seus próprios relacionamentos)
CREATE POLICY "Consultores can view their own cliente relationships" ON consultor_clientes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM consultores 
      WHERE auth_user_id = auth.uid() 
      AND id = consultor_clientes.consultor_id
    )
  );

-- Conceder permissões para as roles
GRANT SELECT ON consultor_clientes TO anon;
GRANT ALL PRIVILEGES ON consultor_clientes TO authenticated;

-- Adicionar campo consultor_id na tabela usuarios_clientes se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'usuarios_clientes' 
                 AND column_name = 'consultor_id') THEN
    ALTER TABLE usuarios_clientes ADD COLUMN consultor_id BIGINT REFERENCES consultores(id);
  END IF;
END $$;

-- Atualizar política RLS da tabela usuarios_clientes para consultores
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
    OR
    -- Consultor pode ver clientes através da tabela de relacionamento
    EXISTS (
      SELECT 1 FROM consultor_clientes cc
      JOIN consultores c ON c.id = cc.consultor_id
      WHERE c.auth_user_id = auth.uid()
      AND cc.cliente_id = usuarios_clientes.id
    )
  );

-- Atualizar política RLS da tabela solicitacao_orcamentos para consultores
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

-- Política para criação de orçamentos por consultores
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
      (
        -- Cliente atribuído diretamente
        EXISTS (
          SELECT 1 FROM usuarios_clientes 
          WHERE id = solicitacao_orcamentos.user_id 
          AND consultor_id = solicitacao_orcamentos.consultor_id
        )
        OR
        -- Cliente atribuído através da tabela de relacionamento
        EXISTS (
          SELECT 1 FROM consultor_clientes cc
          WHERE cc.consultor_id = solicitacao_orcamentos.consultor_id
          AND cc.cliente_id = solicitacao_orcamentos.user_id
        )
      )
    )
  );

-- Política para atualização de orçamentos por consultores
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

COMMENT ON TABLE consultor_clientes IS 'Relacionamento entre consultores e clientes para controle de acesso';
COMMENT ON COLUMN consultor_clientes.consultor_id IS 'ID do consultor';
COMMENT ON COLUMN consultor_clientes.cliente_id IS 'ID do cliente';