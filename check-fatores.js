// Script para verificar dados das tabelas de fator
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkFatores() {
  console.log('Verificando tabelas de fator...');
  
  const { data, error } = await supabase
    .from('tabelas_fator')
    .select('*')
    .eq('status', 'ativo')
    .order('nome_tabela');

  if (error) {
    console.error('Erro ao buscar tabelas de fator:', error);
    return;
  }

  console.log('Tabelas de fator encontradas:');
  data.forEach(item => {
    console.log(`- ${item.nome_tabela}: Qtd ${item.quantidade_inicial}-${item.quantidade_final} = Fator ${item.fator}`);
  });
}

checkFatores();