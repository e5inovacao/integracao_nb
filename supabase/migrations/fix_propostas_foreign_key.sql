-- Corrigir relacionamento entre propostas e solicitacao_orcamentos
-- A tabela propostas deve referenciar solicitacao_orcamentos ao invés de uma tabela orcamentos inexistente

-- Primeiro, verificar se existe alguma constraint incorreta
ALTER TABLE propostas DROP CONSTRAINT IF EXISTS propostas_orcamento_id_fkey;

-- Adicionar a foreign key correta para solicitacao_orcamentos
ALTER TABLE propostas 
ADD CONSTRAINT propostas_orcamento_id_fkey 
FOREIGN KEY (orcamento_id) REFERENCES solicitacao_orcamentos(solicitacao_id) ON DELETE CASCADE;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_propostas_orcamento_id_corrected ON propostas(orcamento_id);

-- Verificar se a constraint foi criada corretamente
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='propostas'
  AND tc.table_schema='public';