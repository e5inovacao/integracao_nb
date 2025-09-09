const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://crfdqfmtymqavfkmgtap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZmRxZm10eW1xYXZma21ndGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzA4NzgsImV4cCI6MjA3MDUwNjg3OH0.Tw_UcOVEFiFhAblD4cTOyhV9u8SFO4EEbPO0eLFIx7I';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyNoDuplicates() {
  try {
    console.log('🔍 VERIFICAÇÃO FINAL - PRODUTOS DUPLICADOS');
    console.log('========================================');

    // Buscar todos os produtos
    const { data: allProducts, error } = await supabase
      .from('produtos_asia')
      .select('referencia_pai, nome_pai, descricao');

    if (error) {
      console.error('❌ Erro ao buscar produtos:', error);
      return;
    }

    console.log(`📊 Total de produtos na tabela: ${allProducts.length}`);

    // Agrupar por referencia_pai
    const groupedProducts = {};
    allProducts.forEach(product => {
      const key = product.referencia_pai;
      if (!groupedProducts[key]) {
        groupedProducts[key] = [];
      }
      groupedProducts[key].push(product);
    });

    // Verificar duplicados
    const duplicates = Object.entries(groupedProducts).filter(([key, products]) => products.length > 1);
    
    console.log(`🔢 Códigos referencia_pai únicos: ${Object.keys(groupedProducts).length}`);
    console.log(`🔍 Produtos duplicados encontrados: ${duplicates.length}`);

    if (duplicates.length === 0) {
      console.log('✅ SUCESSO! Não há mais produtos duplicados na tabela.');
      console.log('🎉 Limpeza concluída com êxito!');
    } else {
      console.log('⚠️  ATENÇÃO! Ainda existem produtos duplicados:');
      duplicates.forEach(([referenciaPai, products]) => {
        console.log(`   - ${referenciaPai}: ${products.length} produtos`);
        products.forEach((product, index) => {
          console.log(`     ${index + 1}. ${product.nome_pai || 'N/A'}`);
        });
      });
    }

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

verifyNoDuplicates();