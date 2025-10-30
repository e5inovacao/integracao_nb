const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Função para extrair ID ecológico (copiada do código original)
function extractEcologicalId(ecologicalId) {
  if (!ecologicalId) return null;
  
  // Se já é um número, retornar como string
  if (typeof ecologicalId === 'number') {
    return ecologicalId.toString();
  }
  
  // Se é string, tentar extrair o número
  if (typeof ecologicalId === 'string') {
    // Remover prefixo 'eco_' se existir
    let cleanId = ecologicalId.replace(/^eco_/, '');
    
    // Remover sufixo '_31e' se existir
    cleanId = cleanId.replace(/_31e$/, '');
    
    // Se o que sobrou é um número válido, retornar
    if (/^\d+$/.test(cleanId)) {
      return cleanId;
    }
    
    // Tentar extrair apenas números da string
    const numbers = cleanId.match(/\d+/);
    if (numbers && numbers[0]) {
      return numbers[0];
    }
  }
  
  return null;
}

// Função de teste
async function testQuoteCreation() {
  try {
    console.log('🧪 === TESTE DE CRIAÇÃO DE ORÇAMENTO ===\n');
    
    // 1. Primeiro, vamos buscar um produto ecológico válido
    console.log('1. Buscando produtos ecológicos disponíveis...');
    const { data: produtos, error: produtosError } = await supabase
      .from('produtos_ecologicos')
      .select('"16\t\tid", "Descricao", "Nome", stativo')
      .eq('stativo', 'S')
      .limit(3);
    
    if (produtosError) {
      console.error('❌ Erro ao buscar produtos:', produtosError);
      return;
    }
    
    if (!produtos || produtos.length === 0) {
      console.error('❌ Nenhum produto ecológico encontrado');
      return;
    }
    
    console.log(`✅ Encontrados ${produtos.length} produtos:`);
    produtos.forEach(p => {
      console.log(`   - ID: ${p['16\t\tid']}, Nome: ${p.Nome || p.Descricao}, Status: ${p.stativo}`);
    });
    
    // 2. Criar um usuário de teste se não existir
    console.log('\n2. Verificando/criando usuário de teste...');
    const testUser = {
      nome: 'Usuário Teste',
      telefone: '(11) 99999-9999',
      empresa: 'Empresa Teste',
      email: 'teste@teste.com'
    };
    
    const { data: existingUser } = await supabase
      .from('usuarios_sistema')
      .select('id')
      .eq('email', testUser.email)
      .maybeSingle();
    
    let userId;
    if (existingUser) {
      userId = existingUser.id;
      console.log(`✅ Usuário existente encontrado: ${userId}`);
    } else {
      const { data: newUser, error: userError } = await supabase
        .from('usuarios_sistema')
        .insert([testUser])
        .select('id')
        .single();
      
      if (userError) {
        console.error('❌ Erro ao criar usuário:', userError);
        return;
      }
      
      userId = newUser.id;
      console.log(`✅ Novo usuário criado: ${userId}`);
    }
    
    // 3. Criar um orçamento de teste
    console.log('\n3. Criando orçamento de teste...');
    const { data: orcamento, error: orcamentoError } = await supabase
      .from('orcamentos_sistema')
      .insert([{
        usuario_id: userId,
        observacoes: 'Orçamento de teste - criado automaticamente',
        status: 'pendente'
      }])
      .select('id')
      .single();
    
    if (orcamentoError) {
      console.error('❌ Erro ao criar orçamento:', orcamentoError);
      return;
    }
    
    console.log(`✅ Orçamento criado: ${orcamento.id}`);
    
    // 4. Simular itens do carrinho
    const produto = produtos[0];
    const produtoId = produto['16\t\tid'];
    const ecologicalId = `eco_${produtoId}_31e`;
    
    console.log('\n4. Simulando criação de itens do orçamento...');
    console.log(`   - Produto ID: ${produtoId}`);
    console.log(`   - Ecological ID: ${ecologicalId}`);
    
    const cartItems = [{
      id: '1',
      name: produto.Nome || produto.Descricao || 'Produto Teste',
      ecologicalId: ecologicalId,
      quantity: 2,
      unitPrice: 15.50,
      selectedColor: 'Azul',
      itemNotes: 'Teste de criação de item'
    }];
    
    // 5. Testar a função de criação de itens (simulando o código original)
    console.log('\n5. Testando criação de itens...');
    
    const validItemsData = [];
    
    for (const item of cartItems) {
      console.log(`\n--- Processando item: ${item.name} ---`);
      
      // Verificar se ecologicalId existe
      if (!item.ecologicalId) {
        console.warn(`⚠️ AVISO: ecologicalId não fornecido para o item ${item.name}. Pulando item.`);
        continue;
      }
      
      // Extrair e validar o ID do produto
      const produtoEcologicoId = extractEcologicalId(item.ecologicalId);
      
      if (!produtoEcologicoId) {
        console.warn(`⚠️ AVISO: Não foi possível extrair ID válido do ecologicalId: ${item.ecologicalId}. Pulando item ${item.name}.`);
        continue;
      }

      console.log(`🔍 Verificando existência do produto ID ${produtoEcologicoId} no banco...`);

      // Verificar se o produto existe na tabela produtos_ecologicos
      const { data: produtoCheck, error } = await supabase
        .from('produtos_ecologicos')
        .select('"16\t\tid"')
        .eq('"16\t\tid"', produtoEcologicoId)
        .eq('stativo', 'S')
        .maybeSingle();
        
      if (error) {
        console.error(`❌ ERRO na consulta do produto ID ${produtoEcologicoId}:`, error);
        console.warn(`⚠️ Pulando item ${item.name} devido ao erro na consulta.`);
        continue;
      }
      
      if (!produtoCheck) {
        console.warn(`⚠️ AVISO: Produto ecológico ID ${produtoEcologicoId} não encontrado ou inativo.`);
        console.warn(`⚠️ Pulando item ${item.name} - produto não existe na tabela produtos_ecologicos.`);
        continue;
      }
      
      console.log(`✅ Produto ID ${produtoEcologicoId} encontrado e válido. Adicionando ao orçamento.`);
    
      // Adicionar item válido à lista
      validItemsData.push({
        orcamento_id: orcamento.id,
        produto_ecologico_id: produtoEcologicoId,
        quantidade: item.quantity,
        preco_unitario: item.unitPrice || 0,
        observacoes: [
          `Produto: ${item.name}`,
          item.selectedColor ? `Cor: ${item.selectedColor}` : null,
          item.itemNotes ? `Observações: ${item.itemNotes}` : null
        ].filter(Boolean).join(' | ') || null
      });
    }

    console.log(`\n📊 RESUMO: ${validItemsData.length} itens válidos de ${cartItems.length} itens totais`);
    
    // 6. Inserir os itens
    if (validItemsData.length > 0) {
      console.log('\n6. Inserindo itens na tabela itens_orcamento_sistema...');
      
      const { data: createdItems, error: itemsError } = await supabase
        .from('itens_orcamento_sistema')
        .insert(validItemsData)
        .select();

      if (itemsError) {
        console.error('❌ Erro ao inserir itens do orçamento:', itemsError);
        throw new Error(`Erro ao criar itens do orçamento: ${itemsError.message}`);
      }

      console.log(`✅ ${createdItems.length} itens criados com sucesso no orçamento.`);
      console.log('Itens criados:', createdItems);
    } else {
      console.warn('⚠️ Nenhum item válido para inserir.');
    }
    
    // 7. Verificar se os itens foram realmente inseridos
    console.log('\n7. Verificando itens inseridos na tabela...');
    const { data: insertedItems, error: checkError } = await supabase
      .from('itens_orcamento_sistema')
      .select('*')
      .eq('orcamento_id', orcamento.id);
    
    if (checkError) {
      console.error('❌ Erro ao verificar itens inseridos:', checkError);
    } else {
      console.log(`✅ Verificação: ${insertedItems.length} itens encontrados na tabela`);
      if (insertedItems.length > 0) {
        console.log('Detalhes dos itens:', insertedItems);
      }
    }
    
    console.log('\n🎉 === TESTE CONCLUÍDO ===');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar o teste
testQuoteCreation().then(() => {
  console.log('\n✅ Script finalizado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});