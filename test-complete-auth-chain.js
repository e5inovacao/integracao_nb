import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dntlbhmljceaefycdsbc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODEwNTgwMywiZXhwIjoyMDYzNjgxODAzfQ.bbbYcj0MrnUU-tOjcZvHCU98nW9r-d8i_hVYHyTah0I';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMDU4MDMsImV4cCI6MjA2MzY4MTgwM30.DyBPu5O9C8geyV6pliyIGkhwGegwV_9FQeKQ8prSdHY';

// Cliente com service role para operações administrativas
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// Cliente com anon key para operações de usuário
const supabaseClient = createClient(supabaseUrl, anonKey);

async function testCompleteAuthChain() {
  console.log('🔍 Testando cadeia completa de autenticação...');
  
  const testEmail = `test-consultor-${Date.now()}@test.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Consultor Teste';
  const testPhone = '(11) 99999-9999';
  
  try {
    // Passo 0: Fazer login como admin primeiro
    console.log('\n🔐 Passo 0: Fazendo login como admin...');
    const { data: adminLogin, error: adminLoginError } = await supabaseClient.auth.signInWithPassword({
      email: 'admin@nbadmin.com',
      password: 'admin123'
    });
    
    if (adminLoginError) {
      console.error('❌ Erro no login admin:', adminLoginError);
      return;
    }
    
    console.log('✅ Login admin realizado:', adminLogin.user?.email);
    
    // Criar cliente autenticado como admin
    const supabaseAsAdmin = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${adminLogin.session?.access_token}`
        }
      }
    });
    
    // Passo 1: Criar consultor usando create_consultor_with_auth_user
    console.log('\n📝 Passo 1: Criando consultor...');
    const { data: createResult, error: createError } = await supabaseAsAdmin.rpc('create_consultor_with_auth_user', {
      p_nome: testName,
      p_email: testEmail,
      p_telefone: testPhone,
      p_senha: testPassword,
      p_ativo: true,
      p_role: 'consultor'
    });
    
    if (createError) {
      console.error('❌ Erro ao criar consultor:', createError);
      return;
    }
    
    console.log('✅ Consultor criado:', createResult);
    
    // Passo 2: Verificar se o consultor foi criado na tabela consultores
    console.log('\n🔍 Passo 2: Verificando consultor na tabela...');
    const { data: consultorData, error: consultorError } = await supabaseAdmin
      .from('consultores')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    if (consultorError) {
      console.error('❌ Erro ao buscar consultor:', consultorError);
      return;
    }
    
    console.log('✅ Consultor encontrado na tabela:', consultorData);
    
    // Passo 3: Simular registro do usuário (signup)
    console.log('\n👤 Passo 3: Simulando registro do usuário...');
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
      confirmed: signupData.user?.email_confirmed_at
    });
    
    // Passo 4: Verificar se o usuário foi criado em auth.users
    console.log('\n🔍 Passo 4: Verificando usuário em auth.users...');
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao listar usuários:', authError);
      return;
    }
    
    const createdUser = authUsers.users.find(user => user.email === testEmail);
    if (createdUser) {
      console.log('✅ Usuário encontrado em auth.users:', {
        id: createdUser.id,
        email: createdUser.email,
        confirmed: createdUser.email_confirmed_at,
        metadata: createdUser.user_metadata
      });
    } else {
      console.log('❌ Usuário não encontrado em auth.users');
      return;
    }
    
    // Passo 5: Chamar register_consultor para vincular
    console.log('\n🔗 Passo 5: Vinculando usuário ao consultor...');
    const { data: linkResult, error: linkError } = await supabaseClient.rpc('register_consultor', {
      user_id: createdUser.id
    });
    
    if (linkError) {
      console.error('❌ Erro ao vincular consultor:', linkError);
    } else {
      console.log('✅ Consultor vinculado:', linkResult);
    }
    
    // Passo 6: Verificar se o auth_user_id foi atualizado
    console.log('\n🔍 Passo 6: Verificando vinculação...');
    const { data: updatedConsultor, error: updateError } = await supabaseAdmin
      .from('consultores')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    if (updateError) {
      console.error('❌ Erro ao verificar consultor atualizado:', updateError);
    } else {
      console.log('✅ Consultor atualizado:', {
        id: updatedConsultor.id,
        email: updatedConsultor.email,
        auth_user_id: updatedConsultor.auth_user_id,
        ativo: updatedConsultor.ativo
      });
    }
    
    // Passo 7: Tentar fazer login
    console.log('\n🔐 Passo 7: Tentando fazer login...');
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) {
      console.error('❌ Erro no login:', loginError);
      
      // Se o erro for de confirmação de email, vamos confirmar manualmente
      if (loginError.message.includes('Email not confirmed')) {
        console.log('\n📧 Confirmando email manualmente...');
        const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
          createdUser.id,
          { email_confirm: true }
        );
        
        if (confirmError) {
          console.error('❌ Erro ao confirmar email:', confirmError);
        } else {
          console.log('✅ Email confirmado, tentando login novamente...');
          
          const { data: retryLogin, error: retryError } = await supabaseClient.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
          });
          
          if (retryError) {
            console.error('❌ Erro no segundo login:', retryError);
          } else {
            console.log('✅ Login realizado com sucesso!', {
              user: retryLogin.user?.id,
              email: retryLogin.user?.email,
              role: retryLogin.user?.user_metadata?.role
            });
          }
        }
      }
    } else {
      console.log('✅ Login realizado com sucesso!', {
        user: loginData.user?.id,
        email: loginData.user?.email,
        role: loginData.user?.user_metadata?.role
      });
    }
    
    // Limpeza: Remover dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    
    // Remover usuário do auth
    if (createdUser) {
      await supabaseAdmin.auth.admin.deleteUser(createdUser.id);
    }
    
    // Remover consultor da tabela
    await supabaseAdmin
      .from('consultores')
      .delete()
      .eq('email', testEmail);
    
    console.log('✅ Limpeza concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testCompleteAuthChain();