import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  try {
    console.log('🔧 Criando dados de teste...');
    
    // 1. Criar consultor de teste
    console.log('📝 Criando consultor de teste...');
    const { data: consultorData, error: consultorError } = await supabase
      .from('consultores')
      .insert({
        id: 1,
        nome: 'Admin Teste',
        email: 'admin@naturezabrindes.com.br',
        telefone: '(27) 99999-9999',
        auth_user_id: '00000000-0000-0000-0000-000000000000'
      })
      .select();

    if (consultorError && consultorError.code !== '23505') { // Ignora erro de duplicata
      console.error('❌ Erro ao criar consultor:', consultorError);
    } else {
      console.log('✅ Consultor criado/já existe:', consultorData || 'Já existe');
    }

    // 2. Criar proposta de teste
    console.log('📝 Criando proposta de teste...');
    const { data: propostaData, error: propostaError } = await supabase
      .from('propostas')
      .insert({
        id: 107,
        orcamento_id: 107,
        numero_proposta: 'PROP-107',
        titulo: 'Proposta de Teste',
        descricao: 'Proposta criada para teste de correção de erros',
        status: 'pendente',
        valor_total: 1000.00
      })
      .select();

    if (propostaError && propostaError.code !== '23505') { // Ignora erro de duplicata
      console.error('❌ Erro ao criar proposta:', propostaError);
    } else {
      console.log('✅ Proposta criada/já existe:', propostaData || 'Já existe');
    }

    // 3. Verificar se tudo foi criado corretamente
    console.log('🔍 Verificando dados criados...');
    
    const { data: consultorVerif, error: consultorVerifError } = await supabase
      .from('consultores')
      .select('*')
      .eq('id', 1)
      .single();

    if (consultorVerifError) {
      console.error('❌ Erro ao verificar consultor:', consultorVerifError);
    } else {
      console.log('✅ Consultor verificado:', consultorVerif);
    }

    const { data: propostaVerif, error: propostaVerifError } = await supabase
      .from('propostas')
      .select('*')
      .eq('id', 107)
      .single();

    if (propostaVerifError) {
      console.error('❌ Erro ao verificar proposta:', propostaVerifError);
    } else {
      console.log('✅ Proposta verificada:', propostaVerif);
    }

  } catch (err) {
    console.error('💥 Erro geral:', err);
  }
}

createTestData();