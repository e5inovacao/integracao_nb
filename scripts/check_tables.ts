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

async function checkTables() {
  console.log('🔍 Verificando tabelas...');
  
  // Tentar listar consultores
  const { data: consultores, error: err1 } = await supabase.from('consultores').select('count', { count: 'exact', head: true });
  if (err1) console.error('❌ Tabela consultores:', err1.message);
  else console.log('✅ Tabela consultores existe.');

  // Tentar listar user_profiles
  const { data: profiles, error: err2 } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true });
  if (err2) console.error('❌ Tabela user_profiles:', err2.message);
  else console.log('✅ Tabela user_profiles existe.');

  // Tentar listar partners
  const { data: partners, error: err3 } = await supabase.from('partners').select('count', { count: 'exact', head: true });
  if (err3) console.error('❌ Tabela partners:', err3.message);
  else console.log('✅ Tabela partners existe.');
}

checkTables();
