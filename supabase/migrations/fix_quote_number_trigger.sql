-- Fix Quote Number Trigger
-- Remove any problematic triggers and create a proper one

-- Drop existing triggers that might be causing issues
DROP TRIGGER IF EXISTS set_quote_number_trigger ON orcamentos_sistema;
DROP TRIGGER IF EXISTS generate_quote_number_trigger ON orcamentos_sistema;
DROP TRIGGER IF EXISTS set_orcamento_numero ON orcamentos_sistema;

-- Drop existing functions that might be problematic (using CASCADE)
DROP FUNCTION IF EXISTS set_quote_number() CASCADE;
DROP FUNCTION IF EXISTS generate_quote_number() CASCADE;
DROP FUNCTION IF EXISTS set_orcamento_numero() CASCADE;

-- Create a proper function to generate quote numbers
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    quote_number TEXT;
BEGIN
    -- Get the next sequential number from existing quote numbers
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_orcamento FROM 'ORC([0-9]+)') AS INTEGER)), 0) + 1
    INTO next_number
    FROM orcamentos_sistema
    WHERE numero_orcamento ~ '^ORC[0-9]+$';
    
    -- Format as ORC + padded number (6 digits)
    quote_number := 'ORC' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN quote_number;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function to set quote number on insert
CREATE OR REPLACE FUNCTION set_quote_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set quote number if it's not already provided
    IF NEW.numero_orcamento IS NULL OR NEW.numero_orcamento = '' THEN
        NEW.numero_orcamento := generate_quote_number();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER set_quote_number_trigger
    BEFORE INSERT ON orcamentos_sistema
    FOR EACH ROW
    EXECUTE FUNCTION set_quote_number();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON orcamentos_sistema TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON orcamentos_sistema TO authenticated;