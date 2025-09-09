-- Verificar triggers na tabela itens_orcamento_sistema
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'itens_orcamento_sistema'
AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Verificar estrutura atual da tabela
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'itens_orcamento_sistema'
ORDER BY ordinal_position;