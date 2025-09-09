-- Remover view existente se houver
DROP VIEW IF EXISTS eco_products;

-- Criar view eco_products com as colunas corretas da tabela ecologic_products
CREATE VIEW eco_products AS 
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
NOTIFY pgrst, 'reload schema';