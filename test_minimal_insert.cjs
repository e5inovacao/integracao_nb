const { supabaseAdmin } = require('./supabase/server.ts');

async function testMinimalInsert() {
  try {
    console.log('🔍 Testando inserção mínima na tabela orcamentos_sistema...');
    
    // Verificar se existe usuário
    const { data: usuarios, error: userError } = await supabaseAdmin
      .from('usuarios_sistema')
      .select('id, nome')
      .limit(1);
    
    if (userError || !usuarios || usuarios.length === 0) {
      console.error('❌ Nenhum usuário encontrado:', userError);
      return;
    }
    
    console.log('✅ Usuário encontrado:', usuarios[0]);
    
    // Teste 1: Inserir apenas campos obrigatórios
    console.log('\n📋 Teste 1: Inserindo apenas campos obrigatórios...');
    const { data: teste1, error: erro1 } = await supabaseAdmin
      .from('orcamentos_sistema')
      .insert({
        usuario_id: usuarios[0].id
      })
      .select()
      .single();
    
    if (erro1) {
      console.error('❌ Erro no teste 1:', erro1);
    } else {
      console.log('✅ Teste 1 bem-sucedido:', teste1);
    }
    
    // Teste 2: Adicionar observações
    console.log('\n📋 Teste 2: Adicionando observações...');
    const { data: teste2, error: erro2 } = await supabaseAdmin
      .from('orcamentos_sistema')
      .insert({
        usuario_id: usuarios[0].id,
        observacoes: 'Teste 2 - apenas observações'
      })
      .select()
      .single();
    
    if (erro2) {
      console.error('❌ Erro no teste 2:', erro2);
    } else {
      console.log('✅ Teste 2 bem-sucedido:', teste2);
    }
    
    // Teste 3: Adicionar status
    console.log('\n📋 Teste 3: Adicionando status...');
    const { data: teste3, error: erro3 } = await supabaseAdmin
      .from('orcamentos_sistema')
      .insert({
        usuario_id: usuarios[0].id,
        observacoes: 'Teste 3 - com status',
        status: 'pendente'
      })
      .select()
      .single();
    
    if (erro3) {
      console.error('❌ Erro no teste 3:', erro3);
    } else {
      console.log('✅ Teste 3 bem-sucedido:', teste3);
    }
    
    // Teste 4: Adicionar valor_total
    console.log('\n📋 Teste 4: Adicionando valor_total...');
    const { data: teste4, error: erro4 } = await supabaseAdmin
      .from('orcamentos_sistema')
      .insert({
        usuario_id: usuarios[0].id,
        observacoes: 'Teste 4 - com valor total',
        status: 'pendente',
        valor_total: 100.00
      })
      .select()
      .single();
    
    if (erro4) {
      console.error('❌ Erro no teste 4:', erro4);
    } else {
      console.log('✅ Teste 4 bem-sucedido:', teste4);
    }
    
    // Teste 5: Adicionar data_evento
    console.log('\n📋 Teste 5: Adicionando data_evento...');
    const { data: teste5, error: erro5 } = await supabaseAdmin
      .from('orcamentos_sistema')
      .insert({
        usuario_id: usuarios[0].id,
        observacoes: 'Teste 5 - com data evento',
        status: 'pendente',
        valor_total: 100.00,
        data_evento: '2024-01-15'
      })
      .select()
      .single();
    
    if (erro5) {
      console.error('❌ Erro no teste 5:', erro5);
    } else {
      console.log('✅ Teste 5 bem-sucedido:', teste5);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testMinimalInsert().then(() => {
  console.log('\n✅ Testes concluídos.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro nos testes:', error);
  process.exit(1);
});