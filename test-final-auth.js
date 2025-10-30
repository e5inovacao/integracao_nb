import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://dntlbhmljceaefycdsbc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMDU4MDMsImV4cCI6MjA2MzY4MTgwM30.DyBPu5O9C8geyV6pliyIGkhwGegwV_9FQeKQ8prSdHY';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODEwNTgwMywiZXhwIjoyMDYzNjgxODAzfQ.bbbYcj0MrnUU-tOjcZvHCU98nW9r-d8i_hVYHyTah0I';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

async function testCompleteAuthFlow() {
  console.log('🧪 Teste Final: Fluxo correto de autenticação de consultor...');
  
  const testEmail = `consultor.teste@gmail.com`;
  const testPassword = 'teste123456';
  const testName = 'Consultor Correto';
  
  try {
    // Passo 1: Admin cria consultor (apenas na tabela consultores)
    console.log('\n👤 Passo 1: Admin criando consultor...');
    const { data: adminAuth } = await supabaseAdmin.auth.signInWithPassword({
      email: 'admin@nbadmin.com',
      password: 'admin123'
    });
    
    if (!adminAuth.user) {
      throw new Error('Falha no login do admin');
    }
    
    console.log('✅ Admin logado com sucesso');
    
    const { data: consultorData, error: consultorError } = await supabaseAdmin.rpc('create_consultor_with_auth_user', {
      p_nome: testName,
      p_email: testEmail,
      p_telefone: '11999999999',
      p_senha: testPassword,
      p_ativo: true
    });
    
    if (consultorError) {
      throw new Error(`Erro ao criar consultor: ${consultorError.message}`);
    }
    
    console.log('✅ Consultor criado:', consultorData);
    
    // Passo 2: Verificar se pode se registrar
    console.log('\n📝 Passo 2: Verificando se pode se registrar...');
    const { data: canRegister, error: canRegisterError } = await supabaseClient
      .rpc('can_register_as_consultor', { p_email: testEmail });
    
    if (canRegisterError) {
      throw new Error(`Erro ao verificar registro: ${canRegisterError.message}`);
    }
    
    console.log('✅ Pode se registrar:', canRegister);
    
    if (!canRegister) {
      throw new Error('Email não pode se registrar como consultor');
    }
    
    // Passo 3: Consultor faz signup (cria usuário no auth.users)
    console.log('\n🔐 Passo 3: Consultor fazendo signup...');
    const { data: signupData, error: signupError } = await supabaseClient.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          nome: testName
        }
      }
    });
    
    if (signupError) {
      throw new Error(`Erro no signup: ${signupError.message}`);
    }
    
    console.log('✅ Signup realizado:', {
      user: signupData.user?.id,
      email: signupData.user?.email,
      confirmed: signupData.user?.email_confirmed_at ? 'Yes' : 'No'
    });
    
    // Passo 4: Confirmar email via Admin API
    console.log('\n📧 Passo 4: Confirmando email via Admin API...');
    if (signupData.user && !signupData.user.email_confirmed_at) {
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
        signupData.user.id,
        { email_confirm: true }
      );
      
      if (confirmError) {
        console.error('⚠️ Erro ao confirmar email:', confirmError.message);
      } else {
        console.log('✅ Email confirmado via Admin API');
      }
    }
    
    // Passo 5: Registrar consultor (vincular auth_user_id)
    console.log('\n🔗 Passo 5: Vinculando usuário ao consultor...');
    
    // Primeiro fazer login para ter o contexto de usuário autenticado
    const { data: tempLogin, error: tempLoginError } = await supabaseClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (tempLoginError) {
      console.error('⚠️ Erro no login temporário:', tempLoginError.message);
      // Continuar mesmo assim
    } else {
      console.log('✅ Login temporário realizado');
      
      // Agora chamar register_consultor
      const { data: registerData, error: registerError } = await supabaseClient.rpc('register_consultor', {
        p_nome: testName,
        p_email: testEmail,
        p_telefone: '11999999999',
        p_senha: testPassword
      });
      
      if (registerError) {
        console.error('⚠️ Erro ao registrar consultor:', registerError.message);
      } else {
        console.log('✅ Consultor registrado:', registerData);
      }
      
      // Fazer logout
      await supabaseClient.auth.signOut();
    }
    
    // Passo 6: Teste de login final
    console.log('\n🎯 Passo 6: Teste de login final...');
    const { data: finalLogin, error: finalLoginError } = await supabaseClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (finalLoginError) {
      console.error('❌ Erro no login final:', finalLoginError);
    } else {
      console.log('✅ Login final realizado com sucesso:', {
        user: finalLogin.user.id,
        email: finalLogin.user.email,
        role: finalLogin.user.user_metadata?.role
      });
      
      // Passo 7: Verificar acesso aos dados do consultor
      console.log('\n📊 Passo 7: Verificando acesso aos dados...');
      const { data: consultorInfo, error: consultorInfoError } = await supabaseClient
        .from('consultores')
        .select('*')
        .eq('email', testEmail)
        .single();
      
      if (consultorInfoError) {
        console.error('❌ Erro ao acessar dados do consultor:', consultorInfoError);
      } else {
        console.log('✅ Dados do consultor acessados:', {
          id: consultorInfo.id,
          nome: consultorInfo.nome,
          email: consultorInfo.email,
          role: consultorInfo.role,
          ativo: consultorInfo.ativo,
          auth_user_id: consultorInfo.auth_user_id
        });
        
        console.log('\n🎉 SUCESSO! O fluxo de autenticação está funcionando corretamente!');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  } finally {
    // Limpeza
    console.log('\n🧹 Limpando dados de teste...');
    
    try {
      // Remover consultor
      await supabaseAdmin
        .from('consultores')
        .delete()
        .eq('email', testEmail);
      
      // Remover usuário auth
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const user = users.users.find(u => u.email === testEmail);
      if (user) {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
      }
      
      console.log('✅ Limpeza concluída!');
    } catch (cleanupError) {
      console.error('⚠️ Erro na limpeza:', cleanupError.message);
    }
  }
}

testCompleteAuthFlow();