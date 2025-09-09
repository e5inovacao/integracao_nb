import { supabase } from '../../supabase/client';
import type { Database } from '../../supabase/types';

type OrcamentoSistema = Database['Tables']['orcamentos_sistema']['Row'];
type OrcamentoSistemaInsert = Database['Tables']['orcamentos_sistema']['Insert'];
type ItemOrcamentoSistema = Database['Tables']['itens_orcamento_sistema']['Row'];
type ItemOrcamentoSistemaInsert = Database['Tables']['itens_orcamento_sistema']['Insert'];
type UsuarioSistema = Database['Tables']['usuarios_sistema']['Row'];
type UsuarioSistemaInsert = Database['Tables']['usuarios_sistema']['Insert'];

// Os tipos são importados do Database acima

export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice?: number;
  customizations?: Record<string, any>;
  ecologicalId?: number;
  selectedColor?: string;
  itemNotes?: string;
}

export interface CustomerData {
  name: string;
  phone: string;
  email: string;
  company?: string;
  cnpj?: string;
  address?: string;
}

export interface QuoteRequestData {
  customerData: CustomerData;
  items: CartItem[];
  notes?: string;
}

/**
 * Gera um número único para o orçamento (será gerado automaticamente pelo trigger)
 */
export async function generateQuoteNumber(): Promise<string | null> {
  // O número será gerado automaticamente pelo trigger set_quote_number
  // Retornamos null para indicar que deve ser auto-gerado
  return null;
}

/**
 * Cria ou busca um usuário no sistema
 * Permite usuários não autenticados para solicitação de orçamentos
 */
