import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://dntlbhmljceaefycdsbc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMDU4MDMsImV4cCI6MjA2MzY4MTgwM30.DyBPu5O9C8geyV6pliyIGkhwGegwV_9FQeKQ8prSdHY';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODEwNTgwMywiZXhwIjoyMDYzNjgxODAzfQ.bbbYcj0MrnUU-tOjcZvHCU98nW9r-d8i_hVYHyTah0I';

// Cliente com chave anônima (para login)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Cliente com chave de serviço (para operações admin)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testAuthentication() {
  console.log('🔍 Iniciando diagnóstico de autenticação...');
  console.log('=' .repeat(50));

  try {
    // 1. Testar login básico do admin
    console.log('\n1. Testando login do admin...');
    const { data: loginData, error: loginError } = await supabaseAnon.auth.signInWithPassword({
      email: 'admin@nbadmin.com',
      password: 'admin123'
    });

    if (loginError) {
      console.error('❌ Erro no login:', loginError.message);
      return;
    }

    console.log('✅ Login realizado com sucesso');
    console.log('User ID:', loginData.user?.id);
    console.log('Email:', loginData.user?.email);
    console.log('Metadata:', JSON.stringify(loginData.user?.user_metadata, null, 2));

    // 2. Verificar se o usuário existe na tabela consultores
    console.log('\n2. Verificando dados do consultor...');
    const { data: consultorData, error: consultorError } = await supabaseAnon
      .from('consultores')
      .select('*')
      .eq('auth_user_id', loginData.user?.id)
      .single();

    if (consultorError) {
      console.error('❌ Erro ao buscar consultor:', consultorError.message);
    } else {
      console.log('✅ Dados do consultor encontrados:');
      console.log(JSON.stringify(consultorData, null, 2));
    }

    // 3. Testar acesso à tabela consultores (RLS)
    console.log('\n3. Testando acesso RLS à tabela consultores...');
    const { data: allConsultores, error: rlsError } = await supabaseAnon
      .from('consultores')
      .select('id, nome, email, role')
      .limit(5);

    if (rlsError) {
      console.error('❌ Erro RLS:', rlsError.message);
    } else {
      console.log('✅ Acesso RLS funcionando. Consultores encontrados:', allConsultores?.length || 0);
    }

    // 4. Testar logout
    console.log('\n4. Testando logout...');
    const { error: logoutError } = await supabaseAnon.auth.signOut();
    
    if (logoutError) {
      console.error('❌ Erro no logout:', logoutError.message);
    } else {
      console.log('✅ Logout realizado com sucesso');
    }

    // 5. Verificar sessão após logout
    console.log('\n5. Verificando sessão após logout...');
    const { data: sessionData } = await supabaseAnon.auth.getSession();
    
    if (sessionData.session) {
      console.log('⚠️  Sessão ainda ativa após logout');
    } else {
      console.log('✅ Sessão limpa após logout');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Diagnóstico concluído');
}

// Executar o teste
testAuthentication().catch(console.error);