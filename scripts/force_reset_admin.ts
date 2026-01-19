import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Credenciais Service Role ausentes.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function forceResetAdmin() {
  const email = 'admin@naturezabrindes.com.br';
  const password = 'admin123';

  console.log(`🔄 Iniciando RESET FORÇADO para ${email}...`);

  // 1. Buscar usuário para pegar o ID
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Erro ao listar usuários:', listError);
    return;
  }

  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    console.log(`🗑️ Usuário encontrado (ID: ${existingUser.id}). Deletando...`);
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
    if (deleteError) {
      console.error('❌ Erro ao deletar usuário:', deleteError);
      return;
    }
    console.log('✅ Usuário deletado com sucesso.');
  } else {
    console.log('ℹ️ Usuário não existia.');
  }

  // 2. Criar usuário novamente
  console.log('🆕 Criando usuário admin do zero...');
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Força confirmação imediata
    user_metadata: { 
      role: 'admin',
      full_name: 'Admin Sistema'
    }
  });

  if (createError) {
    console.error('❌ Erro ao criar usuário:', createError);
    console.error('Detalhes:', JSON.stringify(createError, null, 2));
    return;
  }

  if (!newUser.user) {
    console.error('❌ Usuário criado mas objeto user veio vazio.');
    return;
  }

  console.log(`✅ Usuário criado com sucesso! ID: ${newUser.user.id}`);
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Senha: ${password}`);
  console.log(`✅ Status: Confirmado (email_confirm: true)`);

  // 3. Tentar login imediato para validar
  console.log('\n🔐 Testando login imediato...');
  
  // Precisamos de um cliente normal (anon) para testar login de senha
  const supabaseAnon = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY!);
  
  const { data: loginData, error: loginError } = await supabaseAnon.auth.signInWithPassword({
    email,
    password
  });

  if (loginError) {
    console.error('❌ Login de teste falhou:', loginError);
    console.error('⚠️ Provável causa: Rate Limit ou Provedor ainda propagando.');
  } else {
    console.log('🎉 LOGIN DE TESTE BEM SUCEDIDO!');
    console.log('Token:', loginData.session?.access_token.substring(0, 20) + '...');
  }
}

forceResetAdmin();
