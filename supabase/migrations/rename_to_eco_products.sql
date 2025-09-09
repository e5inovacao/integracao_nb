-- Renomear tabela ecologic_products para eco_products para resolver problema de cache do PostgREST
ALTER TABLE public.ecologic_products RENAME TO eco_products;

-- Renomear a sequência também
ALTER SEQUENCE public.ecologic_products_id_seq RENAME TO eco_products_id_seq;

-- Atualizar o valor padrão da coluna id para usar a nova sequência
ALTER TABLE public.eco_products ALTER COLUMN id SET DEFAULT nextval('eco_products_id_seq'::regclass);

-- Notificar o PostgREST para recarregar o schema
NOTIFY pgrst, 'reload schema';