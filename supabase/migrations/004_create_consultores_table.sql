-- Criação da tabela consultores
CREATE TABLE IF NOT EXISTS consultores (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    cpf VARCHAR(14) UNIQUE,
    endereco TEXT,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_consultores_email ON consultores(email);
CREATE INDEX IF NOT EXISTS idx_consultores_cpf ON consultores(cpf);
CREATE INDEX IF NOT EXISTS idx_consultores_auth_user_id ON consultores(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_consultores_ativo ON consultores(ativo);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_consultores_updated_at
    BEFORE UPDATE ON consultores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- A coluna consultor_id já existe, apenas ajustar a referência
-- Remover constraint existente se houver
ALTER TABLE solicitacao_orcamentos 
DROP CONSTRAINT IF EXISTS solicitacao_orcamentos_consultor_id_fkey;

-- Adicionar nova constraint referenciando a tabela consultores
ALTER TABLE solicitacao_orcamentos 
ADD CONSTRAINT solicitacao_orcamentos_consultor_id_fkey 
FOREIGN KEY (consultor_id) REFERENCES consultores(id);

-- Índice para a coluna (se não existir)
CREATE INDEX IF NOT EXISTS idx_solicitacao_orcamentos_consultor_id 
ON solicitacao_orcamentos(consultor_id);

-- Habilitar RLS nas tabelas
ALTER TABLE consultores ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacao_orcamentos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tabela consultores
-- Admins podem ver todos os consultores
CREATE POLICY "Admins can view all consultores" ON consultores
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Consultores podem ver apenas seus próprios dados
CREATE POLICY "Consultores can view own data" ON consultores
    FOR SELECT USING (auth_user_id = auth.uid());

-- Apenas admins podem inserir novos consultores
CREATE POLICY "Only admins can insert consultores" ON consultores
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Apenas admins podem atualizar consultores
CREATE POLICY "Only admins can update consultores" ON consultores
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Apenas admins podem deletar consultores
CREATE POLICY "Only admins can delete consultores" ON consultores
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Políticas RLS para tabela solicitacao_orcamentos
-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Enable read access for all users" ON solicitacao_orcamentos;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON solicitacao_orcamentos;
DROP POLICY IF EXISTS "Enable update for users based on email" ON solicitacao_orcamentos;

-- Admins podem ver todos os orçamentos
CREATE POLICY "Admins can view all orcamentos" ON solicitacao_orcamentos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Consultores podem ver apenas orçamentos vinculados a eles
CREATE POLICY "Consultores can view assigned orcamentos" ON solicitacao_orcamentos
    FOR SELECT USING (
        consultor_id IN (
            SELECT id FROM consultores 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Apenas admins podem inserir orçamentos
CREATE POLICY "Only admins can insert orcamentos" ON solicitacao_orcamentos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Admins podem atualizar todos os orçamentos
CREATE POLICY "Admins can update all orcamentos" ON solicitacao_orcamentos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Consultores podem atualizar apenas orçamentos vinculados (com restrições)
CREATE POLICY "Consultores can update assigned orcamentos" ON solicitacao_orcamentos
    FOR UPDATE USING (
        consultor_id IN (
            SELECT id FROM consultores 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Apenas admins podem deletar orçamentos
CREATE POLICY "Only admins can delete orcamentos" ON solicitacao_orcamentos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Conceder permissões básicas
GRANT SELECT, INSERT, UPDATE, DELETE ON consultores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON solicitacao_orcamentos TO authenticated;
GRANT SELECT ON consultores TO anon;
GRANT SELECT ON solicitacao_orcamentos TO anon;