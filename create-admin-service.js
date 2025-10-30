import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dntlbhmljceaefycdsbc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODEwNTgwMywiZXhwIjoyMDYzNjgxODAzfQ.bbbYcj0MrnUU-tOjcZvHCU98nW9r-d8i_hVYHyTah0I';

// Cliente com service role para contornar RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Cliente normal para testar login
const supabaseClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMDU4MDMsImV4cCI6MjA2MzY4MTgwM30.DyBPu5O9C8geyV6pliyIGkhwGegwV_9FQeKQ8prSdHY');

async function createAdminUser() {
  try {
    console.log('Criando usuário administrador com service role...');
    
    // Primeiro, criar o usuário na auth usando admin API
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@nbadmin.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        role: 'admin'
      }
    });
    
    if (authError) {
      console.error('Erro ao criar usuário auth:', authError);
      return;
    }
    
    console.log('Usuário auth criado:', authUser.user.email);
    
    // Agora criar o registro na tabela consultores
    const { data: consultorData, error: consultorError } = await supabaseAdmin
      .from('consultores')
      .insert({
        nome: 'Administrador',
        email: 'admin@nbadmin.com',
        telefone: '(11) 99999-9999',
        cpf: '000.000.000-00',
        endereco: 'Endereço do Administrador',
        observacoes: 'Usuário administrador inicial do sistema',
        ativo: true,
        auth_user_id: authUser.user.id,
        role: 'admin',
        senha: 'admin123'
      })
      .select();
    
    if (consultorError) {
      console.error('Erro ao criar consultor:', consultorError);
      return;
    }
    
    console.log('Consultor criado:', consultorData);
    
    // Testar login
    console.log('\nTestando login...');
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
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
      await supabaseClient.auth.signOut();
      console.log('Logout realizado.');
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

createAdminUser();