-- Migration 022: Unified Schema Integration (NB Admin + Gestão de Pedidos)

-- 1. Create PARTNERS table (Unifies Clientes and Fornecedores)
DO $$ BEGIN
    CREATE TYPE partner_type AS ENUM ('CLIENTE', 'FORNECEDOR', 'AMBOS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type partner_type NOT NULL DEFAULT 'CLIENTE',
  name text NOT NULL,
  doc text, -- CPF/CNPJ
  email text, -- Unique constraint will be added later if needed, to avoid conflict with existing bad data
  phone text,
  financial_email text, -- From Gestão
  address_data jsonb DEFAULT '{}'::jsonb, -- Store full address structure
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid errors
DROP POLICY IF EXISTS "Public read access for partners" ON partners;
DROP POLICY IF EXISTS "Authenticated full access for partners" ON partners;

CREATE POLICY "Public read access for partners" ON partners FOR SELECT USING (true);
CREATE POLICY "Authenticated full access for partners" ON partners FOR ALL USING (auth.role() = 'authenticated');


-- 2. Update ECOLOGIC_PRODUCTS (Catalog)
-- Add Supplier Link and Cost Price
-- Note: We use DO block to avoid errors if columns already exist
DO $$ BEGIN
    ALTER TABLE ecologic_products ADD COLUMN supplier_id uuid REFERENCES partners(id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE ecologic_products ADD COLUMN cost_price numeric(10,2) DEFAULT 0;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 3. Create ORDERS table (Execution of the Sale)
DO $$ BEGIN
    CREATE TYPE order_status_type AS ENUM (
        'EM ABERTO', 'EM PRODUÇÃO', 'AGUARDANDO APROVAÇÃO', 
        'AGUARDANDO NF', 'AGUARDANDO PAGAMENTO', 
        'AGUARDANDO PERSONALIZAÇÃO', 'FINALIZADO', 'ENTRE FINALIZADO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number text NOT NULL, -- Can be same as quote number or new sequence
  quote_id uuid REFERENCES orcamentos_sistema(id), -- Link to Origin Quote
  partner_id uuid REFERENCES partners(id), -- Link to Client
  salesperson_id uuid REFERENCES auth.users(id), -- Link to Consultant
  
  status order_status_type DEFAULT 'EM ABERTO',
  
  -- Dates
  order_date date DEFAULT current_date,
  delivery_deadline date,
  
  -- Financials
  total_amount numeric(10,2) DEFAULT 0,
  billing_type text, -- '50/50', '30/60/90', etc.
  payment_method text,
  
  -- Payments Tracking
  entry_amount numeric(10,2) DEFAULT 0,
  entry_date date,
  entry_confirmed boolean DEFAULT false,
  
  remaining_amount numeric(10,2) DEFAULT 0,
  remaining_date date,
  remaining_confirmed boolean DEFAULT false,
  
  invoice_number text,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(order_number)
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see their own orders" ON orders;
CREATE POLICY "Users see their own orders" ON orders FOR ALL USING (auth.uid() = salesperson_id OR auth.role() = 'service_role');
-- Note: Adjust policy for Admin roles later

-- 4. Create ORDER_ITEMS table (Financial Breakdown)
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id bigint, -- Link to ecologic_products (can be null if custom item)
  product_name text NOT NULL, -- Snapshot of name
  
  supplier_id uuid REFERENCES partners(id),
  
  quantity integer DEFAULT 1,
  
  -- Price (Revenue)
  unit_price numeric(10,2) DEFAULT 0, -- Final selling price per unit
  total_item_value numeric(10,2) DEFAULT 0, -- quantity * unit_price
  
  -- Costs (Predicted vs Real)
  -- Predicted (from catalog/quote)
  cost_product numeric(10,2) DEFAULT 0,
  cost_customization numeric(10,2) DEFAULT 0,
  cost_freight numeric(10,2) DEFAULT 0,
  cost_extra numeric(10,2) DEFAULT 0,
  
  -- Real (from production/supplier invoice)
  real_cost_product numeric(10,2) DEFAULT 0,
  real_cost_customization numeric(10,2) DEFAULT 0,
  real_cost_freight numeric(10,2) DEFAULT 0,
  real_cost_extra numeric(10,2) DEFAULT 0,
  
  -- Flags
  is_paid_supplier boolean DEFAULT false,
  
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see items of their orders" ON order_items;
CREATE POLICY "Users see items of their orders" ON order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.salesperson_id = auth.uid() OR auth.role() = 'service_role'))
);

-- 5. Create COMMISSIONS table
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  salesperson_id uuid REFERENCES auth.users(id),
  amount numeric(10,2) NOT NULL,
  type text NOT NULL, -- 'ENTRADA', 'RESTANTE'
  status text DEFAULT 'PENDING',
  percentage numeric(5,2) DEFAULT 3.00,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see their own commissions" ON commissions;
CREATE POLICY "Users see their own commissions" ON commissions FOR ALL USING (salesperson_id = auth.uid() OR auth.role() = 'service_role');

-- 6. Create EXPENSES table
CREATE TABLE IF NOT EXISTS company_expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  paid boolean DEFAULT false,
  paid_date date,
  category text,
  observation text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE company_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage expenses" ON company_expenses;
CREATE POLICY "Admins manage expenses" ON company_expenses FOR ALL USING (auth.role() = 'service_role'); -- TODO: Add Admin role check

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_partners_modtime ON partners;
CREATE TRIGGER update_partners_modtime BEFORE UPDATE ON partners FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_modtime ON orders;
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_commissions_modtime ON commissions;
CREATE TRIGGER update_commissions_modtime BEFORE UPDATE ON commissions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
