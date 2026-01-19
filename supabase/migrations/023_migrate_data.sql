-- Migration 023: Migrate Data and Refine Schema

-- 1. Add company_name to partners
DO $$ BEGIN
    ALTER TABLE partners ADD COLUMN company_name text;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 2. Ensure Email Uniqueness for Migration
DO $$ BEGIN
    ALTER TABLE partners ADD CONSTRAINT partners_email_key UNIQUE (email);
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null; -- Might fail if duplicates exist
END $$;

-- 3. Migrate Clients from clientes_sistema to partners
-- We use a CTE to filter valid emails and avoid duplicates if any
WITH distinct_clients AS (
    SELECT DISTINCT ON (email) *
    FROM clientes_sistema
    WHERE email IS NOT NULL AND email != ''
)
INSERT INTO partners (type, name, company_name, email, phone, created_at, updated_at)
SELECT 
    'CLIENTE'::partner_type,
    nome,
    empresa,
    email,
    telefone,
    created_at,
    updated_at
FROM distinct_clients
ON CONFLICT (email) DO UPDATE 
SET 
    phone = EXCLUDED.phone,
    company_name = EXCLUDED.company_name,
    updated_at = EXCLUDED.updated_at;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_partners_email ON partners(email);
CREATE INDEX IF NOT EXISTS idx_partners_name ON partners(name);
CREATE INDEX IF NOT EXISTS idx_orders_quote_id ON orders(quote_id);
