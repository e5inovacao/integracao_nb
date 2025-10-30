const { supabaseAdmin } = require('./supabase/server.ts');

async function testSimpleItemInsert() {
  try {
    console.log('🔍 Testando inserção simples de itens...');
    
    // 1. Buscar um orçamento existente
    const { data: orcamentos, error: orcamentoError } = await supabaseAdmin
      .from('orcamentos_sistema')
      .select('id')
      .limit(1);
    
    if (orcamentoError || !orcamentos || orcamentos.length === 0) {
      console.error('❌ Nenhum orçamento encontrado:', orcamentoError);
      return;
    }
    
    console.log('✅ Orçamento encontrado:', orcamentos[0].id);
    
    // 2. Buscar um produto
    const { data: produtos, error: produtoError } = await supabaseAdmin
      .from('produtos_ecologicos')
      .select('id')
      .limit(1);
    
    if (produtoError || !produtos || produtos.length === 0) {
      console.error('❌ Nenhum produto encontrado:', produtoError);
      return;
    }
    
    console.log('✅ Produto encontrado:', produtos[0].id);
    
    // 3. Inserir item simples (apenas campos obrigatórios)
    console.log('\n📦 Inserindo item simples...');
    const { data: item, error: itemError } = await supabaseAdmin
      .from('itens_orcamento_sistema')
      .insert({
        orcamento_id: orcamentos[0].id,
        produto_ecologico_id: produtos[0].id,
        quantidade: 5
      })
      .select('id, quantidade')
      .single();
    
    if (itemError) {
      console.error('❌ Erro ao inserir item:', itemError);
      return;
    }
    
    console.log('✅ Item inserido com sucesso:', item);
    
    // 4. Verificar se o item foi inserido
    const { data: itemVerificacao, error: verificacaoError } = await supabaseAdmin
      .from('itens_orcamento_sistema')
      .select('*')
      .eq('id', item.id)
      .single();
    
    if (verificacaoError) {
      console.error('❌ Erro ao verificar item:', verificacaoError);
      return;
    }
    
    console.log('✅ Item verificado:', itemVerificacao);
    
    console.log('\n🎉 Inserção simples funcionando!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testSimpleItemInsert().then(() => {
  console.log('\n✅ Teste simples concluído.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro no teste simples:', error);
  process.exit(1);
});