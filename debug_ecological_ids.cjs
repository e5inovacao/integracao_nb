const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://hnqmkqjqzjvxjxkqzjvx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhucW1rcWpxemp2eGp4a3F6anZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1NzE4NzcsImV4cCI6MjA1MTE0Nzg3N30.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para gerar ID consistente (copiada do backend)
function generateConsistentEcologicalId(data) {
  // Se tem ID no banco, usar ele como base
  if (data.id) {
    return `eco_${data.id}`;
  }
  
  // Criar um ID determinístico baseado nos dados do produto
  const parts = [];
  
  // Priorizar Referencia se disponível
  if (data.Referencia && data.Referencia.trim()) {
    parts.push(data.Referencia.trim());
  }
  // Se não tem referência, usar Codigo Fornecedor
  else if (data['Codigo Fornecedor'] && data['Codigo Fornecedor'].trim()) {
    parts.push(data['Codigo Fornecedor'].trim());
  }
  // Se não tem nenhum dos dois, usar as primeiras 3 letras do fornecedor
  else if (data.Fornecedor && data.Fornecedor.trim()) {
    parts.push(data.Fornecedor.substring(0, 3).toUpperCase());
  }
  // Último recurso: usar hash do nome
  else {
    const name = data.Nome || 'produto';
    const hash = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
    parts.push(hash);
  }
  
  // Criar um hash determinístico dos dados (SEM timestamp)
  const dataString = JSON.stringify({
    nome: data.Nome,
    referencia: data.Referencia,
    fornecedor: data.Fornecedor,
    codigo: data['Codigo Fornecedor'],
    descricao: data.Descricao
  }, Object.keys(data).sort()); // Ordenar chaves para consistência
  
  // Criar um hash simples e determinístico
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const hashSuffix = Math.abs(hash).toString(36).substring(0, 4);
  return `eco_${parts.join('_')}_${hashSuffix}`;
}

// Função para extrair ID ecológico (copiada do backend)
function extractEcologicalId(ecologicalId) {
  console.log('🔧 extractEcologicalId - Input:', ecologicalId, 'Tipo:', typeof ecologicalId);
  
  // Verificar se o input é válido
  if (ecologicalId === null || ecologicalId === undefined) {
    console.error('❌ extractEcologicalId - Input é null ou undefined');
    return null;
  }
  
  // Se já é um número, validar se é positivo
  if (typeof ecologicalId === 'number') {
    if (isNaN(ecologicalId) || ecologicalId <= 0) {
      console.error('❌ extractEcologicalId - Número inválido:', ecologicalId);
      return null;
    }
    console.log('✅ extractEcologicalId - Número válido:', ecologicalId);
    return ecologicalId;
  }
  
  // Se é string, tentar extrair o número
  if (typeof ecologicalId === 'string') {
    // Remover prefixo 'eco_' se existir
    let cleanId = ecologicalId.replace(/^eco_/, '');
    console.log('🔧 extractEcologicalId - ID limpo:', cleanId);
    
    // Tentar converter para número
    const numericId = parseInt(cleanId, 10);
    
    if (isNaN(numericId) || numericId <= 0) {
      console.error('❌ extractEcologicalId - Não foi possível extrair número válido de:', ecologicalId);
      return null;
    }
    
    console.log('✅ extractEcologicalId - Número extraído:', numericId);
    return numericId;
  }
  
  console.error('❌ extractEcologicalId - Tipo não suportado:', typeof ecologicalId);
  return null;
}

async function debugEcologicalIds() {
  try {
    console.log('🔍 === DEBUG DE IDs ECOLÓGICOS ===\n');
    
    // 1. Buscar produtos ecológicos do banco
    console.log('1. Buscando produtos ecológicos do banco...');
    const { data: produtos, error } = await supabase
      .from('produtos_ecologicos')
      .select('*')
      .eq('stativo', 'S')
      .limit(3);
    
    if (error) {
      console.error('❌ Erro ao buscar produtos:', error);
      return;
    }
    
    console.log(`✅ Encontrados ${produtos.length} produtos\n`);
    
    // 2. Para cada produto, mostrar como os IDs são gerados
    for (const produto of produtos) {
      console.log(`--- PRODUTO: ${produto.Nome} ---`);
      console.log('📊 Dados do banco:', {
        id: produto.id,
        Nome: produto.Nome,
        Referencia: produto.Referencia,
        'Codigo Fornecedor': produto['Codigo Fornecedor'],
        Fornecedor: produto.Fornecedor
      });
      
      // Gerar ID como o frontend faz
      const frontendId = generateConsistentEcologicalId(produto);
      console.log('🎨 ID gerado pelo frontend:', frontendId);
      
      // Tentar extrair ID como o backend faz
      const backendId = extractEcologicalId(frontendId);
      console.log('🔧 ID extraído pelo backend:', backendId);
      
      // Verificar se o ID extraído corresponde ao ID real do banco
      const realId = produto.id;
      console.log('🏦 ID real no banco:', realId);
      
      if (backendId === realId) {
        console.log('✅ MATCH: IDs correspondem!');
      } else {
        console.log('❌ PROBLEMA: IDs NÃO correspondem!');
        console.log('   - Frontend gera:', frontendId);
        console.log('   - Backend extrai:', backendId);
        console.log('   - Banco tem:', realId);
      }
      
      console.log('');
    }
    
    // 3. Testar cenário real: como seria no carrinho
    console.log('\n🛒 === SIMULAÇÃO DO CARRINHO ===');
    const produto = produtos[0];
    const produtoFrontend = {
      id: generateConsistentEcologicalId(produto),
      name: produto.Nome,
      isEcological: true
    };
    
    console.log('Produto no frontend:', produtoFrontend);
    
    // Como o ProductDetails.tsx define o ecologicalId
    const ecologicalId = produtoFrontend.isEcological ? produtoFrontend.id : undefined;
    console.log('ecologicalId definido no carrinho:', ecologicalId);
    
    // Como o backend tenta processar
    const extractedId = extractEcologicalId(ecologicalId);
    console.log('ID extraído pelo backend:', extractedId);
    
    // Verificar se existe no banco
    if (extractedId) {
      const { data: produtoCheck } = await supabase
        .from('produtos_ecologicos')
        .select('id, Nome')
        .eq('id', extractedId)
        .eq('stativo', 'S')
        .single();
      
      if (produtoCheck) {
        console.log('✅ Produto encontrado no banco:', produtoCheck);
      } else {
        console.log('❌ Produto NÃO encontrado no banco com ID:', extractedId);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
}

// Executar o debug
debugEcologicalIds();