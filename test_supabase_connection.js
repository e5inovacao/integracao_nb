import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

console.log('Environment variables loaded:');
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);

// Configurar cliente Supabase com service role (máximas permissões)
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testSupabaseConnection() {
  console.log('Testando conexão com Supabase usando service role...');
  
  try {
    // 1. Testar se conseguimos listar tabelas
    console.log('\n1. Testando acesso direto à tabela...');
    const { data: rawData, error: rawError } = await supabaseAdmin
      .from('ecologic_products_site')
      .select('*')
      .limit(1);
    
    console.log('Acesso direto:', {
      hasData: !!rawData,
      count: rawData?.length || 0,
      error: rawError,
      firstRecord: rawData?.[0] || null
    });

    // 2. Testar contagem
    console.log('\n2. Testando contagem...');
    const { count, error: countError } = await supabaseAdmin
      .from('ecologic_products_site')
      .select('*', { count: 'exact', head: true });
    
    console.log('Contagem:', { count, countError });

    // 3. Testar com RPC (função SQL direta)
    console.log('\n3. Testando com RPC...');
    const { data: rpcData, error: rpcError } = await supabaseAdmin
      .rpc('exec', {
        sql: 'SELECT COUNT(*) as total FROM public.ecologic_products_site'
      });
    
    console.log('RPC Count:', { rpcData, rpcError });

    // 4. Testar campos específicos
    console.log('\n4. Testando campos específicos...');
    const { data: fieldsData, error: fieldsError } = await supabaseAdmin
      .from('ecologic_products_site')
      .select('id, tipo, codigo, titulo')
      .limit(3);
    
    console.log('Campos específicos:', {
      hasData: !!fieldsData,
      count: fieldsData?.length || 0,
      error: fieldsError,
      data: fieldsData
    });

  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
}

testSupabaseConnection();