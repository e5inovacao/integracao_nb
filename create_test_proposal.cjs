const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestProposal() {
  console.log('🔄 Criando proposta de teste...');

  try {
    // Primeiro, buscar um orçamento existente
    const { data: orcamentos, error: orcamentosError } = await supabase
      .from('solicitacao_orcamentos')
      .select('solicitacao_id, numero_solicitacao')
      .limit(1);

    if (orcamentosError) {
      console.error('❌ Erro ao buscar orçamentos:', orcamentosError);
      return;
    }

    if (!orcamentos || orcamentos.length === 0) {
      console.log('❌ Nenhum orçamento encontrado para criar proposta');
      return;
    }

    const orcamento = orcamentos[0];
    console.log('✅ Orçamento encontrado:', orcamento);

    // Criar a proposta
    const propostaData = {
      orcamento_id: orcamento.solicitacao_id,
      numero_proposta: 'PROP-107',
      titulo: 'Proposta de Teste 107',
      descricao: 'Proposta criada para corrigir erro de consulta',
      status: 'Proposta Criada',
      valor_total: 1500.00,
      observacoes: 'Proposta de teste para resolver erro de consulta',
      validade_proposta: '30 dias',
      prazo_entrega: '15 dias úteis',
      forma_pagamento: 'À vista',
      opcao_frete: 'CIF',
      local_entrega: 'Local de entrega padrão',
      local_cobranca: 'Local de cobrança padrão'
    };

    const { data: novaProposta, error: createError } = await supabase
      .from('propostas')
      .insert(propostaData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar proposta:', createError);
      return;
    }

    console.log('✅ Proposta criada com sucesso:', {
      id: novaProposta.id,
      numero: novaProposta.numero_proposta,
      orcamento_id: novaProposta.orcamento_id,
      titulo: novaProposta.titulo
    });

    // Verificar se a proposta pode ser buscada corretamente
    console.log('🔍 Testando busca da proposta recém-criada...');
    const { data: propostaBuscada, error: fetchError } = await supabase
      .from('propostas')
      .select(`
        *,
        orcamento:solicitacao_orcamentos(
          solicitacao_id,
          numero_solicitacao,
          user_id,
          status
        )
      `)
      .eq('id', novaProposta.id)
      .single();

    if (fetchError) {
      console.error('❌ Erro ao buscar proposta criada:', fetchError);
    } else {
      console.log('✅ Proposta buscada com sucesso:', {
        id: propostaBuscada.id,
        numero: propostaBuscada.numero_proposta,
        orcamento_numero: propostaBuscada.orcamento?.numero_solicitacao
      });
    }

  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

createTestProposal().catch(console.error);