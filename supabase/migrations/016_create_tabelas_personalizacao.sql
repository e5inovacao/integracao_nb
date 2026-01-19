-- Tabelas de Personalização com faixas por quantidade (igual Fatores)
CREATE TABLE IF NOT EXISTS tabelas_personalizacao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_tabela VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  quantidade_inicial INTEGER NOT NULL,
  quantidade_final INTEGER NOT NULL,
  percentual DECIMAL(10,3) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_quantidade_valida CHECK (quantidade_final > quantidade_inicial),
  CONSTRAINT check_percentual_nao_negativo CHECK (percentual >= 0)
);

CREATE INDEX IF NOT EXISTS idx_tabelas_personalizacao_nome ON tabelas_personalizacao(nome_tabela);
CREATE INDEX IF NOT EXISTS idx_tabelas_personalizacao_status ON tabelas_personalizacao(status);
CREATE INDEX IF NOT EXISTS idx_tabelas_personalizacao_quantidade ON tabelas_personalizacao(quantidade_inicial, quantidade_final);

CREATE OR REPLACE FUNCTION update_tabelas_personalizacao_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tabelas_personalizacao_updated_at
  BEFORE UPDATE ON tabelas_personalizacao
  FOR EACH ROW
  EXECUTE FUNCTION update_tabelas_personalizacao_updated_at();

ALTER TABLE tabelas_personalizacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver tabelas de personalização" ON tabelas_personalizacao
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem inserir tabelas de personalização" ON tabelas_personalizacao
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem atualizar tabelas de personalização" ON tabelas_personalizacao
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem deletar tabelas de personalização" ON tabelas_personalizacao
  FOR DELETE USING (auth.role() = 'authenticated');

GRANT SELECT, INSERT, UPDATE, DELETE ON tabelas_personalizacao TO authenticated;

-- Exemplo: Tabela P (Personalização)
INSERT INTO tabelas_personalizacao (nome_tabela, status, quantidade_inicial, quantidade_final, percentual) VALUES
('P', 'ativo', 1, 100, 10.000),
('P', 'ativo', 101, 300, 12.500)
ON CONFLICT DO NOTHING;

