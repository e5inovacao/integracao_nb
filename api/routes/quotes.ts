import express from 'express';
import type { Request, Response } from 'express';
// import { QuoteRequest, QuoteStatus, PaginatedResponse } from '../../shared/types.ts';
import { supabaseAdmin } from '../../supabase/server.ts';

const router = express.Router();

// Função auxiliar para mapear dados do Supabase para o tipo QuoteRequest
function mapSupabaseToQuoteRequest(quoteData: any, itemsData: any[]): QuoteRequest {
  return {
    id: quoteData.id,
    customerInfo: {
      name: quoteData.nome_cliente || '',
      email: quoteData.email_cliente || '',
      phone: quoteData.telefone_cliente || '',
      company: quoteData.empresa_cliente || '',
      cnpj: quoteData.cnpj_cliente || ''
    },
    items: itemsData.map(item => ({
      productId: item.id,
      productName: item.produto_nome || '',
      quantity: item.quantidade,
      unitPrice: item.valor_unitario_estimado || 0,
      customizations: item.personalizacoes || {},
      notes: ''
    })),
    notes: quoteData.observacoes || '',
    status: quoteData.status,
    totalEstimated: quoteData.valor_total_estimado || 0,
    createdAt: new Date(quoteData.created_at),
    updatedAt: new Date(quoteData.updated_at)
  };
}

// Dados mockados removidos - agora usando Supabase

