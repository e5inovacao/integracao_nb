import { supabase } from '../../supabase/client';
import type { Database } from '../../supabase/types';

type Orcamento = Database['Tables']['orcamentos_sistema']['Row'];
type OrcamentoInsert = Database['Tables']['orcamentos_sistema']['Insert'];
type ItemOrcamento = Database['Tables']['itens_orcamento_sistema']['Row'];
type ItemOrcamentoInsert = Database['Tables']['itens_orcamento_sistema']['Insert'];
type Usuario = Database['Tables']['usuarios_sistema']['Row'];
type UsuarioInsert = Database['Tables']['usuarios_sistema']['Insert'];

// Tipos para parâmetros das funções
export interface CriarOrcamentoParams {
  usuario_id: string;
  cliente_data: {
    nome?: string;
    empresa?: string;
    telefone?: string;
    endereco?: string;
  };
  itens_data: Array<{
    produto_id?: string;
    quantidade: number;
    valor_unitario?: number;
    personalizacoes?: Record<string, any>;
    descricao_personalizada?: string;
  }>;
  observacoes?: string;
  data_evento?: string;
  urgencia?: 'baixa' | 'normal' | 'alta' | 'urgente';
}

export interface AdicionarItemParams {
  orcamento_id: string;
  produto_id?: string;
  quantidade: number;
  valor_unitario?: number;
  personalizacoes?: Record<string, any>;
  descricao_personalizada?: string;
}

export interface BuscarOrcamentosParams {
  usuario_id: string;
  status_filter?: string;
  limit?: number;
  offset?: number;
}

// Tipos de retorno
export interface OrcamentoCompleto extends Orcamento {
  usuario: Usuario;
  itens: ItemOrcamento[];
}

export interface ResultadoPaginado<T> {
  data: T[];
  total: number;
  has_more: boolean;
}

