-- Migration 005: Enhanced Quotes System
-- Criação de sistema completo de orçamentos com usuários e funcionalidades avançadas

-- 1. Criar tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    empresa VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Adicionar campos faltantes na tabela orcamentos
ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS data_evento DATE,
ADD COLUMN IF NOT EXISTS urgencia VARCHAR(20) DEFAULT 'normal' CHECK (urgencia IN ('baixa', 'normal', 'alta', 'urgente')),
ADD COLUMN IF NOT EXISTS observacoes_cliente TEXT,
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS desconto DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_frete DECIMAL(10,2) DEFAULT 0;

-- 3. Adicionar produto_id na tabela itens_orcamento
ALTER TABLE itens_orcamento 
ADD COLUMN IF NOT EXISTS produto_id UUID REFERENCES products(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS valor_unitario DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS subtotal_item DECIMAL(10,2) DEFAULT 0;

-- 4. Criar índices otimizados
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_orcamentos_usuario_id ON orcamentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON orcamentos(status);
CREATE INDEX IF NOT EXISTS idx_orcamentos_created_at ON orcamentos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_itens_orcamento_orcamento_id ON itens_orcamento(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_itens_orcamento_produto_id ON itens_orcamento(produto_id);

-- 5. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Trigger para cálculo automático de subtotais
CREATE OR REPLACE FUNCTION calcular_subtotal_item()
RETURNS TRIGGER AS $$
BEGIN
    NEW.subtotal_item = NEW.quantidade * COALESCE(NEW.valor_unitario, 0);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_calcular_subtotal_item 
    BEFORE INSERT OR UPDATE ON itens_orcamento
    FOR EACH ROW EXECUTE FUNCTION calcular_subtotal_item();

-- 7. Trigger para atualizar total do orçamento
CREATE OR REPLACE FUNCTION atualizar_total_orcamento()
RETURNS TRIGGER AS $$
DECLARE
    novo_subtotal DECIMAL(10,2);
    novo_total DECIMAL(10,2);
BEGIN
    -- Calcular subtotal dos itens
    SELECT COALESCE(SUM(subtotal_item), 0) INTO novo_subtotal
    FROM itens_orcamento 
    WHERE orcamento_id = COALESCE(NEW.orcamento_id, OLD.orcamento_id);
    
    -- Atualizar subtotal e valor_total do orçamento
    UPDATE orcamentos 
    SET 
        subtotal = novo_subtotal,
        valor_total = novo_subtotal - COALESCE(desconto, 0) + COALESCE(valor_frete, 0),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.orcamento_id, OLD.orcamento_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_atualizar_total_orcamento 
    AFTER INSERT OR UPDATE OR DELETE ON itens_orcamento
    FOR EACH ROW EXECUTE FUNCTION atualizar_total_orcamento();

-- 8. Políticas RLS

-- Habilitar RLS nas tabelas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_orcamento ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios
CREATE POLICY "Permitir inserção pública de usuários" ON usuarios
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura pública de usuários" ON usuarios
    FOR SELECT USING (true);

CREATE POLICY "Permitir atualização pública de usuários" ON usuarios
    FOR UPDATE USING (true);

-- Políticas para orcamentos
CREATE POLICY "Permitir inserção pública de orçamentos" ON orcamentos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura pública de orçamentos" ON orcamentos
    FOR SELECT USING (true);

CREATE POLICY "Permitir atualização pública de orçamentos" ON orcamentos
    FOR UPDATE USING (true);

-- Políticas para itens_orcamento
CREATE POLICY "Permitir inserção pública de itens" ON itens_orcamento
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura pública de itens" ON itens_orcamento
    FOR SELECT USING (true);

CREATE POLICY "Permitir atualização pública de itens" ON itens_orcamento
    FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão pública de itens" ON itens_orcamento
    FOR DELETE USING (true);

-- 9. Comentários nas tabelas
COMMENT ON TABLE usuarios IS 'Tabela de usuários do sistema de orçamentos';
COMMENT ON TABLE orcamentos IS 'Tabela principal de orçamentos com relacionamento a usuários';
COMMENT ON TABLE itens_orcamento IS 'Itens individuais de cada orçamento com relacionamento a produtos';

COMMENT ON COLUMN orcamentos.usuario_id IS 'Referência ao usuário que criou o orçamento';
COMMENT ON COLUMN orcamentos.data_evento IS 'Data do evento para o qual o orçamento é destinado';
COMMENT ON COLUMN orcamentos.urgencia IS 'Nível de urgência do orçamento';
COMMENT ON COLUMN orcamentos.observacoes_cliente IS 'Observações específicas do cliente';
COMMENT ON COLUMN itens_orcamento.produto_id IS 'Referência ao produto na tabela products';
COMMENT ON COLUMN itens_orcamento.valor_unitario IS 'Valor unitário do produto no momento do orçamento';
COMMENT ON COLUMN itens_orcamento.subtotal_item IS 'Subtotal calculado automaticamente (quantidade * valor_unitario)';