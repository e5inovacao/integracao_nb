-- Migration: Clean Database Architecture
-- Remove unnecessary tables and create new clean structure

-- 1. DROP all unnecessary tables and their dependencies
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS quote_requests CASCADE;
DROP TABLE IF EXISTS quote_items CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS product_suppliers CASCADE;
DROP TABLE IF EXISTS customization_options CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS representantes CASCADE;
DROP TABLE IF EXISTS historico_alteracoes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS itens_orcamento CASCADE;
DROP TABLE IF EXISTS itens_solicitacao_orcamento CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;

-- 2. Keep only products and produtos_ecologicos tables (they remain unchanged)

-- 3. Create new clean structure

-- Table: clientes_sistema
CREATE TABLE clientes_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    empresa VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: orcamentos_sistema
CREATE TABLE orcamentos_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_orcamento VARCHAR(50) UNIQUE NOT NULL,
    cliente_id UUID NOT NULL REFERENCES clientes_sistema(id) ON DELETE CASCADE,
    data_evento DATE,
    observacoes_cliente TEXT,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'finalizado')),
    valor_total DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: itens_orcamento_sistema
CREATE TABLE itens_orcamento_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orcamento_id UUID NOT NULL REFERENCES orcamentos_sistema(id) ON DELETE CASCADE,
    produto_ecologico_id BIGINT NOT NULL REFERENCES produtos_ecologicos("16		id") ON DELETE RESTRICT,
    quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX idx_clientes_sistema_email ON clientes_sistema(email);
CREATE INDEX idx_orcamentos_sistema_cliente_id ON orcamentos_sistema(cliente_id);
CREATE INDEX idx_orcamentos_sistema_numero ON orcamentos_sistema(numero_orcamento);
CREATE INDEX idx_orcamentos_sistema_status ON orcamentos_sistema(status);
CREATE INDEX idx_itens_orcamento_sistema_orcamento_id ON itens_orcamento_sistema(orcamento_id);
CREATE INDEX idx_itens_orcamento_sistema_produto_id ON itens_orcamento_sistema(produto_ecologico_id);

-- 5. Create trigger for auto-updating updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clientes_sistema_updated_at
    BEFORE UPDATE ON clientes_sistema
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orcamentos_sistema_updated_at
    BEFORE UPDATE ON orcamentos_sistema
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Create function for auto-generating quote numbers
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    quote_number TEXT;
BEGIN
    -- Get the next sequential number
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_orcamento FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM orcamentos_sistema
    WHERE numero_orcamento ~ '^ORC-[0-9]+$';
    
    -- Format as ORC-XXXX
    quote_number := 'ORC-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN quote_number;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for auto-generating quote numbers
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

-- 8. Enable RLS (Row Level Security)
ALTER TABLE clientes_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_orcamento_sistema ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies
-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON clientes_sistema
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON orcamentos_sistema
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON itens_orcamento_sistema
    FOR ALL USING (auth.role() = 'authenticated');

-- Allow read access for anonymous users (for quote requests)
CREATE POLICY "Allow read for anonymous" ON clientes_sistema
    FOR SELECT USING (auth.role() = 'anon');

CREATE POLICY "Allow insert for anonymous" ON clientes_sistema
    FOR INSERT WITH CHECK (auth.role() = 'anon');

CREATE POLICY "Allow read for anonymous" ON orcamentos_sistema
    FOR SELECT USING (auth.role() = 'anon');

CREATE POLICY "Allow insert for anonymous" ON orcamentos_sistema
    FOR INSERT WITH CHECK (auth.role() = 'anon');

CREATE POLICY "Allow read for anonymous" ON itens_orcamento_sistema
    FOR SELECT USING (auth.role() = 'anon');

CREATE POLICY "Allow insert for anonymous" ON itens_orcamento_sistema
    FOR INSERT WITH CHECK (auth.role() = 'anon');

-- 10. Grant permissions to roles
GRANT ALL PRIVILEGES ON clientes_sistema TO authenticated;
GRANT ALL PRIVILEGES ON orcamentos_sistema TO authenticated;
GRANT ALL PRIVILEGES ON itens_orcamento_sistema TO authenticated;

GRANT SELECT, INSERT ON clientes_sistema TO anon;
GRANT SELECT, INSERT ON orcamentos_sistema TO anon;
GRANT SELECT, INSERT ON itens_orcamento_sistema TO anon;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 11. Create function for auto-creating clients when email doesn't exist
CREATE OR REPLACE FUNCTION ensure_client_exists(p_email TEXT, p_nome TEXT DEFAULT NULL, p_telefone TEXT DEFAULT NULL, p_empresa TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    client_id UUID;
BEGIN
    -- Try to find existing client
    SELECT id INTO client_id
    FROM clientes_sistema
    WHERE email = p_email;
    
    -- If not found, create new client
    IF client_id IS NULL THEN
        INSERT INTO clientes_sistema (nome, email, telefone, empresa)
        VALUES (
            COALESCE(p_nome, 'Cliente'),
            p_email,
            p_telefone,
            p_empresa
        )
        RETURNING id INTO client_id;
    END IF;
    
    RETURN client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION ensure_client_exists(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_client_exists(TEXT, TEXT, TEXT, TEXT) TO anon;

COMMIT;