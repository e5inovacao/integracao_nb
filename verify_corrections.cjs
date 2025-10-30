const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://crfdqfmtymqavfkmgtap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZmRxZm10eW1xYXZma21ndGFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkzMDg3OCwiZXhwIjoyMDcwNTA2ODc4fQ.-DbIGgR_xv-BdpjubuJu-Yfat8o5QUjQ1MXaba5zrbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyCorrections() {
  try {
    console.log('✅ Verificando correções aplicadas na tabela produtos_asia...');
    
    // Verificar se ainda existem caracteres especiais problemáticos
    const { data: problemProducts, error: problemError } = await supabase
      .from('produtos_asia')
      .select('referencia_pai, nome_pai, descricao')
      .or('descricao.like.%�%,descricao.like.%_x000D_%,nome_pai.like.%�%,nome_pai.like.%_x000D_%')
      .limit(10);
    
    if (problemError) {
      console.error('❌ Erro ao verificar produtos com problemas:', problemError);
      return;
    }
    
    console.log(`🔍 Produtos com caracteres especiais restantes: ${problemProducts.length}`);
    
    if (problemProducts.length > 0) {
      console.log('\n⚠️  PRODUTOS COM PROBLEMAS RESTANTES:');
      problemProducts.forEach((produto, i) => {
        console.log(`${i + 1}. ${produto.referencia_pai} - ${produto.nome_pai}`);
        if (produto.descricao && (produto.descricao.includes('�') || produto.descricao.includes('_x000D_'))) {
          console.log(`   Descrição: ${produto.descricao.substring(0, 100)}...`);
        }
      });
    } else {
      console.log('✅ Nenhum produto com caracteres especiais problemáticos encontrado!');
    }
    
    // Verificar alguns produtos corrigidos
    const { data: correctedProducts, error: correctedError } = await supabase
      .from('produtos_asia')
      .select('referencia_pai, nome_pai, descricao')
      .in('referencia_pai', ['CAD200P', 'CAD009', 'CAD380P', 'SVT010'])
      .limit(5);
    
    if (correctedError) {
      console.error('❌ Erro ao verificar produtos corrigidos:', correctedError);
      return;
    }
    
    console.log('\n📋 EXEMPLOS DE PRODUTOS CORRIGIDOS:');
    correctedProducts.forEach((produto, i) => {
      console.log(`${i + 1}. ${produto.referencia_pai} - ${produto.nome_pai}`);
      if (produto.descricao) {
        console.log(`   Descrição: ${produto.descricao.substring(0, 150)}...`);
      }
    });
    
    // Verificar estatísticas gerais
    const { count: totalProducts, error: countError } = await supabase
      .from('produtos_asia')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erro ao contar produtos:', countError);
      return;
    }
    
    console.log('\n📊 ESTATÍSTICAS FINAIS:');
    console.log('========================');
    console.log(`🔸 Total de produtos na base: ${totalProducts}`);
    console.log(`🔸 Produtos com problemas restantes: ${problemProducts.length}`);
    console.log(`🔸 Taxa de correção: ${((totalProducts - problemProducts.length) / totalProducts * 100).toFixed(2)}%`);
    
    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

// Executar a verificação
verifyCorrections();