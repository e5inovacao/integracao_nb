-- Corrigir tipo dos campos valor_qtd01, valor_qtd02, valor_qtd03 de integer para DECIMAL(10,2)
-- Estes campos armazenam valores monetários que podem ter casas decimais

ALTER TABLE products_solicitacao 
ALTER COLUMN valor_qtd01 TYPE DECIMAL(10,2),
ALTER COLUMN valor_qtd02 TYPE DECIMAL(10,2),
ALTER COLUMN valor_qtd03 TYPE DECIMAL(10,2);

-- Adicionar comentários para documentar os campos
COMMENT ON COLUMN products_solicitacao.valor_qtd01 IS 'Valor monetário para quantidade 1 (DECIMAL para suportar centavos)';
COMMENT ON COLUMN products_solicitacao.valor_qtd02 IS 'Valor monetário para quantidade 2 (DECIMAL para suportar centavos)';
COMMENT ON COLUMN products_solicitacao.valor_qtd03 IS 'Valor monetário para quantidade 3 (DECIMAL para suportar centavos)';