// Teste simples das stored procedures do Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wnqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWpxanFqcWpxanFqcWoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNzU2NzE5NCwiZXhwIjoyMDUzMTQzMTk0fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStoredProcedures() {
  console.log('Testando stored procedures...');
  
  try {
    // Teste 1: Verificar se a função criar_orcamento_completo existe
    const { data: createResult, error: createError } = await supabase
      .rpc('criar_orcamento_completo', {
        p_cliente_id: 1,
        p_usuario_id: 1,
        p_observacoes: 'Teste de orçamento',
        p_itens: [{
          produto_id: 1,
          quantidade: 2,
          preco_unitario: 10.50
        }]
      });
    
    if (createError) {
      console.log('Erro ao testar criar_orcamento_completo:', createError.message);
    } else {
      console.log('✓ criar_orcamento_completo funcionando:', createResult);
    }
    
    // Teste 2: Verificar se a função buscar_orcamentos_usuario existe
    const { data: searchResult, error: searchError } = await supabase
      .rpc('buscar_orcamentos_usuario', {
        p_usuario_id: 1,
        p_limite: 10,
        p_offset: 0
      });
    
    if (searchError) {
      console.log('Erro ao testar buscar_orcamentos_usuario:', searchError.message);
    } else {
      console.log('✓ buscar_orcamentos_usuario funcionando:', searchResult);
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

testStoredProcedures();