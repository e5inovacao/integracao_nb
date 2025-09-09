-- Corrigir acesso à tabela eco_products

-- 1. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Enable read access for all users" ON public.eco_products;
DROP POLICY IF EXISTS "Allow public read access" ON public.eco_products;
DROP POLICY IF EXISTS "Public read access" ON public.eco_products;

-- 2. Desabilitar RLS temporariamente
ALTER TABLE public.eco_products DISABLE ROW LEVEL SECURITY;

-- 3. Garantir permissões básicas
GRANT SELECT ON public.eco_products TO anon;
GRANT SELECT ON public.eco_products TO authenticated;
GRANT ALL ON public.eco_products TO service_role;

-- 4. Reabilitar RLS
ALTER TABLE public.eco_products ENABLE ROW LEVEL SECURITY;

-- 5. Criar política simples e permissiva
CREATE POLICY "Allow all read access" ON public.eco_products
    FOR SELECT
    USING (true);

-- 6. Notificar PostgREST para recarregar o schema
NOTIFY pgrst, 'reload schema';

-- 7. Verificar se os dados estão acessíveis
SELECT COUNT(*) as total_count FROM public.eco_products;
SELECT id, codigo, titulo FROM public.eco_products LIMIT 3;