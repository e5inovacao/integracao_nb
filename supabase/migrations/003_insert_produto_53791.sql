-- Inserir produto específico: 5 blocos adesivados com 200 folhas em cartão
INSERT INTO produtos (
  nome,
  descricao,
  categoria,
  subcategoria,
  codigo_interno,
  custo_base,
  fator_multiplicador,
  unidade_medida,
  estoque_atual,
  status
) VALUES (
  '5 blocos adesivados com 200 folhas em cartão',
  'Conjunto de 5 blocos adesivados, cada um contendo 200 folhas em papel cartão de alta qualidade',
  'Papelaria',
  'Blocos',
  '53791',
  25.00,
  2.0,
  'UN',
  50,
  'ativo'
);