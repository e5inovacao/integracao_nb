// Serviço de API para comunicação com o backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005/api';

// Tipos para as respostas da API
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

// Função auxiliar para fazer requisições HTTP
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Serviços de Produtos
export const productsApi = {
  // Listar produtos com filtros e paginação
  async getProducts(params: {
    category?: string;
    features?: string;
    search?: string;
    featured?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    
    const queryString = searchParams.toString();
    const endpoint = `/products${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<PaginatedResponse<any>>(endpoint);
  },

  // Buscar produto por ID
  async getProductById(id: string) {
    return apiRequest<ApiResponse<any>>(`/products/${id}`);
  },

  // Listar produtos em destaque
  async getFeaturedProducts(limit: number = 4) {
    return apiRequest<ApiResponse<any[]>>(`/products/featured/list?limit=${limit}`);
  },

  // Listar categorias
  async getCategories() {
    return apiRequest<ApiResponse<any[]>>('/products/categories/list');
  },
};

// Serviços de Orçamentos
export const quotesApi = {
  // Criar nova solicitação de orçamento
  async createQuote(quoteData: {
    customerInfo: {
      name: string;
      phone: string;
      company: string;
      cnpj?: string;
    };
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      customizations?: Record<string, any>;
      notes?: string;
    }>;
    notes?: string;
  }) {
    return apiRequest<ApiResponse<any>>('/quotes', {
      method: 'POST',
      body: JSON.stringify(quoteData),
    });
  },

  // Listar orçamentos
  async getQuotes(params: {
    status?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    
    const queryString = searchParams.toString();
    const endpoint = `/quotes${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<PaginatedResponse<any>>(endpoint);
  },

  // Buscar orçamento por ID
  async getQuoteById(id: string) {
    return apiRequest<ApiResponse<any>>(`/quotes/${id}`);
  },

  // Atualizar status do orçamento
  async updateQuoteStatus(id: string, status: string) {
    return apiRequest<ApiResponse<any>>(`/quotes/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Excluir orçamento
  async deleteQuote(id: string) {
    return apiRequest<ApiResponse<any>>(`/quotes/${id}`, {
      method: 'DELETE',
    });
  },

  // Buscar estatísticas do dashboard
  async getDashboardStats() {
    return apiRequest<ApiResponse<any>>('/quotes/stats/dashboard');
  },
};

// Exportar API como padrão
export default {
  products: productsApi,
  quotes: quotesApi,
};