// POST /api/quotes - Criar nova solicitação de orçamento
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      customerInfo,
      items,
      notes
    } = req.body;

    // Validação básica
    if (!customerInfo || !customerInfo.name || !customerInfo.email) {
      return res.status(400).json({
        success: false,
        error: 'Informações do cliente são obrigatórias (nome e email)'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Pelo menos um item deve ser incluído no orçamento'
      });
    }

    // Primeiro, criar ou buscar cliente
    const { data: clienteData, error: clienteError } = await supabaseAdmin
      .rpc('ensure_client_exists', {
        p_nome: customerInfo.name,
        p_email: customerInfo.email,
        p_telefone: customerInfo.phone,
        p_empresa: customerInfo.company
      });

    if (clienteError || !clienteData) {
      console.error('Erro ao criar/buscar cliente:', clienteError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar dados do cliente'
      });
    }

    // Criar orçamento
    const { data: quoteData, error: quoteError } = await supabaseAdmin
      .from('orcamentos_sistema')
      .insert({
        usuario_id: clienteData,
        observacoes: notes || '',
        status: 'pendente'
      })
      .select('id')
      .single();

    if (quoteError || !quoteData) {
      console.error('Erro ao criar solicitação de orçamento:', quoteError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar solicitação de orçamento'
      });
    }

    // Criar itens do orçamento
    const quoteItems = items.map((item: any) => ({
      orcamento_id: quoteData.id,
      produto_ecologico_id: item.productId || 1, // Usar ID padrão se não fornecido
      quantidade: item.quantity,
      observacoes: `${item.productName || item.name}${item.customizations ? ' - ' + JSON.stringify(item.customizations) : ''}`
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('itens_orcamento_sistema')
      .insert(quoteItems);

    if (itemsError) {
      console.error('Erro ao criar itens da solicitação:', itemsError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar itens da solicitação'
      });
    }

    // Buscar o orçamento criado com todos os dados
    const { data: fullQuoteData } = await supabaseAdmin
      .from('orcamentos_sistema')
      .select(`
        *,
        usuarios_sistema!usuario_id(*)
      `)
      .eq('id', quoteData.id)
      .single();

    const { data: fullItemsData } = await supabaseAdmin
      .from('itens_orcamento_sistema')
      .select(`
        *,
        produtos_ecologicos!produto_ecologico_id(*)
      `)
      .eq('orcamento_id', quoteData.id);

    const newQuote = mapSupabaseToQuoteRequest(fullQuoteData, fullItemsData || []);

    res.status(201).json({
      success: true,
      data: newQuote,
      message: 'Solicitação de orçamento criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/quotes - Listar todas as solicitações de orçamento
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      status,
      page = '1',
      limit = '10',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Construir query base
    let query = supabaseAdmin
      .from('orcamentos_sistema')
      .select(`
        *,
        usuarios_sistema!usuario_id(*)
      `, { count: 'exact' });

    // Filtrar por status se especificado
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Ordenação
    const orderColumn = sortBy === 'createdAt' ? 'created_at' : sortBy as string;
    query = query.order(orderColumn, { ascending: sortOrder === 'asc' });

    // Paginação
    query = query.range(offset, offset + limitNum - 1);

    const { data: quotesData, error: quotesError, count } = await query;

    if (quotesError) {
      console.error('Erro ao buscar orçamentos:', quotesError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar orçamentos'
      });
    }

    // Buscar itens para cada orçamento
    const quotesWithItems = await Promise.all(
      (quotesData || []).map(async (quote) => {
        const { data: itemsData } = await supabaseAdmin
          .from('itens_orcamento_sistema')
          .select(`
            *,
            produtos_ecologicos!produto_ecologico_id(*)
          `)
          .eq('orcamento_id', quote.id);

        return mapSupabaseToQuoteRequest(quote, itemsData || []);
      })
    );

    const totalQuotes = count || 0;
    const totalPages = Math.ceil(totalQuotes / limitNum);

    res.json({
      success: true,
      data: {
        quotes: quotesWithItems,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: totalQuotes,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/quotes/:id - Buscar orçamento por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Buscar orçamento
    const { data: quoteData, error: quoteError } = await supabaseAdmin
      .from('orcamentos_sistema')
      .select(`
        *,
        usuarios_sistema!usuario_id(*)
      `)
      .eq('id', id)
      .single();

    if (quoteError || !quoteData) {
      return res.status(404).json({
        success: false,
        error: 'Orçamento não encontrado'
      });
    }

    // Buscar itens do orçamento
    const { data: itemsData } = await supabaseAdmin
      .from('itens_orcamento_sistema')
      .select(`
        *,
        produtos_ecologicos!produto_ecologico_id(*)
      `)
      .eq('orcamento_id', id);

    const quote = mapSupabaseToQuoteRequest(quoteData, itemsData || []);

    res.json({
      success: true,
      data: quote
    });
  } catch (error) {
    console.error('Erro ao buscar orçamento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/quotes/:id/status - Atualizar status do orçamento
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses: QuoteStatus[] = ['pending', 'approved', 'rejected', 'completed'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status inválido. Use: pending, approved, rejected ou completed'
      });
    }

    // Atualizar status no Supabase
    const { data: updatedQuote, error: updateError } = await supabaseAdmin
      .from('solicitacoes_orcamento')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError || !updatedQuote) {
      return res.status(404).json({
        success: false,
        error: 'Orçamento não encontrado'
      });
    }

    // Buscar itens do orçamento
    const { data: itemsData } = await supabaseAdmin
      .from('itens_solicitacao_orcamento')
      .select('*')
      .eq('solicitacao_id', id);

    const quote = mapSupabaseToQuoteRequest(updatedQuote, itemsData || []);

    res.json({
      success: true,
      data: quote,
      message: 'Status do orçamento atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar status do orçamento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/quotes/:id - Excluir orçamento
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Buscar orçamento antes de excluir para retornar os dados
    const { data: quoteData, error: fetchError } = await supabaseAdmin
      .from('solicitacoes_orcamento')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !quoteData) {
      return res.status(404).json({
        success: false,
        error: 'Orçamento não encontrado'
      });
    }

    // Buscar itens do orçamento
    const { data: itemsData } = await supabaseAdmin
      .from('itens_solicitacao_orcamento')
      .select('*')
      .eq('solicitacao_id', id);

    const quote = mapSupabaseToQuoteRequest(quoteData, itemsData || []);

    // Excluir itens do orçamento primeiro (devido à foreign key)
    const { error: deleteItemsError } = await supabaseAdmin
      .from('itens_solicitacao_orcamento')
      .delete()
      .eq('solicitacao_id', id);

    if (deleteItemsError) {
      console.error('Erro ao excluir itens do orçamento:', deleteItemsError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao excluir itens do orçamento'
      });
    }

    // Excluir orçamento
    const { error: deleteQuoteError } = await supabaseAdmin
      .from('solicitacoes_orcamento')
      .delete()
      .eq('id', id);

    if (deleteQuoteError) {
      console.error('Erro ao excluir orçamento:', deleteQuoteError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao excluir orçamento'
      });
    }

    res.json({
      success: true,
      data: quote,
      message: 'Orçamento excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir orçamento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/quotes/stats/dashboard - Estatísticas para dashboard
router.get('/stats/dashboard', async (req: Request, res: Response) => {
  try {
    // Buscar total de orçamentos
    const { count: totalQuotes } = await supabaseAdmin
      .from('solicitacoes_orcamento')
      .select('*', { count: 'exact', head: true });

    // Buscar orçamentos por status
    const { data: allQuotes } = await supabaseAdmin
      .from('solicitacoes_orcamento')
      .select('status');

    const pendingQuotes = allQuotes?.filter(q => q.status === 'pending').length || 0;
    const approvedQuotes = allQuotes?.filter(q => q.status === 'approved').length || 0;
    const rejectedQuotes = allQuotes?.filter(q => q.status === 'rejected').length || 0;
    const completedQuotes = allQuotes?.filter(q => q.status === 'completed').length || 0;

    // Buscar orçamentos recentes (últimos 5)
    const { data: recentQuotesData } = await supabaseAdmin
      .from('solicitacoes_orcamento')
      .select('id, status, created_at, nome_cliente, empresa_cliente')
      .order('created_at', { ascending: false })
      .limit(5);

    const recentQuotes = recentQuotesData?.map(quote => ({
      id: quote.id,
      customerName: quote.nome_cliente || '',
      company: quote.empresa_cliente || '',
      status: quote.status,
      totalEstimated: 0,
      createdAt: new Date(quote.created_at)
    })) || [];

    res.json({
      success: true,
      data: {
        summary: {
          totalQuotes: totalQuotes || 0,
          pendingQuotes,
          approvedQuotes,
          rejectedQuotes,
          completedQuotes,
          totalValue: 0 // TODO: Implementar cálculo de valor total quando houver preços
        },
        recentQuotes
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;