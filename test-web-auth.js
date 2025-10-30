import { createClient } from '@supabase/supabase-js';

// Usar exatamente a mesma configuração da aplicação
const supabaseUrl = 'https://dntlbhmljceaefycdsbc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMDU4MDMsImV4cCI6MjA2MzY4MTgwM30.DyBPu5O9C8geyV6pliyIGkhwGegwV_9FQeKQ8prSdHY';

// Configurar cliente exatamente como na aplicação
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    retryAttempts: 3,
    storage: {
      getItem: (key) => {
        try {
          return global.localStorage?.getItem(key) || null;
        } catch (error) {
          console.warn('Erro ao acessar localStorage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          global.localStorage?.setItem(key, value);
        } catch (error) {
          console.warn('Erro ao salvar no localStorage:', error);
        }
      },
      removeItem: (key) => {
        try {
          global.localStorage?.removeItem(key);
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

// Simular localStorage para Node.js
if (typeof global !== 'undefined' && !global.localStorage) {
  global.localStorage = {
    data: {},
    getItem(key) {
      return this.data[key] || null;
    },
    setItem(key, value) {
      this.data[key] = value;
    },
    removeItem(key) {
      delete this.data[key];
    },
    clear() {
      this.data = {};
    }
  };
}

async function testWebAuthentication() {
  console.log('🌐 Testando autenticação web...');
  console.log('=' .repeat(50));

  try {
    // 1. Verificar sessão atual
    console.log('\n1. Verificando sessão atual...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao obter sessão:', sessionError);
    } else {
      console.log('✅ Sessão atual:', sessionData.session ? 'Ativa' : 'Inativa');
      if (sessionData.session) {
        console.log('   - User ID:', sessionData.session.user.id);
        console.log('   - Email:', sessionData.session.user.email);
      }
    }

    // 2. Fazer logout se houver sessão ativa
    if (sessionData.session) {
      console.log('\n2. Fazendo logout da sessão ativa...');
      const { error: logoutError } = await supabase.auth.signOut();
      if (logoutError) {
        console.error('❌ Erro no logout:', logoutError);
      } else {
        console.log('✅ Logout realizado com sucesso!');
      }
    }

    // 3. Testar login com credenciais
    console.log('\n3. Testando login com credenciais admin...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@nbadmin.com',
      password: 'admin123'
    });

    if (loginError) {
      console.error('❌ Erro no login:', loginError);
      console.error('   - Código:', loginError.status);
      console.error('   - Mensagem:', loginError.message);
      console.error('   - Detalhes:', loginError.details);
    } else {
      console.log('✅ Login realizado com sucesso!');
      console.log('   - User ID:', loginData.user.id);
      console.log('   - Email:', loginData.user.email);
      console.log('   - Role:', loginData.user.user_metadata?.role);
      console.log('   - Session:', loginData.session ? 'Criada' : 'Não criada');
      
      if (loginData.session) {
        console.log('   - Access Token:', loginData.session.access_token ? 'Presente' : 'Ausente');
        console.log('   - Refresh Token:', loginData.session.refresh_token ? 'Presente' : 'Ausente');
        console.log('   - Expires At:', new Date(loginData.session.expires_at * 1000).toISOString());
      }
    }

    // 4. Verificar dados do consultor após login
    if (loginData && !loginError) {
      console.log('\n4. Verificando dados do consultor...');
      const { data: consultorData, error: consultorError } = await supabase
        .from('consultores')
        .select('*')
        .eq('email', 'admin@nbadmin.com')
        .single();

      if (consultorError) {
        console.error('❌ Erro ao buscar consultor:', consultorError);
      } else {
        console.log('✅ Dados do consultor encontrados:');
        console.log('   - ID:', consultorData.id);
        console.log('   - Nome:', consultorData.nome);
        console.log('   - Tipo:', consultorData.tipo);
        console.log('   - Ativo:', consultorData.ativo);
      }
    }

    // 5. Testar logout
    if (loginData && !loginError) {
      console.log('\n5. Testando logout...');
      const { error: logoutError } = await supabase.auth.signOut();

      if (logoutError) {
        console.error('❌ Erro no logout:', logoutError);
      } else {
        console.log('✅ Logout realizado com sucesso!');
      }
    }

    // 6. Verificar sessão após logout
    console.log('\n6. Verificando sessão após logout...');
    const { data: finalSessionData, error: finalSessionError } = await supabase.auth.getSession();
    
    if (finalSessionError) {
      console.error('❌ Erro ao verificar sessão final:', finalSessionError);
    } else {
      console.log('✅ Sessão final:', finalSessionData.session ? 'Ainda ativa' : 'Inativa');
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Teste de autenticação web finalizado!');
}

// Executar o teste
testWebAuthentication();