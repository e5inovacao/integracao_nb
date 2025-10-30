-- Temporariamente desabilitar RLS para testar se é um problema de política
ALTER TABLE public.eco_products DISABLE ROW LEVEL SECURITY;

-- Garantir que as permissões básicas estão corretas
GRANT SELECT ON public.eco_products TO anon;
GRANT SELECT ON public.eco_products TO authenticated;

-- Notificar PostgREST para recarregar o schema
NOTIFY pgrst, 'reload schema';

-- Verificar se conseguimos acessar os dados diretamente
SELECT COUNT(*) as total_count FROM public.eco_products;
SELECT id, titulo, codigo FROM public.eco_products LIMIT 3;