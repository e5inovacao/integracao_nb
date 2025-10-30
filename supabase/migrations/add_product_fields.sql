-- Adicionar novos campos na tabela products_solicitacao
ALTER TABLE products_solicitacao 
ADD COLUMN IF NOT EXISTS gravacao TEXT,
ADD COLUMN IF NOT EXISTS personalizacao TEXT,
ADD COLUMN IF NOT EXISTS info TEXT,
ADD COLUMN IF NOT EXISTS custo DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS preco_unitario DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS valor_unitario DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS observacoes TEXT,
ADD COLUMN IF NOT EXISTS fator TEXT,
ADD COLUMN IF NOT EXISTS preco1 DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS preco2 DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS preco3 DECIMAL(10,2);

-- Comentários para documentar os campos
COMMENT ON COLUMN products_solicitacao.gravacao IS 'Tipo de gravação selecionada para o produto';
COMMENT ON COLUMN products_solicitacao.personalizacao IS 'Detalhes da personalização do produto';
COMMENT ON COLUMN products_solicitacao.info IS 'Informações adicionais sobre o produto';
COMMENT ON COLUMN products_solicitacao.custo IS 'Custo do produto';
COMMENT ON COLUMN products_solicitacao.preco_unitario IS 'Preço unitário do produto';
COMMENT ON COLUMN products_solicitacao.valor_unitario IS 'Valor unitário para cálculos';
COMMENT ON COLUMN products_solicitacao.observacoes IS 'Observações gerais do produto';
COMMENT ON COLUMN products_solicitacao.fator IS 'Fator multiplicador para cálculos';
COMMENT ON COLUMN products_solicitacao.preco1 IS 'Preço para quantidade 1';
COMMENT ON COLUMN products_solicitacao.preco2 IS 'Preço para quantidade 2';
COMMENT ON COLUMN products_solicitacao.preco3 IS 'Preço para quantidade 3';

-- Garantir permissões para os roles
GRANT SELECT, INSERT, UPDATE, DELETE ON products_solicitacao TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON products_solicitacao TO authenticated;