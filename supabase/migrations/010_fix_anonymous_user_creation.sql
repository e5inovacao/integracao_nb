-- Fix RLS policies to allow anonymous user creation
-- This migration adds policies to allow anonymous users to create records in usuarios_sistema

-- Drop existing restrictive policies for usuarios_sistema
DROP POLICY IF EXISTS "Users can insert their own profile" ON usuarios_sistema;

-- Create new policy that allows anonymous users to insert records
-- This is needed for quote requests from non-authenticated users
CREATE POLICY "Allow anonymous user creation" ON usuarios_sistema
    FOR INSERT WITH CHECK (true);

-- Keep the existing policies for authenticated users
CREATE POLICY "Authenticated users can insert their own profile" ON usuarios_sistema
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add policy to allow anonymous users to read their own records by phone
-- This helps with duplicate prevention
CREATE POLICY "Allow anonymous read by phone" ON usuarios_sistema
    FOR SELECT USING (telefone IS NOT NULL);

-- Update orcamentos_sistema policies to allow anonymous quote creation
DROP POLICY IF EXISTS "Users can create their own quotes" ON orcamentos_sistema;

CREATE POLICY "Allow anonymous quote creation" ON orcamentos_sistema
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can create their own quotes" ON orcamentos_sistema
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios_sistema u 
            WHERE u.id = orcamentos_sistema.usuario_id 
            AND u.user_id = auth.uid()
        )
    );

-- Update itens_orcamento_sistema policies to allow anonymous item creation
DROP POLICY IF EXISTS "Users can manage their own quote items" ON itens_orcamento_sistema;

CREATE POLICY "Allow anonymous quote items creation" ON itens_orcamento_sistema
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can manage their own quote items" ON itens_orcamento_sistema
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM orcamentos_sistema o
            JOIN usuarios_sistema u ON u.id = o.usuario_id
            WHERE o.id = itens_orcamento_sistema.orcamento_id
            AND u.user_id = auth.uid()
        )
    );

-- Grant additional permissions to anon role for INSERT operations
GRANT INSERT ON usuarios_sistema TO anon;
GRANT INSERT ON orcamentos_sistema TO anon;
GRANT INSERT ON itens_orcamento_sistema TO anon;