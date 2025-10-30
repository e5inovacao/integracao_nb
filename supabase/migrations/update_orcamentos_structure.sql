-- Atualização da estrutura de orçamentos para simplificar e adicionar campos de conteúdo rico
-- Baseado na documentação técnica das melhorias do sistema

-- 1. Simplificar estrutura removendo complexidade de versões múltiplas
-- Adicionar campos necessários à tabela principal de orçamentos

-- Adicionar campos de conteúdo rico e numeração única
ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS observacoes_ricas TEXT,
ADD COLUMN IF NOT EXISTS descricao_rica TEXT,
ADD COLUMN IF NOT EXISTS informacoes_adicionais_ricas TEXT;

-- Adicionar campos para melhor controle de numeração
ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS numero_sequencial INTEGER,
ADD COLUMN IF NOT EXISTS ano_orcamento INTEGER;

-- Atualizar campos existentes para suportar conteúdo rico nos itens
ALTER TABLE orcamento_itens 
ADD COLUMN IF NOT EXISTS descricao_rica TEXT,
ADD COLUMN IF NOT EXISTS observacoes_ricas TEXT,
ADD COLUMN IF NOT EXISTS cor_selecionada VARCHAR(100),
ADD COLUMN IF NOT EXISTS variacao_selecionada VARCHAR(100);

-- Criar função melhorada para gerar número único do orçamento
CREATE OR REPLACE FUNCTION gerar_numero_orcamento_unico()
RETURNS TRIGGER AS $$
DECLARE
    ano_atual INTEGER;
    proximo_numero INTEGER;
    numero_formatado VARCHAR(50);
BEGIN
    -- Obter o ano atual
    ano_atual := EXTRACT(YEAR FROM NOW());
    
    -- Obter o próximo número sequencial para o ano
    SELECT COALESCE(MAX(numero_sequencial), 0) + 1
    INTO proximo_numero
    FROM orcamentos
    WHERE ano_orcamento = ano_atual;
    
    -- Formatar o número do orçamento
    numero_formatado := ano_atual || '-' || LPAD(proximo_numero::TEXT, 4, '0');
    
    -- Atribuir os valores gerados
    NEW.numero_orcamento := numero_formatado;
    NEW.numero_sequencial := proximo_numero;
    NEW.ano_orcamento := ano_atual;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Remover trigger antigo e criar novo
DROP TRIGGER IF EXISTS trigger_gerar_numero_orcamento ON orcamentos;

CREATE TRIGGER trigger_gerar_numero_orcamento_unico
    BEFORE INSERT ON orcamentos
    FOR EACH ROW
    WHEN (NEW.numero_orcamento IS NULL OR NEW.numero_orcamento = '')
    EXECUTE FUNCTION gerar_numero_orcamento_unico();

-- Atualizar dados existentes para ter numeração sequencial
UPDATE orcamentos 
SET 
    ano_orcamento = EXTRACT(YEAR FROM data_criacao),
    numero_sequencial = CAST(SUBSTRING(numero_orcamento FROM '[0-9]+$') AS INTEGER)
WHERE ano_orcamento IS NULL;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_orcamentos_ano_sequencial ON orcamentos(ano_orcamento, numero_sequencial);
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_cor ON orcamento_itens(cor_selecionada);
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_variacao ON orcamento_itens(variacao_selecionada);

-- Atualizar função de valor total para considerar apenas a estrutura simplificada
CREATE OR REPLACE FUNCTION atualizar_valor_total_orcamento_simples()
RETURNS TRIGGER AS $$
DECLARE
    novo_valor_total DECIMAL(10,2);
    orcamento_id_atual INTEGER;
BEGIN
    -- Determinar o orcamento_id baseado na operação
    IF TG_OP = 'DELETE' THEN
        orcamento_id_atual := OLD.versao_id;
    ELSE
        orcamento_id_atual := NEW.versao_id;
    END IF;
    
    -- Calcular o novo valor total diretamente dos itens
    SELECT COALESCE(SUM(oi.valor_total), 0) INTO novo_valor_total
    FROM orcamento_itens oi
    WHERE oi.versao_id = orcamento_id_atual;
    
    -- Atualizar o valor total no orçamento
    UPDATE orcamentos
    SET valor_total = novo_valor_total
    WHERE id = orcamento_id_atual;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ language 'plpgsql';

-- Comentários sobre a estrutura simplificada
COMMENT ON COLUMN orcamentos.observacoes_ricas IS 'Campo de observações com suporte a formatação rica (HTML/Markdown)';
COMMENT ON COLUMN orcamentos.descricao_rica IS 'Campo de descrição com suporte a formatação rica (HTML/Markdown)';
COMMENT ON COLUMN orcamentos.informacoes_adicionais_ricas IS 'Campo de informações adicionais com suporte a formatação rica (HTML/Markdown)';
COMMENT ON COLUMN orcamentos.numero_sequencial IS 'Número sequencial único por ano para facilitar ordenação';
COMMENT ON COLUMN orcamentos.ano_orcamento IS 'Ano do orçamento para controle de numeração';

COMMENT ON COLUMN orcamento_itens.descricao_rica IS 'Descrição do item com suporte a formatação rica (HTML/Markdown)';
COMMENT ON COLUMN orcamento_itens.observacoes_ricas IS 'Observações do item com suporte a formatação rica (HTML/Markdown)';
COMMENT ON COLUMN orcamento_itens.cor_selecionada IS 'Cor selecionada para o produto';
COMMENT ON COLUMN orcamento_itens.variacao_selecionada IS 'Variação selecionada para o produto';