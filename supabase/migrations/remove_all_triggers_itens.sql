-- Remover TODOS os triggers da tabela itens_orcamento_sistema
-- e recriar apenas o essencial

-- 1. Desabilitar todos os triggers da tabela
ALTER TABLE itens_orcamento_sistema DISABLE TRIGGER ALL;

-- 2. Remover triggers específicos que podem existir
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Loop através de todos os triggers da tabela itens_orcamento_sistema
    FOR trigger_record IN 
        SELECT tgname 
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'itens_orcamento_sistema'
        AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND NOT t.tgisinternal
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.tgname || ' ON itens_orcamento_sistema CASCADE';
    END LOOP;
END $$;

-- 3. Remover funções problemáticas
DROP FUNCTION IF EXISTS update_item_subtotal() CASCADE;
DROP FUNCTION IF EXISTS calculate_item_subtotal() CASCADE;
DROP FUNCTION IF EXISTS atualizar_subtotal_item() CASCADE;
DROP FUNCTION IF EXISTS calcular_subtotal() CASCADE;
DROP FUNCTION IF EXISTS update_subtotal() CASCADE;
DROP FUNCTION IF EXISTS calculate_subtotal() CASCADE;

-- 4. Recriar função simples de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Recriar apenas o trigger de updated_at
CREATE TRIGGER set_updated_at_trigger
    BEFORE UPDATE ON itens_orcamento_sistema
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Reabilitar triggers (apenas o que criamos)
ALTER TABLE itens_orcamento_sistema ENABLE TRIGGER set_updated_at_trigger;

-- 7. Verificar resultado
SELECT 'Triggers removidos e recriados com sucesso' as status;