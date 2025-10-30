-- Remover view existente se houver
DROP VIEW IF EXISTS eco_products;

-- Criar view eco_products como alias para ecologic_products
CREATE VIEW eco_products AS 
SELECT 
  id,
  codigo,
  titulo,
  descricao,
  categoria,
  subcategoria,
  material,
  cor,
  tamanho,
  peso,
  dimensoes,
  preco_unitario,
  moq,
  tempo_producao,
  personalizacao,
  sustentabilidade,
  certificacoes,
  origem,
  fornecedor,
  data_cadastro,
  ativo,
  imagem_url,
  galeria_imagens,
  tags,
  observacoes
FROM ecologic_products;

-- Garantir permissões na view
GRANT SELECT ON eco_products TO anon;
GRANT SELECT ON eco_products TO authenticated;
GRANT ALL PRIVILEGES ON eco_products TO service_role;

-- Comentário na view
COMMENT ON VIEW eco_products IS 'View que mapeia a tabela ecologic_products para compatibilidade com a API';