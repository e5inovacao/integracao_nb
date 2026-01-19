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

async function ensureAdmin01() {
  const email = 'admin01@naturezabrindes.com.br';
  const password = 'admin123'; // Senha padrão

  console.log(`🔍 Verificando usuário: ${email}...`);

  try {
    // 1. Verificar/Criar no Auth
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    let user = users.find(u => u.email === email);
    let userId;

    if (user) {
      console.log('✅ Usuário encontrado no Auth.');
      userId = user.id;
      // Garantir senha e confirmação
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: password,
        email_confirm: true,
        user_metadata: { role: 'admin', full_name: 'Admin01' }
      });
    } else {
      console.log('🆕 Criando usuário...');
      const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'admin', full_name: 'Admin01' }
      });
      if (error) throw error;
      userId = newUser.user?.id;
      console.log('✅ Usuário criado com sucesso.');
    }

    if (!userId) throw new Error('ID do usuário não encontrado.');

    // 2. Garantir permissões nas tabelas (user_profiles e consultores)
    console.log('🔄 Atualizando tabelas de permissão...');
    
    // user_profiles
    await supabaseAdmin.from('user_profiles').upsert({
      user_id: userId,
      full_name: 'Admin01 Sistema',
      role: 'admin',
      is_active: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    // consultores (para compatibilidade legado)
    const { data: existingConsultor } = await supabaseAdmin
      .from('consultores')
      .select('id')
      .eq('email', email)
      .single();

    if (existingConsultor) {
      await supabaseAdmin.from('consultores').update({
        auth_user_id: userId,
        ativo: true,
        nome: 'Admin01 Sistema'
      }).eq('id', existingConsultor.id);
    } else {
      await supabaseAdmin.from('consultores').insert({
        auth_user_id: userId,
        email: email,
        nome: 'Admin01 Sistema',
        ativo: true,
        cpf: '00000000000'
      });
    }

    console.log('🎉 Permissões concedidas com sucesso!');
    console.log(`Login: ${email}`);
    console.log(`Senha: ${password}`);

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
  }
}

ensureAdmin01();
