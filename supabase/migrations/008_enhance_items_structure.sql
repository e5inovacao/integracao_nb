-- Migration: Enhance Items Structure
-- Add color and item-specific observations to itens_orcamento_sistema

-- Add new columns to itens_orcamento_sistema
ALTER TABLE itens_orcamento_sistema 
ADD COLUMN cor_selecionada VARCHAR(100),
ADD COLUMN observacoes_item TEXT,
ADD COLUMN preco_unitario DECIMAL(10,2),
ADD COLUMN subtotal DECIMAL(12,2),
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger for auto-updating updated_at column
CREATE TRIGGER update_itens_orcamento_sistema_updated_at
    BEFORE UPDATE ON itens_orcamento_sistema
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate subtotal automatically
CREATE OR REPLACE FUNCTION calculate_item_subtotal()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate subtotal if price and quantity are available
    IF NEW.preco_unitario IS NOT NULL AND NEW.quantidade IS NOT NULL THEN
        NEW.subtotal := NEW.preco_unitario * NEW.quantidade;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-calculating subtotal
CREATE TRIGGER calculate_subtotal_trigger
    BEFORE INSERT OR UPDATE ON itens_orcamento_sistema
    FOR EACH ROW
    EXECUTE FUNCTION calculate_item_subtotal();

-- Create function to update quote total when items change
CREATE OR REPLACE FUNCTION update_quote_total()
RETURNS TRIGGER AS $$
DECLARE
    quote_id UUID;
    new_total DECIMAL(12,2);
BEGIN
    -- Get the quote ID from the affected row
    IF TG_OP = 'DELETE' THEN
        quote_id := OLD.orcamento_id;
    ELSE
        quote_id := NEW.orcamento_id;
    END IF;
    
    -- Calculate new total for the quote
    SELECT COALESCE(SUM(subtotal), 0)
    INTO new_total
    FROM itens_orcamento_sistema
    WHERE orcamento_id = quote_id;
    
    -- Update the quote total
    UPDATE orcamentos_sistema
    SET valor_total = new_total,
        updated_at = NOW()
    WHERE id = quote_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating quote totals
CREATE TRIGGER update_quote_total_trigger
    AFTER INSERT OR UPDATE OR DELETE ON itens_orcamento_sistema
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_total();

-- Add index for better performance on color searches
CREATE INDEX idx_itens_orcamento_sistema_cor ON itens_orcamento_sistema(cor_selecionada);

-- Add comments for documentation
COMMENT ON COLUMN itens_orcamento_sistema.cor_selecionada IS 'Cor específica selecionada pelo cliente para este item';
COMMENT ON COLUMN itens_orcamento_sistema.observacoes_item IS 'Observações específicas para este item do orçamento';
COMMENT ON COLUMN itens_orcamento_sistema.preco_unitario IS 'Preço unitário do produto no momento da cotação';
COMMENT ON COLUMN itens_orcamento_sistema.subtotal IS 'Subtotal calculado automaticamente (preço_unitario * quantidade)';

COMMIT;