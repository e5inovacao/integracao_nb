-- Verificar políticas RLS na tabela eco_products
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

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'eco_products';

-- Tentar fazer uma consulta direta como anon
SET ROLE anon;
SELECT COUNT(*) as total_products FROM public.eco_products;
SELECT id, titulo, codigo FROM public.eco_products LIMIT 3;
RESET ROLE;