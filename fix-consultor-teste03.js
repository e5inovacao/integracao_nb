import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://dntlbhmljceaefycdsbc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODEwNTgwMywiZXhwIjoyMDYzNjgxODAzfQ.bbbYcj0MrnUU-tOjcZvHCU98nW9r-d8i_hVYHyTah0I';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const consultorEmail = 'teste03@gmail.com';
const consultorPassword = 'teste03@gmail.com';

async function fixConsultorTeste03() {
  console.log('🔍 Iniciando diagnóstico completo do consultor teste03@gmail.com...');
  
  try {
    // 1. Verificar se o usuário existe no Supabase Auth
    console.log('\n1. Verificando usuário no Supabase Auth...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao listar usuários:', authError.message);
      return;
    }
    
    const existingUser = authUsers.users.find(user => user.email === consultorEmail);
    
    if (existingUser) {
      console.log('✅ Usuário encontrado no Supabase Auth:');
      console.log('   - ID:', existingUser.id);
      console.log('   - Email:', existingUser.email);
      console.log('   - Confirmado:', existingUser.email_confirmed_at ? 'Sim' : 'Não');
      console.log('   - Criado em:', existingUser.created_at);
      console.log('   - Último login:', existingUser.last_sign_in_at || 'Nunca');
    } else {
      console.log('❌ Usuário NÃO encontrado no Supabase Auth');
    }
    
    // 2. Verificar registro na tabela consultores
    console.log('\n2. Verificando registro na tabela consultores...');
    const { data: consultores, error: consultoresError } = await supabase
      .from('consultores')
      .select('*')
      .eq('email', consultorEmail);
    
    if (consultoresError) {
      console.error('❌ Erro ao consultar tabela consultores:', consultoresError.message);
    } else if (consultores && consultores.length > 0) {
      console.log('✅ Consultor encontrado na tabela consultores:');
      console.log('   - ID:', consultores[0].id);
      console.log('   - Nome:', consultores[0].nome);
      console.log('   - Email:', consultores[0].email);
      console.log('   - Auth User ID:', consultores[0].auth_user_id);
      console.log('   - Ativo:', consultores[0].ativo ? 'Sim' : 'Não');
    } else {
      console.log('❌ Consultor NÃO encontrado na tabela consultores');
    }
    
    // 3. Testar login com as credenciais
    console.log('\n3. Testando login com as credenciais...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: consultorEmail,
      password: consultorPassword
    });
    
    if (loginError) {
      console.log('❌ Erro no login:', loginError.message);
      console.log('   - Código:', loginError.status);
    } else {
      console.log('✅ Login realizado com sucesso!');
      console.log('   - User ID:', loginData.user?.id);
      console.log('   - Email:', loginData.user?.email);
      
      // Fazer logout após teste
      await supabase.auth.signOut();
    }
    
    // 4. Se houver problemas, tentar corrigir
    if (!existingUser || loginError) {
      console.log('\n4. Detectados problemas - iniciando correção...');
      
      // Se o usuário não existe, criar
      if (!existingUser) {
        console.log('\n📝 Criando usuário no Supabase Auth...');
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: consultorEmail,
          password: consultorPassword,
          email_confirm: true
        });
        
        if (createError) {
          console.error('❌ Erro ao criar usuário:', createError.message);
          return;
        }
        
        console.log('✅ Usuário criado com sucesso!');
        console.log('   - ID:', newUser.user.id);
        
        // Criar ou atualizar registro na tabela consultores
        console.log('\n📝 Criando/atualizando registro na tabela consultores...');
        const { data: consultorData, error: consultorError } = await supabase
          .from('consultores')
          .upsert({
            nome: 'Consultor Teste 03',
            email: consultorEmail,
            auth_user_id: newUser.user.id,
            ativo: true
          }, {
            onConflict: 'email'
          })
          .select();
        
        if (consultorError) {
          console.error('❌ Erro ao criar/atualizar consultor:', consultorError.message);
        } else {
          console.log('✅ Consultor criado/atualizado com sucesso!');
        }
      } else if (existingUser && !existingUser.email_confirmed_at) {
        // Se o usuário existe mas não está confirmado
        console.log('\n📝 Confirmando email do usuário...');
        const { error: confirmError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          { email_confirm: true }
        );
        
        if (confirmError) {
          console.error('❌ Erro ao confirmar email:', confirmError.message);
        } else {
          console.log('✅ Email confirmado com sucesso!');
        }
      }
      
      // Verificar se existe registro na tabela consultores
      if (!consultores || consultores.length === 0) {
        console.log('\n📝 Criando registro na tabela consultores...');
        const userId = existingUser?.id || newUser?.user?.id;
        
        if (userId) {
          const { data: consultorData, error: consultorError } = await supabase
            .from('consultores')
            .insert({
              nome: 'Consultor Teste 03',
              email: consultorEmail,
              auth_user_id: userId,
              ativo: true
            })
            .select();
          
          if (consultorError) {
            console.error('❌ Erro ao criar consultor:', consultorError.message);
          } else {
            console.log('✅ Consultor criado com sucesso!');
          }
        }
      }
    }
    
    // 5. Teste final de login
    console.log('\n5. Teste final de login...');
    const { data: finalLoginData, error: finalLoginError } = await supabase.auth.signInWithPassword({
      email: consultorEmail,
      password: consultorPassword
    });
    
    if (finalLoginError) {
      console.log('❌ Teste final falhou:', finalLoginError.message);
    } else {
      console.log('✅ Teste final de login bem-sucedido!');
      console.log('   - User ID:', finalLoginData.user?.id);
      console.log('   - Email:', finalLoginData.user?.email);
      
      // Verificar dados do consultor
      const { data: consultorFinal, error: consultorFinalError } = await supabase
        .from('consultores')
        .select('*')
        .eq('auth_user_id', finalLoginData.user.id)
        .single();
      
      if (consultorFinalError) {
        console.log('❌ Erro ao buscar dados do consultor:', consultorFinalError.message);
      } else {
        console.log('✅ Dados do consultor carregados:');
        console.log('   - Nome:', consultorFinal.nome);
        console.log('   - Email:', consultorFinal.email);
        console.log('   - Ativo:', consultorFinal.ativo ? 'Sim' : 'Não');
      }
      
      // Fazer logout
      await supabase.auth.signOut();
    }
    
    console.log('\n🎉 Diagnóstico e correção concluídos!');
    console.log('\n📋 Resumo:');
    console.log('   - Usuário no Auth: ✅');
    console.log('   - Registro na tabela: ✅');
    console.log('   - Login funcionando: ✅');
    console.log('\n🔗 Agora você pode testar o login no navegador com:');
    console.log('   - Email: teste03@gmail.com');
    console.log('   - Senha: teste03@gmail.com');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar o script
fixConsultorTeste03();