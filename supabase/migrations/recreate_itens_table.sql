-- Recriar a tabela itens_orcamento_sistema do zero
-- para eliminar qualquer referência residual à coluna 'subtotal'

-- 1. Fazer backup dos dados existentes
CREATE TABLE itens_orcamento_sistema_backup AS 
SELECT 
    id,
    orcamento_id,
    produto_ecologico_id,
    quantidade,
    created_at,
    updated_at
FROM itens_orcamento_sistema;

-- 2. Remover a tabela original
DROP TABLE itens_orcamento_sistema CASCADE;

-- 3. Recriar a tabela com estrutura limpa
CREATE TABLE itens_orcamento_sistema (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    orcamento_id uuid NOT NULL REFERENCES orcamentos_sistema(id) ON DELETE CASCADE,
    produto_ecologico_id integer NOT NULL REFERENCES produtos_ecologicos(id) ON DELETE CASCADE,
    quantidade integer NOT NULL DEFAULT 1,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- 4. Restaurar dados do backup
INSERT INTO itens_orcamento_sistema (
    id,
    orcamento_id,
    produto_ecologico_id,
    quantidade,
    created_at,
    updated_at
)
SELECT 
    id,
    orcamento_id,
    produto_ecologico_id,
    quantidade,
    created_at,
    updated_at
FROM itens_orcamento_sistema_backup;

-- 5. Remover backup
DROP TABLE itens_orcamento_sistema_backup;

-- 6. Criar trigger de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_updated_at_trigger
    BEFORE UPDATE ON itens_orcamento_sistema
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Habilitar RLS
ALTER TABLE itens_orcamento_sistema ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas RLS simples
CREATE POLICY "Permitir todas as operações para usuários autenticados" 
ON itens_orcamento_sistema 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Permitir leitura para usuários anônimos" 
ON itens_orcamento_sistema 
FOR SELECT 
TO anon 
USING (true);

-- 9. Garantir permissões
GRANT ALL PRIVILEGES ON itens_orcamento_sistema TO authenticated;
GRANT SELECT ON itens_orcamento_sistema TO anon;

-- 10. Verificar estrutura final
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'itens_orcamento_sistema'
ORDER BY ordinal_position;