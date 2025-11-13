-- Corrigir função get_configuracoes_por_categoria para evitar erro GROUP BY
DROP FUNCTION IF EXISTS get_configuracoes_por_categoria(VARCHAR(100));

CREATE OR REPLACE FUNCTION get_configuracoes_por_categoria(p_categoria VARCHAR(100))
RETURNS TABLE(
  id UUID,
  chave VARCHAR(255),
  valor TEXT,
  descricao TEXT,
  categoria VARCHAR(100),
  tipo VARCHAR(50),
  ativo BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.chave,
    c.valor,
    c.descricao,
    c.categoria,
    c.tipo,
    c.ativo,
    c.created_at,
    c.updated_at
  FROM configuracoes c
  WHERE c.categoria = p_categoria AND c.ativo = true
  ORDER BY c.chave;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_configuracoes_por_categoria(VARCHAR(100)) TO authenticated;