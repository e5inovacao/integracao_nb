const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDuplicateProducts() {
  console.log('🔍 Analisando produtos duplicados na tabela produtos_asia...');
  console.log('=' .repeat(60));

  try {
    // 1. Buscar todos os produtos
    const { data: allProducts, error: allError } = await supabase
      .from('produtos_asia')
      .select('referencia_pai, nome_pai, descricao, preco_pai, categorias')
      .order('referencia_pai');

    if (allError) {
      console.error('❌ Erro ao buscar produtos:', allError);
      return;
    }

    console.log(`📊 Total de produtos na tabela: ${allProducts.length}`);
    console.log('');

    // 2. Agrupar por referencia_pai e contar duplicatas
    const referenciaPaiGroups = {};
    const duplicateGroups = {};

    allProducts.forEach(product => {
      const ref = product.referencia_pai;
      if (!referenciaPaiGroups[ref]) {
        referenciaPaiGroups[ref] = [];
      }
      referenciaPaiGroups[ref].push(product);
    });

    // Identificar duplicatas
    Object.keys(referenciaPaiGroups).forEach(ref => {
      if (referenciaPaiGroups[ref].length > 1) {
        duplicateGroups[ref] = referenciaPaiGroups[ref];
      }
    });

    // 3. Estatísticas gerais
    const totalDuplicateRefs = Object.keys(duplicateGroups).length;
    const totalDuplicateProducts = Object.values(duplicateGroups)
      .reduce((sum, group) => sum + group.length, 0);

    console.log('📈 ESTATÍSTICAS DE DUPLICATAS:');
    console.log('-'.repeat(40));
    console.log(`🔢 Códigos referencia_pai únicos: ${Object.keys(referenciaPaiGroups).length}`);
    console.log(`🔄 Códigos referencia_pai duplicados: ${totalDuplicateRefs}`);
    console.log(`📦 Total de produtos duplicados: ${totalDuplicateProducts}`);
    console.log(`📊 Percentual de duplicatas: ${((totalDuplicateProducts / allProducts.length) * 100).toFixed(2)}%`);
    console.log('');

    // 4. Lista dos códigos referencia_pai duplicados com contagem
    console.log('📋 CÓDIGOS REFERENCIA_PAI DUPLICADOS:');
    console.log('-'.repeat(50));
    
    const sortedDuplicates = Object.entries(duplicateGroups)
      .sort(([,a], [,b]) => b.length - a.length);

    sortedDuplicates.forEach(([ref, products], index) => {
      console.log(`${index + 1}. ${ref} - ${products.length} produtos`);
    });
    console.log('');

    // 5. Exemplos detalhados dos 10 primeiros grupos de duplicatas
    console.log('🔍 EXEMPLOS DETALHADOS (Top 10):');
    console.log('='.repeat(60));

    sortedDuplicates.slice(0, 10).forEach(([ref, products], index) => {
      console.log(`\n${index + 1}. REFERÊNCIA PAI: ${ref} (${products.length} produtos)`);
      console.log('-'.repeat(50));
      
      products.forEach((product, prodIndex) => {
        console.log(`   ${prodIndex + 1}. Referência: ${product.referencia_pai}`);
        console.log(`      Nome: ${product.nome_pai}`);
        console.log(`      Descrição: ${product.descricao ? product.descricao.substring(0, 100) + '...' : 'N/A'}`);
        console.log(`      Preço: ${product.preco_pai || 'N/A'}`);
        console.log(`      Categorias: ${product.categorias || 'N/A'}`);
        console.log('');
      });
    });

    // 6. Análise de padrões
    console.log('\n🎯 ANÁLISE DE PADRÕES:');
    console.log('-'.repeat(40));
    
    const maxDuplicates = Math.max(...Object.values(duplicateGroups).map(group => group.length));
    const avgDuplicates = (totalDuplicateProducts / totalDuplicateRefs).toFixed(2);
    
    console.log(`📊 Maior número de duplicatas para um referencia_pai: ${maxDuplicates}`);
    console.log(`📊 Média de produtos por referencia_pai duplicado: ${avgDuplicates}`);
    
    // Distribuição por quantidade de duplicatas
    const distributionMap = {};
    Object.values(duplicateGroups).forEach(group => {
      const count = group.length;
      distributionMap[count] = (distributionMap[count] || 0) + 1;
    });
    
    console.log('\n📊 DISTRIBUIÇÃO POR QUANTIDADE:');
    Object.entries(distributionMap)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([count, refs]) => {
        console.log(`   ${count} produtos: ${refs} referencia_pai`);
      });

  } catch (error) {
    console.error('❌ Erro durante a análise:', error);
  }
}

// Executar análise
analyzeDuplicateProducts()
  .then(() => {
    console.log('\n✅ Análise concluída!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });