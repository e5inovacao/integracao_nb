-- Adicionar coluna observacoes na tabela itens_orcamento_sistema
-- Esta coluna foi removida acidentalmente na migração recreate_itens_table.sql
-- mas é necessária para o funcionamento do sistema de orçamentos

-- 1. Adicionar a coluna observacoes
ALTER TABLE itens_orcamento_sistema 
ADD COLUMN observacoes TEXT;

-- 2. Verificar a estrutura final da tabela
SELECT 'Estrutura da tabela itens_orcamento_sistema após adicionar observacoes:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'itens_orcamento_sistema'
ORDER BY ordinal_position;

-- 3. Comentário para documentação
COMMENT ON COLUMN itens_orcamento_sistema.observacoes IS 'Observações sobre o item do orçamento, incluindo cor, customizações e notas especiais';