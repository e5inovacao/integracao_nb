import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Credenciais Service Role ausentes.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
  const migrationFile = process.argv[2];
  if (!migrationFile) {
    console.error('Por favor, forneça o nome do arquivo de migração.');
    process.exit(1);
  }

  const filePath = path.resolve(__dirname, '../supabase/migrations', migrationFile);
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Executando migração: ${migrationFile}...`);

    // Separar comandos se necessário (simples split por ponto e vírgula pode ser frágil, 
    // mas o supabase-js não tem um método direto para rodar scripts brutos facilmente sem RPC.
    // O ideal seria usar pg diretamente, mas vamos tentar via query bruta se disponível ou hack via RPC)
    
    // NOTA: O cliente JS do Supabase não executa SQL arbitrário por segurança.
    // Vamos usar uma função RPC 'exec_sql' se ela existir, ou criar uma.
    // SE NÃO TIVERMOS RPC, TEREMOS QUE USAR O SQL EDITOR DO DASHBOARD.
    
    // Tentativa 1: Assumir que temos uma função exec_sql (comum em setups dev)
    /*
    create or replace function exec_sql(sql text) returns void as $$
    begin
      execute sql;
    end;
    $$ language plpgsql security definer;
    */

    // Como não podemos garantir que a função existe, vamos instruir o usuário.
    console.log('\n⚠️ ATENÇÃO: O cliente JS não pode executar migrações SQL diretamente.');
    console.log('Por favor, copie o conteúdo do arquivo abaixo e execute no SQL Editor do Supabase:');
    console.log(`\nArquivo: ${filePath}\n`);
    
  } catch (error) {
    console.error('Erro ao ler arquivo:', error);
  }
}

runMigration();
