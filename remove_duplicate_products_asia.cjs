require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function removeDuplicateProducts() {
  try {
    console.log('🔍 Iniciando remoção de produtos duplicados na tabela produtos_asia...');
    console.log('============================================================');

    // 1. Buscar estatísticas iniciais
    const { data: allProducts, error: allError } = await supabase
      .from('produtos_asia')
      .select('referencia_pai')
      .order('referencia_pai');

    if (allError) {
      console.error('❌ Erro ao buscar produtos:', allError);
      return;
    }

    const totalProductsBefore = allProducts.length;
    console.log(`📊 Total de produtos antes da limpeza: ${totalProductsBefore}`);

    // 2. Identificar duplicatas
    const referenciaGroups = {};
    allProducts.forEach(product => {
      if (!referenciaGroups[product.referencia_pai]) {
        referenciaGroups[product.referencia_pai] = 0;
      }
      referenciaGroups[product.referencia_pai]++;
    });

    const duplicateReferences = Object.keys(referenciaGroups).filter(
      ref => referenciaGroups[ref] > 1
    );

    console.log(`🔄 Códigos referencia_pai duplicados encontrados: ${duplicateReferences.length}`);
    console.log(`📦 Total de produtos duplicados: ${duplicateReferences.reduce((sum, ref) => sum + referenciaGroups[ref], 0)}`);

    if (duplicateReferences.length === 0) {
      console.log('✅ Nenhum produto duplicado encontrado!');
      return;
    }

    // 3. Para cada referencia_pai duplicado, manter apenas o primeiro
    let totalDeleted = 0;
    
    for (const referenciaPai of duplicateReferences) {
      console.log(`\n🔧 Processando referencia_pai: ${referenciaPai} (${referenciaGroups[referenciaPai]} produtos)`);
      
      // Buscar todos os produtos com esta referencia_pai
      const { data: duplicateProducts, error: duplicateError } = await supabase
        .from('produtos_asia')
        .select('*')
        .eq('referencia_pai', referenciaPai);

      if (duplicateError) {
        console.error(`❌ Erro ao buscar produtos duplicados para ${referenciaPai}:`, duplicateError);
        continue;
      }

      if (duplicateProducts.length <= 1) {
        console.log(`⚠️  Apenas ${duplicateProducts.length} produto encontrado para ${referenciaPai}, pulando...`);
        continue;
      }

      // Manter o primeiro produto, deletar os demais
      const productToKeep = duplicateProducts[0];
      const productsToDelete = duplicateProducts.slice(1);

      console.log(`   ✅ Mantendo produto: ${productToKeep.nome_pai || 'N/A'}`);
      console.log(`   🗑️  Deletando ${productsToDelete.length} produtos duplicados...`);

      // Deletar produtos duplicados usando uma abordagem mais específica
      for (let i = 0; i < productsToDelete.length; i++) {
        const productToDelete = productsToDelete[i];
        
        // Buscar e deletar um produto por vez para evitar deletar o produto que queremos manter
        const { data: toDelete, error: findError } = await supabase
          .from('produtos_asia')
          .select('*')
          .eq('referencia_pai', productToDelete.referencia_pai)
          .limit(2); // Buscar apenas 2 para comparar

        if (findError) {
          console.error(`❌ Erro ao buscar produto para deletar:`, findError);
          continue;
        }

        if (toDelete && toDelete.length > 1) {
          // Deletar o segundo produto encontrado (manter o primeiro)
          const { error: deleteError } = await supabase
            .from('produtos_asia')
            .delete()
            .eq('referencia_pai', toDelete[1].referencia_pai)
            .eq('nome_pai', toDelete[1].nome_pai)
            .eq('descricao', toDelete[1].descricao)
            .eq('preco_pai', toDelete[1].preco_pai)
            .limit(1);

          if (deleteError) {
            console.error(`❌ Erro ao deletar produto duplicado:`, deleteError);
          } else {
            totalDeleted++;
            console.log(`   ✅ Produto duplicado deletado com sucesso`);
          }
        }
      }
    }

    // 4. Verificar estatísticas finais
    const { data: finalProducts, error: finalError } = await supabase
      .from('produtos_asia')
      .select('referencia_pai');

    if (finalError) {
      console.error('❌ Erro ao buscar produtos finais:', finalError);
      return;
    }

    const totalProductsAfter = finalProducts.length;
    const uniqueReferences = new Set(finalProducts.map(p => p.referencia_pai)).size;

    console.log('\n🎯 RESULTADOS DA LIMPEZA:');
    console.log('----------------------------------------');
    console.log(`📊 Produtos antes da limpeza: ${totalProductsBefore}`);
    console.log(`📊 Produtos após a limpeza: ${totalProductsAfter}`);
    console.log(`🗑️  Total de produtos deletados: ${totalDeleted}`);
    console.log(`🔢 Códigos referencia_pai únicos: ${uniqueReferences}`);
    console.log(`✅ Limpeza concluída com sucesso!`);

  } catch (error) {
    console.error('❌ Erro durante a execução:', error);
  }
}

// Executar o script
removeDuplicateProducts();