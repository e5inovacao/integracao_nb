// Tipos principais do sistema Natureza Brindes

export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  images: string[];
  category: ProductCategory;
  sustainabilityFeatures: SustainabilityFeature[];
  customizationOptions: CustomizationOption[];
  minQuantity: number;
  maxQuantity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  specifications: Record<string, string>;
  features: string[];
  certifications: string[];
  rating: number;
  reviewCount: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
}

export interface SustainabilityFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  badge: string;
}

export interface CustomizationOption {
  id: string;
  name: string;
  type: 'text' | 'color' | 'size' | 'material';
  options?: string[];
  required: boolean;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  customizations: Record<string, string>;
  observations?: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totalItems: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteRequest {
  id: string;
  customerInfo: CustomerInfo;
  items: CartItem[];
  totalItems: number;
  message?: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'pending' | 'processing' | 'quoted' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  adminNotes?: string;
  quotedAt?: Date;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  company: string;
  cnpj?: string;
  address: Address;
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

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'seller' | 'customer';
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FilterOptions {
  category?: string;
  sustainabilityFeatures?: string[];
  search?: string;
  sortBy?: 'name' | 'newest' | 'popular';
  sortOrder?: 'asc' | 'desc';
}

export interface DashboardStats {
  totalQuotes: number;
  pendingQuotes: number;
  approvedQuotes: number;
  monthlyGrowth: number;
  topProducts: Product[];
  recentQuotes: QuoteRequest[];
}

// Enums
export enum QuoteStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  QUOTED = 'quoted',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum UserRole {
  ADMIN = 'admin',
  SELLER = 'seller',
  CUSTOMER = 'customer'
}

export enum UrgencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}