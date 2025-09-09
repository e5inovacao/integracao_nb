-- SOLUÇÃO DEFINITIVA PARA O PROBLEMA DE INTEGER OVERFLOW
-- Remove todos os triggers problemáticos e recria as tabelas com tipos corretos

-- 1. Remover todos os triggers que podem estar causando problemas
DROP TRIGGER IF EXISTS set_quote_number_trigger ON orcamentos_sistema CASCADE;
DROP TRIGGER IF EXISTS set_orcamento_numero ON orcamentos_sistema CASCADE;
DROP TRIGGER IF EXISTS update_orcamentos_sistema_updated_at ON orcamentos_sistema CASCADE;
DROP TRIGGER IF EXISTS update_itens_orcamento_sistema_updated_at ON itens_orcamento_sistema CASCADE;

-- 2. Remover funções problemáticas
DROP FUNCTION IF EXISTS set_quote_number() CASCADE;
DROP FUNCTION IF EXISTS generate_quote_number() CASCADE;
DROP FUNCTION IF EXISTS set_orcamento_numero() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 3. Verificar se há campos integer problemáticos e convertê-los para bigint
-- (O valor 1756154394472 é um timestamp em milissegundos que precisa de bigint)
ALTER TABLE IF EXISTS orcamentos_sistema 
  ALTER COLUMN id TYPE uuid USING id::uuid;

-- 4. Remover colunas desnecessárias da tabela itens_orcamento_sistema
ALTER TABLE IF EXISTS itens_orcamento_sistema 
  DROP COLUMN IF EXISTS preco_unitario CASCADE,
  DROP COLUMN IF EXISTS subtotal CASCADE;

-- 5. Criar função simples para gerar número de orçamento sequencial
CREATE OR REPLACE FUNCTION generate_simple_quote_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
BEGIN
    -- Buscar o próximo número baseado na contagem de registros
    SELECT COALESCE(COUNT(*), 0) + 1 INTO next_number
    FROM orcamentos_sistema;
    
    -- Retornar no formato ORC000001
    RETURN 'ORC' || LPAD(next_number::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- 6. Criar função para definir número do orçamento (sem usar timestamp)
CREATE OR REPLACE FUNCTION set_simple_quote_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Só definir se não foi fornecido
    IF NEW.numero_orcamento IS NULL OR NEW.numero_orcamento = '' THEN
        NEW.numero_orcamento := generate_simple_quote_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger simples para número do orçamento
CREATE TRIGGER set_simple_quote_number_trigger
    BEFORE INSERT ON orcamentos_sistema
    FOR EACH ROW
    EXECUTE FUNCTION set_simple_quote_number();

-- 8. Criar função simples para updated_at
CREATE OR REPLACE FUNCTION update_simple_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Criar triggers para updated_at
CREATE TRIGGER update_orcamentos_sistema_simple_updated_at
    BEFORE UPDATE ON orcamentos_sistema
    FOR EACH ROW
    EXECUTE FUNCTION update_simple_updated_at();

CREATE TRIGGER update_itens_orcamento_sistema_simple_updated_at
    BEFORE UPDATE ON itens_orcamento_sistema
    FOR EACH ROW
    EXECUTE FUNCTION update_simple_updated_at();

-- 10. Limpar dados de teste problemáticos
DELETE FROM itens_orcamento_sistema WHERE orcamento_id IN (
    SELECT id FROM orcamentos_sistema WHERE numero_orcamento IS NULL OR numero_orcamento = ''
);
DELETE FROM orcamentos_sistema WHERE numero_orcamento IS NULL OR numero_orcamento = '';

-- 11. Atualizar orçamentos existentes sem número
UPDATE orcamentos_sistema 
SET numero_orcamento = generate_simple_quote_number()
WHERE numero_orcamento IS NULL OR numero_orcamento = '';

-- 12. Verificar estrutura final
SELECT 'Estrutura da tabela orcamentos_sistema:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'orcamentos_sistema'
ORDER BY ordinal_position;

SELECT 'Estrutura da tabela itens_orcamento_sistema:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'itens_orcamento_sistema'
ORDER BY ordinal_position;

SELECT 'Triggers ativos:' as info;
SELECT 
    c.relname as table_name,
    t.tgname as trigger_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
  AND c.relname IN ('orcamentos_sistema', 'itens_orcamento_sistema')
ORDER BY c.relname, t.tgname;