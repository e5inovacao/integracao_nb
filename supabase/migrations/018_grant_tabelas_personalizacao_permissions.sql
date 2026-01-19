-- Verificar e garantir permissões para a tabela tabelas_personalizacao
-- Esta migração garante que os papéis anon e authenticated tenham as permissões adequadas

-- Verificar se a tabela existe (já foi criada na migração 016)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tabelas_personalizacao'
  ) THEN
    -- Garantir permissões para authenticated
    GRANT SELECT, INSERT, UPDATE, DELETE ON tabelas_personalizacao TO authenticated;
    
    -- Garantir permissões para anon (apenas leitura, se necessário)
    GRANT SELECT ON tabelas_personalizacao TO anon;
    
    -- Recarregar schema do PostgREST
    NOTIFY pgrst, 'reload schema';
    
    RAISE NOTICE 'Permissões garantidas para tabela tabelas_personalizacao';
  ELSE
    RAISE WARNING 'Tabela tabelas_personalizacao não encontrada';
  END IF;
END
$$;