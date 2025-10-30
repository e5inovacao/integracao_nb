import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dntlbhmljceaefycdsbc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMDU4MDMsImV4cCI6MjA2MzY4MTgwM30.DyBPu5O9C8geyV6pliyIGkhwGegwV_9FQeKQ8prSdHY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdmin() {
  try {
    console.log('Criando usuário administrador...');
    
    // Usar a função RPC para criar o consultor/admin com os parâmetros corretos
    const { data, error } = await supabase.rpc('create_consultor_with_auth_user', {
      p_nome: 'Administrador',
      p_email: 'admin@nbadmin.com',
      p_telefone: '(11) 99999-9999',
      p_role: 'admin',
      p_senha: 'admin123',
      p_ativo: true
    });
    
    if (error) {
      console.error('Erro ao criar administrador:', error);
    } else {
      console.log('Administrador criado com sucesso:', data);
      
      // Testar login
      console.log('\nTestando login com o novo administrador...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'admin@nbadmin.com',
        password: 'admin123'
      });
      
      if (loginError) {
        console.error('Erro no login:', loginError.message);
      } else {
        console.log('Login bem-sucedido!');
        console.log('Email:', loginData.user?.email);
        console.log('Metadados:', loginData.user?.user_metadata);
        
        // Fazer logout
        await supabase.auth.signOut();
        console.log('Logout realizado.');
      }
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

createAdmin();