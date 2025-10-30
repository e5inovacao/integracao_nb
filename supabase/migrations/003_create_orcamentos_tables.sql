-- Criar tabela de orçamentos
CREATE TABLE IF NOT EXISTS orcamentos (
  id SERIAL PRIMARY KEY,
  numero_orcamento VARCHAR(50) UNIQUE NOT NULL,
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_validade DATE,
  status VARCHAR(20) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviado', 'aprovado', 'rejeitado', 'expirado')),
  valor_total DECIMAL(10,2) DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de versões do orçamento
CREATE TABLE IF NOT EXISTS orcamento_versoes (
  id SERIAL PRIMARY KEY,
  orcamento_id INTEGER REFERENCES orcamentos(id) ON DELETE CASCADE,
  versao INTEGER NOT NULL DEFAULT 1,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  valor_total DECIMAL(10,2) DEFAULT 0,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ativa BOOLEAN DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(orcamento_id, versao)
);

-- Criar tabela de itens do orçamento
CREATE TABLE IF NOT EXISTS orcamento_itens (
  id SERIAL PRIMARY KEY,
  versao_id INTEGER REFERENCES orcamento_versoes(id) ON DELETE CASCADE,
  produto_id INTEGER REFERENCES produtos(id) ON DELETE CASCADE,
  descricao VARCHAR(255) NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
  observacoes TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de propostas (PDFs gerados)
CREATE TABLE IF NOT EXISTS orcamento_propostas (
  id SERIAL PRIMARY KEY,
  versao_id INTEGER REFERENCES orcamento_versoes(id) ON DELETE CASCADE,
  nome_arquivo VARCHAR(255) NOT NULL,
  url_arquivo TEXT,
  data_geracao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tipo VARCHAR(20) DEFAULT 'pdf' CHECK (tipo IN ('pdf', 'excel')),
  tamanho_arquivo INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de histórico do orçamento
CREATE TABLE IF NOT EXISTS orcamento_historico (
  id SERIAL PRIMARY KEY,
  orcamento_id INTEGER REFERENCES orcamentos(id) ON DELETE CASCADE,
  acao VARCHAR(50) NOT NULL,
  descricao TEXT,
  usuario_id UUID,
  data_acao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dados_anteriores JSONB,
  dados_novos JSONB
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente_id ON orcamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_numero ON orcamentos(numero_orcamento);
CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON orcamentos(status);
CREATE INDEX IF NOT EXISTS idx_orcamentos_data_criacao ON orcamentos(data_criacao);

CREATE INDEX IF NOT EXISTS idx_orcamento_versoes_orcamento_id ON orcamento_versoes(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_versoes_ativa ON orcamento_versoes(ativa);

CREATE INDEX IF NOT EXISTS idx_orcamento_itens_versao_id ON orcamento_itens(versao_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_produto_id ON orcamento_itens(produto_id);

CREATE INDEX IF NOT EXISTS idx_orcamento_propostas_versao_id ON orcamento_propostas(versao_id);

CREATE INDEX IF NOT EXISTS idx_orcamento_historico_orcamento_id ON orcamento_historico(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_historico_data_acao ON orcamento_historico(data_acao);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para atualizar updated_at
CREATE TRIGGER update_orcamentos_updated_at BEFORE UPDATE ON orcamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar função para gerar número do orçamento
CREATE OR REPLACE FUNCTION gerar_numero_orcamento()
RETURNS TRIGGER AS $$
DECLARE
    ano_atual INTEGER;
    proximo_numero INTEGER;
    numero_formatado VARCHAR(50);
BEGIN
    -- Obter o ano atual
    ano_atual := EXTRACT(YEAR FROM NOW());
    
    -- Obter o próximo número sequencial para o ano
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_orcamento FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO proximo_numero
    FROM orcamentos
    WHERE numero_orcamento LIKE ano_atual || '-%';
    
    -- Formatar o número do orçamento
    numero_formatado := ano_atual || '-' || LPAD(proximo_numero::TEXT, 4, '0');
    
    -- Atribuir o número gerado
    NEW.numero_orcamento := numero_formatado;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para gerar número do orçamento automaticamente
CREATE TRIGGER trigger_gerar_numero_orcamento
    BEFORE INSERT ON orcamentos
    FOR EACH ROW
    WHEN (NEW.numero_orcamento IS NULL OR NEW.numero_orcamento = '')
    EXECUTE FUNCTION gerar_numero_orcamento();

-- Criar função para atualizar valor total do orçamento
CREATE OR REPLACE FUNCTION atualizar_valor_total_orcamento()
RETURNS TRIGGER AS $$
DECLARE
    novo_valor_total DECIMAL(10,2);
    orcamento_id_atual INTEGER;
BEGIN
    -- Determinar o orcamento_id baseado na operação
    IF TG_OP = 'DELETE' THEN
        SELECT ov.orcamento_id INTO orcamento_id_atual
        FROM orcamento_versoes ov
        WHERE ov.id = OLD.versao_id;
    ELSE
        SELECT ov.orcamento_id INTO orcamento_id_atual
        FROM orcamento_versoes ov
        WHERE ov.id = NEW.versao_id;
    END IF;
    
    -- Calcular o novo valor total da versão ativa
    SELECT COALESCE(SUM(oi.valor_total), 0) INTO novo_valor_total
    FROM orcamento_itens oi
    JOIN orcamento_versoes ov ON oi.versao_id = ov.id
    WHERE ov.orcamento_id = orcamento_id_atual AND ov.ativa = true;
    
    -- Atualizar o valor total no orçamento
    UPDATE orcamentos
    SET valor_total = novo_valor_total
    WHERE id = orcamento_id_atual;
    
    -- Atualizar o valor total na versão ativa
    UPDATE orcamento_versoes
    SET valor_total = novo_valor_total
    WHERE orcamento_id = orcamento_id_atual AND ativa = true;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ language 'plpgsql';

-- Criar triggers para atualizar valor total
CREATE TRIGGER trigger_atualizar_valor_total_insert
    AFTER INSERT ON orcamento_itens
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_valor_total_orcamento();

CREATE TRIGGER trigger_atualizar_valor_total_update
    AFTER UPDATE ON orcamento_itens
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_valor_total_orcamento();

CREATE TRIGGER trigger_atualizar_valor_total_delete
    AFTER DELETE ON orcamento_itens
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_valor_total_orcamento();

-- Habilitar RLS (Row Level Security)
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_historico ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para usuários autenticados
CREATE POLICY "Usuários autenticados podem ver todos os orçamentos" ON orcamentos
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver todas as versões" ON orcamento_versoes
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver todos os itens" ON orcamento_itens
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver todas as propostas" ON orcamento_propostas
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver todo o histórico" ON orcamento_historico
    FOR ALL USING (auth.role() = 'authenticated');

-- Dados de exemplo serão inseridos após criação de clientes

-- Dados de exemplo das versões e itens serão inseridos após criação de orçamentos

-- Dados de exemplo do histórico serão inseridos após criação de orçamentos

-- Comentários para documentação
COMMENT ON TABLE orcamentos IS 'Tabela principal de orçamentos';
COMMENT ON TABLE orcamento_versoes IS 'Versões dos orçamentos para controle de alterações';
COMMENT ON TABLE orcamento_itens IS 'Itens/produtos incluídos em cada versão do orçamento';
COMMENT ON TABLE orcamento_propostas IS 'Propostas geradas em PDF ou outros formatos';
COMMENT ON TABLE orcamento_historico IS 'Histórico de ações realizadas nos orçamentos';

COMMENT ON COLUMN orcamentos.numero_orcamento IS 'Número único do orçamento no formato YYYY-NNNN';
COMMENT ON COLUMN orcamentos.status IS 'Status atual: rascunho, enviado, aprovado, rejeitado, expirado';
COMMENT ON COLUMN orcamento_versoes.ativa IS 'Indica se esta é a versão ativa do orçamento';
COMMENT ON COLUMN orcamento_itens.valor_total IS 'Valor calculado automaticamente (quantidade × valor_unitario)';