-- Migration: Allow NULL user_id for anonymous users
-- Description: Fix constraint to allow anonymous users in usuarios_sistema table
-- Date: 2024

-- Remove the NOT NULL constraint from user_id column
ALTER TABLE usuarios_sistema ALTER COLUMN user_id DROP NOT NULL;

-- Drop the unique constraint on user_id since we'll have multiple NULL values
ALTER TABLE usuarios_sistema DROP CONSTRAINT IF EXISTS usuarios_sistema_user_id_key;

-- Create a partial unique index that only applies to non-NULL user_id values
-- This ensures authenticated users still have unique user_id, but allows multiple NULL values
CREATE UNIQUE INDEX usuarios_sistema_user_id_unique_idx 
ON usuarios_sistema (user_id) 
WHERE user_id IS NOT NULL;

-- Update RLS policies to handle NULL user_id properly
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON usuarios_sistema;
DROP POLICY IF EXISTS "Users can update their own profile" ON usuarios_sistema;
DROP POLICY IF EXISTS "Users can insert their own profile" ON usuarios_sistema;
DROP POLICY IF EXISTS "Allow anonymous user creation" ON usuarios_sistema;
DROP POLICY IF EXISTS "Authenticated users can insert their own profile" ON usuarios_sistema;
DROP POLICY IF EXISTS "Allow anonymous read by phone" ON usuarios_sistema;

-- Create new comprehensive policies
-- Allow authenticated users to manage their own profiles
CREATE POLICY "Authenticated users can manage their own profile" ON usuarios_sistema
    FOR ALL USING (auth.uid() = user_id);

-- Allow anonymous users to create profiles (user_id will be NULL)
CREATE POLICY "Allow anonymous user creation" ON usuarios_sistema
    FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Allow reading profiles for quote management (needed for phone-based lookups)
CREATE POLICY "Allow profile read for quotes" ON usuarios_sistema
    FOR SELECT USING (
        auth.uid() = user_id OR  -- Own profile for authenticated users
        user_id IS NULL OR      -- Anonymous profiles
        auth.role() = 'anon'    -- Allow anon role to read for quote creation
    );

-- Update orcamentos_sistema policies to handle anonymous users
DROP POLICY IF EXISTS "Users can view their own quotes" ON orcamentos_sistema;
DROP POLICY IF EXISTS "Users can create their own quotes" ON orcamentos_sistema;
DROP POLICY IF EXISTS "Users can update their own quotes" ON orcamentos_sistema;
DROP POLICY IF EXISTS "Allow anonymous quote creation" ON orcamentos_sistema;
DROP POLICY IF EXISTS "Authenticated users can create their own quotes" ON orcamentos_sistema;

-- Create comprehensive quote policies
CREATE POLICY "Users can manage their own quotes" ON orcamentos_sistema
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios_sistema u 
            WHERE u.id = orcamentos_sistema.usuario_id 
            AND (u.user_id = auth.uid() OR u.user_id IS NULL)
        )
    );

CREATE POLICY "Allow quote creation" ON orcamentos_sistema
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios_sistema u 
            WHERE u.id = orcamentos_sistema.usuario_id
        )
    );

-- Update itens_orcamento_sistema policies
DROP POLICY IF EXISTS "Users can manage their own quote items" ON itens_orcamento_sistema;
DROP POLICY IF EXISTS "Allow anonymous quote items creation" ON itens_orcamento_sistema;
DROP POLICY IF EXISTS "Authenticated users can manage their own quote items" ON itens_orcamento_sistema;

CREATE POLICY "Allow quote items management" ON itens_orcamento_sistema
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM orcamentos_sistema o
            JOIN usuarios_sistema u ON u.id = o.usuario_id
            WHERE o.id = itens_orcamento_sistema.orcamento_id
            AND (u.user_id = auth.uid() OR u.user_id IS NULL)
        )
    );

CREATE POLICY "Allow quote items creation" ON itens_orcamento_sistema
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orcamentos_sistema o
            JOIN usuarios_sistema u ON u.id = o.usuario_id
            WHERE o.id = itens_orcamento_sistema.orcamento_id
        )
    );

-- Ensure proper permissions for anon role
GRANT SELECT, INSERT ON usuarios_sistema TO anon;
GRANT SELECT, INSERT ON orcamentos_sistema TO anon;
GRANT SELECT, INSERT ON itens_orcamento_sistema TO anon;

-- Grant permissions to authenticated role as well
GRANT ALL PRIVILEGES ON usuarios_sistema TO authenticated;
GRANT ALL PRIVILEGES ON orcamentos_sistema TO authenticated;
GRANT ALL PRIVILEGES ON itens_orcamento_sistema TO authenticated;