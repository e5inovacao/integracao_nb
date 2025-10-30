-- Verificar dados reais na tabela eco_products

-- Contar todos os registros
SELECT COUNT(*) as total_records FROM public.eco_products;

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'eco_products'
ORDER BY ordinal_position;

-- Selecionar os primeiros 3 registros com todos os campos
SELECT * FROM public.eco_products LIMIT 3;

-- Verificar se existem registros com campos específicos
SELECT id, titulo, codigo, descricao, preco 
FROM public.eco_products 
WHERE titulo IS NOT NULL 
LIMIT 5;