-- Inserção de dados de exemplo para o sistema Natureza Brindes

-- Inserir categorias
INSERT INTO categories (name, slug, description, icon) VALUES
('Papelaria', 'papelaria', 'Produtos de papelaria sustentáveis para escritório', 'FileText'),
('Casa e Escritório', 'casa-escritorio', 'Itens para casa e ambiente de trabalho', 'Home'),
('Acessórios', 'acessorios', 'Acessórios diversos e brindes personalizados', 'Package'),
('Tecnologia', 'tecnologia', 'Produtos tecnológicos sustentáveis', 'Smartphone'),
('Alimentação', 'alimentacao', 'Produtos para alimentação e bebidas', 'Coffee'),
('Vestuário', 'vestuario', 'Roupas e acessórios de vestuário', 'Shirt');

-- Inserir produtos de exemplo
INSERT INTO products (
  name, 
  description, 
  category_id, 
  images, 
  sustainability_features, 
  featured, 
  specifications, 
  features, 
  certifications, 
  rating, 
  review_count
) VALUES
(
  'Caderno Ecológico A5',
  'Caderno com capa de papel reciclado e folhas de papel sustentável, ideal para anotações e reuniões corporativas.',
  (SELECT id FROM categories WHERE slug = 'papelaria'),
  ARRAY[
    'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=recycled%20paper%20notebook%20A5%20size%20eco-friendly%20corporate%20stationery%20front%20view&image_size=square',
    'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=recycled%20paper%20notebook%20A5%20size%20eco-friendly%20corporate%20stationery%20open%20pages&image_size=square',
    'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=recycled%20paper%20notebook%20A5%20spiral%20binding%20detail&image_size=square'
  ],
  ARRAY['recyclable', 'biodegradable'],
  true,
  '{
    "Dimensões": "21 x 14.8 cm",
    "Páginas": "100 folhas",
    "Material": "Papel reciclado",
    "Peso": "250g",
    "Gramatura": "75g/m²",
    "Encadernação": "Espiral duplo",
    "Area de Impressao": "18 x 12 cm",
     "Tempo de Producao": "5-7 dias uteis",
     "Quantidade Minima": "25 unidades"
  }'::jsonb,
  ARRAY[
    'Papel 100% reciclado',
    'Capa resistente à água',
    'Folhas pautadas de alta qualidade',
    'Espiral duplo resistente',
    'Design minimalista',
    'Marcador de páginas integrado'
  ],
  ARRAY[
    'FSC - Manejo Florestal Responsável',
    'ISO 14001 - Gestão Ambiental',
    'ABNT - Qualidade Certificada'
  ],
  4.7,
  89
),
(
  'Caneca de Bambu',
  'Caneca térmica feita de bambu sustentável com tampa de silicone. Capacidade de 350ml, ideal para bebidas quentes e frias.',
  (SELECT id FROM categories WHERE slug = 'casa-escritorio'),
  ARRAY[
    'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=eco-friendly%20bamboo%20mug%20with%20natural%20wood%20finish%20sustainable%20corporate%20gift&image_size=square',
    'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=bamboo%20mug%20with%20silicone%20lid%20side%20view&image_size=square'
  ],
  ARRAY['renewable', 'biodegradable'],
  true,
  '{
    "Capacidade": "350ml",
    "Material": "Bambu natural",
    "Altura": "12 cm",
    "Diâmetro": "8 cm",
    "Peso": "180g",
    "Tampa": "Silicone alimentício",
    "Area de Personalizacao": "8 x 6 cm",
     "Tempo de Producao": "7-10 dias uteis",
     "Quantidade Minima": "50 unidades"
  }'::jsonb,
  ARRAY[
    'Material 100% renovável',
    'Livre de BPA',
    'Resistente a temperaturas altas',
    'Tampa hermética',
    'Design ergonômico',
    'Acabamento natural'
  ],
  ARRAY[
    'FSC - Manejo Florestal Responsável',
    'FDA - Segurança Alimentar',
    'ISO 14001 - Gestão Ambiental'
  ],
  4.8,
  127
),
(
  'Sacola Ecológica Personalizada',
  'Sacola reutilizável feita de algodão orgânico, perfeita para eventos e campanhas de sustentabilidade.',
  (SELECT id FROM categories WHERE slug = 'acessorios'),
  ARRAY[
    'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=organic%20cotton%20reusable%20bag%20eco-friendly%20tote%20bag%20corporate%20branding&image_size=square',
    'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=cotton%20tote%20bag%20with%20custom%20logo%20sustainable%20shopping%20bag&image_size=square'
  ],
  ARRAY['organic', 'reusable'],
  false,
  '{
    "Dimensões": "38 x 42 cm",
    "Material": "Algodão orgânico",
    "Peso": "120g",
    "Alças": "65 cm",
    "Capacidade": "15 litros",
    "Area de Impressao": "25 x 30 cm",
     "Tempo de Producao": "5-8 dias uteis",
     "Quantidade Minima": "100 unidades"
  }'::jsonb,
  ARRAY[
    'Algodão 100% orgânico',
    'Alças reforçadas',
    'Lavável na máquina',
    'Resistente e durável',
    'Design versátil',
    'Costura dupla'
  ],
  ARRAY[
    'GOTS - Têxtil Orgânico Global',
    'OEKO-TEX - Segurança Têxtil',
    'Fair Trade - Comércio Justo'
  ],
  4.5,
  203
),
(
  'Power Bank Solar',
  'Carregador portátil com painel solar integrado, ideal para uso sustentável e eventos ao ar livre.',
  (SELECT id FROM categories WHERE slug = 'tecnologia'),
  ARRAY[
    'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=solar%20power%20bank%20portable%20charger%20eco-friendly%20technology%20sustainable%20gadget&image_size=square',
    'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=solar%20panel%20power%20bank%20charging%20phone%20outdoor%20use&image_size=square'
  ],
  ARRAY['solar-energy', 'durable'],
  true,
  '{
    "Capacidade": "10000mAh",
    "Painel Solar": "5W monocristalino",
    "Dimensões": "15 x 8 x 2 cm",
    "Peso": "280g",
    "Portas": "2x USB-A, 1x USB-C",
    "Resistencia": "IP65 (a prova d agua)",
    "Area de Personalizacao": "10 x 6 cm",
     "Tempo de Producao": "10-15 dias uteis",
     "Quantidade Minima": "25 unidades"
  }'::jsonb,
  ARRAY[
    'Energia solar renovável',
    'Resistente à água IP65',
    'Carregamento rápido',
    'LED indicador de bateria',
    'Múltiplas portas USB',
    'Design compacto'
  ],
  ARRAY[
    'CE - Conformidade Europeia',
    'FCC - Comissão Federal de Comunicações',
    'RoHS - Restrição de Substâncias Perigosas'
  ],
  4.6,
  156
),
(
  'Kit Canudos de Bambu',
  'Kit com 4 canudos de bambu reutilizáveis, escova de limpeza e estojo de algodão orgânico.',
  (SELECT id FROM categories WHERE slug = 'alimentacao'),
  ARRAY[
    'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=bamboo%20straws%20kit%20reusable%20eco-friendly%20drinking%20straws%20organic%20cotton%20pouch&image_size=square',
    'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=bamboo%20straws%20with%20cleaning%20brush%20sustainable%20zero%20waste%20kit&image_size=square'
  ],
  ARRAY['renewable', 'biodegradable', 'reusable'],
  false,
  '{
    "Quantidade": "4 canudos + escova + estojo",
    "Material": "Bambu natural",
    "Comprimento": "20 cm",
    "Diâmetro": "8mm",
    "Estojo": "Algodão orgânico",
    "Escova": "Fibra natural",
    "Area de Personalizacao": "Estojo 15 x 10 cm",
     "Tempo de Producao": "7-12 dias uteis",
     "Quantidade Minima": "50 kits"
  }'::jsonb,
  ARRAY[
    'Bambu 100% natural',
    'Livre de produtos químicos',
    'Reutilizável e durável',
    'Fácil limpeza',
    'Estojo portátil',
    'Zero waste'
  ],
  ARRAY[
    'FSC - Manejo Florestal Responsável',
    'FDA - Segurança Alimentar',
    'GOTS - Têxtil Orgânico (estojo)'
  ],
  4.9,
  312
),
(
  'Camiseta Orgânica Personalizada',
  'Camiseta básica feita de algodão orgânico, disponível em várias cores e tamanhos para personalização.',
  (SELECT id FROM categories WHERE slug = 'vestuario'),
  ARRAY[
    'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=organic%20cotton%20t-shirt%20sustainable%20apparel%20corporate%20uniform%20eco-friendly%20clothing&image_size=square',
    'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=organic%20cotton%20shirt%20different%20colors%20sustainable%20fashion&image_size=square'
  ],
  ARRAY['organic', 'biodegradable'],
  false,
  '{
    "Material": "100% algodão orgânico",
    "Gramatura": "160g/m²",
    "Tamanhos": "PP, P, M, G, GG, XGG",
    "Cores": "Branco, Preto, Cinza, Verde, Azul",
    "Modelagem": "Unissex",
    "Area de Impressao": "25 x 35 cm",
     "Tempo de Producao": "8-12 dias uteis",
     "Quantidade Minima": "50 unidades"
  }'::jsonb,
  ARRAY[
    'Algodão 100% orgânico',
    'Tingimento natural',
    'Costura reforçada',
    'Modelagem confortável',
    'Respirável e macio',
    'Durabilidade superior'
  ],
  ARRAY[
    'GOTS - Têxtil Orgânico Global',
    'OEKO-TEX - Segurança Têxtil',
    'Fair Trade - Comércio Justo'
  ],
  4.4,
  178
);

