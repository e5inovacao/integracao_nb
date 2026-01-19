-- Migration 028: Fix Relationships and Admin Access
-- 1. Ensure orcamentos_sistema has consultor_id and Foreign Key
-- 2. Force Admin Role Update

-- A. Fix orcamentos_sistema relationships
DO $$ 
BEGIN
    -- Check if consultor_id exists in orcamentos_sistema
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orcamentos_sistema' AND column_name = 'consultor_id') THEN
        ALTER TABLE orcamentos_sistema ADD COLUMN consultor_id bigint;
    END IF;

    -- Drop existing FK if any (to be safe and recreate correctly)
    ALTER TABLE orcamentos_sistema DROP CONSTRAINT IF EXISTS orcamentos_sistema_consultor_id_fkey;

    -- Add Foreign Key to consultores(id)
    ALTER TABLE orcamentos_sistema 
    ADD CONSTRAINT orcamentos_sistema_consultor_id_fkey 
    FOREIGN KEY (consultor_id) REFERENCES consultores(id);

    -- Also check usuario_id relationship (optional but good for consistency)
    -- Usually usuario_id -> auth.users. This is handled by Supabase automatically if defined.
END $$;

-- B. Fix orcamentos_sistema RLS
ALTER TABLE orcamentos_sistema ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin All Access orcamentos_sistema" ON orcamentos_sistema;
CREATE POLICY "Admin All Access orcamentos_sistema" ON orcamentos_sistema 
FOR ALL USING (
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin' OR
    auth.role() = 'service_role' OR
    auth.email() = 'admin01@naturezabrindes.com.br' -- Fallback hardcoded for safety
);

-- C. Force Update Admin01 Role in user_profiles
DO $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Get User ID from auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin01@naturezabrindes.com.br';

    IF v_user_id IS NOT NULL THEN
        -- Update user_profiles
        INSERT INTO user_profiles (user_id, role, full_name, is_active)
        VALUES (v_user_id, 'admin', 'Admin01 Sistema', true)
        ON CONFLICT (user_id) 
        DO UPDATE SET role = 'admin', is_active = true;

        -- Update user_metadata in auth.users (This requires superadmin/service_role)
        -- We can't do this easily via SQL inside a migration run by anon/postgres without extensions sometimes.
        -- But we can update the public tables that AuthContext reads.
    END IF;
END $$;

-- D. Grant Permissions to Views (Double Check)
GRANT SELECT, INSERT, UPDATE, DELETE ON orcamentos_sistema TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON consultores TO authenticated;
