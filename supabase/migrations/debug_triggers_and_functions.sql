-- Debug completo de triggers e funções relacionadas à tabela itens_orcamento_sistema

-- 1. Listar TODOS os triggers da tabela itens_orcamento_sistema
SELECT 
    t.tgname as trigger_name,
    t.tgtype,
    t.tgenabled,
    p.proname as function_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'itens_orcamento_sistema'
AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND NOT t.tgisinternal;

-- 2. Listar TODAS as funções que mencionam 'subtotal' ou 'itens_orcamento_sistema'
SELECT 
    p.proname as function_name,
    n.nspname as schema_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE (
    pg_get_functiondef(p.oid) ILIKE '%subtotal%' 
    OR pg_get_functiondef(p.oid) ILIKE '%itens_orcamento_sistema%'
)
AND n.nspname = 'public';

-- 3. Verificar se há views que usam a coluna subtotal
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE definition ILIKE '%subtotal%' 
AND schemaname = 'public';

-- 4. Verificar estrutura atual da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'itens_orcamento_sistema'
ORDER BY ordinal_position;