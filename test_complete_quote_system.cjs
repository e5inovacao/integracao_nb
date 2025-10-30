const { supabaseAdmin } = require('./supabase/server.ts');

async function testCompleteQuoteSystem() {
  try {
    console.log('🔍 Testando sistema completo de orçamentos...');
    
    // 1. Verificar usuário
    const { data: usuarios, error: userError } = await supabaseAdmin
      .from('usuarios_sistema')
      .select('id, nome')
      .limit(1);
    
    if (userError || !usuarios || usuarios.length === 0) {
      console.error('❌ Nenhum usuário encontrado:', userError);
      return;
    }
    
    console.log('✅ Usuário encontrado:', usuarios[0]);
    
    // 2. Criar orçamento
    console.log('\n📋 Criando orçamento completo...');
    const { data: orcamento, error: orcamentoError } = await supabaseAdmin
      .from('orcamentos_sistema')
      .insert({
        usuario_id: usuarios[0].id,
        observacoes: 'Teste completo do sistema',
        status: 'pendente',
        valor_total: 250.00,
        data_evento: '2024-12-31'
      })
      .select()
      .single();
    
    if (orcamentoError) {
      console.error('❌ Erro ao criar orçamento:', orcamentoError);
      return;
    }
    
    console.log('✅ Orçamento criado:', {
      id: orcamento.id,
      numero: orcamento.numero_orcamento,
      valor: orcamento.valor_total
    });
    
    // 3. Verificar produtos disponíveis
    console.log('\n🛍️ Verificando produtos disponíveis...');
    const { data: produtos, error: produtosError } = await supabaseAdmin
      .from('produtos_ecologicos')
      .select('id, Nome, Descricao, Referencia')
      .limit(2);
    
    if (produtosError || !produtos || produtos.length === 0) {
      console.error('❌ Nenhum produto encontrado:', produtosError);
      return;
    }
    
    console.log('✅ Produtos encontrados:', produtos.length);
    produtos.forEach((produto, index) => {
      console.log(`${index + 1}. ${produto.Nome} (${produto.Referencia})`);
    });
    
    // 4. Adicionar itens ao orçamento
    console.log('\n📦 Adicionando itens ao orçamento...');
    const itensParaAdicionar = [
      {
        orcamento_id: orcamento.id,
        produto_ecologico_id: produtos[0].id,
        quantidade: 10
      },
      {
        orcamento_id: orcamento.id,
        produto_ecologico_id: produtos[1].id,
        quantidade: 5
      }
    ];

    const { data: itens, error: itensError } = await supabaseAdmin
      .from('itens_orcamento_sistema')
      .insert(itensParaAdicionar)
      .select(`
        id,
        quantidade,
        produto_ecologico_id,
        produtos_ecologicos!inner(Nome, Referencia)
      `);
    
    if (itensError) {
      console.error('❌ Erro ao adicionar itens:', itensError);
      return;
    }
    
    console.log('✅ Itens adicionados com sucesso:', itens.length);
    itens.forEach((item, index) => {
      console.log(`${index + 1}. ${item.produtos_ecologicos.Nome} - Qtd: ${item.quantidade}`);
    });
    
    // 5. Verificar orçamento completo
    console.log('\n🔍 Verificando orçamento completo...');
    const { data: orcamentoCompleto, error: completoError } = await supabaseAdmin
      .from('orcamentos_sistema')
      .select(`
        id,
        numero_orcamento,
        status,
        valor_total,
        data_evento,
        observacoes,
        itens_orcamento_sistema!inner(
          id,
          quantidade,
          produtos_ecologicos!inner(Nome, Referencia)
        )
      `)
      .eq('id', orcamento.id)
      .single();
    
    if (completoError) {
      console.error('❌ Erro ao buscar orçamento completo:', completoError);
      return;
    }
    
    console.log('✅ Orçamento completo recuperado:');
    console.log(`   Número: ${orcamentoCompleto.numero_orcamento}`);
    console.log(`   Status: ${orcamentoCompleto.status}`);
    console.log(`   Valor: R$ ${orcamentoCompleto.valor_total}`);
    console.log(`   Data Evento: ${orcamentoCompleto.data_evento}`);
    console.log(`   Itens: ${orcamentoCompleto.itens_orcamento_sistema.length}`);
    
    orcamentoCompleto.itens_orcamento_sistema.forEach((item, index) => {
      console.log(`     ${index + 1}. ${item.produtos_ecologicos.Nome} - Qtd: ${item.quantidade}`);
    });
    
    console.log('\n🎉 Sistema completo de orçamentos funcionando perfeitamente!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testCompleteQuoteSystem().then(() => {
  console.log('\n✅ Teste completo concluído.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro no teste completo:', error);
  process.exit(1);
});