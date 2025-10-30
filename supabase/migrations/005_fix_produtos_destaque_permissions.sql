-- Verificar e corrigir permissões para produtos_destaque

-- Conceder permissões básicas para o role anon
GRANT SELECT ON produtos_destaque TO anon;

-- Conceder todas as permissões para o role authenticated
GRANT ALL PRIVILEGES ON produtos_destaque TO authenticated;

-- Verificar se as políticas RLS estão corretas
-- Remover políticas existentes se necessário
DROP POLICY IF EXISTS "Admin can manage produtos_destaque" ON produtos_destaque;
DROP POLICY IF EXISTS "Consultores can view produtos_destaque" ON produtos_destaque;

-- Criar política para permitir leitura para usuários autenticados
CREATE POLICY "Allow authenticated users to read produtos_destaque" ON produtos_destaque
    FOR SELECT USING (auth.role() = 'authenticated');

-- Criar política para permitir inserção para usuários autenticados
CREATE POLICY "Allow authenticated users to insert produtos_destaque" ON produtos_destaque
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Criar política para permitir atualização para usuários autenticados
CREATE POLICY "Allow authenticated users to update produtos_destaque" ON produtos_destaque
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Criar política para permitir exclusão para usuários autenticados
CREATE POLICY "Allow authenticated users to delete produtos_destaque" ON produtos_destaque
    FOR DELETE USING (auth.role() = 'authenticated');

-- Inserir alguns produtos de exemplo para teste
INSERT INTO produtos_destaque (codigo_produto) VALUES 
    ('04198'),
    ('14981'),
    ('08123')
ON CONFLICT DO NOTHING;