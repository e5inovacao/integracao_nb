const { supabaseAdmin } = require('./supabase/server.ts');

async function checkPolicies() {
  try {
    console.log('🔍 Testando inserção na tabela itens_orcamento_sistema...');
    
    // Verificar se existem produtos ecológicos
    console.log('\n📦 Verificando produtos ecológicos...');
    const { data: produtos, error: prodError } = await supabaseAdmin
      .from('produtos_ecologicos')
      .select('id, nome, preco')
      .limit(5);
    
    if (prodError) {
      console.error('❌ Erro ao buscar produtos:', prodError);
    } else {
      console.log('✅ Produtos encontrados:', produtos?.length || 0);
      if (produtos && produtos.length > 0) {
        console.log('Primeiro produto:', produtos[0]);
      }
    }
    

    
    // Primeiro, buscar um orçamento existente
    const { data: orcamentos, error: orcError } = await supabaseAdmin
      .from('orcamentos_sistema')
      .select('id')
      .limit(1);
    
    if (orcError || !orcamentos || orcamentos.length === 0) {
      console.log('⚠️ Nenhum orçamento encontrado para teste. Criando um orçamento de teste...');
      
      // Primeiro criar um usuário de teste
      const { data: usuario, error: userError } = await supabaseAdmin
        .from('usuarios_sistema')
        .select('id')
        .limit(1)
        .single();
      
      if (userError || !usuario) {
        console.error('❌ Nenhum usuário encontrado para teste:', userError);
        return;
      }
      
      const { data: newOrcamento, error: createError } = await supabaseAdmin
        .from('orcamentos_sistema')
        .insert({
          usuario_id: usuario.id,
          observacoes: 'Teste de inserção manual',
          status: 'pendente',
          valor_total: 0
        })
        .select('id')
        .single();
      
      if (createError) {
        console.error('❌ Erro ao criar orçamento de teste:', createError);
        return;
      }
      
      console.log('✅ Orçamento de teste criado:', newOrcamento.id);
      
      // Testar inserção de item
      const { data: item, error: itemError } = await supabaseAdmin
        .from('itens_orcamento_sistema')
        .insert({
          orcamento_id: newOrcamento.id,
          produto_ecologico_id: 1, // ID de teste
          quantidade: 1,
          observacoes: 'Item de teste manual',
          preco_unitario: 10.00
        })
        .select()
        .single();
      
      if (itemError) {
        console.error('❌ Erro ao inserir item de teste:', itemError);
      } else {
        console.log('✅ Item inserido com sucesso:', item);
      }
    } else {
      console.log('📋 Orçamento existente encontrado:', orcamentos[0].id);
      
      // Testar inserção de item
      const { data: item, error: itemError } = await supabaseAdmin
        .from('itens_orcamento_sistema')
        .insert({
          orcamento_id: orcamentos[0].id,
          produto_ecologico_id: 1, // ID de teste
          quantidade: 1,
          observacoes: 'Item de teste manual',
          preco_unitario: 10.00
        })
        .select()
        .single();
      
      if (itemError) {
        console.error('❌ Erro ao inserir item de teste:', itemError);
      } else {
        console.log('✅ Item inserido com sucesso:', item);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkPolicies().then(() => {
  console.log('\n✅ Verificação concluída.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro na verificação:', error);
  process.exit(1);
});