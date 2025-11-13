import { supabase } from './supabase'

export interface Configuracao {
  id: number
  chave: string
  valor: string
  descricao: string
  categoria: string
  tipo: 'texto' | 'numero' | 'booleano' | 'json'
  ativo: boolean
  created_at: string
  updated_at: string
}

/**
 * Busca uma configuração por chave
 */
export async function getConfiguracao(chave: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_configuracao', { p_chave: chave })

    if (error) {
      console.error('Erro ao buscar configuração:', error)
      return null
    }

    if (data?.error) {
      console.warn(`Configuração não encontrada: ${chave}`)
      return null
    }

    return data?.valor || null
  } catch (error) {
    console.error('Erro ao buscar configuração:', error)
    return null
  }
}

/**
 * Busca configurações por categoria
 */
export async function getConfiguracoesPorCategoria(categoria: string): Promise<Configuracao[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_configuracoes_por_categoria', { p_categoria: categoria })

    if (error) {
      console.error('Erro ao buscar configurações por categoria:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar configurações por categoria:', error)
    return []
  }
}

/**
 * Busca todas as configurações ativas
 */
export async function getAllConfiguracoes(): Promise<Configuracao[]> {
  try {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('*')
      .eq('ativo', true)
      .order('categoria')
      .order('chave')

    if (error) {
      console.error('Erro ao buscar todas as configurações:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar todas as configurações:', error)
    return []
  }
}

/**
 * Busca configurações para uso em orçamentos
 */
export async function getConfiguracoesOrcamento(): Promise<Record<string, string>> {
  try {
    const configuracoes = await getConfiguracoesPorCategoria('orcamento')
    const config: Record<string, string> = {}
    
    configuracoes.forEach(item => {
      config[item.chave] = item.valor
    })
    
    return config
  } catch (error) {
    console.error('Erro ao buscar configurações de orçamento:', error)
    return {}
  }
}

/**
 * Busca configurações da empresa
 */
export async function getConfiguracoesEmpresa(): Promise<Record<string, string>> {
  try {
    const configuracoes = await getConfiguracoesPorCategoria('empresa')
    const config: Record<string, string> = {}
    
    configuracoes.forEach(item => {
      config[item.chave] = item.valor
    })
    
    return config
  } catch (error) {
    console.error('Erro ao buscar configurações da empresa:', error)
    return {}
  }
}

/**
 * Salva ou atualiza uma configuração
 */
export async function salvarConfiguracao(
  chave: string, 
  valor: string, 
  descricao?: string, 
  categoria: string = 'geral',
  tipo: 'texto' | 'numero' | 'booleano' | 'json' = 'texto'
): Promise<boolean> {
  try {
    // Verificar se a configuração já existe
    const { data: existing } = await supabase
      .from('configuracoes')
      .select('id')
      .eq('chave', chave)
      .single()

    if (existing) {
      // Atualizar configuração existente
      const { error } = await supabase
        .from('configuracoes')
        .update({
          valor,
          descricao,
          categoria,
          tipo,
          updated_at: new Date().toISOString()
        })
        .eq('chave', chave)

      if (error) {
        console.error('Erro ao atualizar configuração:', error)
        return false
      }
    } else {
      // Criar nova configuração
      const { error } = await supabase
        .from('configuracoes')
        .insert({
          chave,
          valor,
          descricao,
          categoria,
          tipo,
          ativo: true
        })

      if (error) {
        console.error('Erro ao criar configuração:', error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Erro ao salvar configuração:', error)
    return false
  }
}

/**
 * Busca configurações com filtro de texto
 */
export async function buscarConfiguracoes(termo: string): Promise<Configuracao[]> {
  try {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('*')
      .or(`chave.ilike.%${termo}%,valor.ilike.%${termo}%,descricao.ilike.%${termo}%`)
      .eq('ativo', true)
      .order('categoria')
      .order('chave')

    if (error) {
      console.error('Erro ao buscar configurações:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return []
  }
}

/**
 * Utilitários para conversão de tipos
 */
export const ConfigUtils = {
  /**
   * Converte valor para número
   */
  toNumber(valor: string | null, defaultValue: number = 0): number {
    if (!valor) return defaultValue
    const num = parseFloat(valor)
    return isNaN(num) ? defaultValue : num
  },

  /**
   * Converte valor para booleano
   */
  toBoolean(valor: string | null, defaultValue: boolean = false): boolean {
    if (!valor) return defaultValue
    return valor.toLowerCase() === 'true' || valor === '1'
  },

  /**
   * Converte valor para JSON
   */
  toJSON<T>(valor: string | null, defaultValue: T): T {
    if (!valor) return defaultValue
    try {
      return JSON.parse(valor)
    } catch {
      return defaultValue
    }
  },

  /**
   * Formata valor para exibição
   */
  formatValue(valor: string, tipo: string): string {
    switch (tipo) {
      case 'numero':
        const num = parseFloat(valor)
        return isNaN(num) ? valor : num.toLocaleString('pt-BR')
      case 'booleano':
        return valor.toLowerCase() === 'true' ? 'Sim' : 'Não'
      case 'json':
        try {
          return JSON.stringify(JSON.parse(valor), null, 2)
        } catch {
          return valor
        }
      default:
        return valor
    }
  }
}