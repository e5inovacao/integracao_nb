-- Criar usuário administrador inicial
-- Esta migração cria o primeiro usuário administrador diretamente no banco

-- Primeiro, vamos inserir o usuário na tabela auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@nbadmin.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Agora vamos inserir o registro correspondente na tabela consultores
INSERT INTO public.consultores (
  nome,
  email,
  telefone,
  cpf,
  endereco,
  observacoes,
  ativo,
  auth_user_id,
  role,
  senha,
  created_at,
  updated_at
) 
SELECT 
  'Administrador',
  'admin@nbadmin.com',
  '(11) 99999-9999',
  '000.000.000-00',
  'Endereço do Administrador',
  'Usuário administrador inicial do sistema',
  true,
  u.id,
  'admin',
  'admin123',
  NOW(),
  NOW()
FROM auth.users u 
WHERE u.email = 'admin@nbadmin.com'
AND NOT EXISTS (
  SELECT 1 FROM public.consultores c 
  WHERE c.email = 'admin@nbadmin.com'
);

-- Comentário informativo
COMMENT ON TABLE public.consultores IS 'Tabela de consultores e administradores. Usuário inicial: admin@nbadmin.com / admin123';