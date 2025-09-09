-- Desabilitar RLS temporariamente na tabela eco_products para teste

-- Desabilitar RLS na tabela eco_products
ALTER TABLE public.eco_products DISABLE ROW LEVEL SECURITY;

-- Garantir que as permissões básicas estão corretas
GRANT SELECT ON public.eco_products TO anon;
GRANT SELECT ON public.eco_products TO authenticated;
GRANT ALL PRIVILEGES ON public.eco_products TO authenticated;

-- Notificar PostgREST para recarregar o schema
NOTIFY pgrst, 'reload schema';

-- Verificar se os dados existem
SELECT COUNT(*) as total_products FROM public.eco_products;
SELECT id, titulo, codigo FROM public.eco_products LIMIT 3;