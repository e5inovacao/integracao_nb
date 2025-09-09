-- Adicionar coluna email na tabela usuarios_sistema
-- Esta migração resolve o problema de não conseguir salvar o email dos usuários

ALTER TABLE usuarios_sistema 
ADD COLUMN email VARCHAR(255);

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN usuarios_sistema.email IS 'Email address of the user for contact and identification';

-- Criar índice para melhorar performance de busca por email
CREATE INDEX idx_usuarios_sistema_email ON usuarios_sistema(email);

-- Atualizar trigger de updated_at se necessário
-- (O trigger já existe, não precisa recriar)

-- Verificar permissões para a tabela
GRANT SELECT, INSERT, UPDATE ON usuarios_sistema TO authenticated;
GRANT SELECT ON usuarios_sistema TO anon;