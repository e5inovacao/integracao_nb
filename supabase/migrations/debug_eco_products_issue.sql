-- Debug da tabela eco_products

-- 1. Verificar se a tabela existe e tem dados
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables 
WHERE tablename LIKE '%eco%products%';

-- 2. Contar registros diretamente
SELECT COUNT(*) as total_records FROM public.eco_products;

-- 3. Verificar estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'eco_products'
ORDER BY ordinal_position;

-- 4. Verificar RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'eco_products';

-- 5. Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'eco_products';

-- 6. Tentar selecionar dados diretamente
SELECT id, tipo, codigo, titulo FROM public.eco_products LIMIT 3;

-- 7. Verificar permissões da tabela
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'eco_products' 
AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee;