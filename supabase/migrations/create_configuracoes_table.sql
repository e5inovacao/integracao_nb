-- Criar tabela de configurações para armazenamento de valores-chave
CREATE TABLE IF NOT EXISTS configuracoes (
  id BIGSERIAL PRIMARY KEY,
  chave VARCHAR(255) NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  descricao TEXT,
  categoria VARCHAR(100) DEFAULT 'geral',
  tipo VARCHAR(50) DEFAULT 'texto', -- texto, numero, booleano, json
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON configuracoes(chave);
CREATE INDEX IF NOT EXISTS idx_configuracoes_categoria ON configuracoes(categoria);
CREATE INDEX IF NOT EXISTS idx_configuracoes_ativo ON configuracoes(ativo);

-- Habilitar RLS (Row Level Security)
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários autenticados
CREATE POLICY "Usuários autenticados podem ler configurações" ON configuracoes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir inserção apenas para administradores
CREATE POLICY "Apenas administradores podem inserir configurações" ON configuracoes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM consultores 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Política para permitir atualização apenas para administradores
CREATE POLICY "Apenas administradores podem atualizar configurações" ON configuracoes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM consultores 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Política para permitir exclusão apenas para administradores
CREATE POLICY "Apenas administradores podem excluir configurações" ON configuracoes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM consultores 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_configuracoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER trigger_update_configuracoes_updated_at
  BEFORE UPDATE ON configuracoes
  FOR EACH ROW
  EXECUTE FUNCTION update_configuracoes_updated_at();

-- Função para buscar configuração por chave
CREATE OR REPLACE FUNCTION get_configuracao(p_chave VARCHAR(255))
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'id', id,
    'chave', chave,
    'valor', valor,
    'descricao', descricao,
    'categoria', categoria,
    'tipo', tipo,
    'ativo', ativo,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO v_result
  FROM configuracoes
  WHERE chave = p_chave AND ativo = true;

  IF v_result IS NULL THEN
    v_result := json_build_object(
      'error', 'Configuração não encontrada',
      'chave', p_chave
    );
  END IF;

  RETURN v_result;
END;
$$;

-- Função para buscar configurações por categoria
CREATE OR REPLACE FUNCTION get_configuracoes_por_categoria(p_categoria VARCHAR(100))
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', id,
      'chave', chave,
      'valor', valor,
      'descricao', descricao,
      'categoria', categoria,
      'tipo', tipo,
      'ativo', ativo,
      'created_at', created_at,
      'updated_at', updated_at
    )
  ) INTO v_result
  FROM configuracoes
  WHERE categoria = p_categoria AND ativo = true
  ORDER BY chave;

  IF v_result IS NULL THEN
    v_result := json_build_array();
  END IF;

  RETURN v_result;
END;
$$;

-- Conceder permissões para as funções
GRANT EXECUTE ON FUNCTION get_configuracao(VARCHAR(255)) TO authenticated;
GRANT EXECUTE ON FUNCTION get_configuracoes_por_categoria(VARCHAR(100)) TO authenticated;

-- Inserir algumas configurações padrão
INSERT INTO configuracoes (chave, valor, descricao, categoria, tipo, created_by) VALUES
  ('empresa_nome', 'NB Admin', 'Nome da empresa', 'empresa', 'texto', (SELECT id FROM auth.users LIMIT 1)),
  ('empresa_cnpj', '', 'CNPJ da empresa', 'empresa', 'texto', (SELECT id FROM auth.users LIMIT 1)),
  ('empresa_endereco', '', 'Endereço da empresa', 'empresa', 'texto', (SELECT id FROM auth.users LIMIT 1)),
  ('empresa_telefone', '', 'Telefone da empresa', 'empresa', 'texto', (SELECT id FROM auth.users LIMIT 1)),
  ('empresa_email', '', 'Email da empresa', 'empresa', 'texto', (SELECT id FROM auth.users LIMIT 1)),
  ('orcamento_validade_padrao', '30', 'Validade padrão dos orçamentos (dias)', 'orcamento', 'numero', (SELECT id FROM auth.users LIMIT 1)),
  ('orcamento_prazo_entrega_padrao', '15', 'Prazo de entrega padrão (dias)', 'orcamento', 'numero', (SELECT id FROM auth.users LIMIT 1)),
  ('sistema_moeda', 'BRL', 'Moeda padrão do sistema', 'sistema', 'texto', (SELECT id FROM auth.users LIMIT 1)),
  ('sistema_timezone', 'America/Sao_Paulo', 'Fuso horário do sistema', 'sistema', 'texto', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (chave) DO NOTHING;

-- Comentários na tabela
COMMENT ON TABLE configuracoes IS 'Tabela para armazenar configurações do sistema em formato chave-valor';
COMMENT ON COLUMN configuracoes.chave IS 'Chave única da configuração';
COMMENT ON COLUMN configuracoes.valor IS 'Valor da configuração (sempre armazenado como texto)';
COMMENT ON COLUMN configuracoes.descricao IS 'Descrição da configuração';
COMMENT ON COLUMN configuracoes.categoria IS 'Categoria da configuração para organização';
COMMENT ON COLUMN configuracoes.tipo IS 'Tipo do valor (texto, numero, booleano, json)';
COMMENT ON COLUMN configuracoes.ativo IS 'Se a configuração está ativa';