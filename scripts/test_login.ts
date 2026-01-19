import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('Credenciais ausentes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey);

async function testLogin() {
  const email = 'admin@naturezabrindes.com.br';
  const password = 'admin123';

  console.log(`Tentando login com ${email} e senha padrão...`);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('❌ Falha no login:', error);
    console.error('Detalhes:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ Login bem sucedido!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Role:', data.user.role);
  }
}

testLogin();
