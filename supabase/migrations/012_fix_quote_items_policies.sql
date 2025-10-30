-- Migration: Fix Quote Items Policies
-- Corrige as políticas RLS para permitir inserção de itens de orçamento

-- Remove políticas existentes para itens_orcamento_sistema
DROP POLICY IF EXISTS "Usuários podem gerenciar itens de seus orçamentos" ON itens_orcamento_sistema;
DROP POLICY IF EXISTS "Usuários anônimos podem criar itens de orçamento" ON itens_orcamento_sistema;

-- Cria política simplificada para SELECT
CREATE POLICY "Permitir visualização de itens de orçamento"
ON itens_orcamento_sistema
FOR SELECT
USING (true);

-- Cria política simplificada para INSERT
CREATE POLICY "Permitir inserção de itens de orçamento"
ON itens_orcamento_sistema
FOR INSERT
WITH CHECK (true);

-- Cria política para UPDATE
CREATE POLICY "Permitir atualização de itens de orçamento"
ON itens_orcamento_sistema
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Garante que as permissões estão corretas
GRANT SELECT, INSERT, UPDATE ON itens_orcamento_sistema TO anon;
GRANT SELECT, INSERT, UPDATE ON itens_orcamento_sistema TO authenticated;