-- Inserir dados de teste na tabela eco_products
INSERT INTO eco_products (
  tipo,
  codigo,
  titulo,
  descricao,
  preco,
  imagem,
  galeria,
  video,
  categorias,
  propriedades,
  propriedades2,
  promocao,
  status
) VALUES 
(
  'produto',
  'ECO001',
  'Caneca Ecológica de Bambu',
  'Caneca sustentável feita de fibra de bambu, perfeita para bebidas quentes e frias.',
  25.90,
  'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=eco-friendly%20bamboo%20mug%20sustainable%20drinkware%20natural%20material&image_size=square',
  '["https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=bamboo%20mug%20side%20view&image_size=square", "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=bamboo%20mug%20top%20view&image_size=square"]'::jsonb,
  null,
  '["Canecas", "Sustentável", "Bambu"]'::jsonb,
  '{"material": "Bambu", "capacidade": "350ml", "cor": "Natural"}'::jsonb,
  '{"lavavel": true, "microondas": false, "biodegradavel": true}'::jsonb,
  false,
  true
),
(
  'produto',
  'ECO002',
  'Sacola Reutilizável de Algodão',
  'Sacola ecológica de algodão orgânico, ideal para compras sustentáveis.',
  15.50,
  'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=organic%20cotton%20reusable%20shopping%20bag%20eco-friendly%20natural&image_size=square',
  '["https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=cotton%20bag%20folded&image_size=square"]'::jsonb,
  null,
  '["Sacolas", "Algodão", "Reutilizável"]'::jsonb,
  '{"material": "Algodão Orgânico", "dimensoes": "40x35cm", "cor": "Cru"}'::jsonb,
  '{"lavavel": true, "resistente": true, "biodegradavel": true}'::jsonb,
  true,
  true
),
(
  'produto',
  'ECO003',
  'Caderno Reciclado A5',
  'Caderno com capa de papel reciclado e folhas de papel sustentável.',
  18.90,
  'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=recycled%20paper%20notebook%20A5%20sustainable%20stationery%20eco-friendly&image_size=square',
  '["https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=notebook%20open%20pages&image_size=square"]'::jsonb,
  null,
  '["Papelaria", "Reciclado", "Sustentável"]'::jsonb,
  '{"material": "Papel Reciclado", "tamanho": "A5", "paginas": 100}'::jsonb,
  '{"reciclavel": true, "FSC_certified": true, "biodegradavel": true}'::jsonb,
  false,
  true
);

-- Verificar se os dados foram inseridos
SELECT COUNT(*) as total_produtos FROM eco_products;
SELECT id, codigo, titulo, preco FROM eco_products LIMIT 5;