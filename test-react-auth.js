import { createClient } from '@supabase/supabase-js';

// Configuração exata da aplicação React
const supabaseUrl = 'https://dntlbhmljceaefycdsbc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMDU4MDMsImV4cCI6MjA2MzY4MTgwM30.DyBPu5O9C8geyV6pliyIGkhwGegwV_9FQeKQ8prSdHY';

// Cliente com as mesmas configurações da aplicação
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    retryAttempts: 3,
    storage: {
      getItem: (key) => {
        try {
          return global.mockStorage?.[key] || null;
        } catch (error) {
          console.warn('Erro ao acessar localStorage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          if (!global.mockStorage) global.mockStorage = {};
          global.mockStorage[key] = value;
        } catch (error) {
          console.warn('Erro ao salvar no localStorage:', error);
        }
      },
      removeItem: (key) => {
        try {
          if (global.mockStorage) {
            delete global.mockStorage[key];
          }
        } catch (error) {
          console.warn('Erro ao remover do localStorage:', error);
        }
      }
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'nb-admin-v2'
    }
  }
});

// Simular o fluxo exato do AuthContext
async function testReactAuthFlow() {
  console.log('🔍 Testando fluxo de autenticação React...');
  console.log('=' .repeat(50));

  try {
    // 1. Simular signIn do AuthContext
    console.log('\n1. Testando signIn (como no AuthContext)...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@nbadmin.com',
      password: 'admin123'
    });

    if (authError) {
      console.error('❌ Erro no signIn:', authError.message);
      return;
    }

    console.log('✅ SignIn realizado com sucesso');
    console.log('User ID:', authData.user?.id);
    console.log('Email:', authData.user?.email);

    // 2. Buscar dados do consultor (linha 58 do AuthContext)
    console.log('\n2. Buscando dados do consultor (auth_user_id)...');
    const { data: consultorData, error: consultorError } = await supabase
      .from('consultores')
      .select('*')
      .eq('auth_user_id', authData.user?.id)
      .single();

    if (consultorError) {
      console.error('❌ Erro ao buscar consultor:', consultorError.message);
      console.error('Detalhes do erro:', consultorError);
    } else {
      console.log('✅ Dados do consultor encontrados:');
      console.log('ID:', consultorData.id);
      console.log('Nome:', consultorData.nome);
      console.log('Role:', consultorData.role);
      console.log('Auth User ID:', consultorData.auth_user_id);
    }

    // 3. Testar getSession (usado no useEffect do AuthContext)
    console.log('\n3. Testando getSession...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao obter sessão:', sessionError.message);
    } else {
      console.log('✅ Sessão obtida com sucesso');
      console.log('Session User ID:', sessionData.session?.user?.id);
      console.log('Session válida:', !!sessionData.session);
    }

    // 4. Testar onAuthStateChange (usado no useEffect)
    console.log('\n4. Testando onAuthStateChange...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('📡 Auth state change:', event);
        console.log('📡 Session:', !!session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('📡 Usuário logado via onAuthStateChange');
          
          // Buscar dados do consultor novamente
          const { data: consultorData2, error: consultorError2 } = await supabase
            .from('consultores')
            .select('*')
            .eq('auth_user_id', session.user.id)
            .single();
            
          if (consultorError2) {
            console.error('📡 ❌ Erro ao buscar consultor via onAuthStateChange:', consultorError2.message);
          } else {
            console.log('📡 ✅ Consultor encontrado via onAuthStateChange:', consultorData2.nome);
          }
        }
      }
    );

    // Aguardar um pouco para o onAuthStateChange processar
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Limpar subscription
    subscription.unsubscribe();

    // 5. Testar signOut
    console.log('\n5. Testando signOut...');
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.error('❌ Erro no signOut:', signOutError.message);
    } else {
      console.log('✅ SignOut realizado com sucesso');
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Teste do fluxo React concluído');
}

// Executar o teste
testReactAuthFlow().catch(console.error);