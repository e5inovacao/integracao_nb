-- Adicionar coluna fator na tabela tabelas_personalizacao
ALTER TABLE tabelas_personalizacao 
ADD COLUMN IF NOT EXISTS fator numeric(10,3);

-- Migrar dados existentes de percentual para fator
-- Exemplo: 25% vira 1.250, 100% vira 1.000
UPDATE tabelas_personalizacao 
SET fator = 1 + (percentual / 100)
WHERE fator IS NULL AND percentual IS NOT NULL;

-- Adicionar constraint para garantir que fator seja positivo
ALTER TABLE tabelas_personalizacao 
ADD CONSTRAINT tabelas_personalizacao_fator_check CHECK (fator > 0);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_tabelas_personalizacao_fator ON tabelas_personalizacao(fator);

-- Comentários para documentação
COMMENT ON COLUMN tabelas_personalizacao.fator IS 'Fator multiplicativo: 1.0 = 100%, 1.25 = 125% (aumento de 25%)';
COMMENT ON COLUMN tabelas_personalizacao.percentual IS 'Campo legado - usar fator multiplicativo em vez disso';