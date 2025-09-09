-- Garantir permissões na tabela ecologic_products
GRANT SELECT ON ecologic_products TO anon;
GRANT SELECT ON ecologic_products TO authenticated;
GRANT ALL PRIVILEGES ON ecologic_products TO service_role;

-- Forçar reload do schema PostgREST
SELECT pg_notify('pgrst', 'reload schema');

-- Verificar permissões
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'ecologic_products' 
AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee;

-- Verificar se há dados na tabela
SELECT COUNT(*) as total_records FROM ecologic_products;
SELECT 'Permissões aplicadas com sucesso na tabela ecologic_products' as status;