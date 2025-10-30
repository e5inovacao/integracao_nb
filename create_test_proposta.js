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

async function createTestProposta() {
  try {
    console.log('🔧 Criando proposta de teste para ID 107...');
    
    // Criar proposta de teste com ID 107 e orcamento_id 107
    const { data, error } = await supabase
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

    if (error) {
      console.error('❌ Erro ao criar proposta:', error);
      return;
    }

    console.log('✅ Proposta criada com sucesso:', data);

    // Verificar se a proposta foi criada
    const { data: verificacao, error: errorVerificacao } = await supabase
      .from('propostas')
      .select('*')
      .eq('id', 107)
      .single();

    if (errorVerificacao) {
      console.error('❌ Erro ao verificar proposta criada:', errorVerificacao);
      return;
    }

    console.log('✅ Verificação - Proposta 107 existe:', verificacao);

  } catch (err) {
    console.error('💥 Erro geral:', err);
  }
}

createTestProposta();