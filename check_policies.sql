-- Verificar políticas RLS da tabela usuarios_sistema
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'usuarios_sistema';

-- Verificar permissões da tabela usuarios_sistema
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'usuarios_sistema' 
    AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;