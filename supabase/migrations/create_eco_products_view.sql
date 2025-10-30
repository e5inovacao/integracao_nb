-- Criar view eco_products como alias para ecologic_products
-- Isso resolve o problema do PostgREST que está procurando por 'eco_products'

CREATE OR REPLACE VIEW eco_products AS 
SELECT * FROM ecologic_products;

-- Garantir permissões na view
GRANT ALL PRIVILEGES ON eco_products TO anon;
GRANT ALL PRIVILEGES ON eco_products TO authenticated;
GRANT ALL PRIVILEGES ON eco_products TO service_role;

-- Forçar reload do schema
NOTIFY pgrst, 'reload schema';