-- Inserir opções de personalização para os produtos
INSERT INTO customization_options (product_id, name, type, options, required) VALUES
-- Caderno Ecológico A5
((SELECT id FROM products WHERE name = 'Caderno Ecológico A5'), 'Cor da Capa', 'color', ARRAY['Verde Natural', 'Azul Oceano', 'Marrom Terra', 'Cinza Pedra'], true),
((SELECT id FROM products WHERE name = 'Caderno Ecológico A5'), 'Personalização da Capa', 'text', ARRAY[]::text[], false),
((SELECT id FROM products WHERE name = 'Caderno Ecológico A5'), 'Tipo de Pauta', 'select', ARRAY['Pautado', 'Quadriculado', 'Pontilhado', 'Liso'], true),

-- Caneca de Bambu
((SELECT id FROM products WHERE name = 'Caneca de Bambu'), 'Cor da Tampa', 'color', ARRAY['Branco', 'Preto', 'Verde', 'Azul'], true),
((SELECT id FROM products WHERE name = 'Caneca de Bambu'), 'Gravação', 'text', ARRAY[]::text[], false),
((SELECT id FROM products WHERE name = 'Caneca de Bambu'), 'Tamanho', 'select', ARRAY['300ml', '350ml', '400ml'], true),

-- Sacola Ecológica
((SELECT id FROM products WHERE name = 'Sacola Ecológica Personalizada'), 'Cor', 'color', ARRAY['Natural', 'Branco', 'Preto', 'Verde', 'Azul'], true),
((SELECT id FROM products WHERE name = 'Sacola Ecológica Personalizada'), 'Impressão', 'text', ARRAY[]::text[], false),
((SELECT id FROM products WHERE name = 'Sacola Ecológica Personalizada'), 'Tipo de Alça', 'select', ARRAY['Curta (30cm)', 'Longa (65cm)'], true),

