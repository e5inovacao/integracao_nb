-- Migration: Fix RLS Policies for itens_orcamento_sistema
-- Resolve o erro: new row violates row-level security policy for table "itens_orcamento_sistema"

-- 1. Remover políticas RLS existentes que podem estar causando problemas
DROP POLICY IF EXISTS "Allow anonymous insert on itens_orcamento_sistema" ON itens_orcamento_sistema;
DROP POLICY IF EXISTS "Allow authenticated insert on itens_orcamento_sistema" ON itens_orcamento_sistema;
DROP POLICY IF EXISTS "Allow select on itens_orcamento_sistema" ON itens_orcamento_sistema;
DROP POLICY IF EXISTS "Allow insert on itens_orcamento_sistema" ON itens_orcamento_sistema;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON itens_orcamento_sistema;
DROP POLICY IF EXISTS "Enable read access for all users" ON itens_orcamento_sistema;
DROP POLICY IF EXISTS "Allow all inserts on itens_orcamento_sistema" ON itens_orcamento_sistema;
DROP POLICY IF EXISTS "Allow all selects on itens_orcamento_sistema" ON itens_orcamento_sistema;
DROP POLICY IF EXISTS "Allow all updates on itens_orcamento_sistema" ON itens_orcamento_sistema;

-- 2. Verificar se RLS está habilitado
ALTER TABLE itens_orcamento_sistema ENABLE ROW LEVEL SECURITY;

-- 3. Criar política permissiva para inserção (permite tanto anônimos quanto autenticados)
CREATE POLICY "Allow all inserts on itens_orcamento_sistema"
    ON itens_orcamento_sistema
    FOR INSERT
    WITH CHECK (true);

-- 4. Criar política permissiva para leitura (permite tanto anônimos quanto autenticados)
CREATE POLICY "Allow all selects on itens_orcamento_sistema"
    ON itens_orcamento_sistema
    FOR SELECT
    USING (true);

-- 5. Criar política permissiva para atualização (permite tanto anônimos quanto autenticados)
CREATE POLICY "Allow all updates on itens_orcamento_sistema"
    ON itens_orcamento_sistema
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 6. Garantir que as permissões básicas estejam corretas
GRANT ALL PRIVILEGES ON itens_orcamento_sistema TO anon;
GRANT ALL PRIVILEGES ON itens_orcamento_sistema TO authenticated;

-- 7. Verificar políticas ativas
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
WHERE tablename = 'itens_orcamento_sistema'
ORDER BY policyname;

-- 8. Verificar permissões da tabela
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'itens_orcamento_sistema'
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;

SELECT 'Políticas RLS corrigidas para itens_orcamento_sistema' as status;