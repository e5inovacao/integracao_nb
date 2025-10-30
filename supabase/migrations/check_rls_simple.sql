-- Verificar políticas RLS de forma simples

-- 1. Listar todas as políticas da tabela itens_orcamento_sistema
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'itens_orcamento_sistema';

-- 2. Verificar se há views que usam a tabela
SELECT 
    schemaname,
    viewname
FROM pg_views 
WHERE definition ILIKE '%itens_orcamento_sistema%' 
AND schemaname = 'public';

-- 3. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'itens_orcamento_sistema';

-- 4. Tentar desabilitar RLS temporariamente para teste
ALTER TABLE itens_orcamento_sistema DISABLE ROW LEVEL SECURITY;

-- 5. Verificar estrutura atual da tabela
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'itens_orcamento_sistema'
ORDER BY ordinal_position;