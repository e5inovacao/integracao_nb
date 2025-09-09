-- Verificar e conceder permissões para a tabela produtos_asia

-- Conceder permissões de SELECT para o role anon (usuários não autenticados)
GRANT SELECT ON produtos_asia TO anon;

-- Conceder todas as permissões para o role authenticated (usuários autenticados)
GRANT ALL PRIVILEGES ON produtos_asia TO authenticated;

-- Verificar as permissões concedidas
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'produtos_asia' 
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;