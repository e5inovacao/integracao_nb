-- Criar tabela principal para solicitações de orçamento
CREATE TABLE IF NOT EXISTS solicitacoes_orcamento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero_solicitacao VARCHAR(50) UNIQUE NOT NULL,
    nome_cliente VARCHAR(255) NOT NULL,
    email_cliente VARCHAR(255) NOT NULL,
    telefone_cliente VARCHAR(20),
    empresa_cliente VARCHAR(255),
    cnpj_cliente VARCHAR(18),
    endereco_cliente TEXT,
    observacoes TEXT,
    valor_total_estimado DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'aprovado', 'rejeitado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela para itens da solicitação de orçamento
CREATE TABLE IF NOT EXISTS itens_solicitacao_orcamento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    solicitacao_id UUID NOT NULL REFERENCES solicitacoes_orcamento(id) ON DELETE CASCADE,
    produto_nome VARCHAR(255) NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    valor_unitario_estimado DECIMAL(10,2) DEFAULT 0,
    subtotal_estimado DECIMAL(10,2) DEFAULT 0,
    personalizacoes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_solicitacoes_orcamento_numero ON solicitacoes_orcamento(numero_solicitacao);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_orcamento_email ON solicitacoes_orcamento(email_cliente);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_orcamento_status ON solicitacoes_orcamento(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_orcamento_created_at ON solicitacoes_orcamento(created_at);
CREATE INDEX IF NOT EXISTS idx_itens_solicitacao_orcamento_solicitacao_id ON itens_solicitacao_orcamento(solicitacao_id);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_solicitacoes_orcamento_updated_at
    BEFORE UPDATE ON solicitacoes_orcamento
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE solicitacoes_orcamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_solicitacao_orcamento ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para permitir inserção pública
CREATE POLICY "Permitir inserção pública em solicitacoes_orcamento" ON solicitacoes_orcamento
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura pública em solicitacoes_orcamento" ON solicitacoes_orcamento
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserção pública em itens_solicitacao_orcamento" ON itens_solicitacao_orcamento
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura pública em itens_solicitacao_orcamento" ON itens_solicitacao_orcamento
    FOR SELECT USING (true);

-- Conceder permissões às roles anon e authenticated
GRANT SELECT, INSERT ON solicitacoes_orcamento TO anon;
GRANT SELECT, INSERT ON solicitacoes_orcamento TO authenticated;
GRANT SELECT, INSERT ON itens_solicitacao_orcamento TO anon;
GRANT SELECT, INSERT ON itens_solicitacao_orcamento TO authenticated;

-- Conceder permissões para usar as sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;