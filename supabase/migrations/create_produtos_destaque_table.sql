-- Criar tabela produtos_destaque
CREATE TABLE IF NOT EXISTS produtos_destaque (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  posicao INTEGER NOT NULL DEFAULT 1,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_produtos_destaque_produto_id ON produtos_destaque(produto_id);
CREATE INDEX IF NOT EXISTS idx_produtos_destaque_posicao ON produtos_destaque(posicao);
CREATE INDEX IF NOT EXISTS idx_produtos_destaque_ativo ON produtos_destaque(ativo);

-- Garantir que a posição seja única para produtos ativos
CREATE UNIQUE INDEX IF NOT EXISTS idx_produtos_destaque_posicao_ativo 
ON produtos_destaque(posicao) WHERE ativo = true;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_produtos_destaque_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_produtos_destaque_updated_at
  BEFORE UPDATE ON produtos_destaque
  FOR EACH ROW
  EXECUTE FUNCTION update_produtos_destaque_updated_at();

-- Habilitar RLS
ALTER TABLE produtos_destaque ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para produtos_destaque
CREATE POLICY "Permitir leitura de produtos_destaque para todos" ON produtos_destaque
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de produtos_destaque para usuários autenticados" ON produtos_destaque
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização de produtos_destaque para usuários autenticados" ON produtos_destaque
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir exclusão de produtos_destaque para usuários autenticados" ON produtos_destaque
  FOR DELETE USING (auth.role() = 'authenticated');

-- Conceder permissões para as roles
GRANT ALL PRIVILEGES ON produtos_destaque TO authenticated;
GRANT SELECT ON produtos_destaque TO anon;

-- Inserir alguns dados de exemplo (apenas se existirem produtos)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM produtos LIMIT 1) THEN
    INSERT INTO produtos_destaque (produto_id, posicao, ativo)
    SELECT 
      p.id,
      ROW_NUMBER() OVER (ORDER BY p.created_at DESC),
      true
    FROM produtos p
    LIMIT 5
    ON CONFLICT DO NOTHING;
  END IF;
END $$;