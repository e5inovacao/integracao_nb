import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dntlbhmljceaefycdsbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODEwNTgwMywiZXhwIjoyMDYzNjgxODAzfQ.bbbYcj0MrnUU-tOjcZvHCU98nW9r-d8i_hVYHyTah0I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVariacoes() {
  try {
    console.log('Verificando estrutura da coluna variacoes...');
    
    const { data, error } = await supabase
      .from('ecologic_products_site')
      .select('id, titulo, img_0, img_1, img_2, cor_web_principal, variacoes')
      .limit(3);
    
    if (error) {
      console.error('Erro:', error);
      return;
    }
    
    console.log('Dados encontrados:');
    data.forEach((produto, index) => {
      console.log(`\n--- Produto ${index + 1} ---`);
      console.log('ID:', produto.id);
      console.log('Título:', produto.titulo);
      console.log('Cor Principal:', produto.cor_web_principal);
      console.log('IMG_0:', produto.img_0 ? 'Presente' : 'Ausente');
      console.log('IMG_1:', produto.img_1 ? 'Presente' : 'Ausente');
      console.log('IMG_2:', produto.img_2 ? 'Presente' : 'Ausente');
      console.log('Variações:', JSON.stringify(produto.variacoes, null, 2));
    });
    
  } catch (err) {
    console.error('Erro na consulta:', err);
  }
}

checkVariacoes();