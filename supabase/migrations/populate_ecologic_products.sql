-- Populate ecologic_products table with data from other product tables
-- Clear existing data
TRUNCATE TABLE ecologic_products;

-- Insert data from xbz_products (mapping to actual ecologic_products columns)
INSERT INTO ecologic_products (
    tipo,
    codigo,
    titulo,
    descricao,
    img_0,
    categoria,
    cor_web_principal,
    altura,
    largura,
    comprimento,
    peso,
    variacoes
)
SELECT 
    'XBZ' as tipo,
    codigo_xbz as codigo,
    nome as titulo,
    descricao,
    image_link as img_0,
    'Produtos XBZ' as categoria,
    cor_web_principal,
    altura,
    largura,
    profundidade as comprimento,
    peso,
    NULL as variacoes
FROM xbz_products 
WHERE nome IS NOT NULL AND codigo_xbz IS NOT NULL
LIMIT 100;

-- Insert data from asia_products (mapping to actual ecologic_products columns)
INSERT INTO ecologic_products (
    tipo,
    codigo,
    titulo,
    descricao,
    img_0,
    categoria,
    cor_web_principal,
    altura,
    largura,
    comprimento,
    peso,
    variacoes
)
SELECT 
    'ASIA' as tipo,
    referencia as codigo,
    nome as titulo,
    descricao,
    imagem as img_0,
    'Produtos Asia' as categoria,
    NULL as cor_web_principal,
    altura,
    largura,
    comprimento,
    peso,
    variacoes
FROM asia_products 
WHERE status = true AND nome IS NOT NULL
LIMIT 50;

-- Insert data from spot_products (mapping to actual ecologic_products columns)
INSERT INTO ecologic_products (
    tipo,
    codigo,
    titulo,
    descricao,
    img_0,
    categoria,
    cor_web_principal,
    altura,
    largura,
    comprimento,
    peso,
    variacoes
)
SELECT 
    'SPOT' as tipo,
    "ProdReference" as codigo,
    "Name" as titulo,
    "Description" as descricao,
    "MainImage" as img_0,
    'Produtos Spot' as categoria,
    NULL as cor_web_principal,
    "BoxHeightMM" as altura,
    "BoxWidthMM" as largura,
    "BoxLengthMM" as comprimento,
    "Weight" as peso,
    NULL as variacoes
FROM spot_products 
WHERE "Name" IS NOT NULL AND "ProdReference" IS NOT NULL
LIMIT 50;

-- Verify the inserted records
SELECT COUNT(*) as total_records FROM ecologic_products;
SELECT tipo, COUNT(*) as count_by_type FROM ecologic_products GROUP BY tipo;

-- Force PostgREST schema reload
NOTIFY pgrst, 'reload schema';

-- Reset query statistics to clear any cached plans
SELECT pg_stat_statements_reset();

-- Create and drop a temporary function to force schema refresh
CREATE OR REPLACE FUNCTION temp_force_schema_reload() RETURNS void AS $$
BEGIN
    -- This function forces PostgREST to reload its schema cache
    PERFORM pg_notify('pgrst', 'reload schema');
END;
$$ LANGUAGE plpgsql;

SELECT temp_force_schema_reload();
DROP FUNCTION temp_force_schema_reload();

-- Update table comment to force cache refresh
COMMENT ON TABLE ecologic_products IS 'Ecological products table - Populated with data from multiple sources';