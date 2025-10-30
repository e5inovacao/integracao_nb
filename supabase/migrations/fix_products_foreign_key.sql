-- Corrigir constraint de foreign key na tabela products_solicitacao
-- A constraint atual referencia 'ecologic_products_site' mas deveria referenciar 'ecologic_products'
-- ou usar o campo correto da tabela existente

-- Primeiro, remover a constraint existente
ALTER TABLE products_solicitacao 
DROP CONSTRAINT IF EXISTS products_solicitacao_products_id_fkey;

-- Verificar se a tabela ecologic_products_site existe e tem dados
-- Se sim, manter a referência mas corrigir o campo
-- A tabela ecologic_products_site usa 'codigo' como primary key (text)
-- A tabela products_solicitacao tem products_id como text

-- Recriar a constraint corretamente
ALTER TABLE products_solicitacao 
ADD CONSTRAINT products_solicitacao_products_id_fkey 
FOREIGN KEY (products_id) 
REFERENCES ecologic_products_site(codigo)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Verificar se existem registros órfãos e corrigi-los
-- Atualizar registros com products_id que não existem na tabela de referência
UPDATE products_solicitacao 
SET products_id = NULL 
WHERE products_id IS NOT NULL 
AND products_id NOT IN (
    SELECT codigo 
    FROM ecologic_products_site 
    WHERE codigo IS NOT NULL
);

-- Conceder permissões necessárias
GRANT SELECT, INSERT, UPDATE, DELETE ON products_solicitacao TO authenticated;
GRANT SELECT ON ecologic_products_site TO authenticated;
GRANT SELECT ON ecologic_products_site TO anon;