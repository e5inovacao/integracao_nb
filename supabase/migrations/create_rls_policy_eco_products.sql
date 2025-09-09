-- Criar política RLS para permitir leitura na tabela eco_products

-- Primeiro, remover qualquer política existente que possa estar bloqueando
DROP POLICY IF EXISTS "Allow read access to eco_products" ON public.eco_products;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.eco_products;

-- Criar nova política que permite leitura para todos
CREATE POLICY "Enable read access for all users" ON public.eco_products
    FOR SELECT
    USING (true);

-- Garantir que as permissões estão corretas
GRANT SELECT ON public.eco_products TO anon;
GRANT SELECT ON public.eco_products TO authenticated;

-- Notificar PostgREST para recarregar o schema
NOTIFY pgrst, 'reload schema';