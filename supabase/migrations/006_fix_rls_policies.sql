-- Corrigir políticas RLS para produtos_destaque

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Allow authenticated users to read produtos_destaque" ON produtos_destaque;
DROP POLICY IF EXISTS "Allow authenticated users to insert produtos_destaque" ON produtos_destaque;
DROP POLICY IF EXISTS "Allow authenticated users to update produtos_destaque" ON produtos_destaque;
DROP POLICY IF EXISTS "Allow authenticated users to delete produtos_destaque" ON produtos_destaque;

-- Criar políticas mais permissivas para permitir acesso público de leitura
CREATE POLICY "Allow public read access to produtos_destaque" ON produtos_destaque
    FOR SELECT USING (true);

-- Permitir inserção, atualização e exclusão para usuários autenticados
CREATE POLICY "Allow authenticated insert on produtos_destaque" ON produtos_destaque
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update on produtos_destaque" ON produtos_destaque
    FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete on produtos_destaque" ON produtos_destaque
    FOR DELETE USING (true);

-- Garantir que as permissões estão corretas
GRANT SELECT ON produtos_destaque TO anon;
GRANT ALL PRIVILEGES ON produtos_destaque TO authenticated;

-- Também garantir permissões para ecologic_products_site
GRANT SELECT ON ecologic_products_site TO anon;
GRANT ALL PRIVILEGES ON ecologic_products_site TO authenticated;