-- Fix database structure issues
-- 1. Clean orphaned data first
-- 2. Fix malformed column name in produtos_ecologicos table
-- 3. Remove unnecessary columns from itens_orcamento_sistema table
-- 4. Ensure proper data types and constraints

-- Step 1: Clean orphaned data in itens_orcamento_sistema
-- Delete items that reference non-existent products
DELETE FROM itens_orcamento_sistema 
WHERE produto_ecologico_id NOT IN (
    SELECT "16		id" FROM produtos_ecologicos WHERE "16		id" IS NOT NULL
);

-- Step 2: Fix the malformed column name in produtos_ecologicos
ALTER TABLE produtos_ecologicos RENAME COLUMN "16		id" TO id;

-- Step 3: Add proper primary key constraint if not exists
ALTER TABLE produtos_ecologicos DROP CONSTRAINT IF EXISTS produtos_ecologicos_pkey;
ALTER TABLE produtos_ecologicos ADD CONSTRAINT produtos_ecologicos_pkey PRIMARY KEY (id);

-- Step 4: Remove unnecessary columns from itens_orcamento_sistema
-- First drop the generated column subtotal
ALTER TABLE itens_orcamento_sistema DROP COLUMN IF EXISTS subtotal;

-- Then drop the preco_unitario column as it's not needed
ALTER TABLE itens_orcamento_sistema DROP COLUMN IF EXISTS preco_unitario;

-- Step 5: Ensure proper foreign key constraint for produto_ecologico_id
ALTER TABLE itens_orcamento_sistema DROP CONSTRAINT IF EXISTS itens_orcamento_sistema_produto_ecologico_id_fkey;
ALTER TABLE itens_orcamento_sistema ADD CONSTRAINT itens_orcamento_sistema_produto_ecologico_id_fkey 
    FOREIGN KEY (produto_ecologico_id) REFERENCES produtos_ecologicos(id);

-- Step 6: Grant permissions to anon and authenticated roles
GRANT SELECT ON produtos_ecologicos TO anon;
GRANT SELECT ON produtos_ecologicos TO authenticated;

GRANT SELECT, INSERT, UPDATE ON itens_orcamento_sistema TO authenticated;
GRANT SELECT ON itens_orcamento_sistema TO anon;

GRANT SELECT, INSERT, UPDATE ON orcamentos_sistema TO authenticated;
GRANT SELECT ON orcamentos_sistema TO anon;

GRANT SELECT, INSERT, UPDATE ON usuarios_sistema TO authenticated;
GRANT SELECT ON usuarios_sistema TO anon;

-- Step 7: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_itens_orcamento_orcamento_id ON itens_orcamento_sistema(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_itens_orcamento_produto_id ON itens_orcamento_sistema(produto_ecologico_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_usuario_id ON orcamentos_sistema(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_telefone ON usuarios_sistema(telefone);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios_sistema(email);