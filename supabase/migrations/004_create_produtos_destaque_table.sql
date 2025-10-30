-- Criar tabela de produtos em destaque
CREATE TABLE IF NOT EXISTS produtos_destaque (
  id BIGSERIAL PRIMARY KEY,
  produto_id BIGINT NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  posicao INTEGER NOT NULL DEFAULT 1,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_produtos_destaque_produto_id ON produtos_destaque(produto_id);
CREATE INDEX IF NOT EXISTS idx_produtos_destaque_posicao ON produtos_destaque(posicao);
CREATE INDEX IF NOT EXISTS idx_produtos_destaque_ativo ON produtos_destaque(ativo);

-- Garantir que não há produtos duplicados em destaque
CREATE UNIQUE INDEX IF NOT EXISTS idx_produtos_destaque_unique_produto ON produtos_destaque(produto_id);

-- Garantir que não há posições duplicadas para produtos ativos
CREATE UNIQUE INDEX IF NOT EXISTS idx_produtos_destaque_unique_posicao_ativo 
ON produtos_destaque(posicao) WHERE ativo = true;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_produtos_destaque_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_produtos_destaque_updated_at 
    BEFORE UPDATE ON produtos_destaque
    FOR EACH ROW EXECUTE FUNCTION update_produtos_destaque_updated_at();

-- Habilitar RLS
ALTER TABLE produtos_destaque ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para produtos_destaque
-- Admin pode fazer tudo
CREATE POLICY "Admin can manage produtos_destaque" ON produtos_destaque
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM consultores 
            WHERE auth_user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Usuários autenticados podem visualizar produtos ativos
CREATE POLICY "Users can view active produtos_destaque" ON produtos_destaque
    FOR SELECT USING (ativo = true);

-- Usuários anônimos podem visualizar produtos ativos
CREATE POLICY "Anonymous can view active produtos_destaque" ON produtos_destaque
    FOR SELECT USING (ativo = true);

-- Conceder permissões
GRANT SELECT ON produtos_destaque TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON produtos_destaque TO authenticated;

-- Comentários
COMMENT ON TABLE produtos_destaque IS 'Tabela para gerenciar produtos em destaque no sistema';
COMMENT ON COLUMN produtos_destaque.produto_id IS 'Referência ao produto que está em destaque';
COMMENT ON COLUMN produtos_destaque.posicao IS 'Posição do produto na lista de destaques (1 = primeiro)';
COMMENT ON COLUMN produtos_destaque.ativo IS 'Se o produto está ativo nos destaques';