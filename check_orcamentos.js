import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOrcamentos() {
  console.log('Verificando dados na tabela orcamentos_sistema...');
  
  try {
    // Buscar todos os orçamentos
    const { data: orcamentos, error } = await supabase
      .from('orcamentos_sistema')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar orçamentos:', error);
      return;
    }
    
    console.log(`\nTotal de orçamentos encontrados: ${orcamentos.length}`);
    
    if (orcamentos.length > 0) {
      console.log('\n=== ÚLTIMOS ORÇAMENTOS ===');
      orcamentos.slice(0, 5).forEach((orc, index) => {
        console.log(`\n${index + 1}. Orçamento ID: ${orc.id}`);
        console.log(`   Número: ${orc.numero_orcamento}`);
        console.log(`   Usuário ID: ${orc.usuario_id}`);
        console.log(`   Status: ${orc.status}`);
        console.log(`   Valor Total: R$ ${orc.valor_total}`);
        console.log(`   Criado em: ${orc.created_at}`);
        console.log(`   Observações: ${orc.observacoes || 'Nenhuma'}`);
      });
    } else {
      console.log('\n❌ Nenhum orçamento encontrado na tabela!');
    }
    
    // Verificar também os itens
    const { data: itens, error: itensError } = await supabase
      .from('itens_orcamento_sistema')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (itensError) {
      console.error('Erro ao buscar itens:', itensError);
    } else {
      console.log(`\nTotal de itens de orçamento encontrados: ${itens.length}`);
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

checkOrcamentos();