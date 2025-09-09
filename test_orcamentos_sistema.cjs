const { supabaseAdmin } = require('./supabase/server.ts');

async function testOrcamentosSistema() {
  try {
    console.log('🔍 Testando criação de orçamento na tabela orcamentos_sistema...');
    
    // Verificar se existe usuário
    console.log('\n👤 Verificando usuários...');
    const { data: usuarios, error: userError } = await supabaseAdmin
      .from('usuarios_sistema')
      .select('id, nome')
      .limit(1);
    
    if (userError || !usuarios || usuarios.length === 0) {
      console.error('❌ Nenhum usuário encontrado:', userError);
      return;
    }
    
    console.log('✅ Usuário encontrado:', usuarios[0]);
    
    // Criar orçamento de teste
    console.log('\n📋 Criando orçamento de teste...');
    const { data: novoOrcamento, error: orcError } = await supabaseAdmin
      .from('orcamentos_sistema')
      .insert({
        usuario_id: usuarios[0].id,
        observacoes: 'Teste de criação de orçamento após correções',
        status: 'pendente',
        valor_total: 100.00,
        data_evento: new Date().toISOString().split('T')[0] // Send as YYYY-MM-DD format
      })
      .select()
      .single();
    
    if (orcError) {
      console.error('❌ Erro ao criar orçamento:', orcError);
      return;
    }
    
    console.log('✅ Orçamento criado com sucesso:', novoOrcamento);
    
    // Verificar se o orçamento foi inserido
    console.log('\n🔍 Verificando orçamentos na tabela...');
    const { data: orcamentos, error: listError } = await supabaseAdmin
      .from('orcamentos_sistema')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (listError) {
      console.error('❌ Erro ao listar orçamentos:', listError);
    } else {
      console.log('✅ Orçamentos encontrados:', orcamentos?.length || 0);
      if (orcamentos && orcamentos.length > 0) {
        console.log('Últimos orçamentos:');
        orcamentos.forEach((orc, index) => {
          console.log(`${index + 1}. ID: ${orc.id}, Status: ${orc.status}, Valor: ${orc.valor_total}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testOrcamentosSistema().then(() => {
  console.log('\n✅ Teste concluído.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro no teste:', error);
  process.exit(1);
});