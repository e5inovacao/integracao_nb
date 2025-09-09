const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://crfdqfmtymqavfkmgtap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZmRxZm10eW1xYXZma21ndGFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkzMDg3OCwiZXhwIjoyMDcwNTA2ODc4fQ.-DbIGgR_xv-BdpjubuJu-Yfat8o5QUjQ1MXaba5zrbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateIssues() {
  console.log('=== INVESTIGAÇÃO DE PROBLEMAS NA TABELA PRODUTOS_ASIA ===\n');
  
  try {
    // Consulta simples para verificar se conseguimos acessar os dados
    const { data: produtos, error } = await supabase
      .from('produtos_asia')
      .select('referencia_pai, nome_pai, descricao, imagem, img01, img02')
      .limit(10);
    
    if (error) {
      console.log('Erro ao consultar produtos_asia:', error);
      return;
    }
    
    console.log(`Total de produtos encontrados: ${produtos.length}\n`);
    
    if (produtos.length === 0) {
      console.log('Nenhum produto encontrado na tabela produtos_asia.');
      return;
    }
    
    // Análise de problemas
    let imageIssues = [];
    let specialCharIssues = [];
    
    produtos.forEach((produto, index) => {
      console.log(`\n--- PRODUTO ${index + 1} ---`);
      console.log(`Referência: ${produto.referencia_pai}`);
      console.log(`Nome: ${produto.nome_pai}`);
      console.log(`Descrição: ${produto.descricao}`);
      console.log(`Imagem: ${produto.imagem}`);
      console.log(`Img01: ${produto.img01}`);
      console.log(`Img02: ${produto.img02}`);
      
      // Verificar problemas de imagem
      const imageFields = ['imagem', 'img01', 'img02'];
      imageFields.forEach(field => {
        const imageUrl = produto[field];
        if (imageUrl) {
          // Verificar se é uma URL válida
          if (!imageUrl.startsWith('http') && !imageUrl.startsWith('https')) {
            imageIssues.push({
              produto: produto.referencia_pai || produto.nome_pai,
              campo: field,
              problema: 'URL não começa com http/https',
              valor: imageUrl
            });
          }
          
          // Verificar se contém caracteres especiais problemáticos
          if (imageUrl.includes('�')) {
            imageIssues.push({
              produto: produto.referencia_pai || produto.nome_pai,
              campo: field,
              problema: 'Contém caracteres especiais (�)',
              valor: imageUrl
            });
          }
        }
      });
      
      // Verificar problemas de caracteres especiais em texto
      const textFields = ['nome_pai', 'descricao'];
      textFields.forEach(field => {
        const text = produto[field];
        if (text && text.includes('�')) {
          specialCharIssues.push({
            produto: produto.referencia_pai || produto.nome_pai,
            campo: field,
            problema: 'Contém caracteres especiais (�)',
            valor: text
          });
        }
      });
    });
    
    // Relatório de problemas
    console.log('\n\n=== RELATÓRIO DE PROBLEMAS ===\n');
    
    console.log(`Problemas de imagem encontrados: ${imageIssues.length}`);
    imageIssues.forEach((issue, index) => {
      console.log(`${index + 1}. Produto: ${issue.produto}`);
      console.log(`   Campo: ${issue.campo}`);
      console.log(`   Problema: ${issue.problema}`);
      console.log(`   Valor: ${issue.valor}\n`);
    });
    
    console.log(`Problemas de caracteres especiais encontrados: ${specialCharIssues.length}`);
    specialCharIssues.forEach((issue, index) => {
      console.log(`${index + 1}. Produto: ${issue.produto}`);
      console.log(`   Campo: ${issue.campo}`);
      console.log(`   Problema: ${issue.problema}`);
      console.log(`   Valor: ${issue.valor}\n`);
    });
    
  } catch (error) {
    console.log('Erro ao executar investigação:', error);
  }
}

investigateIssues();