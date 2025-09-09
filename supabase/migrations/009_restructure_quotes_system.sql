-- Migration: Restructure Quotes System
-- Description: Remove old quote tables and create optimized structure with proper user relationships
-- Date: 2024

-- Drop existing tables in correct order (child tables first)
DROP TABLE IF EXISTS itens_orcamento_sistema CASCADE;
DROP TABLE IF EXISTS orcamentos_sistema CASCADE;
DROP TABLE IF EXISTS clientes_sistema CASCADE;

-- Create usuarios_sistema table with relationship to auth.users
CREATE TABLE usuarios_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    empresa VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per auth user
    UNIQUE(user_id)
);

-- Create orcamentos_sistema table with optimized structure
CREATE TABLE orcamentos_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_orcamento VARCHAR(20) NOT NULL UNIQUE,
    usuario_id UUID NOT NULL REFERENCES usuarios_sistema(id) ON DELETE CASCADE,
    data_evento DATE,
    observacoes TEXT,
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'cancelado')),
    valor_total DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create itens_orcamento_sistema table with proper product relationships
CREATE TABLE itens_orcamento_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orcamento_id UUID NOT NULL REFERENCES orcamentos_sistema(id) ON DELETE CASCADE,
    produto_ecologico_id BIGINT NOT NULL, -- References produtos_ecologicos."16\t\tid"
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    observacoes TEXT, -- Includes color, customizations, and other details
    preco_unitario DECIMAL(10,2),
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (quantidade * COALESCE(preco_unitario, 0)) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX idx_usuarios_sistema_user_id ON usuarios_sistema(user_id);
CREATE INDEX idx_orcamentos_sistema_usuario_id ON orcamentos_sistema(usuario_id);
CREATE INDEX idx_orcamentos_sistema_numero ON orcamentos_sistema(numero_orcamento);
CREATE INDEX idx_orcamentos_sistema_status ON orcamentos_sistema(status);
CREATE INDEX idx_orcamentos_sistema_created_at ON orcamentos_sistema(created_at);
CREATE INDEX idx_itens_orcamento_orcamento_id ON itens_orcamento_sistema(orcamento_id);
CREATE INDEX idx_itens_orcamento_produto_id ON itens_orcamento_sistema(produto_ecologico_id);

-- Create function for auto-generating quote numbers
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    quote_number TEXT;
BEGIN
    -- Get the next sequential number
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_orcamento FROM '[0-9]+') AS INTEGER)), 0) + 1
    INTO next_number
    FROM orcamentos_sistema
    WHERE numero_orcamento ~ '^ORC[0-9]+$';
    
    -- Format as ORC + padded number
    quote_number := 'ORC' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN quote_number;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_usuarios_sistema_updated_at
    BEFORE UPDATE ON usuarios_sistema
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orcamentos_sistema_updated_at
    BEFORE UPDATE ON orcamentos_sistema
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itens_orcamento_sistema_updated_at
    BEFORE UPDATE ON itens_orcamento_sistema
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for auto-generating quote numbers
CREATE OR REPLACE FUNCTION set_quote_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_orcamento IS NULL OR NEW.numero_orcamento = '' THEN
        NEW.numero_orcamento := generate_quote_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_orcamento_numero
    BEFORE INSERT ON orcamentos_sistema
    FOR EACH ROW
    EXECUTE FUNCTION set_quote_number();

-- Create trigger to update total value when items change
CREATE OR REPLACE FUNCTION update_quote_total()
RETURNS TRIGGER AS $$
DECLARE
    quote_id UUID;
    new_total DECIMAL(10,2);
BEGIN
    -- Determine which quote to update
    IF TG_OP = 'DELETE' THEN
        quote_id := OLD.orcamento_id;
    ELSE
        quote_id := NEW.orcamento_id;
    END IF;
    
    -- Calculate new total
    SELECT COALESCE(SUM(subtotal), 0)
    INTO new_total
    FROM itens_orcamento_sistema
    WHERE orcamento_id = quote_id;
    
    -- Update the quote total
    UPDATE orcamentos_sistema
    SET valor_total = new_total
    WHERE id = quote_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quote_total_on_items
    AFTER INSERT OR UPDATE OR DELETE ON itens_orcamento_sistema
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_total();

