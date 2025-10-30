import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dntlbhmljceaefycdsbc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODEwNTgwMywiZXhwIjoyMDYzNjgxODAzfQ.bbbYcj0MrnUU-tOjcZvHCU98nW9r-d8i_hVYHyTah0I';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAuthUsers() {
  console.log('=== VERIFICANDO USUÁRIOS AUTH.USERS ===\n');
  
  try {
    // Listar todos os usuários
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authUsersError) {
      console.error('Erro ao listar usuários auth:', authUsersError);
      return;
    }
    
    console.log(`Total de usuários encontrados: ${authUsers.users.length}\n`);
    
    authUsers.users.forEach((user, index) => {
      console.log(`--- Usuário ${index + 1} ---`);
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Email confirmado:', user.email_confirmed_at ? 'Sim' : 'Não');
      console.log('Criado em:', user.created_at);
      console.log('Última atualização:', user.updated_at);
      console.log('User metadata:', JSON.stringify(user.user_metadata, null, 2));
      console.log('Raw user metadata:', JSON.stringify(user.raw_user_meta_data, null, 2));
      console.log('App metadata:', JSON.stringify(user.app_metadata, null, 2));
      console.log('Identities:', user.identities?.length || 0);
      console.log('Banned until:', user.banned_until || 'Não banido');
      console.log('\n');
    });
    
    // Verificar se há usuários recém-criados que não conseguem fazer login
    const recentUsers = authUsers.users.filter(user => {
      const createdAt = new Date(user.created_at);
      const now = new Date();
      const diffMinutes = (now - createdAt) / (1000 * 60);
      return diffMinutes < 30; // Usuários criados nos últimos 30 minutos
    });
    
    if (recentUsers.length > 0) {
      console.log('=== USUÁRIOS RECÉM-CRIADOS (últimos 30 min) ===');
      recentUsers.forEach(user => {
        console.log(`- ${user.email} (${user.email_confirmed_at ? 'Confirmado' : 'Não confirmado'})`);
      });
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

checkAuthUsers();