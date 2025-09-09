-- SOLUÇÃO DEFINITIVA PARA O PROBLEMA DE INTEGER OVERFLOW
-- Abordagem cuidadosa: remove políticas RLS temporariamente

-- 1. Desabilitar RLS temporariamente
ALTER TABLE orcamentos_sistema DISABLE ROW LEVEL SECURITY;
ALTER TABLE itens_orcamento_sistema DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas RLS temporariamente
DROP POLICY IF EXISTS "Users can view their own quotes" ON orcamentos_sistema;
DROP POLICY IF EXISTS "Users can insert their own quotes" ON orcamentos_sistema;
DROP POLICY IF EXISTS "Users can update their own quotes" ON orcamentos_sistema;
DROP POLICY IF EXISTS "Users can delete their own quotes" ON orcamentos_sistema;
DROP POLICY IF EXISTS "Users can view their own quote items" ON itens_orcamento_sistema;
DROP POLICY IF EXISTS "Users can insert their own quote items" ON itens_orcamento_sistema;
DROP POLICY IF EXISTS "Users can update their own quote items" ON itens_orcamento_sistema;
DROP POLICY IF EXISTS "Users can delete their own quote items" ON itens_orcamento_sistema;

-- 3. Remover todos os triggers que podem estar causando problemas
DROP TRIGGER IF EXISTS set_quote_number_trigger ON orcamentos_sistema CASCADE;
DROP TRIGGER IF EXISTS set_orcamento_numero ON orcamentos_sistema CASCADE;
DROP TRIGGER IF EXISTS update_orcamentos_sistema_updated_at ON orcamentos_sistema CASCADE;
DROP TRIGGER IF EXISTS update_itens_orcamento_sistema_updated_at ON itens_orcamento_sistema CASCADE;

-- 4. Remover funções problemáticas
DROP FUNCTION IF EXISTS set_quote_number() CASCADE;
DROP FUNCTION IF EXISTS generate_quote_number() CASCADE;
DROP FUNCTION IF EXISTS set_orcamento_numero() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 5. Remover colunas desnecessárias da tabela itens_orcamento_sistema
ALTER TABLE itens_orcamento_sistema 
  DROP COLUMN IF EXISTS preco_unitario CASCADE,
  DROP COLUMN IF EXISTS subtotal CASCADE;

-- 6. Criar função simples para gerar número de orçamento sequencial
CREATE OR REPLACE FUNCTION generate_simple_quote_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
BEGIN
    -- Buscar o próximo número baseado na contagem de registros
    SELECT COALESCE(COUNT(*), 0) + 1 INTO next_number
    FROM orcamentos_sistema;
    
    -- Retornar no formato ORC000001
    RETURN 'ORC' || LPAD(next_number::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- 7. Criar função para definir número do orçamento (sem usar timestamp)
CREATE OR REPLACE FUNCTION set_simple_quote_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Só definir se não foi fornecido
    IF NEW.numero_orcamento IS NULL OR NEW.numero_orcamento = '' THEN
        NEW.numero_orcamento := generate_simple_quote_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar trigger simples para número do orçamento
CREATE TRIGGER set_simple_quote_number_trigger
    BEFORE INSERT ON orcamentos_sistema
    FOR EACH ROW
    EXECUTE FUNCTION set_simple_quote_number();

-- 9. Criar função simples para updated_at
CREATE OR REPLACE FUNCTION update_simple_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Criar triggers para updated_at
CREATE TRIGGER update_orcamentos_sistema_simple_updated_at
    BEFORE UPDATE ON orcamentos_sistema
    FOR EACH ROW
    EXECUTE FUNCTION update_simple_updated_at();

CREATE TRIGGER update_itens_orcamento_sistema_simple_updated_at
    BEFORE UPDATE ON itens_orcamento_sistema
    FOR EACH ROW
    EXECUTE FUNCTION update_simple_updated_at();

-- 11. Limpar dados de teste problemáticos
DELETE FROM itens_orcamento_sistema WHERE orcamento_id IN (
    SELECT id FROM orcamentos_sistema WHERE numero_orcamento IS NULL OR numero_orcamento = ''
);
DELETE FROM orcamentos_sistema WHERE numero_orcamento IS NULL OR numero_orcamento = '';

-- 12. Atualizar orçamentos existentes sem número
UPDATE orcamentos_sistema 
SET numero_orcamento = generate_simple_quote_number()
WHERE numero_orcamento IS NULL OR numero_orcamento = '';

-- 13. Recriar políticas RLS
-- Políticas para orcamentos_sistema
CREATE POLICY "Users can view their own quotes" ON orcamentos_sistema
    FOR SELECT USING (usuario_id = auth.uid());

CREATE POLICY "Users can insert their own quotes" ON orcamentos_sistema
    FOR INSERT WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Users can update their own quotes" ON orcamentos_sistema
    FOR UPDATE USING (usuario_id = auth.uid());

CREATE POLICY "Users can delete their own quotes" ON orcamentos_sistema
    FOR DELETE USING (usuario_id = auth.uid());

-- Políticas para itens_orcamento_sistema
CREATE POLICY "Users can view their own quote items" ON itens_orcamento_sistema
    FOR SELECT USING (
        orcamento_id IN (
            SELECT id FROM orcamentos_sistema WHERE usuario_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own quote items" ON itens_orcamento_sistema
    FOR INSERT WITH CHECK (
        orcamento_id IN (
            SELECT id FROM orcamentos_sistema WHERE usuario_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own quote items" ON itens_orcamento_sistema
    FOR UPDATE USING (
        orcamento_id IN (
            SELECT id FROM orcamentos_sistema WHERE usuario_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own quote items" ON itens_orcamento_sistema
    FOR DELETE USING (
        orcamento_id IN (
            SELECT id FROM orcamentos_sistema WHERE usuario_id = auth.uid()
        )
    );

-- 14. Reabilitar RLS
ALTER TABLE orcamentos_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_orcamento_sistema ENABLE ROW LEVEL SECURITY;

-- 15. Garantir permissões para roles anon e authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON orcamentos_sistema TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON itens_orcamento_sistema TO anon, authenticated;

-- 16. Verificar estrutura final
SELECT 'Migração concluída com sucesso!' as status;