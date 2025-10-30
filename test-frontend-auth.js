import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://dntlbhmljceaefycdsbc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMDU4MDMsImV4cCI6MjA2MzY4MTgwM30.DyBPu5O9C8geyV6pliyIGkhwGegwV_9FQeKQ8prSdHY';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODEwNTgwMywiZXhwIjoyMDYzNjgxODAzfQ.bbbYcj0MrnUU-tOjcZvHCU98nW9r-d8i_hVYHyTah0I';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

async function testFrontendAuthFlow() {
  console.log('🧪 Testando fluxo de autenticação do frontend...');
  
  const testEmail = `consultor.teste@gmail.com`;
  const testPassword = 'teste123456';
  const testName = 'Teste Frontend';
  
  try {
    // 1. Simular criação de consultor pelo admin (backend)
    console.log('\n👤 Passo 1: Admin criando consultor...');
    
    // Login como admin primeiro
    const { data: adminAuth, error: adminError } = await supabaseClient.auth.signInWithPassword({
      email: 'admin@nbadmin.com',
      password: 'admin123'
    });
    
    if (adminError) {
      console.error('❌ Erro no login admin:', adminError);
      return;
    }
    
    console.log('✅ Admin logado com sucesso');
    
    // Criar consultor usando a função
    const { data: consultorResult, error: consultorError } = await supabaseClient
      .rpc('create_consultor_with_auth_user', {
        p_nome: testName,
        p_email: testEmail,
        p_telefone: '11999999999',
        p_senha: testPassword,
        p_ativo: true,
        p_role: 'consultor'
      });
    
    if (consultorError) {
      console.error('❌ Erro ao criar consultor:', consultorError);
      return;
    }
    
    console.log('✅ Consultor criado:', consultorResult);
    
    // Logout do admin
    await supabaseClient.auth.signOut();
    
    // 2. Simular registro do consultor no frontend
    console.log('\n📝 Passo 2: Consultor se registrando...');
    
    // Verificar se pode se registrar
    const { data: canRegister, error: canRegisterError } = await supabaseClient
      .rpc('can_register_as_consultor', { p_email: testEmail });
    
    if (canRegisterError) {
      console.error('❌ Erro ao verificar registro:', canRegisterError);
      return;
    }
    
    console.log('✅ Pode se registrar:', canRegister);
    
    if (!canRegister) {
      console.error('❌ Email não pode se registrar como consultor');
      return;
    }
    
    // Fazer signup
    const { data: signupData, error: signupError } = await supabaseClient.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          nome: testName,
          role: 'consultor'
        }
      }
    });
    
    if (signupError) {
      console.error('❌ Erro no signup:', signupError);
      return;
    }
    
    console.log('✅ Signup realizado:', {
      user: signupData.user?.id,
      email: signupData.user?.email,
      confirmed: signupData.user?.email_confirmed_at ? 'Yes' : 'No'
    });
    
    // Registrar como consultor
    const { data: registerResult, error: registerError } = await supabaseClient
      .rpc('register_consultor', {
        p_nome: testName,
        p_email: testEmail,
        p_telefone: '11999999999',
        p_senha: testPassword
      });
    
    if (registerError) {
      console.error('❌ Erro ao registrar consultor:', registerError);
      return;
    }
    
    console.log('✅ Consultor registrado:', registerResult);
    
    // 3. Testar login
    console.log('\n🔐 Passo 3: Testando login...');
    
    // Logout primeiro
    await supabaseClient.auth.signOut();
    
    // Fazer login
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) {
      console.error('❌ Erro no login:', loginError);
      return;
    }
    
    console.log('✅ Login realizado:', {
      user: loginData.user?.id,
      email: loginData.user?.email,
      role: loginData.user?.user_metadata?.role,
      confirmed: loginData.user?.email_confirmed_at ? 'Yes' : 'No'
    });
    
    // 4. Testar acesso aos dados do consultor
    console.log('\n🔍 Passo 4: Testando acesso aos dados...');
    
    const { data: consultorData, error: consultorDataError } = await supabaseClient
      .from('consultores')
      .select('*')
      .eq('auth_user_id', loginData.user?.id)
      .single();
    
    if (consultorDataError) {
      console.error('❌ Erro ao acessar dados do consultor:', consultorDataError);
      return;
    }
    
    console.log('✅ Dados do consultor acessados:', {
      id: consultorData.id,
      nome: consultorData.nome,
      email: consultorData.email,
      role: consultorData.role,
      ativo: consultorData.ativo
    });
    
    console.log('\n🎉 Teste completo realizado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    // Limpeza
    console.log('\n🧹 Limpando dados de teste...');
    
    try {
      // Deletar consultor
      await supabaseAdmin
        .from('consultores')
        .delete()
        .eq('email', testEmail);
      
      // Deletar usuário auth
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const testUser = users.users.find(u => u.email === testEmail);
      if (testUser) {
        await supabaseAdmin.auth.admin.deleteUser(testUser.id);
      }
      
      console.log('✅ Limpeza concluída!');
    } catch (cleanupError) {
      console.error('⚠️ Erro na limpeza:', cleanupError);
    }
  }
}

testFrontendAuthFlow();