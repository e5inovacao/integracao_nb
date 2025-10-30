-- Atualização da estrutura das tabelas existentes para suportar as melhorias do sistema
-- Baseado na documentação técnica e estrutura atual do banco

-- 1. Adicionar campos de conteúdo rico e numeração única à tabela solicitacao_orcamentos
ALTER TABLE solicitacao_orcamentos 
ADD COLUMN IF NOT EXISTS descricao_rica TEXT,
ADD COLUMN IF NOT EXISTS observacoes_ricas TEXT,
ADD COLUMN IF NOT EXISTS informacoes_adicionais_ricas TEXT,
ADD COLUMN IF NOT EXISTS numero_sequencial INTEGER,
ADD COLUMN IF NOT EXISTS ano_orcamento INTEGER;

-- 2. Adicionar campos de variação e conteúdo rico à tabela products_solicitacao
ALTER TABLE products_solicitacao 
ADD COLUMN IF NOT EXISTS variacao_selecionada VARCHAR(100),
ADD COLUMN IF NOT EXISTS cor_selecionada VARCHAR(50),
ADD COLUMN IF NOT EXISTS descricao_rica TEXT,
ADD COLUMN IF NOT EXISTS observacoes_ricas TEXT,
ADD COLUMN IF NOT EXISTS imagem_variacao VARCHAR(255);

-- 3. Adicionar campo de conteúdo rico à tabela propostas
ALTER TABLE propostas 
ADD COLUMN IF NOT EXISTS conteudo_rico TEXT,
ADD COLUMN IF NOT EXISTS descricao_rica TEXT;

-- 4. Função para gerar número único de orçamento
CREATE OR REPLACE FUNCTION gerar_numero_orcamento_unico()
RETURNS TRIGGER AS $$
DECLARE
    ano_atual INTEGER;
    proximo_numero INTEGER;
    numero_formatado TEXT;
BEGIN
    -- Obter o ano atual
    ano_atual := EXTRACT(YEAR FROM NOW());
    
    -- Buscar o próximo número sequencial para o ano atual
    SELECT COALESCE(MAX(numero_sequencial), 0) + 1
    INTO proximo_numero
    FROM solicitacao_orcamentos
    WHERE ano_orcamento = ano_atual;
    
    -- Formatar o número do orçamento
    numero_formatado := ano_atual || '-' || LPAD(proximo_numero::TEXT, 4, '0');
    
    -- Atribuir os valores gerados
    NEW.numero_solicitacao := numero_formatado;
    NEW.numero_sequencial := proximo_numero;
    NEW.ano_orcamento := ano_atual;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para gerar número único automaticamente (apenas se não existir)
DROP TRIGGER IF EXISTS trigger_gerar_numero_orcamento ON solicitacao_orcamentos;
CREATE TRIGGER trigger_gerar_numero_orcamento
    BEFORE INSERT ON solicitacao_orcamentos
    FOR EACH ROW
    WHEN (NEW.numero_solicitacao IS NULL)
    EXECUTE FUNCTION gerar_numero_orcamento_unico();

-- 6. Atualizar registros existentes que não possuem numeração
-- Primeiro, atualizar o ano_orcamento
UPDATE solicitacao_orcamentos 
SET ano_orcamento = EXTRACT(YEAR FROM created_at)
WHERE ano_orcamento IS NULL;

-- Usar uma CTE para calcular numero_sequencial e depois aplicar
WITH numbered_rows AS (
    SELECT 
        solicitacao_id,
        ROW_NUMBER() OVER (
            PARTITION BY EXTRACT(YEAR FROM created_at) 
            ORDER BY created_at
        ) as new_numero_sequencial
    FROM solicitacao_orcamentos 
    WHERE numero_sequencial IS NULL
)
UPDATE solicitacao_orcamentos 
SET numero_sequencial = numbered_rows.new_numero_sequencial
FROM numbered_rows
WHERE solicitacao_orcamentos.solicitacao_id = numbered_rows.solicitacao_id;

