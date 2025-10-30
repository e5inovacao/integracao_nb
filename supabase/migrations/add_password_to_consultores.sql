-- Adicionar campo de senha na tabela consultores
ALTER TABLE consultores ADD COLUMN IF NOT EXISTS senha TEXT;

-- Atualizar comentário da tabela
COMMENT ON COLUMN consultores.senha IS 'Senha de acesso do consultor';

-- Criar índice para melhorar performance de consultas por email (usado no login)
CREATE INDEX IF NOT EXISTS idx_consultores_email ON consultores(email);

-- Atualizar RLS policy para permitir que consultores atualizem sua própria senha
CREATE POLICY "Consultores podem atualizar próprios dados" ON consultores
  FOR UPDATE USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);