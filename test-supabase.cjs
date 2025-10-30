const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? 'Presente' : 'Ausente');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  try {
    console.log('\n=== Testando produtos_destaque ===');
    const { data: produtosDestaque, error: errorDestaque } = await supabase
      .from('produtos_destaque')
      .select('*');
    
    console.log('Produtos em destaque:', produtosDestaque);
    console.log('Erro produtos destaque:', errorDestaque);
    
    console.log('\n=== Testando produtos_destaque com JOIN ===');
    const { data: produtosComJoin, error: errorJoin } = await supabase
      .from('produtos_destaque')
      .select(`
        *,
        ecologic_products_site (
          titulo,
          descricao,
          img_0,
          categoria
        )
      `);
    
    console.log('Produtos com JOIN:', JSON.stringify(produtosComJoin, null, 2));
    console.log('Erro JOIN:', errorJoin);
    
    console.log('\n=== Testando ecologic_products_site ===');
    const { data: produtos, error: errorProdutos } = await supabase
      .from('ecologic_products_site')
      .select('codigo, titulo, descricao, img_0, categoria')
      .limit(5);
    
    console.log('Produtos disponíveis:', produtos);
    console.log('Erro produtos:', errorProdutos);
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

testSupabase();