export async function getOrCreateUser(customerData: CustomerData): Promise<UsuarioSistema> {
  try {
    console.log('\n🔍 === INICIANDO getOrCreateUser ===');
    console.log('👤 Dados do cliente recebidos:', JSON.stringify(customerData, null, 2));
    
    // Verificar se o usuário está autenticado (opcional)
    console.log('🔐 Verificando autenticação...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    let userId: string | null = null;
    
    // Se usuário autenticado, usar o ID do auth
    if (!authError && user) {
      userId = user.id;
      console.log('✅ Usuário autenticado encontrado:', userId);
      
      // Tentar buscar usuário existente pelo user_id
      console.log('🔍 Buscando usuário autenticado na tabela usuarios_sistema...');
      const { data: existingUser, error: searchError } = await supabase
        .from('usuarios_sistema')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar usuário autenticado:', searchError);
      } else if (existingUser) {
        console.log('✅ Usuário autenticado encontrado na tabela:', existingUser.nome);
        return existingUser;
      } else {
        console.log('ℹ️ Usuário autenticado não encontrado na tabela usuarios_sistema');
      }
    } else {
      console.log('ℹ️ Usuário não autenticado ou erro na autenticação:', authError?.message || 'N/A');
    }
    
    // Para usuários não autenticados ou novos usuários autenticados
    // Buscar por email primeiro, depois por telefone para evitar duplicatas
    console.log('\n📧 Buscando usuário por email:', customerData.email);
    const { data: existingUserByEmail, error: emailSearchError } = await supabase
      .from('usuarios_sistema')
      .select('*')
      .eq('email', customerData.email)
      .single();

    if (emailSearchError && emailSearchError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar usuário por email:', emailSearchError);
    } else if (existingUserByEmail) {
      console.log('✅ Usuário encontrado por email:', existingUserByEmail.nome);
      // Se encontrou usuário pelo email, atualizar user_id se necessário
      if (userId && !existingUserByEmail.user_id) {
        console.log('🔄 Atualizando user_id do usuário existente...');
        const { data: updatedUser, error: updateError } = await supabase
          .from('usuarios_sistema')
          .update({ user_id: userId })
          .eq('id', existingUserByEmail.id)
          .select()
          .single();
          
        if (updateError) {
          console.error('❌ Erro ao atualizar user_id:', updateError);
          return existingUserByEmail;
        }
        console.log('✅ User_id atualizado com sucesso');
        return updatedUser;
      }
      return existingUserByEmail;
    }

    // Fallback: buscar por telefone se não encontrou por email
    console.log('\n📞 Buscando usuário por telefone:', customerData.phone);
    const { data: existingUserByPhone, error: phoneSearchError } = await supabase
      .from('usuarios_sistema')
      .select('*')
      .eq('telefone', customerData.phone)
      .single();

    if (phoneSearchError && phoneSearchError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar usuário por telefone:', phoneSearchError);
    } else if (existingUserByPhone) {
      console.log('✅ Usuário encontrado por telefone:', existingUserByPhone.nome);
      // Se encontrou usuário pelo telefone, atualizar user_id se necessário
      if (userId && !existingUserByPhone.user_id) {
        console.log('🔄 Atualizando user_id do usuário existente...');
        const { data: updatedUser, error: updateError } = await supabase
          .from('usuarios_sistema')
          .update({ user_id: userId })
          .eq('id', existingUserByPhone.id)
          .select()
          .single();
          
        if (updateError) {
          console.error('❌ Erro ao atualizar user_id:', updateError);
          return existingUserByPhone;
        }
        console.log('✅ User_id atualizado com sucesso');
        return updatedUser;
      }
      return existingUserByPhone;
    } else {
      console.log('ℹ️ Usuário não encontrado por telefone');
    }

    // Criar novo usuário
    console.log('\n➕ Criando novo usuário...');
    const newUserData: UsuarioSistemaInsert = {
      user_id: userId, // Pode ser null para usuários não autenticados
      nome: customerData.name,
      telefone: customerData.phone,
      email: customerData.email,
      empresa: customerData.company || null
    };
    
    console.log('📝 Dados do novo usuário:', JSON.stringify(newUserData, null, 2));

    const { data: newUser, error: createError } = await supabase
      .from('usuarios_sistema')
      .insert(newUserData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar usuário na tabela usuarios_sistema:', createError);
      console.error('❌ Dados que tentamos inserir:', JSON.stringify(newUserData, null, 2));
      throw new Error(`Erro ao criar usuário no sistema: ${createError.message}`);
    }
    
    if (!newUser) {
      console.error('❌ ERRO: Usuário foi inserido mas não retornou dados');
      throw new Error('Usuário foi inserido mas não retornou dados');
    }

    console.log('✅ Usuário criado com sucesso na tabela usuarios_sistema:');
    console.log('✅ Dados do usuário criado:', JSON.stringify(newUser, null, 2));
    return newUser;
  } catch (error) {
    console.error('❌ ERRO GERAL no getOrCreateUser:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
    throw error;
  }
}

/**
 * Cria um novo orçamento
 */
export async function createQuoteRequest(
  customerData: CustomerData,
  items: CartItem[],
  notes?: string
): Promise<OrcamentoSistema> {
  try {
    console.log('\n=== INICIANDO CRIAÇÃO DE ORÇAMENTO ===');
    console.log('📋 Dados do cliente:', JSON.stringify(customerData, null, 2));
    console.log('🛒 Itens do carrinho:', items.length, 'itens');
    console.log('📝 Observações:', notes || 'Nenhuma');
    
    // 1. Cria ou busca o usuário
    console.log('\n🔍 Etapa 1: Criando/buscando usuário...');
    const user = await getOrCreateUser(customerData);
    console.log('✅ Usuário obtido:', {
      id: user.id,
      nome: user.nome,
      telefone: user.telefone
    });
    
    // 2. Calcula o valor total estimado
    console.log('\n💰 Etapa 2: Calculando valor total...');
    const valorTotal = items.reduce((total, item) => {
      const unitPrice = item.unitPrice || 0;
      const itemTotal = unitPrice * item.quantity;
      console.log(`  - ${item.name}: ${item.quantity} x R$ ${unitPrice} = R$ ${itemTotal}`);
      return total + itemTotal;
    }, 0);
    console.log('💰 Valor total calculado: R$', valorTotal);
    
    const quoteData: OrcamentoSistemaInsert = {
      // numero_orcamento será gerado automaticamente pelo trigger
      usuario_id: user.id,
      observacoes: notes || null,
      valor_total: valorTotal,
      status: 'pendente'
    };
    
    console.log('\n📄 Etapa 3: Preparando dados do orçamento...');
    console.log('📄 Dados para inserção:', JSON.stringify(quoteData, null, 2));

    console.log('\n💾 Etapa 4: Inserindo orçamento na tabela orcamentos_sistema...');
    const { data: newQuote, error: quoteError } = await supabase
      .from('orcamentos_sistema')
      .insert(quoteData)
      .select()
      .single();

    if (quoteError) {
      console.error('❌ ERRO ao inserir orçamento na tabela orcamentos_sistema:');
      console.error('❌ Detalhes do erro:', JSON.stringify(quoteError, null, 2));
      console.error('❌ Dados que tentamos inserir:', JSON.stringify(quoteData, null, 2));
      throw new Error(`Erro ao criar orçamento: ${quoteError.message}`);
    }
    
    if (!newQuote) {
      console.error('❌ ERRO: Orçamento foi inserido mas não retornou dados');
      throw new Error('Orçamento foi inserido mas não retornou dados');
    }

    console.log('✅ Orçamento criado com sucesso na tabela orcamentos_sistema:');
    console.log('✅ Dados do orçamento criado:', JSON.stringify(newQuote, null, 2));

    // 3. Cria os itens do orçamento
    console.log('\n🛍️ Etapa 5: Criando itens do orçamento...');
    const createdItems = await createQuoteRequestItems(newQuote.id, items);
    console.log(`✅ ${createdItems.length} itens criados para o orçamento ${newQuote.id}`);

    console.log('\n🎉 ORÇAMENTO CRIADO COM SUCESSO!');
    console.log('🎉 ID do orçamento:', newQuote.id);
    console.log('🎉 Número do orçamento:', newQuote.numero_orcamento);
    
    return newQuote;
  } catch (error) {
    console.error('❌ ERRO GERAL no createQuoteRequest:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
    throw error;
  }
}

/**
 * Verifica se um telefone já existe no sistema
 */
export async function checkPhoneExists(phone: string): Promise<boolean> {
  try {
    console.log('🔍 Verificando se telefone existe:', phone);
    
    const { data, error } = await supabase
      .from('usuarios_sistema')
      .select('id')
      .eq('telefone', phone)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar telefone:', error);
      return false;
    }
    
    const exists = !!data;
    console.log(exists ? '✅ Telefone encontrado no sistema' : 'ℹ️ Telefone não encontrado');
    return exists;
  } catch (error) {
    console.error('❌ Erro ao verificar telefone:', error);
    return false;
  }
}

/**
 * Verifica se um e-mail já existe no sistema
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    console.log('🔍 Verificando se e-mail existe:', email);
    
    // Buscar na tabela usuarios_sistema que contém o campo email
    const { data, error } = await supabase
      .from('usuarios_sistema')
      .select('id')
      .eq('email', email)
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar e-mail:', error);
      return false;
    }
    
    const exists = !!data;
    console.log(exists ? '✅ E-mail encontrado no sistema' : 'ℹ️ E-mail não encontrado');
    return exists;
  } catch (error) {
    console.error('❌ Erro ao verificar e-mail:', error);
    return false;
  }
}

// Função auxiliar para extrair o ID do produto ecológico com validações robustas
function extractEcologicalId(ecologicalId: string | number): number | null {
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
    return Math.floor(ecologicalId); // Garantir que é inteiro
  }
  
  // Se é string, tentar extrair número
  if (typeof ecologicalId === 'string') {
    const trimmed = ecologicalId.trim();
    
    // Verificar se é string vazia
    if (trimmed === '') {
      console.error('❌ extractEcologicalId - String vazia');
      return null;
    }
    
    // Tentar converter diretamente se for string numérica
    const directNumber = parseInt(trimmed, 10);
    if (!isNaN(directNumber) && directNumber > 0) {
      console.log('✅ extractEcologicalId - String numérica convertida:', directNumber);
      return directNumber;
    }
    
    // Tentar extrair número do formato "eco-123", "product-456", etc.
    const match = trimmed.match(/(\d+)/);
    if (match) {
      const extractedNumber = parseInt(match[1], 10);
      if (extractedNumber > 0) {
        console.log('✅ extractEcologicalId - Número extraído do padrão:', extractedNumber);
        return extractedNumber;
      }
    }
    
    console.error('❌ extractEcologicalId - Não foi possível extrair número válido da string:', trimmed);
    return null;
  }
  
  console.error('❌ extractEcologicalId - Tipo não suportado:', typeof ecologicalId);
  return null;
}

/**
 * Cria os itens do orçamento
 */
export async function createQuoteRequestItems(
  orcamentoId: string,
  items: CartItem[]
): Promise<ItemOrcamentoSistema[]> {
  try {
    console.log(`\n=== CRIANDO ITENS DO ORÇAMENTO ===`);
    console.log(`Total de itens para processar: ${items.length}`);
    
    // Validar e filtrar itens válidos
    const validItemsData: ItemOrcamentoSistemaInsert[] = [];
    
    for (const item of items) {
      console.log(`\n--- Processando item: ${item.name} ---`);
      
      // Verificar se ecologicalId existe
      if (!item.ecologicalId) {
        console.warn(`⚠️ AVISO: ecologicalId não fornecido para o item ${item.name}. Pulando item.`);
        continue;
      }
      
      // Extrair e validar o ID do produto usando a função robusta
      const produtoEcologicoId = extractEcologicalId(item.ecologicalId);
      
      if (!produtoEcologicoId) {
        console.warn(`⚠️ AVISO: Não foi possível extrair ID válido do ecologicalId: ${item.ecologicalId}. Pulando item ${item.name}.`);
        continue;
      }

      console.log(`🔍 Verificando existência do produto ID ${produtoEcologicoId} no banco...`);

      // Verificar na tabela produtos_ecologicos
      const { data: produto, error } = await supabase
        .from('produtos_ecologicos')
        .select('id')
        .eq('id', produtoEcologicoId)
        .eq('stativo', 'S')
        .maybeSingle();
        
      if (error) {
        console.error(`❌ ERRO na consulta do produto ID ${produtoEcologicoId}:`, error);
        console.warn(`⚠️ Pulando item ${item.name} devido ao erro na consulta.`);
        continue;
      }
      
      if (!produto) {
        console.warn(`⚠️ AVISO: Produto ecológico ID ${produtoEcologicoId} não encontrado ou inativo.`);
        console.warn(`⚠️ Pulando item ${item.name} - produto não existe na tabela produtos_ecologicos.`);
        continue;
      }
      
      console.log(`✅ Produto ID ${produtoEcologicoId} encontrado e válido. Adicionando ao orçamento.`);
    
      // Adicionar item válido à lista
      validItemsData.push({
        orcamento_id: orcamentoId,
        produto_ecologico_id: produtoEcologicoId,
        quantidade: item.quantity,
        observacoes: [
          `Produto: ${item.name}`,
          item.selectedColor ? `Cor: ${item.selectedColor}` : null,
          item.itemNotes ? `Observações: ${item.itemNotes}` : null,
          item.customizations ? `Customizações: ${JSON.stringify(item.customizations)}` : null
        ].filter(Boolean).join(' | ') || null
      });
    }

    console.log(`\n📊 RESUMO: ${validItemsData.length} itens válidos de ${items.length} itens totais`);
    
    // Se não há itens válidos, retornar array vazio mas não falhar
    if (validItemsData.length === 0) {
      console.warn('⚠️ AVISO: Nenhum item válido encontrado para o orçamento. Criando orçamento sem itens.');
      return [];
    }

    // Inserir apenas os itens válidos
    const { data: createdItems, error: itemsError } = await supabase
      .from('itens_orcamento_sistema')
      .insert(validItemsData)
      .select();

    if (itemsError) {
      console.error('❌ Erro ao inserir itens do orçamento:', itemsError);
      throw new Error(`Erro ao criar itens do orçamento: ${itemsError.message}`);
    }

    console.log(`✅ ${createdItems.length} itens criados com sucesso no orçamento.`);
    return createdItems;
  } catch (error) {
    console.error('❌ Erro no createQuoteRequestItems:', error);
    throw error;
  }
}

/**
 * Busca um orçamento pelo ID
 */
export async function getQuoteRequest(id: string): Promise<OrcamentoSistema | null> {
  try {
    const { data, error } = await supabase
      .from('orcamentos_sistema')
      .select(`
        *,
        usuarios_sistema!inner(
          id,
          nome,
          telefone,
          empresa
        ),
        itens_orcamento_sistema(
          id,
          produto_ecologico_id,
          quantidade,
          observacoes
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar orçamento:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro no getQuoteRequest:', error);
    return null;
  }
}

/**
 * Valida todos os produtos antes de criar o orçamento
 */
export async function validateProductsBeforeQuote(items: CartItem[]): Promise<{
  validProducts: CartItem[];
  invalidProducts: { item: CartItem; reason: string }[];
  warnings: string[];
}> {
  const validProducts: CartItem[] = [];
  const invalidProducts: { item: CartItem; reason: string }[] = [];
  const warnings: string[] = [];

  console.log('🔍 Validando produtos antes de criar orçamento...');

  for (const item of items) {
    try {
      if (!item.ecologicalId) {
        invalidProducts.push({ item, reason: 'ecologicalId não fornecido' });
        continue;
      }

      const produtoEcologicoId = extractEcologicalId(item.ecologicalId);
      if (!produtoEcologicoId) {
        invalidProducts.push({ item, reason: `ID ecológico inválido: ${item.ecologicalId}` });
        continue;
      }

      // Verificar na tabela produtos_ecologicos
      const { data: produto, error } = await supabase
        .from('produtos_ecologicos')
        .select('id')
        .eq('id', produtoEcologicoId)
        .eq('stativo', 'S')
        .maybeSingle();

      if (error) {
        warnings.push(`Erro ao consultar produto ${item.name} (ID: ${produtoEcologicoId}): ${error.message}`);
        invalidProducts.push({ item, reason: `Erro na consulta: ${error.message}` });
        continue;
      }

      if (!produto) {
        // Tentar fallback na tabela products
        const { data: productFallback } = await supabase
          .from('products')
          .select('id, name')
          .eq('id', produtoEcologicoId)
          .maybeSingle();

        if (productFallback) {
          warnings.push(`Produto ${item.name} encontrado apenas na tabela products (fallback)`);
          validProducts.push(item);
        } else {
          warnings.push(`Produto ${item.name} (ID: ${produtoEcologicoId}) não encontrado em nenhuma tabela`);
          invalidProducts.push({ item, reason: 'Produto não encontrado no banco de dados' });
        }
      } else {
        validProducts.push(item);
      }
    } catch (error) {
      console.error(`Erro ao validar produto ${item.name}:`, error);
      invalidProducts.push({ item, reason: `Erro na validação: ${error}` });
    }
  }

  console.log(`✅ Validação concluída: ${validProducts.length} válidos, ${invalidProducts.length} inválidos, ${warnings.length} avisos`);
  
  return { validProducts, invalidProducts, warnings };
}

/**
 * Função principal para processar um orçamento completo
 */
export async function processQuoteRequest(quoteRequestData: QuoteRequestData): Promise<{
  orcamento: OrcamentoSistema;
  itens: ItemOrcamentoSistema[];
}> {
  try {
    console.log('Processando orçamento:', quoteRequestData);

    // 1. Validar produtos antes de criar orçamento
    const validation = await validateProductsBeforeQuote(quoteRequestData.items);
    
    if (validation.warnings.length > 0) {
      console.warn('⚠️ Avisos na validação de produtos:', validation.warnings);
    }
    
    if (validation.invalidProducts.length > 0) {
      console.warn('⚠️ Produtos com problemas encontrados:', validation.invalidProducts);
      console.warn('Continuando com produtos válidos apenas...');
    }

    // Usar apenas produtos válidos
    const itemsToProcess = validation.validProducts.length > 0 ? validation.validProducts : quoteRequestData.items;

    // 2. Cria o orçamento
    const orcamento = await createQuoteRequest(
      quoteRequestData.customerData,
      itemsToProcess,
      quoteRequestData.notes
    );
    console.log('Orçamento criado:', orcamento);

    // 3. Busca os itens criados
    const { data: itens, error: itensError } = await supabase
      .from('itens_orcamento_sistema')
      .select('*')
      .eq('orcamento_id', orcamento.id);

    if (itensError) {
      console.error('Erro ao buscar itens do orçamento:', itensError);
      throw new Error('Erro ao buscar itens do orçamento');
    }

    console.log('Orçamento processado com sucesso:', {
      orcamento,
      itens
    });

    return {
      orcamento,
      itens: itens || []
    };
  } catch (error) {
    console.error('Erro ao processar orçamento:', error);
    throw error;
  }
}

// ===== FUNÇÕES DE CONSULTA E GERENCIAMENTO =====

/**
 * Busca todos os orçamentos com informações do usuário
 */
export const getAllQuotes = async () => {
  try {
    console.log('📋 Buscando todos os orçamentos...');
    
    const { data, error } = await supabase
      .from('orcamentos_sistema')
      .select(`
        *,
        usuarios_sistema (
          nome,
          telefone,
          empresa
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar orçamentos:', error);
      throw error;
    }
    
    console.log(`✅ ${data?.length || 0} orçamentos encontrados`);
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar orçamentos:', error);
    throw error;
  }
};

/**
 * Busca orçamentos por período
 */
export const getQuotesByDateRange = async (startDate: string, endDate: string) => {
  try {
    console.log(`📅 Buscando orçamentos entre ${startDate} e ${endDate}...`);
    
    const { data, error } = await supabase
      .from('orcamentos_sistema')
      .select(`
        *,
        usuarios_sistema (
          nome,
          telefone,
          empresa
        )
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar orçamentos por período:', error);
      throw error;
    }
    
    console.log(`✅ ${data?.length || 0} orçamentos encontrados no período`);
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar orçamentos por período:', error);
    throw error;
  }
};

/**
 * Busca orçamento completo com todos os itens e detalhes
 */
export const getQuoteWithItems = async (quoteId: string) => {
  try {
    console.log(`🔍 Buscando orçamento completo ID: ${quoteId}...`);
    
    // Buscar o orçamento principal
    const { data: quote, error: quoteError } = await supabase
      .from('orcamentos_sistema')
      .select(`
        *,
        usuarios_sistema (
          nome,
          telefone,
          empresa
        )
      `)
      .eq('id', quoteId)
      .single();
    
    if (quoteError) {
      console.error('❌ Erro ao buscar orçamento:', quoteError);
      throw quoteError;
    }
    
    // Buscar os itens do orçamento
    const { data: items, error: itemsError } = await supabase
      .from('itens_orcamento_sistema')
      .select(`
        *,
        produtos_ecologicos (
          id,
          Nome,
          Descricao,
          Referencia
        )
      `)
      .eq('orcamento_id', quoteId);
    
    if (itemsError) {
      console.error('❌ Erro ao buscar itens do orçamento:', itemsError);
      throw itemsError;
    }
    
    const result = {
      ...quote,
      items: items || []
    };
    
    console.log(`✅ Orçamento completo encontrado com ${items?.length || 0} itens`);
    return result;
  } catch (error) {
    console.error('❌ Erro ao buscar orçamento completo:', error);
    throw error;
  }
};

/**
 * Busca orçamentos por usuário (telefone)
 */
export const getQuotesByClient = async (clientIdentifier: string) => {
  try {
    console.log(`👤 Buscando orçamentos do usuário: ${clientIdentifier}...`);
    
    const { data, error } = await supabase
      .from('orcamentos_sistema')
      .select(`
        *,
        usuarios_sistema!inner (
          nome,
          telefone,
          empresa
        )
      `)
      .eq('usuarios_sistema.telefone', clientIdentifier)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar orçamentos do usuário:', error);
      throw error;
    }
    
    console.log(`✅ ${data?.length || 0} orçamentos encontrados para o usuário`);
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar orçamentos do usuário:', error);
    throw error;
  }
};

/**
 * Atualiza o status de um orçamento
 */
export const updateQuoteStatus = async (quoteId: string, status: string, notes?: string) => {
  try {
    console.log(`📝 Atualizando status do orçamento ${quoteId} para: ${status}...`);
    
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };
    
    if (notes) {
      updateData.observacoes = notes;
    }
    
    const { data, error } = await supabase
      .from('orcamentos_sistema')
      .update(updateData)
      .eq('id', quoteId)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao atualizar status do orçamento:', error);
      throw error;
    }
    
    console.log('✅ Status do orçamento atualizado com sucesso');
    return data;
  } catch (error) {
    console.error('❌ Erro ao atualizar status do orçamento:', error);
    throw error;
  }
};

/**
 * Estatísticas dos orçamentos
 */
export const getQuoteStatistics = async () => {
  try {
    console.log('📊 Calculando estatísticas dos orçamentos...');
    
    // Total de orçamentos
    const { count: totalQuotes, error: countError } = await supabase
      .from('orcamentos_sistema')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erro ao contar orçamentos:', countError);
      throw countError;
    }
    
    // Valor total dos orçamentos
    const { data: valueData, error: valueError } = await supabase
      .from('orcamentos_sistema')
      .select('valor_total');
    
    if (valueError) {
      console.error('❌ Erro ao calcular valor total:', valueError);
      throw valueError;
    }
    
    const totalValue = valueData?.reduce((sum, quote) => sum + (quote.valor_total || 0), 0) || 0;
    
    // Orçamentos do mês atual
    const currentMonth = new Date();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
    
    const { count: monthlyQuotes, error: monthlyError } = await supabase
      .from('orcamentos_sistema')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth);
    
    if (monthlyError) {
      console.error('❌ Erro ao contar orçamentos mensais:', monthlyError);
      throw monthlyError;
    }
    
    const statistics = {
      totalQuotes: totalQuotes || 0,
      totalValue,
      monthlyQuotes: monthlyQuotes || 0,
      averageValue: totalQuotes ? totalValue / totalQuotes : 0
    };
    
    console.log('✅ Estatísticas calculadas:', statistics);
    return statistics;
  } catch (error) {
    console.error('❌ Erro ao calcular estatísticas:', error);
    throw error;
  }
};