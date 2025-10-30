-- Conceder permissões para a tabela consultores
-- Permitir que usuários anônimos possam inserir dados (necessário para registro de admin)
GRANT INSERT ON consultores TO anon;
GRANT SELECT ON consultores TO anon;
GRANT ALL PRIVILEGES ON consultores TO authenticated;

-- Verificar se existem políticas RLS que podem estar bloqueando
-- Criar política para permitir inserção de novos consultores
CREATE POLICY "Allow insert for admin setup" ON consultores
  FOR INSERT
  WITH CHECK (true);

-- Criar política para permitir leitura de consultores
CREATE POLICY "Allow select for consultores" ON consultores
  FOR SELECT
  USING (true);

-- Criar política para permitir atualização apenas do próprio registro ou por admin
CREATE POLICY "Allow update own record or admin" ON consultores
  FOR UPDATE
  USING (
    auth.uid() = auth_user_id OR 
    EXISTS (
      SELECT 1 FROM consultores c 
      WHERE c.auth_user_id = auth.uid() 
      AND c.email LIKE '%admin%'
    )
  );

-- Conceder permissões na sequência também
GRANT USAGE, SELECT ON SEQUENCE consultores_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE consultores_id_seq TO authenticated;