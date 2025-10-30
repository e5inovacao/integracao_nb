-- Verificar permissões das tabelas
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
AND table_name IN ('produtos_destaque', 'ecologic_products_site')
ORDER BY table_name, grantee;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('produtos_destaque', 'ecologic_products_site');