import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://dntlbhmljceaefycdsbc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODEwNTgwMywiZXhwIjoyMDYzNjgxODAzfQ.bbbYcj0MrnUU-tOjcZvHCU98nW9r-d8i_hVYHyTah0I';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConsultorCreation() {
  console.log('=== TESTANDO CRIAÇÃO DE CONSULTOR ===\n');
  
  const testEmail = `consultor.teste.${Date.now()}@test.com`;
  const testData = {
    p_nome: 'Consultor Teste',
    p_email: testEmail,
    p_telefone: '(11) 99999-9999',
    p_senha: 'senha123',
    p_ativo: true,
    p_role: 'consultor'
  };
  
  console.log('📝 Dados do teste:', testData);
  console.log();
  
  try {
    // Primeiro, fazer login como admin para ter permissão
    console.log('🔐 Fazendo login como admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@nbadmin.com',
      password: 'admin123'
    });
    
    if (authError) {
      console.error('❌ Erro no login admin:', authError.message);
      return;
    }
    
    console.log('✅ Login admin realizado com sucesso');
    console.log();
    
    // Criar consultor usando a função corrigida
    console.log('👤 Criando consultor...');
    const { data, error } = await supabase.rpc('create_consultor_with_auth_user', testData);
    
    if (error) {
      console.error('❌ Erro ao criar consultor:', error.message);
      console.error('Detalhes:', error);
      return;
    }
    
    console.log('✅ Consultor criado com sucesso!');
    console.log('📊 Resultado:', data);
    console.log();
    
    // Verificar se o usuário foi criado no auth.users
    console.log('🔍 Verificando usuário no auth.users...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Erro ao listar usuários:', usersError.message);
      return;
    }
    
    const createdUser = users.users.find(user => user.email === testEmail);
    
    if (createdUser) {
      console.log('✅ Usuário encontrado no auth.users:');
      console.log('  - ID:', createdUser.id);
      console.log('  - Email:', createdUser.email);
      console.log('  - Email confirmado:', createdUser.email_confirmed_at ? 'Sim' : 'Não');
      console.log('  - Metadados:', createdUser.user_metadata);
      console.log();
      
      // Testar login com o usuário criado
      console.log('🔐 Testando login com o consultor criado...');
      
      // Fazer logout do admin primeiro
      await supabase.auth.signOut();
      
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: 'senha123'
      });
      
      if (loginError) {
        console.error('❌ Erro no login do consultor:', loginError.message);
        console.error('Detalhes:', loginError);
      } else {
        console.log('✅ Login do consultor realizado com sucesso!');
        console.log('👤 Usuário logado:', loginData.user.email);
        console.log('🎯 Role:', loginData.user.user_metadata?.role);
        
        // Fazer logout
        await supabase.auth.signOut();
      }
    } else {
      console.error('❌ Usuário não encontrado no auth.users');
    }
    
  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
    console.error(err);
  }
}

testConsultorCreation();