-- Adicionar campos tabelaFator1, tabelaFator2, tabelaFator3 à tabela products_solicitacao
-- para armazenar os fatores multiplicativos para cada nível de quantidade

ALTER TABLE public.products_solicitacao 
ADD COLUMN IF NOT EXISTS tabelaFator1 DECIMAL(10,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS tabelaFator2 DECIMAL(10,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS tabelaFator3 DECIMAL(10,2) DEFAULT 1.0;

-- Garantir que os campos existam e tenham valores padrão
UPDATE public.products_solicitacao 
SET tabelaFator1 = COALESCE(tabelaFator1, 1.0),
    tabelaFator2 = COALESCE(tabelaFator2, 1.0),
    tabelaFator3 = COALESCE(tabelaFator3, 1.0)
WHERE tabelaFator1 IS NULL OR tabelaFator2 IS NULL OR tabelaFator3 IS NULL;

-- Grant permissions for the new columns
GRANT SELECT ON public.products_solicitacao TO anon, authenticated;
GRANT UPDATE ON public.products_solicitacao TO authenticated;