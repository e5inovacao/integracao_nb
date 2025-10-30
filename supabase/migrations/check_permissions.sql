-- Verificar permissões atuais para a tabela produtos_ecologicos
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'produtos_ecologicos'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Conceder permissões de leitura para roles anon e authenticated
GRANT SELECT ON produtos_ecologicos TO anon;
GRANT SELECT ON produtos_ecologicos TO authenticated;

-- Verificar novamente as permissões após concessão
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'produtos_ecologicos'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;