-- Conceder permissões para a tabela eco_products
-- Permitir acesso de leitura para o role anon (usuários não autenticados)
GRANT SELECT ON eco_products TO anon;

-- Permitir acesso completo para o role authenticated (usuários autenticados)
GRANT ALL PRIVILEGES ON eco_products TO authenticated;

-- Verificar as permissões após a concessão
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'eco_products'
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Notificar PostgREST para recarregar o schema
NOTIFY pgrst, 'reload schema';