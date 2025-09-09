-- Corrigir mapeamento da tabela ecologic_products
-- Drop e recriar a tabela com dados corretos

DROP TABLE IF EXISTS public.ecologic_products CASCADE;

CREATE TABLE public.ecologic_products (
    id SERIAL PRIMARY KEY,
    tipo TEXT NOT NULL, -- 'XBZ', 'ASIA', 'SPOT'
    codigo TEXT NOT NULL,
    titulo TEXT,
    descricao TEXT,
    preco NUMERIC,
    imagem TEXT,
    galeria JSONB,
    video TEXT,
    categorias JSONB,
    propriedades JSONB,
    propriedades2 JSONB,
    promocao BOOLEAN DEFAULT false,
    status BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.ecologic_products ENABLE ROW LEVEL SECURITY;

-- Conceder permissões
GRANT SELECT ON public.ecologic_products TO anon;
GRANT ALL PRIVILEGES ON public.ecologic_products TO authenticated;

-- Criar políticas
CREATE POLICY "Allow public read access" ON public.ecologic_products
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated full access" ON public.ecologic_products
    FOR ALL USING (auth.role() = 'authenticated');

-- Popular com dados do XBZ (mapeamento correto)
INSERT INTO public.ecologic_products (
    tipo, codigo, titulo, descricao, preco, imagem, 
    galeria, video, categorias, propriedades, promocao, status
)
SELECT 
    'XBZ' as tipo,
    COALESCE(codigo_composto, codigo_xbz) as codigo,
    nome as titulo,
    descricao,
    preco_venda as preco,
    image_link as imagem,
    '[]'::jsonb as galeria,
    NULL as video,
    '[]'::jsonb as categorias,
    jsonb_build_object(
        'peso', peso,
        'altura', altura,
        'largura', largura,
        'profundidade', profundidade,
        'ncm', ncm,
        'cor_principal', cor_web_principal,
        'cor_secundaria', cor_web_secundaria
    ) as propriedades,
    false as promocao,
    (quantidade_disponivel > 0) as status
FROM xbz_products 
WHERE nome IS NOT NULL 
LIMIT 20;

-- Popular com dados do ASIA (mapeamento correto)
INSERT INTO public.ecologic_products (
    tipo, codigo, titulo, descricao, preco, imagem, 
    galeria, video, categorias, propriedades, propriedades2, promocao, status
)
SELECT 
    'ASIA' as tipo,
    referencia as codigo,
    nome as titulo,
    descricao,
    preco,
    imagem,
    COALESCE(galeria, '[]'::jsonb) as galeria,
    video,
    COALESCE(categorias, '[]'::jsonb) as categorias,
    COALESCE(propriedades, '{}'::jsonb) as propriedades,
    COALESCE(propriedades2, '{}'::jsonb) as propriedades2,
    COALESCE(promocao, false) as promocao,
    COALESCE(status, true) as status
FROM asia_products 
WHERE nome IS NOT NULL 
LIMIT 20;

-- Popular com dados do SPOT (mapeamento correto)
INSERT INTO public.ecologic_products (
    tipo, codigo, titulo, descricao, preco, imagem, 
    galeria, video, categorias, propriedades, promocao, status
)
SELECT 
    'SPOT' as tipo,
    "ProdReference" as codigo,
    "Name" as titulo,
    "Description" as descricao,
    "YourPrice" as preco,
    "MainImage" as imagem,
    CASE 
        WHEN "AllImageList" IS NOT NULL AND "AllImageList" != '' 
        THEN jsonb_build_array("AllImageList")
        ELSE '[]'::jsonb 
    END as galeria,
    "VideoLink" as video,
    jsonb_build_array("Type", "SubType") as categorias,
    jsonb_build_object(
        'brand', "Brand",
        'weight', "Weight",
        'materials', "Materials",
        'country_origin', "CountryOfOrigin",
        'pvc_free', "PvcFree"
    ) as propriedades,
    COALESCE("NewProduct", false) as promocao,
    NOT COALESCE("IsStockOut", false) as status
FROM spot_products 
WHERE "Name" IS NOT NULL 
LIMIT 20;

-- Forçar PostgREST a recarregar o schema
NOTIFY pgrst, 'reload schema';