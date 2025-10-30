-- Corrigir permissões para a tabela orcamentos

-- Conceder permissões SELECT para role anon (usuários não autenticados)
GRANT SELECT ON orcamentos TO anon;

-- Conceder todas as permissões para role authenticated (usuários autenticados)
GRANT ALL PRIVILEGES ON orcamentos TO authenticated;

-- Verificar se existem políticas RLS restritivas e criar políticas mais permissivas
-- Remover políticas existentes se houver conflitos
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON orcamentos;
DROP POLICY IF EXISTS "Allow read access to anonymous users" ON orcamentos;

-- Criar política para permitir acesso total aos usuários autenticados
CREATE POLICY "Allow full access to authenticated users" ON orcamentos
  FOR ALL USING (true) WITH CHECK (true);

-- Criar política para permitir leitura aos usuários anônimos
CREATE POLICY "Allow read access to anonymous users" ON orcamentos
  FOR SELECT USING (true);

-- Garantir que as sequências também tenham permissões
GRANT USAGE, SELECT ON SEQUENCE orcamentos_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE orcamentos_id_seq TO authenticated;