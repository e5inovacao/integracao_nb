const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://crfdqfmtymqavfkmgtap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZmRxZm10eW1xYXZma21ndGFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkzMDg3OCwiZXhwIjoyMDcwNTA2ODc4fQ.-DbIGgR_xv-BdpjubuJu-Yfat8o5QUjQ1MXaba5zrbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateImages() {
  try {
    console.log('🔍 Investigando problemas de imagens na tabela produtos_asia...');
    
    // Buscar produtos com campos de imagem (expandindo para 200 produtos)
    const { data: produtos, error } = await supabase
      .from('produtos_asia')
      .select('referencia_pai, nome_pai, imagem, img01, img02')
      .limit(200);
    
    if (error) {
      console.error('❌ Erro ao buscar produtos:', error);
      return;
    }
    
    console.log(`📊 Analisando ${produtos.length} produtos...`);
    
    let problemasEncontrados = {
      imagensVazias: 0,
      urlsInvalidas: 0,
      caracteresEspeciais: 0,
      exemplos: []
    };
    
    produtos.forEach((produto, index) => {
      const { referencia_pai, nome_pai, imagem, img01, img02 } = produto;
      let problemas = [];
      
      // Verificar campos de imagem vazios ou nulos
       if (!imagem && !img01 && !img02) {
         problemasEncontrados.imagensVazias++;
         problemas.push('Todas as imagens estão vazias');
       }
       
       // Verificar campos individuais vazios
       if (!imagem) problemas.push('Campo imagem vazio');
       if (!img01) problemas.push('Campo img01 vazio');
       if (!img02) problemas.push('Campo img02 vazio');
      
      // Verificar URLs inválidas
      [imagem, img01, img02].forEach((url, i) => {
        if (url) {
          const fieldName = ['imagem', 'img01', 'img02'][i];
          
          // Verificar se é uma URL válida
           if (!url.startsWith('http://') && !url.startsWith('https://') && url.trim() !== '') {
             problemasEncontrados.urlsInvalidas++;
             problemas.push(`${fieldName}: URL inválida (${url})`);
           }
           
           // Verificar caracteres especiais problemáticos
           if (url.includes('�') || url.includes('_x000D_') || url.includes('\\') || url.includes('\r') || url.includes('\n')) {
             problemasEncontrados.caracteresEspeciais++;
             problemas.push(`${fieldName}: Caracteres especiais (${url})`);
           }
           
           // Verificar URLs muito curtas ou suspeitas
           if (url.trim().length < 10 && url.trim() !== '') {
             problemasEncontrados.urlsInvalidas++;
             problemas.push(`${fieldName}: URL muito curta (${url})`);
           }
        }
      });
      
      // Adicionar exemplos dos primeiros 10 produtos com problemas
      if (problemas.length > 0 && problemasEncontrados.exemplos.length < 10) {
        problemasEncontrados.exemplos.push({
          referencia: referencia_pai,
          nome: nome_pai,
          problemas: problemas
        });
      }
    });
    
    // Relatório final
    console.log('\n📋 RELATÓRIO DE PROBLEMAS DE IMAGENS:');
    console.log('=====================================');
    console.log(`🔸 Produtos sem imagens: ${problemasEncontrados.imagensVazias}`);
    console.log(`🔸 URLs inválidas: ${problemasEncontrados.urlsInvalidas}`);
    console.log(`🔸 Caracteres especiais: ${problemasEncontrados.caracteresEspeciais}`);
    
    if (problemasEncontrados.exemplos.length > 0) {
      console.log('\n🔍 EXEMPLOS DE PROBLEMAS:');
      problemasEncontrados.exemplos.forEach((exemplo, i) => {
        console.log(`\n${i + 1}. ${exemplo.referencia} - ${exemplo.nome}`);
        exemplo.problemas.forEach(problema => {
          console.log(`   • ${problema}`);
        });
      });
    }
    
    console.log('\n✅ Investigação concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a investigação:', error);
  }
}

// Executar a investigação
investigateImages();