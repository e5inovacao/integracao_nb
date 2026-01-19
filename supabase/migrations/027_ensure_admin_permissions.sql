-- Migration 027: Ensure Configuration Tables and Admin Permissions

-- 1. Create tabelas_fator if not exists
CREATE TABLE IF NOT EXISTS tabelas_fator (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_tabela text NOT NULL,
    quantidade_inicial integer NOT NULL,
    quantidade_final integer NOT NULL,
    fator numeric(10,3) NOT NULL,
    status text DEFAULT 'ativo',
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE tabelas_fator ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read tabelas_fator" ON tabelas_fator;
CREATE POLICY "Public Read tabelas_fator" ON tabelas_fator FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin Manage tabelas_fator" ON tabelas_fator;
CREATE POLICY "Admin Manage tabelas_fator" ON tabelas_fator FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM user_profiles WHERE role = 'admin') OR
    auth.role() = 'service_role'
);

-- 2. Seed default data for tabelas_fator if empty
INSERT INTO tabelas_fator (nome_tabela, quantidade_inicial, quantidade_final, fator)
SELECT 'Padrão', 1, 100, 2.5
WHERE NOT EXISTS (SELECT 1 FROM tabelas_fator LIMIT 1);

INSERT INTO tabelas_fator (nome_tabela, quantidade_inicial, quantidade_final, fator)
SELECT 'Padrão', 101, 500, 2.2
WHERE NOT EXISTS (SELECT 1 FROM tabelas_fator WHERE quantidade_inicial = 101);

INSERT INTO tabelas_fator (nome_tabela, quantidade_inicial, quantidade_final, fator)
SELECT 'Padrão', 501, 10000, 1.9
WHERE NOT EXISTS (SELECT 1 FROM tabelas_fator WHERE quantidade_inicial = 501);

-- 3. Ensure Admin Permissions on ALL tables
-- Grant all privileges on public tables to service_role (which Admin uses effectively)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant standard access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. Fix User Profiles RLS to allow Admins to see everything
DROP POLICY IF EXISTS "Admin Full Access user_profiles" ON user_profiles;
CREATE POLICY "Admin Full Access user_profiles" ON user_profiles 
FOR ALL USING (
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin' OR
    auth.role() = 'service_role'
);
