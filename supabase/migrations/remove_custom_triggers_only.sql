-- Remover apenas triggers personalizados (não do sistema) da tabela itens_orcamento_sistema

-- 1. Remover triggers específicos conhecidos (não do sistema)
DROP TRIGGER IF EXISTS update_subtotal_trigger ON itens_orcamento_sistema;
DROP TRIGGER IF EXISTS calculate_subtotal_trigger ON itens_orcamento_sistema;
DROP TRIGGER IF EXISTS item_subtotal_trigger ON itens_orcamento_sistema;
DROP TRIGGER IF EXISTS atualizar_subtotal_trigger ON itens_orcamento_sistema;
DROP TRIGGER IF EXISTS set_updated_at_trigger ON itens_orcamento_sistema;
DROP TRIGGER IF EXISTS update_updated_at_trigger ON itens_orcamento_sistema;
DROP TRIGGER IF EXISTS handle_updated_at ON itens_orcamento_sistema;
DROP TRIGGER IF EXISTS moddatetime ON itens_orcamento_sistema;

-- 2. Remover funções problemáticas
DROP FUNCTION IF EXISTS update_item_subtotal() CASCADE;
DROP FUNCTION IF EXISTS calculate_item_subtotal() CASCADE;
DROP FUNCTION IF EXISTS atualizar_subtotal_item() CASCADE;
DROP FUNCTION IF EXISTS calcular_subtotal() CASCADE;
DROP FUNCTION IF EXISTS update_subtotal() CASCADE;
DROP FUNCTION IF EXISTS calculate_subtotal() CASCADE;
DROP FUNCTION IF EXISTS handle_updated_at() CASCADE;

-- 3. Recriar função simples de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Recriar apenas o trigger de updated_at
CREATE TRIGGER set_updated_at_trigger
    BEFORE UPDATE ON itens_orcamento_sistema
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Verificar estrutura da tabela (sem usar funções agregadas)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'itens_orcamento_sistema'
ORDER BY ordinal_position;