-- Criar tabela de personalizações com percentual
CREATE TABLE IF NOT EXISTS personalizacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  percentual DECIMAL(10,3) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_personalizacoes_nome ON personalizacoes(nome);
CREATE INDEX IF NOT EXISTS idx_personalizacoes_status ON personalizacoes(status);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_personalizacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_personalizacoes_updated_at
  BEFORE UPDATE ON personalizacoes
  FOR EACH ROW
  EXECUTE FUNCTION update_personalizacoes_updated_at();

-- RLS
ALTER TABLE personalizacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver personalizações" ON personalizacoes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir personalizações" ON personalizacoes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar personalizações" ON personalizacoes
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar personalizações" ON personalizacoes
  FOR DELETE USING (auth.role() = 'authenticated');

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON personalizacoes TO authenticated;

-- Dados exemplo
INSERT INTO personalizacoes (nome, status, percentual) VALUES
('Tampografia', 'ativo', 10.000),
('Laser', 'ativo', 15.000),
('Silkscreen', 'ativo', 12.500)
ON CONFLICT DO NOTHING;

