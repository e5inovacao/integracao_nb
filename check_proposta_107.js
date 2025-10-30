import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dntlbhmljceaefycdsbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGxiaG1samNlYWVmeWNkc2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMDU4MDMsImV4cCI6MjA2MzY4MTgwM30.DyBPu5O9C8geyV6pliyIGkhwGegwV_9FQeKQ8prSdHY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProposta107() {
  console.log('Verificando se proposta ID 107 existe...');
  
  // Verificar se proposta ID 107 existe (usando 'id' como chave primária)
  const { data: proposta, error: propostaError } = await supabase
    .from('propostas')
    .select('*')
    .eq('id', 107)
    .single();
    
  if (propostaError) {
    console.error('Erro ao buscar proposta 107:', propostaError);
  } else {
    console.log('Proposta 107 encontrada:', proposta);
  }
  
  // Verificar todas as propostas para entender o range de IDs
  const { data: todasPropostas, error: todasError } = await supabase
    .from('propostas')
    .select('id, numero_proposta, titulo, status')
    .order('id', { ascending: true });
    
  if (todasError) {
    console.error('Erro ao buscar todas as propostas:', todasError);
  } else {
    console.log('IDs de propostas existentes:', todasPropostas.map(p => p.id));
    console.log('Total de propostas:', todasPropostas.length);
    console.log('Primeiras 5 propostas:', todasPropostas.slice(0, 5));
  }
  
  // Verificar relacionamento com solicitacao_orcamentos
  const { data: relacionamento, error: relError } = await supabase
    .from('propostas')
    .select(`
      id,
      orcamento_id,
      numero_proposta,
      orcamento:solicitacao_orcamentos!inner(
        solicitacao_id,
        numero_solicitacao
      )
    `)
    .eq('id', 107);
    
  if (relError) {
    console.error('Erro no relacionamento:', relError);
  } else {
    console.log('Relacionamento proposta 107:', relacionamento);
  }
  
  // Verificar políticas RLS
  console.log('\nVerificando políticas RLS...');
  
  // Tentar buscar sem filtros para ver se há problemas de RLS
  const { data: rlsTest, error: rlsError } = await supabase
    .from('propostas')
    .select('id, numero_proposta, created_at')
    .limit(5);
    
  if (rlsError) {
    console.error('Erro de RLS:', rlsError);
  } else {
    console.log('Teste RLS - Propostas acessíveis:', rlsTest);
  }
  
  // Verificar dados das tabelas relacionadas
  console.log('\nVerificando dados das tabelas relacionadas...');
  
  const { data: consultores, error: consultoresError } = await supabase
    .from('consultores')
    .select('id, nome, role, auth_user_id')
    .limit(5);
    
  if (consultoresError) {
    console.error('Erro ao buscar consultores:', consultoresError);
  } else {
    console.log('Consultores encontrados:', consultores);
  }
  
  const { data: orcamentos, error: orcamentosError } = await supabase
    .from('solicitacao_orcamentos')
    .select('solicitacao_id, numero_solicitacao, consultor_id')
    .limit(5);
    
  if (orcamentosError) {
    console.error('Erro ao buscar orçamentos:', orcamentosError);
  } else {
    console.log('Orçamentos encontrados:', orcamentos);
  }
}

checkProposta107().catch(console.error);