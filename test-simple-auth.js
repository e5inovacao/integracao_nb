import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dntlbhmljceaefycdsbc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODEwNTgwMywiZXhwIjoyMDYzNjgxODAzfQ.bbbYcj0MrnUU-tOjcZvHCU98nW9r-d8i_hVYHyTah0I';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMDU4MDMsImV4cCI6MjA2MzY4MTgwM30.DyBPu5O9C8geyV6pliyIGkhwGegwV_9FQeKQ8prSdHY';

// Cliente com service role para operações administrativas
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// Cliente com anon key para operações de usuário
const supabaseClient = createClient(supabaseUrl, anonKey);

async function testSimpleAuth() {
  console.log('🔍 Teste simples de autenticação...');
  
  const testEmail = `simple-test-${Date.now()}@test.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Teste Simples';
  
  try {
    // Passo 1: Criar usuário diretamente no auth.users usando service role
    console.log('\n👤 Passo 1: Criando usuário no auth.users...');
    const { data: createUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        nome: testName,
        role: 'consultor'
      }
    });
    
    if (createUserError) {
      console.error('❌ Erro ao criar usuário:', createUserError);
      return;
    }
    
    console.log('✅ Usuário criado:', {
      id: createUserData.user.id,
      email: createUserData.user.email,
      confirmed: createUserData.user.email_confirmed_at,
      metadata: createUserData.user.user_metadata
    });
    
    // Passo 2: Criar consultor na tabela consultores
    console.log('\n📝 Passo 2: Criando consultor na tabela...');
    const { data: consultorData, error: consultorError } = await supabaseAdmin
      .from('consultores')
      .insert({
        nome: testName,
        email: testEmail,
        telefone: '(11) 99999-9999',
        senha: testPassword,
        ativo: true,
        auth_user_id: createUserData.user.id,
        role: 'consultor'
      })
      .select()
      .single();
    
    if (consultorError) {
      console.error('❌ Erro ao criar consultor:', consultorError);
      return;
    }
    
    console.log('✅ Consultor criado:', {
      id: consultorData.id,
      nome: consultorData.nome,
      email: consultorData.email,
      auth_user_id: consultorData.auth_user_id,
      role: consultorData.role
    });
    
    // Passo 3: Tentar fazer login
    console.log('\n🔐 Passo 3: Tentando fazer login...');
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) {
      console.error('❌ Erro no login:', loginError);
    } else {
      console.log('✅ Login realizado com sucesso!', {
        user: loginData.user?.id,
        email: loginData.user?.email,
        role: loginData.user?.user_metadata?.role,
        confirmed: loginData.user?.email_confirmed_at
      });
      
      // Passo 4: Verificar se consegue acessar dados do consultor
      console.log('\n🔍 Passo 4: Verificando acesso aos dados...');
      
      // Criar cliente autenticado
      const supabaseAuth = createClient(supabaseUrl, anonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${loginData.session?.access_token}`
          }
        }
      });
      
      const { data: consultorAuth, error: consultorAuthError } = await supabaseAuth
        .from('consultores')
        .select('*')
        .eq('auth_user_id', loginData.user.id)
        .single();
      
      if (consultorAuthError) {
        console.error('❌ Erro ao acessar dados do consultor:', consultorAuthError);
      } else {
        console.log('✅ Dados do consultor acessados:', {
          id: consultorAuth.id,
          nome: consultorAuth.nome,
          email: consultorAuth.email,
          role: consultorAuth.role
        });
      }
    }
    
    // Limpeza
    console.log('\n🧹 Limpando dados de teste...');
    
    // Remover consultor
    await supabaseAdmin
      .from('consultores')
      .delete()
      .eq('email', testEmail);
    
    // Remover usuário
    if (createUserData.user) {
      await supabaseAdmin.auth.admin.deleteUser(createUserData.user.id);
    }
    
    console.log('✅ Limpeza concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testSimpleAuth();