-- Criar tabela de propostas para armazenar múltiplas propostas por orçamento
CREATE TABLE IF NOT EXISTS propostas (
  id SERIAL PRIMARY KEY,
  orcamento_id INTEGER NOT NULL,
  numero_proposta TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT DEFAULT 'Proposta Criada' CHECK (status IN ('Proposta Criada', 'Proposta Enviada', 'Proposta Aprovada', 'Proposta Rejeitada')),
  valor_total DECIMAL(10,2) DEFAULT 0,
  observacoes TEXT,
  
  -- Campos específicos da proposta
  validade_proposta TEXT,
  prazo_entrega TEXT,
  forma_pagamento TEXT,
  opcao_frete TEXT,
  local_entrega TEXT,
  local_cobranca TEXT,
  
  -- Campos de auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(orcamento_id, numero_proposta)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_propostas_orcamento_id ON propostas(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_propostas_status ON propostas(status);
CREATE INDEX IF NOT EXISTS idx_propostas_created_at ON propostas(created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
CREATE POLICY "Allow authenticated users to view propostas" ON propostas
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert propostas" ON propostas
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update propostas" ON propostas
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete propostas" ON propostas
  FOR DELETE USING (auth.role() = 'authenticated');

-- Conceder permissões
GRANT ALL ON propostas TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE propostas_id_seq TO authenticated;

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_propostas_updated_at 
  BEFORE UPDATE ON propostas 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Criar tabela para itens das propostas (cópia dos itens do orçamento no momento da criação da proposta)
CREATE TABLE IF NOT EXISTS propostas_itens (
  id SERIAL PRIMARY KEY,
  proposta_id INTEGER NOT NULL REFERENCES propostas(id) ON DELETE CASCADE,
  produto_id TEXT,
  descricao TEXT NOT NULL,
  quantidade INTEGER DEFAULT 1,
  valor_unitario DECIMAL(10,2) DEFAULT 0,
  desconto_percentual DECIMAL(5,2) DEFAULT 0,
  valor_total DECIMAL(10,2) DEFAULT 0,
  observacoes TEXT,
  ordem INTEGER DEFAULT 0,
  
  -- Campos adicionais do produto
  customizations TEXT,
  gravacao TEXT,
  fator TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para propostas_itens
CREATE INDEX IF NOT EXISTS idx_propostas_itens_proposta_id ON propostas_itens(proposta_id);
CREATE INDEX IF NOT EXISTS idx_propostas_itens_produto_id ON propostas_itens(produto_id);

-- Habilitar RLS para propostas_itens
ALTER TABLE propostas_itens ENABLE ROW LEVEL SECURITY;

-- Criar políticas para propostas_itens
CREATE POLICY "Allow authenticated users to view propostas_itens" ON propostas_itens
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert propostas_itens" ON propostas_itens
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update propostas_itens" ON propostas_itens
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete propostas_itens" ON propostas_itens
  FOR DELETE USING (auth.role() = 'authenticated');

-- Conceder permissões para propostas_itens
GRANT ALL ON propostas_itens TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE propostas_itens_id_seq TO authenticated;

-- Função para gerar número sequencial de proposta por orçamento
CREATE OR REPLACE FUNCTION generate_proposta_number(p_orcamento_id INTEGER)
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    proposta_number TEXT;
BEGIN
    -- Buscar o próximo número sequencial para este orçamento
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_proposta FROM '[0-9]+') AS INTEGER)), 0) + 1
    INTO next_number
    FROM propostas 
    WHERE orcamento_id = p_orcamento_id;
    
    -- Formatar como "01", "02", etc.
    proposta_number := LPAD(next_number::TEXT, 2, '0');
    
    RETURN proposta_number;
END;
$$ LANGUAGE plpgsql;

-- Conceder permissão para executar a função
GRANT EXECUTE ON FUNCTION generate_proposta_number(INTEGER) TO authenticated;