-- Criar tabela de produtos
CREATE TABLE produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(100),
  subcategoria VARCHAR(100),
  marca VARCHAR(100),
  modelo VARCHAR(100),
  codigo_interno VARCHAR(50),
  codigo_fornecedor VARCHAR(50),
  unidade_medida VARCHAR(20) DEFAULT 'UN',
  peso DECIMAL(10,3),
  dimensoes JSONB, -- {"altura": 10, "largura": 20, "profundidade": 5}
  cor VARCHAR(50),
  material VARCHAR(100),
  custo_base DECIMAL(10,2) NOT NULL DEFAULT 0,
  fator_multiplicador DECIMAL(5,2) NOT NULL DEFAULT 1.5,
  preco_venda DECIMAL(10,2) GENERATED ALWAYS AS (custo_base * fator_multiplicador) STORED,
  margem_lucro DECIMAL(5,2) GENERATED ALWAYS AS ((fator_multiplicador - 1) * 100) STORED,
  estoque_minimo INTEGER DEFAULT 0,
  estoque_atual INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'descontinuado')),
  imagem_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de variações de produtos
CREATE TABLE produto_variacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL, -- Ex: "Tamanho P", "Cor Azul", "Personalização Logo"
  tipo VARCHAR(50) NOT NULL, -- Ex: "tamanho", "cor", "personalizacao"
  valor VARCHAR(100) NOT NULL, -- Ex: "P", "Azul", "Logo Empresa"
  custo_adicional DECIMAL(10,2) DEFAULT 0,
  preco_adicional DECIMAL(10,2) DEFAULT 0,
  codigo VARCHAR(50),
  estoque_adicional INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX idx_produtos_nome ON produtos(nome);
CREATE INDEX idx_produtos_categoria ON produtos(categoria);
CREATE INDEX idx_produtos_status ON produtos(status);
CREATE INDEX idx_produtos_codigo_interno ON produtos(codigo_interno);
CREATE INDEX idx_produto_variacoes_produto_id ON produto_variacoes(produto_id);
CREATE INDEX idx_produto_variacoes_tipo ON produto_variacoes(tipo);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para atualizar updated_at
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON produtos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produto_variacoes_updated_at BEFORE UPDATE ON produto_variacoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_variacoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para produtos
CREATE POLICY "Permitir leitura de produtos para usuários autenticados" ON produtos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir inserção de produtos para usuários autenticados" ON produtos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização de produtos para usuários autenticados" ON produtos
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir exclusão de produtos para usuários autenticados" ON produtos
    FOR DELETE USING (auth.role() = 'authenticated');

-- Criar políticas RLS para variações de produtos
CREATE POLICY "Permitir leitura de variações para usuários autenticados" ON produto_variacoes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir inserção de variações para usuários autenticados" ON produto_variacoes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização de variações para usuários autenticados" ON produto_variacoes
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir exclusão de variações para usuários autenticados" ON produto_variacoes
    FOR DELETE USING (auth.role() = 'authenticated');

-- Conceder permissões para as roles anon e authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON produtos TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON produto_variacoes TO anon, authenticated;

-- Inserir alguns dados de exemplo
INSERT INTO produtos (nome, descricao, categoria, subcategoria, marca, custo_base, fator_multiplicador, unidade_medida, estoque_atual) VALUES
('Caneca Ecológica Personalizada', 'Caneca feita de material reciclado com possibilidade de personalização', 'Brindes', 'Canecas', 'EcoGifts', 15.50, 2.0, 'UN', 100),
('Sacola Reutilizável', 'Sacola de tecido reutilizável para compras', 'Brindes', 'Sacolas', 'GreenBag', 8.75, 1.8, 'UN', 250),
('Caderno Sustentável A5', 'Caderno com capa de material reciclado', 'Papelaria', 'Cadernos', 'EcoPaper', 12.30, 2.2, 'UN', 150);

-- Inserir algumas variações de exemplo
INSERT INTO produto_variacoes (produto_id, nome, tipo, valor, custo_adicional, preco_adicional) 
SELECT 
    p.id,
    'Cor ' || cores.cor,
    'cor',
    cores.cor,
    0,
    0
FROM produtos p
CROSS JOIN (VALUES ('Branca'), ('Azul'), ('Verde'), ('Vermelha')) AS cores(cor)
WHERE p.nome = 'Caneca Ecológica Personalizada';

INSERT INTO produto_variacoes (produto_id, nome, tipo, valor, custo_adicional, preco_adicional)
SELECT 
    p.id,
    'Tamanho ' || tamanhos.tamanho,
    'tamanho', 
    tamanhos.tamanho,
    tamanhos.custo_adicional,
    tamanhos.preco_adicional
FROM produtos p
CROSS JOIN (VALUES ('P', 0, 0), ('M', 2.50, 5.00), ('G', 5.00, 10.00)) AS tamanhos(tamanho, custo_adicional, preco_adicional)
WHERE p.nome = 'Sacola Reutilizável';

INSERT INTO produto_variacoes (produto_id, nome, tipo, valor, custo_adicional, preco_adicional)
SELECT 
    p.id,
    'Personalização ' || personalizacao.tipo,
    'personalizacao',
    personalizacao.tipo,
    personalizacao.custo_adicional,
    personalizacao.preco_adicional
FROM produtos p
CROSS JOIN (VALUES ('Logo Simples', 3.00, 8.00), ('Logo + Texto', 5.50, 12.00), ('Arte Customizada', 10.00, 25.00)) AS personalizacao(tipo, custo_adicional, preco_adicional)
WHERE p.nome = 'Caderno Sustentável A5';