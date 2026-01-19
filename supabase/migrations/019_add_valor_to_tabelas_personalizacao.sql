ALTER TABLE public.tabelas_personalizacao
ADD COLUMN IF NOT EXISTS valor numeric;

UPDATE public.tabelas_personalizacao
SET valor = COALESCE(valor, 0);

COMMENT ON COLUMN public.tabelas_personalizacao.valor IS 'Preço fixo por unidade para personalização, aplicado por faixa de quantidade';