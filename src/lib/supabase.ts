import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Please check your .env file.')
}

// Configurações do cliente Supabase com tratamento de erros melhorado
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
    flowType: 'pkce',
    storage: {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch {
          // Ignorar erros de storage silenciosamente
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Ignorar erros de storage silenciosamente
        }
      }
    }
  },
  // Configurações globais
  global: {
    headers: {
      'X-Client-Info': 'nb-admin-v2'
    },
    // Interceptador de fetch melhorado para silenciar erros de refresh token
    fetch: async (url, options = {}) => {
      // Bloquear completamente requisições de refresh token
      if (url.includes('/auth/v1/token') && url.includes('grant_type=refresh_token')) {
        console.warn('Bloqueando requisição de refresh token automático');
        // Retornar uma resposta vazia para evitar o erro
        return new Response(JSON.stringify({ error: 'refresh_disabled' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error: any) {
        clearTimeout(timeoutId);
        
        // Silenciar erros relacionados ao refresh token
        if (url.includes('/auth/v1/token') || error.message?.includes('refresh')) {
          if (String(error?.message || '').includes('refresh_disabled')) {
            return new Response(JSON.stringify({ error: 'refresh_disabled' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          console.warn('Erro de refresh token silenciado:', error.message);
          return new Response(JSON.stringify({ error: 'network_error' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        if (error.name === 'AbortError') {
          console.warn('Requisição Supabase cancelada por timeout');
          throw new Error('Network timeout');
        }
        throw error;
      }
    }
  }
})

// Interceptador para tratar erros de rede e refresh token
let isRefreshing = false
let refreshPromise: Promise<any> | null = null

// Função para lidar com erros de autenticação
export const handleAuthError = async (error: any) => {
  console.warn('Erro de autenticação detectado:', error)
  
  // Se for erro de refresh token e não estiver já tentando refresh
  if (error?.message?.includes('refresh') && !isRefreshing) {
    isRefreshing = true
    
    try {
      // Tentar obter nova sessão
      const { data, error: refreshError } = await supabase.auth.getSession()
      
      if (refreshError || !data.session) {
        console.warn('Falha ao renovar sessão, fazendo logout...')
        await supabase.auth.signOut()
        // Redirecionar para login se necessário
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    } catch (refreshError) {
      console.error('Erro crítico no refresh:', refreshError)
      await supabase.auth.signOut()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    } finally {
      isRefreshing = false
    }
  }
}

// Monitorar erros de rede globalmente com tratamento melhorado
if (typeof window !== 'undefined') {
  // Interceptar erros de fetch relacionados ao Supabase
  const originalFetch = window.fetch
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args)
      
      // Se for uma requisição para o Supabase e falhou
      if (args[0]?.toString().includes('supabase.co') && !response.ok) {
        // Apenas log de warning, não interromper o fluxo
        console.warn('Requisição Supabase falhou:', response.status, response.statusText)
        
        // Não fazer logout automático para evitar loops
        // Se for erro crítico, deixar o componente lidar com isso
      }
      
      return response
    } catch (error) {
      // Se for erro de rede para o Supabase, apenas log
      if (args[0]?.toString().includes('supabase.co')) {
        console.warn('Erro de rede Supabase (silenciado):', error.message)
        // Não propagar o erro para evitar crashes
        return new Response(JSON.stringify({ error: 'Network error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      throw error
    }
  }
}

// Tipos TypeScript para as tabelas do banco
export interface Cliente {
  id: string
  ativo: boolean
  nome: string
  empresa: string
  razao_social: string
  ie: string
  cnpj: string
  cpf: string
  documento: string
  tipo_pessoa: 'fisica' | 'juridica'
  representante: number
  ramo: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  email: string
  telefone: string
  fone_comercial: string
  fone_celular: string
  fone_residencial: string
  contato_nome?: string
  contato_email?: string
  contato_telefone?: string
  observacoes: string
  created_at: string
  updated_at: string
}

export interface Produto {
  id: number
  produto_ref?: string
  produto_name: string
  produto_img: string
  fornecedor: string
  produto_descricao: string
  categoria: string
  produto_cor?: boolean
  opcoes_cor?: boolean
  quantidade_minima: boolean
  quantidade: number
  status_ativa: string
  data_atualizacao?: string
  altura?: number
  largura?: number
  profundidade?: number
  expessura?: number
  circunferencia?: number
  garantia?: string
  peso?: number
  medidas_para_gravacao?: number
  tamanho_total?: number
}

export interface ProductVariation {
  id: string
  produto_id: string
  nome: string
  tipo: string
  valor: string
  custo_adicional: number
  preco_adicional: number
  codigo?: string
  estoque_adicional: number
  ativo: boolean
  ordem: number
  created_at: string
  updated_at: string
}

export interface Orcamento {
  id: number
  origem: string
  cliente_id: string
  contato_nome: string
  contato_email: string
  contato_fone: string
  representante: number
  status: string
  created_at: string
  updated_at: string
}

export interface QuoteVersion {
  id: number
  quote_id: number
  version_number: number
  validade_proposta: string
  prazo_entrega: string
  forma_pagamento: string
  opcao_frete: string
  observacoes: string
  observacoes_adic: string
  local_entrega: string
  local_cobranca: string
  pdf_url: string
  sent: boolean
  created_at: string
}

export interface QuoteItem {
  id: number
  quote_version_id: number
  produto_id: number
  quantidade: number
  preco_unitario: number
  subtotal: number
  personalizacao: string
  ordem: number
  created_at: string
}

export interface QuoteHistory {
  id: number
  quote_id: number
  action: string
  description: string
  user_id: string
  created_at: string
}

export interface User {
  id: string
  email: string
  nome: string
  role: string
  created_at: string
}

export interface EcologicProduct {
  id: number
  tipo: string
  codigo: string
  titulo: string
  descricao?: string
  img_0?: string
  img_1?: string
  img_2?: string
  categoria?: string
  cor_web_principal?: string
  altura?: number
  largura?: number
  comprimento?: number
  peso?: number
  variacoes?: any
}

export interface ProductsSolicitacao {
  id: number
  created_at: string
  solicitacao_id?: number
  products_id?: number
  products_quantidade_01?: number
  products_quantidade_02?: number
  products_quantidade_03?: number
  ecologic_products_site?: EcologicProduct
}