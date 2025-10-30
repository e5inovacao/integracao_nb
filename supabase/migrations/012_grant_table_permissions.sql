-- Grant permissions for quote system tables
-- This ensures anon and authenticated roles can access the tables

-- Grant permissions for usuarios_sistema
GRANT SELECT, INSERT, UPDATE ON usuarios_sistema TO anon;
GRANT ALL PRIVILEGES ON usuarios_sistema TO authenticated;

-- Grant permissions for orcamentos_sistema
GRANT SELECT, INSERT, UPDATE ON orcamentos_sistema TO anon;
GRANT ALL PRIVILEGES ON orcamentos_sistema TO authenticated;

-- Grant permissions for itens_orcamento_sistema
GRANT SELECT, INSERT, UPDATE ON itens_orcamento_sistema TO anon;
GRANT ALL PRIVILEGES ON itens_orcamento_sistema TO authenticated;

-- Grant usage on sequences if they exist
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Comments
COMMENT ON TABLE usuarios_sistema IS 'System users - permissions granted to anon and authenticated';
COMMENT ON TABLE orcamentos_sistema IS 'Quote system - permissions granted to anon and authenticated';
COMMENT ON TABLE itens_orcamento_sistema IS 'Quote items - permissions granted to anon and authenticated';