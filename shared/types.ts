// Tipos compartilhados entre frontend e backend

export type ProductCategory = 
  | 'papelaria'
  | 'casa-escritorio'
  | 'acessorios'
  | 'tecnologia'
  | 'textil'
  | 'ecologicos';

export type SustainabilityFeature = 
  | 'biodegradable'
  | 'recyclable'
  | 'renewable'
  | 'carbon-neutral'
  | 'organic'
  | 'reusable'
  | 'solar-energy'
  | 'durable'
  | 'reciclado'
  | 'biodegradavel'
  | 'sustentavel';

export type CustomizationOptionType = 'color' | 'text' | 'select';

export interface CustomizationOption {
  id: string;
  name: string;
  type: CustomizationOptionType;
  options: string[];
  required: boolean;
}

export interface ColorVariation {
  color: string;
  image: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  images: string[];
  sustainabilityFeatures: SustainabilityFeature[];
  customizationOptions: CustomizationOption[];
  inStock: boolean;
  featured: boolean;
  // Propriedades para produtos ecológicos da XBZ
  isEcological?: boolean;
  isExternal?: boolean;
  externalSource?: string;
  ecologicalClassification?: string;
  certifications?: string[];
  rating?: number;
  reviewCount?: number;
  specifications?: Record<string, any>;
  features?: string[];
  // Propriedades específicas para produtos ecológicos do Supabase
  supplier?: string;
  supplierCode?: string;
  reference?: string;
  ecologicalDatabaseId?: number;
  // Variações de cores com suas imagens
  colorVariations?: ColorVariation[];
  primaryColor?: string;
  // Dimensões físicas
  dimensions?: {
    height?: number;
    width?: number;
    length?: number;
    weight?: number;
  };
}

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  customizations: Record<string, string>;
  notes: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  company: string;
  cnpj?: string;
}

export type QuoteStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface QuoteRequest {
  id: string;
  customerInfo: CustomerInfo;
  items: CartItem[];
  totalEstimated: number;
  notes: string;
  status: QuoteStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

// Tipos para autenticação
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Tipos para dashboard administrativo
export interface DashboardStats {
  totalQuotes: number;
  pendingQuotes: number;
  approvedQuotes: number;
  rejectedQuotes: number;
  completedQuotes: number;
  totalValue: number;
}

export interface RecentQuote {
  id: string;
  customerName: string;
  company: string;
  totalEstimated: number;
  status: QuoteStatus;
  createdAt: Date;
}

export interface DashboardData {
  summary: DashboardStats;
  recentQuotes: RecentQuote[];
}