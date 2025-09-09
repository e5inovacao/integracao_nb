-- Remover todos os triggers problemáticos da tabela itens_orcamento_sistema
-- que possam estar tentando usar colunas removidas como 'subtotal' ou 'preco_unitario'

-- 1. Remover trigger de atualização de subtotal se existir
DROP TRIGGER IF EXISTS update_subtotal_trigger ON itens_orcamento_sistema;
DROP TRIGGER IF EXISTS calculate_subtotal_trigger ON itens_orcamento_sistema;
DROP TRIGGER IF EXISTS item_subtotal_trigger ON itens_orcamento_sistema;
DROP TRIGGER IF EXISTS atualizar_subtotal_trigger ON itens_orcamento_sistema;

-- 2. Remover funções relacionadas a subtotal
DROP FUNCTION IF EXISTS update_item_subtotal() CASCADE;
DROP FUNCTION IF EXISTS calculate_item_subtotal() CASCADE;
DROP FUNCTION IF EXISTS atualizar_subtotal_item() CASCADE;
DROP FUNCTION IF EXISTS calcular_subtotal() CASCADE;

-- 3. Remover qualquer trigger de updated_at que possa estar causando problema
DROP TRIGGER IF EXISTS set_updated_at_trigger ON itens_orcamento_sistema;

-- 4. Recriar apenas o trigger essencial de updated_at de forma simples
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Aplicar o trigger de updated_at apenas
CREATE TRIGGER set_updated_at_trigger
    BEFORE UPDATE ON itens_orcamento_sistema
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Verificar estrutura final da tabela
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'itens_orcamento_sistema'
ORDER BY ordinal_position;

-- 7. Verificar triggers restantes
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'itens_orcamento_sistema'
AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');