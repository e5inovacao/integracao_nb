-- Garantir permissões para a tabela ecologic_products_site

-- Conceder permissões SELECT para role anon (usuários não autenticados)
GRANT SELECT ON ecologic_products_site TO anon;

-- Conceder todas as permissões para role authenticated (usuários autenticados)
GRANT ALL PRIVILEGES ON ecologic_products_site TO authenticated;

-- Verificar se RLS está habilitado (opcional, mas recomendado)
-- ALTER TABLE ecologic_products_site ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir acesso total aos usuários autenticados (se RLS estiver habilitado)
-- CREATE POLICY "Allow full access to authenticated users" ON ecologic_products_site
--   FOR ALL USING (true) WITH CHECK (true);

-- Criar política para permitir leitura aos usuários anônimos (se RLS estiver habilitado)
-- CREATE POLICY "Allow read access to anonymous users" ON ecologic_products_site
--   FOR SELECT USING (true)