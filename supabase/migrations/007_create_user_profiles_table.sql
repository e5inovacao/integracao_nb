-- Migração: Sistema de Gestão de Colaboradores
-- Criar tabela user_profiles e configurar RLS policies

-- Criar tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'consultor' CHECK (role IN ('super_admin', 'admin', 'consultor')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_lookup ON public.user_profiles(user_id, is_active);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Remover policies existentes se houver
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view consultores" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;

-- Policy para SELECT: Super admins podem ver todos os perfis
CREATE POLICY "Super admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'super_admin' 
            AND up.is_active = true
        )
    );

-- Policy para SELECT: Admins podem ver consultores e próprio perfil
CREATE POLICY "Admins can view consultores" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role IN ('super_admin', 'admin') 
            AND up.is_active = true
        )
        AND (role = 'consultor' OR user_id = auth.uid())
    );

-- Policy para SELECT: Usuários podem ver próprio perfil
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (user_id = auth.uid());

-- Policy para INSERT: Apenas super_admin e admin podem criar perfis
CREATE POLICY "Admins can insert profiles" ON public.user_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role IN ('super_admin', 'admin') 
            AND up.is_active = true
        )
    );

-- Policy para UPDATE: Apenas super_admin e admin podem atualizar perfis
CREATE POLICY "Admins can update profiles" ON public.user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role IN ('super_admin', 'admin') 
            AND up.is_active = true
        )
    );

-- Policy para DELETE: Apenas super_admin pode deletar perfis
CREATE POLICY "Admins can delete profiles" ON public.user_profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'super_admin' 
            AND up.is_active = true
        )
    );

-- Conceder permissões básicas para roles anon e authenticated
GRANT SELECT ON public.user_profiles TO anon;
GRANT ALL PRIVILEGES ON public.user_profiles TO authenticated;

-- Função para criar perfil automaticamente quando um usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'consultor'),
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Inserir perfil para usuários existentes que não têm perfil
INSERT INTO public.user_profiles (user_id, full_name, role, is_active)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'Usuário'),
    CASE 
        WHEN au.email = 'admin@naturezabrindes.com.br' THEN 'super_admin'
        WHEN au.raw_user_meta_data->>'role' IS NOT NULL THEN au.raw_user_meta_data->>'role'
        ELSE 'consultor'
    END,
    true
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
WHERE up.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Tabela opcional para tracking de sessões (para funcionalidade de último acesso)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Índices para user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON public.user_sessions(created_at DESC);

-- RLS para user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy para user_sessions: usuários podem ver apenas suas próprias sessões
CREATE POLICY "Users can view own sessions" ON public.user_sessions
    FOR SELECT USING (user_id = auth.uid());

-- Policy para user_sessions: sistema pode inserir sessões
CREATE POLICY "System can insert sessions" ON public.user_sessions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Conceder permissões para user_sessions
GRANT SELECT, INSERT ON public.user_sessions TO authenticated;