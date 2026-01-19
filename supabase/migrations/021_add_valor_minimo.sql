ALTER TABLE public.tabelas_personalizacao
ADD COLUMN IF NOT EXISTS valor_minimo numeric;

UPDATE public.tabelas_personalizacao
SET valor_minimo = COALESCE(valor_minimo, 0);

COMMENT ON COLUMN public.tabelas_personalizacao.valor_minimo IS 'Valor mínimo por linha de personalização (moeda)';