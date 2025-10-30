-- Conceder permissões para a tabela produtos_destaque
GRANT SELECT ON produtos_destaque TO anon;
GRANT ALL PRIVILEGES ON produtos_destaque TO authenticated;

-- Conceder permissões para a tabela ecologic_products_site
GRANT SELECT ON ecologic_products_site TO anon;
GRANT ALL PRIVILEGES ON ecologic_products_site TO authenticated;

-- Verificar se as permissões foram aplicadas
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
AND table_name IN ('produtos_destaque', 'ecologic_products_site')
ORDER BY table_name, grantee;