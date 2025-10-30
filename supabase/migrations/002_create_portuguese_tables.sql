-- Criação das tabelas em português para o sistema de orçamentos
-- Esta migration cria as tabelas que o quotesService.ts está tentando usar

-- Tabela de clientes (em português)
CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  contato VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  empresa VARCHAR(255),
  cnpj VARCHAR(18),
  endereco TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de orçamentos (em português)
CREATE TABLE orcamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero VARCHAR(50) UNIQUE NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  representante_id UUID,
  valor_total DECIMAL(10,2) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'enviado' CHECK (status IN ('enviado', 'em_analise', 'aprovado', 'rejeitado', 'finalizado')),
  observacoes TEXT,
  data_evento DATE,
  urgencia VARCHAR(20) DEFAULT 'normal' CHECK (urgencia IN ('baixa', 'normal', 'alta', 'urgente')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens do orçamento (em português)
CREATE TABLE itens_orcamento (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID REFERENCES orcamentos(id) ON DELETE CASCADE,
  produto_id UUID,
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  valor_unitario DECIMAL(10,2) DEFAULT 0.00,
  subtotal DECIMAL(10,2) DEFAULT 0.00,
  descricao_personalizada TEXT,
  personalizacoes JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_orcamentos_cliente_id ON orcamentos(cliente_id);
CREATE INDEX idx_orcamentos_numero ON orcamentos(numero);
CREATE INDEX idx_orcamentos_status ON orcamentos(status);
CREATE INDEX idx_itens_orcamento_orcamento_id ON itens_orcamento(orcamento_id);
CREATE INDEX idx_itens_orcamento_produto_id ON itens_orcamento(produto_id);

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_clientes_updated_at 
  BEFORE UPDATE ON clientes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orcamentos_updated_at 
  BEFORE UPDATE ON orcamentos 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_orcamento ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para permitir inserções e leituras públicas
-- Estas políticas permitem que qualquer usuário (incluindo anônimos) possam:
-- 1. Inserir novos clientes, orçamentos e itens
-- 2. Ler os dados que criaram

-- Políticas para a tabela clientes
CREATE POLICY "Allow public insert on clientes" 
  ON clientes FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public read on clientes" 
  ON clientes FOR SELECT 
  USING (true);

CREATE POLICY "Allow public update on clientes" 
  ON clientes FOR UPDATE 
  USING (true) 
  WITH CHECK (true);

-- Políticas para a tabela orcamentos
CREATE POLICY "Allow public insert on orcamentos" 
  ON orcamentos FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public read on orcamentos" 
  ON orcamentos FOR SELECT 
  USING (true);

CREATE POLICY "Allow public update on orcamentos" 
  ON orcamentos FOR UPDATE 
  USING (true) 
  WITH CHECK (true);

-- Políticas para a tabela itens_orcamento
CREATE POLICY "Allow public insert on itens_orcamento" 
  ON itens_orcamento FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public read on itens_orcamento" 
  ON itens_orcamento FOR SELECT 
  USING (true);

CREATE POLICY "Allow public update on itens_orcamento" 
  ON itens_orcamento FOR UPDATE 
  USING (true) 
  WITH CHECK (true);

-- Conceder permissões explícitas aos roles anon e authenticated
GRANT ALL PRIVILEGES ON clientes TO anon;
GRANT ALL PRIVILEGES ON clientes TO authenticated;

GRANT ALL PRIVILEGES ON orcamentos TO anon;
GRANT ALL PRIVILEGES ON orcamentos TO authenticated;

GRANT ALL PRIVILEGES ON itens_orcamento TO anon;
GRANT ALL PRIVILEGES ON itens_orcamento TO authenticated;

-- Conceder permissões de uso das sequences (para os UUIDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;