-- Power Bank Solar
((SELECT id FROM products WHERE name = 'Power Bank Solar'), 'Cor', 'color', ARRAY['Preto', 'Azul', 'Verde'], true),
((SELECT id FROM products WHERE name = 'Power Bank Solar'), 'Gravação a Laser', 'text', ARRAY[]::text[], false),

-- Kit Canudos de Bambu
((SELECT id FROM products WHERE name = 'Kit Canudos de Bambu'), 'Cor do Estojo', 'color', ARRAY['Natural', 'Verde', 'Azul', 'Marrom'], true),
((SELECT id FROM products WHERE name = 'Kit Canudos de Bambu'), 'Gravação no Estojo', 'text', ARRAY[]::text[], false),
((SELECT id FROM products WHERE name = 'Kit Canudos de Bambu'), 'Tamanho dos Canudos', 'select', ARRAY['15cm', '20cm', '25cm'], true),

-- Camiseta Orgânica
((SELECT id FROM products WHERE name = 'Camiseta Orgânica Personalizada'), 'Cor', 'color', ARRAY['Branco', 'Preto', 'Cinza', 'Verde', 'Azul'], true),
((SELECT id FROM products WHERE name = 'Camiseta Orgânica Personalizada'), 'Tamanho', 'select', ARRAY['PP', 'P', 'M', 'G', 'GG', 'XGG'], true),
((SELECT id FROM products WHERE name = 'Camiseta Orgânica Personalizada'), 'Estampa/Logo', 'text', ARRAY[]::text[], false);

