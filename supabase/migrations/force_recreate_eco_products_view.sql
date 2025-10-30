-- Forçar recriação da view eco_products
DROP VIEW IF EXISTS eco_products CASCADE;

-- Criar view eco_products com as colunas corretas da tabela ecologic_products
CREATE OR REPLACE VIEW eco_products AS 
SELECT 
  id,
  tipo,
  codigo,
  titulo,
  descricao,
  img_0,
  img_1,
  img_2,
  categoria,
  cor_web_principal,
  altura,
  largura,
  comprimento,
  peso,
  variacoes
FROM ecologic_products;

-- Garantir permissões na view
GRANT SELECT ON eco_products TO anon;
GRANT SELECT ON eco_products TO authenticated;
GRANT ALL PRIVILEGES ON eco_products TO service_role;

-- Comentário na view
COMMENT ON VIEW eco_products IS 'View que mapeia a tabela ecologic_products para compatibilidade com a API';

-- Forçar reload do schema PostgREST
SELECT pg_notify('pgrst', 'reload schema');

-- Verificar se a view foi criada
SELECT 'View eco_products criada com sucesso' as status;
SELECT COUNT(*) as total_records FROM eco_products;