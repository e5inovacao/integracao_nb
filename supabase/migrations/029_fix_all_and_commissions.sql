-- Migration 029: Fix Legacy Views, Commissions and Triggers

-- 1. FIX LEGACY VIEWS (For Frontend Compatibility)
-- Map usuarios_clientes to partners (or create dummy if partners missing)
DO $$ 
BEGIN
    -- Ensure partners table exists (simplified version if missing)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partners') THEN
        CREATE TABLE partners (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            name text,
            email text,
            phone text,
            doc text,
            address_data jsonb DEFAULT '{}',
            type text DEFAULT 'CLIENTE'
        );
    END IF;

    -- Create/Replace usuarios_clientes view
    CREATE OR REPLACE VIEW usuarios_clientes AS
    SELECT 
        id,
        name as nome,
        email,
        phone as telefone,
        name as empresa, -- Fallback
        doc as cnpj,
        address_data as endereco,
        NULL::uuid as consultor_id -- Placeholder
    FROM partners
    WHERE type = 'CLIENTE' OR type = 'AMBOS';

    -- Create/Replace consultores table/view
    -- If consultores table exists, ensure it has necessary columns. 
    -- If it's a view, ensure it maps to user_profiles.
    -- For safety, we keep consultores as a TABLE if it already is one (legacy), 
    -- but ensure permissions.
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'consultores') THEN
        CREATE TABLE consultores (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            nome text,
            email text,
            cpf text,
            telefone text,
            ativo boolean DEFAULT true,
            auth_user_id uuid REFERENCES auth.users(id)
        );
    END IF;

    -- Create user_profiles if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        CREATE TABLE user_profiles (
            user_id uuid PRIMARY KEY REFERENCES auth.users(id),
            full_name text,
            role text CHECK (role IN ('admin', 'consultor', 'cliente')),
            is_active boolean DEFAULT true
        );
    END IF;

    -- 2. ENSURE COMMISSIONS TABLE
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commissions') THEN
        CREATE TABLE commissions (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
            salesperson_id uuid REFERENCES auth.users(id),
            amount numeric(10,2) NOT NULL,
            type text NOT NULL, -- 'ENTRADA' or 'RESTANTE'
            status text DEFAULT 'PENDING',
            percentage numeric(5,2) DEFAULT 3.00,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now()
        );
    END IF;
END $$;

-- 3. FIX ORCAMENTOS_SISTEMA RELATIONSHIP
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orcamentos_sistema' AND column_name = 'consultor_id') THEN
        ALTER TABLE orcamentos_sistema ADD COLUMN consultor_id uuid REFERENCES consultores(id);
    END IF;
END $$;

-- 4. CREATE TRIGGER FOR COMMISSIONS (Auto-generate on Order Status Change)
CREATE OR REPLACE FUNCTION public.calculate_commissions()
RETURNS TRIGGER AS $$
DECLARE
    v_salesperson_id uuid;
    v_commission_exists boolean;
BEGIN
    -- Only proceed if status changed to confirmed/paid statuses
    -- Logic: 
    -- 1. Entry Payment (ENTRADA) -> When entry_confirmed becomes true
    -- 2. Remaining Payment (RESTANTE) -> When remaining_confirmed becomes true
    
    v_salesperson_id := NEW.salesperson_id;
    
    -- If no salesperson, try to find from quote
    IF v_salesperson_id IS NULL AND NEW.quote_id IS NOT NULL THEN
        SELECT consultor_id INTO v_salesperson_id FROM orcamentos_sistema WHERE id = NEW.quote_id; 
        -- Note: orcamentos_sistema.consultor_id might be bigint or uuid. 
        -- If bigint (legacy), we might have an issue mapping to auth.users. 
        -- Assuming uuid for new system.
    END IF;

    IF v_salesperson_id IS NULL THEN
        RETURN NEW; -- No salesperson, no commission
    END IF;

    -- Entry Commission
    IF NEW.entry_confirmed = true AND (OLD.entry_confirmed = false OR OLD.entry_confirmed IS NULL) THEN
        IF NOT EXISTS (SELECT 1 FROM commissions WHERE order_id = NEW.id AND type = 'ENTRADA') THEN
            INSERT INTO commissions (order_id, salesperson_id, amount, type, status, percentage)
            VALUES (NEW.id, v_salesperson_id, (NEW.entry_amount * 0.03), 'ENTRADA', 'PENDING', 3.00);
        END IF;
    END IF;

    -- Remaining Commission
    IF NEW.remaining_confirmed = true AND (OLD.remaining_confirmed = false OR OLD.remaining_confirmed IS NULL) THEN
        IF NOT EXISTS (SELECT 1 FROM commissions WHERE order_id = NEW.id AND type = 'RESTANTE') THEN
            INSERT INTO commissions (order_id, salesperson_id, amount, type, status, percentage)
            VALUES (NEW.id, v_salesperson_id, (NEW.remaining_amount * 0.03), 'RESTANTE', 'PENDING', 3.00);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_commissions ON orders;
CREATE TRIGGER trg_commissions
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION calculate_commissions();

-- 5. GRANT PERMISSIONS
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure views are accessible
GRANT SELECT ON usuarios_clientes TO authenticated;
