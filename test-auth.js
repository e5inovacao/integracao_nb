import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dntlbhmljceaefycdsbc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMDU4MDMsImV4cCI6MjA2MzY4MTgwM30.DyBPu5O9C8geyV6pliyIGkhwGegwV_9FQeKQ8prSdHY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  try {
    console.log('Testando conexão com Supabase...');
    
    // Verificar se existem usuários administradores
    const { data: admins, error: adminError } = await supabase
      .from('consultores')
      .select('id, nome, email, role, ativo')
      .eq('role', 'admin')
      .eq('ativo', true);
    
    if (adminError) {
      console.error('Erro ao buscar administradores:', adminError);
    } else {
      console.log('Administradores encontrados:', admins);
    }
    
    // Verificar se existem usuários consultores
    const { data: consultores, error: consultorError } = await supabase
      .from('consultores')
      .select('id, nome, email, role, ativo')
      .eq('role', 'consultor')
      .eq('ativo', true)
      .limit(3);
    
    if (consultorError) {
      console.error('Erro ao buscar consultores:', consultorError);
    } else {
      console.log('Consultores encontrados:', consultores);
    }
    
    // Testar login com credenciais de exemplo
    console.log('\nTestando login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@nbadmin.com',
      password: 'admin123'
    });
    
    if (loginError) {
      console.error('Erro no login:', loginError.message);
    } else {
      console.log('Login bem-sucedido:', loginData.user?.email);
      console.log('Metadados do usuário:', loginData.user?.user_metadata);
      
      // Fazer logout
      await supabase.auth.signOut();
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

testAuth();