-- Atualizar numero_solicitacao para registros sem numeração
UPDATE solicitacao_orcamentos 
SET numero_solicitacao = ano_orcamento || '-' || LPAD(numero_sequencial::TEXT, 4, '0')
WHERE numero_solicitacao IS NULL;

-- 7. Função aprimorada para gerar número de proposta baseado no orçamento
CREATE OR REPLACE FUNCTION generate_proposta_number_enhanced(p_orcamento_id INTEGER)
RETURNS TEXT AS $$
DECLARE
    orcamento_numero TEXT;
    contador INTEGER;
    numero_proposta TEXT;
BEGIN
    -- Buscar número do orçamento
    SELECT numero_solicitacao INTO orcamento_numero
    FROM solicitacao_orcamentos
    WHERE solicitacao_id = p_orcamento_id;
    
    -- Se não encontrar o número do orçamento, gerar um temporário
    IF orcamento_numero IS NULL THEN
        orcamento_numero := 'ORG-' || p_orcamento_id;
    END IF;
    
    -- Contar propostas existentes para este orçamento
    SELECT COUNT(*) + 1 INTO contador
    FROM propostas
    WHERE orcamento_id = p_orcamento_id;
    
    -- Gerar número da proposta
    numero_proposta := orcamento_numero || '-P' || LPAD(contador::TEXT, 2, '0');
    
    RETURN numero_proposta;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_solicitacao_orcamentos_numero_sequencial ON solicitacao_orcamentos(numero_sequencial);
CREATE INDEX IF NOT EXISTS idx_solicitacao_orcamentos_ano_orcamento ON solicitacao_orcamentos(ano_orcamento);
CREATE INDEX IF NOT EXISTS idx_products_solicitacao_variacao ON products_solicitacao(variacao_selecionada);
CREATE INDEX IF NOT EXISTS idx_products_solicitacao_cor ON products_solicitacao(cor_selecionada);

-- 9. Comentários para documentação
COMMENT ON COLUMN solicitacao_orcamentos.descricao_rica IS 'Descrição do orçamento com suporte a formatação rica (HTML)';
COMMENT ON COLUMN solicitacao_orcamentos.observacoes_ricas IS 'Observações do orçamento com suporte a formatação rica (HTML)';
COMMENT ON COLUMN solicitacao_orcamentos.informacoes_adicionais_ricas IS 'Informações adicionais com suporte a formatação rica (HTML)';
COMMENT ON COLUMN solicitacao_orcamentos.numero_sequencial IS 'Número sequencial do orçamento no ano';
COMMENT ON COLUMN solicitacao_orcamentos.ano_orcamento IS 'Ano de criação do orçamento para numeração';

COMMENT ON COLUMN products_solicitacao.variacao_selecionada IS 'Variação selecionada para o produto';
COMMENT ON COLUMN products_solicitacao.cor_selecionada IS 'Cor selecionada para o produto';
COMMENT ON COLUMN products_solicitacao.descricao_rica IS 'Descrição do item com suporte a formatação rica (HTML)';
COMMENT ON COLUMN products_solicitacao.observacoes_ricas IS 'Observações do item com suporte a formatação rica (HTML)';
COMMENT ON COLUMN products_solicitacao.imagem_variacao IS 'URL da imagem correspondente à variação selecionada';

COMMENT ON COLUMN propostas.conteudo_rico IS 'Conteúdo da proposta com suporte a formatação rica (HTML)';
COMMENT ON COLUMN propostas.descricao_rica IS 'Descrição da proposta com suporte a formatação rica (HTML)';

-- 10. Conceder permissões necessárias
GRANT EXECUTE ON FUNCTION gerar_numero_orcamento_unico() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_proposta_number_enhanced(INTEGER) TO authenticated;

-- Verificar se as permissões básicas estão corretas
GRANT SELECT, INSERT, UPDATE ON solicitacao_orcamentos TO authenticated;
GRANT SELECT, INSERT, UPDATE ON products_solicitacao TO authenticated;
GRANT SELECT, INSERT, UPDATE ON propostas TO authenticated;