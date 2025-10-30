-- Adicionar coluna imagem_variacao_capturada à tabela products_solicitacao
-- Esta coluna armazenará a URL da imagem da variação selecionada pelo usuário

ALTER TABLE products_solicitacao 
ADD COLUMN IF NOT EXISTS imagem_variacao_capturada TEXT;

-- Adicionar comentário para documentar o propósito da coluna
COMMENT ON COLUMN products_solicitacao.imagem_variacao_capturada IS 'URL da imagem capturada da variação selecionada pelo usuário';

-- Atualizar registros existentes para usar a imagem_variacao como fallback
UPDATE products_solicitacao 
SET imagem_variacao_capturada = imagem_variacao 
WHERE imagem_variacao_capturada IS NULL AND imagem_variacao IS NOT NULL;