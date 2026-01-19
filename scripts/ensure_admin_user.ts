import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração do ambiente
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ ERRO: Credenciais do Supabase ausentes no arquivo .env');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'OK' : 'AUSENTE');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'OK' : 'AUSENTE');
  process.exit(1);
}

// Cliente com privilégios de administrador (Service Role)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function ensureAdminUser() {
  const email = 'admin@naturezabrindes.com.br';
  const password = 'admin123'; // Senha padrão forte
  
  console.log(`🔍 Verificando usuário admin: ${email}...`);

  try {
    // 1. Verificar se o usuário já existe na lista de Auth Users
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Erro ao listar usuários: ${listError.message}`);
    }

    const existingUser = users.find(u => u.email === email);

    let userId;

    if (existingUser) {
      console.log('✅ Usuário admin encontrado no Auth (ID:', existingUser.id, ')');
      userId = existingUser.id;

      // 2. Atualizar a senha para garantir acesso
      console.log('🔄 Atualizando senha do admin...');
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { 
          password: password,
          email_confirm: true,
          user_metadata: { role: 'admin' }
        }
      );

      if (updateError) {
        throw new Error(`Erro ao atualizar senha: ${updateError.message}`);
      }
      console.log('✅ Senha atualizada com sucesso!');

    } else {
      console.log('⚠️ Usuário admin não encontrado. Criando novo...');
      
      // 3. Criar usuário se não existir
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { role: 'admin' }
      });

      if (createError) {
        throw new Error(`Erro ao criar usuário: ${createError.message}`);
      }

      if (!newUser.user) {
        throw new Error('Usuário criado mas nenhum dado retornado.');
      }

      console.log('✅ Usuário admin criado com sucesso (ID:', newUser.user.id, ')');
      userId = newUser.user.id;
    }

    // 4. Garantir que ele exista na tabela pública 'consultores' (se necessário pelo sistema legado)
    // Embora o sistema novo use 'user_profiles' ou 'partners', o sistema antigo checa 'consultores'
    // Vamos garantir que exista nas tabelas relevantes
    
    console.log('🔄 Sincronizando tabelas públicas...');

    // Inserir/Atualizar em user_profiles (tabela nova)
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        user_id: userId,
        full_name: 'Administrador Sistema',
        role: 'admin',
        is_active: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (profileError) {
      console.warn('⚠️ Aviso ao atualizar user_profiles:', profileError.message);
    } else {
      console.log('✅ Tabela user_profiles sincronizada.');
    }

    // Inserir/Atualizar em consultores (tabela legada usada no login)
    // Precisamos checar se existe pelo auth_user_id
    const { data: existingConsultor } = await supabaseAdmin
      .from('consultores')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    if (!existingConsultor) {
        const { error: consultorError } = await supabaseAdmin
        .from('consultores')
        .insert({
            auth_user_id: userId,
            nome: 'Administrador Sistema',
            email: email,
            ativo: true,
            cpf: '00000000000' // CPF Dummy
        });
        
        if (consultorError) {
            console.warn('⚠️ Aviso ao inserir em consultores:', consultorError.message);
        } else {
            console.log('✅ Tabela consultores sincronizada.');
        }
    } else {
        console.log('✅ Consultor já existe na tabela legada.');
    }

    console.log('\n🎉 CONCLUÍDO!');
    console.log('---------------------------------------------------');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Senha: ${password}`);
    console.log('---------------------------------------------------');
    console.log('👉 Tente fazer login novamente com essas credenciais.');

  } catch (error: any) {
    console.error('\n❌ FALHA FATAL:', error.message);
  }
}

ensureAdminUser();
