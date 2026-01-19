import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) process.exit(1);

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function verifyAdmin() {
  const email = 'admin@naturezabrindes.com.br';
  console.log(`Verificando existência do admin: ${email}...`);

  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Erro ao listar usuários:', error);
    return;
  }

  const adminUser = users.find(u => u.email === email);

  if (adminUser) {
    console.log('✅ Usuário admin encontrado no Auth!');
    console.log('ID:', adminUser.id);
    console.log('Confirmado:', adminUser.email_confirmed_at ? 'Sim' : 'Não');
    console.log('Last Sign In:', adminUser.last_sign_in_at);
  } else {
    console.error('❌ Usuário admin NÃO encontrado no Auth.');
  }
}

verifyAdmin();