-- Inserir fornecedores de exemplo
INSERT INTO suppliers (name, email, phone, cnpj, address, sustainability_certifications) VALUES
('EcoMateriais Ltda', 'contato@ecomateriais.com.br', '(11) 3456-7890', '12.345.678/0001-90', 'Rua das Flores, 123 - São Paulo, SP', ARRAY['FSC', 'ISO 14001']),
('Bambu Sustentável', 'vendas@bambusustentavel.com.br', '(21) 2345-6789', '23.456.789/0001-01', 'Av. Verde, 456 - Rio de Janeiro, RJ', ARRAY['FSC', 'Fair Trade']),
('Algodão Orgânico Brasil', 'comercial@algodaoorganico.com.br', '(31) 3456-7890', '34.567.890/0001-12', 'Rua Sustentável, 789 - Belo Horizonte, MG', ARRAY['GOTS', 'OEKO-TEX']),
('TechVerde Soluções', 'info@techverde.com.br', '(41) 4567-8901', '45.678.901/0001-23', 'Av. Inovação, 321 - Curitiba, PR', ARRAY['CE', 'RoHS']);

-- Relacionar produtos com fornecedores
INSERT INTO product_suppliers (product_id, supplier_id, is_primary) VALUES
((SELECT id FROM products WHERE name = 'Caderno Ecológico A5'), (SELECT id FROM suppliers WHERE name = 'EcoMateriais Ltda'), true),
((SELECT id FROM products WHERE name = 'Caneca de Bambu'), (SELECT id FROM suppliers WHERE name = 'Bambu Sustentável'), true),
((SELECT id FROM products WHERE name = 'Sacola Ecológica Personalizada'), (SELECT id FROM suppliers WHERE name = 'Algodão Orgânico Brasil'), true),
((SELECT id FROM products WHERE name = 'Power Bank Solar'), (SELECT id FROM suppliers WHERE name = 'TechVerde Soluções'), true),
((SELECT id FROM products WHERE name = 'Kit Canudos de Bambu'), (SELECT id FROM suppliers WHERE name = 'Bambu Sustentável'), true),
((SELECT id FROM products WHERE name = 'Camiseta Orgânica Personalizada'), (SELECT id FROM suppliers WHERE name = 'Algodão Orgânico Brasil'), true);