-- Criar tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Dados básicos
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(50),
  documento VARCHAR(50), -- CPF/CNPJ
  tipo_pessoa VARCHAR(20) DEFAULT 'fisica' CHECK (tipo_pessoa IN ('fisica', 'juridica')),
  
  -- Endereço
  cep VARCHAR(10),
  endereco TEXT,
  numero VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  
  -- Contato
  contato_nome VARCHAR(255),
  contato_cargo VARCHAR(100),
  contato_telefone VARCHAR(50),
  contato_email VARCHAR(255),
  
  -- Observações
  observacoes TEXT,
  
  -- Status
  ativo BOOLEAN DEFAULT true
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_documento ON clientes(documento);
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo);

-- Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Permitir todas as operações para usuários autenticados" ON clientes
  FOR ALL USING (auth.role() = 'authenticated');

-- Conceder permissões
GRANT ALL PRIVILEGES ON clientes TO authenticated;
GRANT SELECT ON clientes TO anon;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();