-- Enable Row Level Security
ALTER TABLE usuarios_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_orcamento_sistema ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for usuarios_sistema
CREATE POLICY "Users can view their own profile" ON usuarios_sistema
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON usuarios_sistema
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON usuarios_sistema
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON usuarios_sistema
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Create RLS policies for orcamentos_sistema
CREATE POLICY "Users can view their own quotes" ON orcamentos_sistema
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios_sistema u 
            WHERE u.id = orcamentos_sistema.usuario_id 
            AND u.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own quotes" ON orcamentos_sistema
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios_sistema u 
            WHERE u.id = orcamentos_sistema.usuario_id 
            AND u.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own quotes" ON orcamentos_sistema
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM usuarios_sistema u 
            WHERE u.id = orcamentos_sistema.usuario_id 
            AND u.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all quotes" ON orcamentos_sistema
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Create RLS policies for itens_orcamento_sistema
CREATE POLICY "Users can view their own quote items" ON itens_orcamento_sistema
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orcamentos_sistema o
            JOIN usuarios_sistema u ON u.id = o.usuario_id
            WHERE o.id = itens_orcamento_sistema.orcamento_id
            AND u.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own quote items" ON itens_orcamento_sistema
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM orcamentos_sistema o
            JOIN usuarios_sistema u ON u.id = o.usuario_id
            WHERE o.id = itens_orcamento_sistema.orcamento_id
            AND u.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all quote items" ON itens_orcamento_sistema
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON usuarios_sistema TO anon, authenticated;
GRANT ALL PRIVILEGES ON usuarios_sistema TO authenticated;

GRANT SELECT ON orcamentos_sistema TO anon, authenticated;
GRANT ALL PRIVILEGES ON orcamentos_sistema TO authenticated;

GRANT SELECT ON itens_orcamento_sistema TO anon, authenticated;
GRANT ALL PRIVILEGES ON itens_orcamento_sistema TO authenticated;

-- Create view for easy quote reporting
CREATE VIEW vw_orcamentos_completos AS
SELECT 
    o.id,
    o.numero_orcamento,
    o.data_evento,
    o.observacoes,
    o.status,
    o.valor_total,
    o.created_at,
    o.updated_at,
    u.nome as usuario_nome,
    u.telefone as usuario_telefone,
    u.empresa as usuario_empresa,
    COUNT(i.id) as total_itens,
    SUM(i.quantidade) as total_quantidade
FROM orcamentos_sistema o
JOIN usuarios_sistema u ON u.id = o.usuario_id
LEFT JOIN itens_orcamento_sistema i ON i.orcamento_id = o.id
GROUP BY o.id, u.id;

GRANT SELECT ON vw_orcamentos_completos TO anon, authenticated;

-- Add comments for documentation
COMMENT ON TABLE usuarios_sistema IS 'System users linked to Supabase auth.users';
COMMENT ON TABLE orcamentos_sistema IS 'Main quotes table with user relationships';
COMMENT ON TABLE itens_orcamento_sistema IS 'Quote items with products and quantities';
COMMENT ON VIEW vw_orcamentos_completos IS 'Complete quote view for reporting';

COMMENT ON COLUMN usuarios_sistema.user_id IS 'Reference to auth.users(id)';
COMMENT ON COLUMN orcamentos_sistema.numero_orcamento IS 'Auto-generated quote number (ORC000001)';
COMMENT ON COLUMN itens_orcamento_sistema.produto_ecologico_id IS 'Reference to produtos_ecologicos."16\t\tid"';
COMMENT ON COLUMN itens_orcamento_sistema.observacoes IS 'Includes color, customizations, and other item details';
COMMENT ON COLUMN itens_orcamento_sistema.subtotal IS 'Auto-calculated as quantidade * preco_unitario';