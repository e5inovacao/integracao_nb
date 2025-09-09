-- Forçar refresh do PostgREST para reconhecer a tabela ecologic_products
-- Recriar a view de sistema para forçar atualização do cache

-- Primeiro, garantir que a tabela tem as permissões corretas
GRANT ALL PRIVILEGES ON ecologic_products TO anon;
GRANT ALL PRIVILEGES ON ecologic_products TO authenticated;
GRANT ALL PRIVILEGES ON ecologic_products TO service_role;

-- Forçar refresh do schema cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- Adicionar comentário para forçar mudança no schema
COMMENT ON TABLE ecologic_products IS 'Ecological products table - PostgREST cache forced refresh';

-- Analisar a tabela para atualizar estatísticas
ANALYZE ecologic_products;