class OrcamentosService {
  /**
   * Cria um novo orçamento completo com cliente e itens
   */
  async criarOrcamentoCompleto(params: CriarOrcamentoParams): Promise<{ data: OrcamentoCompleto | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('criar_orcamento_completo', {
        p_usuario_id: params.usuario_id,
        p_cliente_data: params.cliente_data,
        p_itens_data: params.itens_data,
        p_observacoes: params.observacoes || null,
        p_data_evento: params.data_evento || null,
        p_urgencia: params.urgencia || 'normal'
      });

      if (error) {
        console.error('Erro ao criar orçamento:', error);
        return { data: null, error };
      }

      return { data: data as OrcamentoCompleto, error: null };
    } catch (error) {
      console.error('Erro inesperado ao criar orçamento:', error);
      return { data: null, error };
    }
  }

  /**
   * Adiciona um item a um orçamento existente
   */
  async adicionarItem(params: AdicionarItemParams): Promise<{ data: ItemOrcamento | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('adicionar_item_orcamento', {
        p_orcamento_id: params.orcamento_id,
        p_produto_id: params.produto_id || null,
        p_quantidade: params.quantidade,
        p_valor_unitario: params.valor_unitario || null,
        p_personalizacoes: params.personalizacoes || null,
        p_descricao_personalizada: params.descricao_personalizada || null
      });

      if (error) {
        console.error('Erro ao adicionar item:', error);
        return { data: null, error };
      }

      return { data: data as ItemOrcamento, error: null };
    } catch (error) {
      console.error('Erro inesperado ao adicionar item:', error);
      return { data: null, error };
    }
  }

  /**
   * Remove um item de um orçamento
   */
  async removerItem(itemId: string): Promise<{ success: boolean; error: any }> {
    try {
      const { data, error } = await supabase.rpc('remover_item_orcamento', {
        p_item_id: itemId
      });

      if (error) {
        console.error('Erro ao remover item:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Erro inesperado ao remover item:', error);
      return { success: false, error };
    }
  }

  /**
   * Atualiza a quantidade de um item
   */
  async atualizarQuantidade(itemId: string, novaQuantidade: number): Promise<{ data: ItemOrcamento | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('atualizar_quantidade_item', {
        p_item_id: itemId,
        p_nova_quantidade: novaQuantidade
      });

      if (error) {
        console.error('Erro ao atualizar quantidade:', error);
        return { data: null, error };
      }

      return { data: data as ItemOrcamento, error: null };
    } catch (error) {
      console.error('Erro inesperado ao atualizar quantidade:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca orçamentos de um usuário com paginação
   */
  async buscarOrcamentosUsuario(params: BuscarOrcamentosParams): Promise<{ data: ResultadoPaginado<Orcamento> | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('buscar_orcamentos_usuario', {
        p_usuario_id: params.usuario_id,
        p_status_filter: params.status_filter || null,
        p_limit: params.limit || 10,
        p_offset: params.offset || 0
      });

      if (error) {
        console.error('Erro ao buscar orçamentos:', error);
        return { data: null, error };
      }

      return { data: data as ResultadoPaginado<Orcamento>, error: null };
    } catch (error) {
      console.error('Erro inesperado ao buscar orçamentos:', error);
      return { data: null, error };
    }
  }

  /**
   * Atualiza o status de um orçamento
   */
  async atualizarStatus(orcamentoId: string, novoStatus: string): Promise<{ data: Orcamento | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('atualizar_status_orcamento', {
        p_orcamento_id: orcamentoId,
        p_novo_status: novoStatus
      });

      if (error) {
        console.error('Erro ao atualizar status:', error);
        return { data: null, error };
      }

      return { data: data as Orcamento, error: null };
    } catch (error) {
      console.error('Erro inesperado ao atualizar status:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca um orçamento completo com todos os dados relacionados
   */
  async buscarOrcamentoCompleto(orcamentoId: string): Promise<{ data: OrcamentoCompleto | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('buscar_orcamento_completo', {
        p_orcamento_id: orcamentoId
      });

      if (error) {
        console.error('Erro ao buscar orçamento completo:', error);
        return { data: null, error };
      }

      return { data: data as OrcamentoCompleto, error: null };
    } catch (error) {
      console.error('Erro inesperado ao buscar orçamento completo:', error);
      return { data: null, error };
    }
  }

  /**
   * Duplica um orçamento existente
   */
  async duplicarOrcamento(orcamentoId: string, novoUsuarioId?: string): Promise<{ data: OrcamentoCompleto | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('duplicar_orcamento', {
        p_orcamento_id: orcamentoId,
        p_novo_usuario_id: novoUsuarioId || null
      });

      if (error) {
        console.error('Erro ao duplicar orçamento:', error);
        return { data: null, error };
      }

      return { data: data as OrcamentoCompleto, error: null };
    } catch (error) {
      console.error('Erro inesperado ao duplicar orçamento:', error);
      return { data: null, error };
    }
  }

  /**
   * Métodos auxiliares para operações diretas nas tabelas (compatibilidade)
   */

  /**
   * Lista todos os orçamentos (método direto)
   */
  async listarOrcamentos(filtros?: { status?: string; usuario_id?: string }): Promise<{ data: Orcamento[] | null; error: any }> {
    try {
      let query = supabase
        .from('orcamentos_sistema')
        .select(`
          *,
          usuario:usuarios_sistema(*),
          itens:itens_orcamento_sistema(*)
        `);

      if (filtros?.status) {
        query = query.eq('status', filtros.status);
      }

      if (filtros?.usuario_id) {
        query = query.eq('usuario_id', filtros.usuario_id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao listar orçamentos:', error);
        return { data: null, error };
      }

      return { data: data as Orcamento[], error: null };
    } catch (error) {
      console.error('Erro inesperado ao listar orçamentos:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca orçamento por ID (método direto)
   */
  async buscarPorId(id: string): Promise<{ data: OrcamentoCompleto | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('orcamentos_sistema')
        .select(`
          *,
          usuario:usuarios_sistema(*),
          itens:itens_orcamento_sistema(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar orçamento por ID:', error);
        return { data: null, error };
      }

      return { data: data as OrcamentoCompleto, error: null };
    } catch (error) {
      console.error('Erro inesperado ao buscar orçamento por ID:', error);
      return { data: null, error };
    }
  }
}

// Instância singleton do serviço
export const orcamentosService = new OrcamentosService();
export default orcamentosService;