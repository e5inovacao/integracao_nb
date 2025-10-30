import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dntlbhmljceaefycdsbc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODEwNTgwMywiZXhwIjoyMDYzNjgxODAzfQ.bbbYcj0MrnUU-tOjcZvHCU98nW9r-d8i_hVYHyTah0I';

// Cliente com service role para operações administrativas
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Cliente normal para testes de autenticação
const supabaseClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMDU4MDMsImV4cCI6MjA2MzY4MTgwM30.DyBPu5O9C8geyV6pliyIGkhwGegwV_9FQeKQ8prSdHY');

async function debugAuthentication() {
  console.log('🔍 Iniciando debug de autenticação...');
  console.log('=' .repeat(50));

  try {
    // 1. Verificar se o usuário admin existe
    console.log('\n1. Verificando se usuário admin existe...');
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError);
      return;
    }

    const adminUser = users.users.find(user => user.email === 'admin@nbadmin.com');
    
    if (adminUser) {
      console.log('✅ Usuário admin encontrado:');
      console.log('   - ID:', adminUser.id);
      console.log('   - Email:', adminUser.email);
      console.log('   - Email confirmado:', adminUser.email_confirmed_at ? 'Sim' : 'Não');
      console.log('   - Criado em:', adminUser.created_at);
      console.log('   - Metadata:', JSON.stringify(adminUser.user_metadata, null, 2));
      console.log('   - App metadata:', JSON.stringify(adminUser.app_metadata, null, 2));
    } else {
      console.log('❌ Usuário admin não encontrado!');
      console.log('\n🔧 Criando usuário admin...');
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: 'admin@nbadmin.com',
        password: 'admin123',
        email_confirm: true,
        user_metadata: {
          role: 'admin',
          name: 'Administrador'
        }
      });

      if (createError) {
        console.error('❌ Erro ao criar usuário admin:', createError);
        return;
      }

      console.log('✅ Usuário admin criado com sucesso!');
      console.log('   - ID:', newUser.user.id);
      console.log('   - Email:', newUser.user.email);
    }

    // 2. Testar login com credenciais
    console.log('\n2. Testando login com credenciais...');
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: 'admin@nbadmin.com',
      password: 'admin123'
    });

    if (loginError) {
      console.error('❌ Erro no login:', loginError);
      console.error('   - Código:', loginError.status);
      console.error('   - Mensagem:', loginError.message);
    } else {
      console.log('✅ Login realizado com sucesso!');
      console.log('   - User ID:', loginData.user.id);
      console.log('   - Email:', loginData.user.email);
      console.log('   - Role:', loginData.user.user_metadata?.role);
    }

    // 3. Verificar se existe registro na tabela consultores
    console.log('\n3. Verificando registro na tabela consultores...');
    const { data: consultores, error: consultorError } = await supabaseClient
      .from('consultores')
      .select('*')
      .eq('email', 'admin@nbadmin.com');

    if (consultorError) {
      console.error('❌ Erro ao consultar tabela consultores:', consultorError);
    } else if (consultores && consultores.length > 0) {
      console.log('✅ Registro encontrado na tabela consultores:');
      console.log('   - ID:', consultores[0].id);
      console.log('   - Nome:', consultores[0].nome);
      console.log('   - Email:', consultores[0].email);
      console.log('   - Tipo:', consultores[0].tipo);
      console.log('   - Ativo:', consultores[0].ativo);
    } else {
      console.log('❌ Nenhum registro encontrado na tabela consultores');
      console.log('\n🔧 Criando registro na tabela consultores...');
      
      const { data: newConsultor, error: insertError } = await supabaseClient
        .from('consultores')
        .insert({
          nome: 'Administrador',
          email: 'admin@nbadmin.com',
          tipo: 'admin',
          ativo: true
        })
        .select();

      if (insertError) {
        console.error('❌ Erro ao criar registro na tabela consultores:', insertError);
      } else {
        console.log('✅ Registro criado na tabela consultores!');
      }
    }

    // 4. Testar logout
    console.log('\n4. Testando logout...');
    const { error: logoutError } = await supabaseClient.auth.signOut();

    if (logoutError) {
      console.error('❌ Erro no logout:', logoutError);
    } else {
      console.log('✅ Logout realizado com sucesso!');
    }

    // 5. Verificar políticas RLS
    console.log('\n5. Verificando políticas RLS...');
    const { data: policies, error: policyError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('schemaname', 'public')
      .eq('tablename', 'consultores');

    if (policyError) {
      console.error('❌ Erro ao consultar políticas RLS:', policyError);
    } else {
      console.log('✅ Políticas RLS encontradas:');
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd} - ${policy.qual}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Debug de autenticação finalizado!');
}

// Executar o debug
debugAuthentication();