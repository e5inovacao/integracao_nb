-- Migration 024: Enhance Quote Items and Add Conversion Function

-- 1. Add Price Columns to Quote Items (Snapshotting prices)
-- This is crucial for fixing the price when converting to an order
DO $$ BEGIN
    ALTER TABLE itens_orcamento_sistema ADD COLUMN unit_price numeric(10,2) DEFAULT 0;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE itens_orcamento_sistema ADD COLUMN total_price numeric(10,2) DEFAULT 0;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 2. Create Conversion Function
CREATE OR REPLACE FUNCTION convert_quote_to_order(p_quote_id uuid, p_salesperson_id uuid DEFAULT auth.uid())
RETURNS uuid AS $$
DECLARE
  v_quote record;
  v_user record;
  v_partner_id uuid;
  v_order_id uuid;
  v_item record;
  v_product_name text;
BEGIN
  -- 1. Get Quote Data
  SELECT * INTO v_quote FROM orcamentos_sistema WHERE id = p_quote_id;
  
  IF v_quote IS NULL THEN
    RAISE EXCEPTION 'Quote not found';
  END IF;
  
  -- 2. Get User Data
  SELECT * INTO v_user FROM usuarios_sistema WHERE id = v_quote.usuario_id;
  
  -- 3. Find or Create Partner
  SELECT id INTO v_partner_id FROM partners WHERE email = v_user.email LIMIT 1;
  
  IF v_partner_id IS NULL THEN
    INSERT INTO partners (type, name, company_name, email, phone)
    VALUES ('CLIENTE', v_user.nome, v_user.empresa, v_user.email, v_user.telefone)
    RETURNING id INTO v_partner_id;
  END IF;
  
  -- 4. Create Order (Idempotent check)
  SELECT id INTO v_order_id FROM orders WHERE quote_id = p_quote_id LIMIT 1;
  
  IF v_order_id IS NOT NULL THEN
    RETURN v_order_id;
  END IF;
  
  INSERT INTO orders (
    order_number,
    quote_id,
    partner_id,
    salesperson_id,
    status,
    total_amount,
    created_at
  ) VALUES (
    v_quote.numero_orcamento,
    p_quote_id,
    v_partner_id,
    p_salesperson_id,
    'EM ABERTO',
    v_quote.valor_total,
    now()
  ) RETURNING id INTO v_order_id;
  
  -- 5. Migrate Items
  FOR v_item IN SELECT * FROM itens_orcamento_sistema WHERE orcamento_id = p_quote_id
  LOOP
    -- Fetch product name for snapshot
    -- Try to get title from ecologic_products
    SELECT titulo INTO v_product_name FROM ecologic_products WHERE id = v_item.produto_ecologico_id;
    
    INSERT INTO order_items (
      order_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      total_item_value
    ) VALUES (
      v_order_id,
      v_item.produto_ecologico_id,
      COALESCE(v_product_name, 'Produto ' || v_item.produto_ecologico_id),
      v_item.quantidade,
      v_item.unit_price,
      v_item.total_price
    );
  END LOOP;
  
  -- Update Quote Status
  UPDATE orcamentos_sistema SET status = 'finalizado' WHERE id = p_quote_id;
  
  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
