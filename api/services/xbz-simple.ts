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

  async getEcologicalProducts(): Promise<XBZProduct[]> {
    if (!this.cnpj || !this.token) {
      console.log('XBZ API credentials not configured - returning empty array');
      return [];
    }

    // For now, return empty array since we don't have real XBZ API credentials
    return [];
  }

  async getProductById(productId: string): Promise<XBZProduct | null> {
    if (!this.cnpj || !this.token) {
      console.log('XBZ API credentials not configured - returning null');
      return null;
    }

    return null;
  }

  async searchEcologicalProducts(query: string): Promise<XBZProduct[]> {
    if (!this.cnpj || !this.token) {
      console.log('XBZ API credentials not configured - returning empty array');
      return [];
    }

    return [];
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