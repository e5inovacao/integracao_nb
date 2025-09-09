export type UrgencyLevel = 'low' | 'normal' | 'high' | 'urgent';

export type ProductCategory = 'papelaria' | 'casa-escritorio' | 'acessorios' | 'tecnologia' | 'textil';

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  company: string;
  position?: string;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  sustainabilityFeatures: string[];
  specifications: Record<string, string>;
  customizationOptions: CustomizationOption[];
  inStock: boolean;
  featured: boolean;
}

export interface CustomizationOption {
  id: string;
  name: string;
  type: 'select' | 'text' | 'color' | 'number';
  options?: string[];
  required: boolean;
  priceModifier?: number;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  customizations: Record<string, string>;
  notes?: string;
}

export interface QuoteRequest {
  id: string;
  customerInfo: CustomerInfo;
  items: CartItem[];
  deliveryAddress: Address;
  urgencyLevel: UrgencyLevel;
  eventDate?: string;
  additionalNotes: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
  estimatedTotal: number;
}

export interface FilterState {
  category: string;
  sustainabilityFeatures: string[];
  priceRange: [number, number];
  search: string;
  sortBy: 'relevance' | 'price-asc' | 'price-desc' | 'name' | 'newest';
}

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}