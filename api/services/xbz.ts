import axios from 'axios';

interface XBZProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  ecological_classification: string;
  sustainability_features: string[];
  certifications: string[];
  images: string[];
  specifications: Record<string, any>;
  available: boolean;
}

interface XBZApiResponse {
  success: boolean;
  data: XBZProduct[];
  message?: string;
}

class XBZService {
  private baseUrl: string;
  private cnpj: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.XBZ_API_BASE_URL || 'https://api.xbz.com.br';
    this.cnpj = process.env.XBZ_API_CNPJ || '';
    this.token = process.env.XBZ_API_TOKEN || '';

    // Make credentials optional - service will be disabled if not configured
    if (!this.cnpj || !this.token) {
      console.log('XBZ API credentials not configured - XBZ integration will be disabled');
    }
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      'X-CNPJ': this.cnpj
    };
  }

  async getEcologicalProducts(): Promise<XBZProduct[]> {
    if (!this.cnpj || !this.token) {
      console.log('XBZ API credentials not configured - returning empty array');
      return [];
    }

    try {
      const response = await axios.get<XBZApiResponse>(
        `${this.baseUrl}/products/ecological`,
        {
          headers: this.getHeaders(),
          timeout: 10000
        }
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch ecological products');
      }
    } catch (error) {
      console.error('Error fetching XBZ ecological products:', error);
      throw error;
    }
  }

  async getProductById(productId: string): Promise<XBZProduct | null> {
    try {
      const response = await axios.get<{ success: boolean; data: XBZProduct }>(
        `${this.baseUrl}/products/${productId}`,
        {
          headers: this.getHeaders(),
          timeout: 10000
        }
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        return null;
      }
    } catch (error) {
      console.error(`Error fetching XBZ product ${productId}:`, error);
      return null;
    }
  }

  async searchEcologicalProducts(query: string): Promise<XBZProduct[]> {
    try {
      const response = await axios.get<XBZApiResponse>(
        `${this.baseUrl}/products/search`,
        {
          headers: this.getHeaders(),
          params: {
            q: query,
            ecological_only: true
          },
          timeout: 10000
        }
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to search ecological products');
      }
    } catch (error) {
      console.error('Error searching XBZ ecological products:', error);
      throw error;
    }
  }

  // Método para transformar produtos XBZ no formato do nosso sistema
  transformToLocalProduct(xbzProduct: XBZProduct) {
    return {
      id: `xbz_${xbzProduct.id}`,
      name: xbzProduct.name,
      description: xbzProduct.description,
      category: xbzProduct.category,
      images: xbzProduct.images,
      specifications: xbzProduct.specifications,
      features: xbzProduct.sustainability_features,
      certifications: xbzProduct.certifications,
      ecological_classification: xbzProduct.ecological_classification,
      is_ecological: true,
      is_external: true,
      external_source: 'XBZ',
      available: xbzProduct.available,
      rating: 4.5, // Rating padrão para produtos ecológicos
      reviewCount: 0
    };
  }
}

export default new XBZService();