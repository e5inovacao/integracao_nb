-- Correção das políticas RLS para as tabelas existentes
-- Esta migration corrige as políticas RLS para permitir inserções públicas

-- Remover políticas existentes que podem estar conflitando
DROP POLICY IF EXISTS "Allow public insert on clientes" ON clientes;
DROP POLICY IF EXISTS "Allow public read on clientes" ON clientes;
DROP POLICY IF EXISTS "Allow public update on clientes" ON clientes;

DROP POLICY IF EXISTS "Allow public insert on orcamentos" ON orcamentos;
DROP POLICY IF EXISTS "Allow public read on orcamentos" ON orcamentos;
DROP POLICY IF EXISTS "Allow public update on orcamentos" ON orcamentos;

DROP POLICY IF EXISTS "Allow public insert on itens_orcamento" ON itens_orcamento;
DROP POLICY IF EXISTS "Allow public read on itens_orcamento" ON itens_orcamento;
DROP POLICY IF EXISTS "Allow public update on itens_orcamento" ON itens_orcamento;

-- Criar novas políticas RLS permissivas para as tabelas existentes
-- Políticas para a tabela clientes
CREATE POLICY "Allow all operations on clientes" 
  ON clientes FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Políticas para a tabela orcamentos
CREATE POLICY "Allow all operations on orcamentos" 
  ON orcamentos FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Políticas para a tabela itens_orcamento
CREATE POLICY "Allow all operations on itens_orcamento" 
  ON itens_orcamento FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Conceder permissões explícitas aos roles anon e authenticated
GRANT ALL PRIVILEGES ON clientes TO anon;
GRANT ALL PRIVILEGES ON clientes TO authenticated;

GRANT ALL PRIVILEGES ON orcamentos TO anon;
GRANT ALL PRIVILEGES ON orcamentos TO authenticated;

GRANT ALL PRIVILEGES ON itens_orcamento TO anon;
GRANT ALL PRIVILEGES ON itens_orcamento TO authenticated;

-- Conceder permissões de uso das sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verificar se RLS está habilitado (caso não esteja)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_orcamento ENABLE ROW LEVEL SECURITY;