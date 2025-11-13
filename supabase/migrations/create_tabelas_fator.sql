-- Criar tabela para gerenciar tabelas de fator
CREATE TABLE IF NOT EXISTS tabelas_fator (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_tabela VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  quantidade_inicial INTEGER NOT NULL,
  quantidade_final INTEGER NOT NULL,
  fator DECIMAL(10,3) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_quantidade_valida CHECK (quantidade_final > quantidade_inicial),
  CONSTRAINT check_fator_positivo CHECK (fator > 0)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tabelas_fator_nome_tabela ON tabelas_fator(nome_tabela);
CREATE INDEX IF NOT EXISTS idx_tabelas_fator_status ON tabelas_fator(status);
CREATE INDEX IF NOT EXISTS idx_tabelas_fator_quantidade ON tabelas_fator(quantidade_inicial, quantidade_final);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_tabelas_fator_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tabelas_fator_updated_at
  BEFORE UPDATE ON tabelas_fator
  FOR EACH ROW
  EXECUTE FUNCTION update_tabelas_fator_updated_at();

-- RLS (Row Level Security)
ALTER TABLE tabelas_fator ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso a usuários autenticados
CREATE POLICY "Usuários autenticados podem ver tabelas de fator" ON tabelas_fator
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir tabelas de fator" ON tabelas_fator
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar tabelas de fator" ON tabelas_fator
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar tabelas de fator" ON tabelas_fator
  FOR DELETE USING (auth.role() = 'authenticated');

-- Função para buscar tabelas de fator por nome
CREATE OR REPLACE FUNCTION get_tabelas_fator_by_nome(p_nome_tabela VARCHAR(255))
RETURNS TABLE(
  id UUID,
  nome_tabela VARCHAR(255),
  status VARCHAR(20),
  quantidade_inicial INTEGER,
  quantidade_final INTEGER,
  fator DECIMAL(10,3),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tf.id,
    tf.nome_tabela,
    tf.status,
    tf.quantidade_inicial,
    tf.quantidade_final,
    tf.fator,
    tf.created_at,
    tf.updated_at
  FROM tabelas_fator tf
  WHERE tf.nome_tabela = p_nome_tabela AND tf.status = 'ativo'
  ORDER BY tf.quantidade_inicial;
END;
$$;

-- Função para calcular fator baseado na quantidade
CREATE OR REPLACE FUNCTION calcular_fator(p_nome_tabela VARCHAR(255), p_quantidade INTEGER)
RETURNS DECIMAL(10,3)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_fator DECIMAL(10,3);
BEGIN
  SELECT fator INTO v_fator
  FROM tabelas_fator
  WHERE nome_tabela = p_nome_tabela 
    AND status = 'ativo'
    AND p_quantidade >= quantidade_inicial 
    AND p_quantidade <= quantidade_final
  LIMIT 1;
  
  RETURN COALESCE(v_fator, 1.0);
END;
$$;

-- Conceder permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON tabelas_fator TO authenticated;
GRANT EXECUTE ON FUNCTION get_tabelas_fator_by_nome(VARCHAR(255)) TO authenticated;
GRANT EXECUTE ON FUNCTION calcular_fator(VARCHAR(255), INTEGER) TO authenticated;

-- Inserir dados de exemplo
INSERT INTO tabelas_fator (nome_tabela, status, quantidade_inicial, quantidade_final, fator) VALUES
('A', 'ativo', 1, 100, 1.800),
('A', 'ativo', 101, 300, 1.790),
('A', 'ativo', 301, 500, 1.780)
ON CONFLICT DO NOTHING;