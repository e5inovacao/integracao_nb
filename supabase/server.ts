import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import type { Database } from './types';
import path from 'path';
import { fileURLToPath } from 'url';

// for esm mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://crfdqfmtymqavfkmgtap.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment variables loaded:');
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseServiceKey);
console.log('VITE_SUPABASE_URL:', supabaseUrl);

if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

// Cliente Supabase para o servidor com service role key
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Funções utilitárias para operações no banco
export const supabaseOperations = {
  // Produtos
  async getProducts() {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getProductById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createProduct(product: Database['Tables']['products']['Insert']) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(product)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateProduct(id: string, updates: Database['Tables']['products']['Update']) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteProduct(id: string) {
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Produtos Ecológicos
  async getEcologicalProducts() {
    const { data, error } = await supabaseAdmin
      .from('produtos_ecologicos')
      .select('*')
      .eq('stativo', 'S')
      .order('Nome', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Usuários Sistema
  async getUsers() {
    const { data, error } = await supabaseAdmin
      .from('usuarios_sistema')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getUserById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('usuarios_sistema')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Orçamentos Sistema
  async getQuotes() {
    const { data, error } = await supabaseAdmin
      .from('orcamentos_sistema')
      .select(`
        *,
        usuarios_sistema!usuario_id(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getQuoteById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('orcamentos_sistema')
      .select(`
        *,
        usuarios_sistema!usuario_id(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateQuoteStatus(id: string, status: string) {
    const { data, error } = await supabaseAdmin
      .from('orcamentos_sistema')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Itens de Orçamento Sistema
  async getQuoteItems(quoteId: string) {
    const { data, error } = await supabaseAdmin
      .from('itens_orcamento_sistema')
      .select(`
        *,
        produtos_ecologicos!produto_ecologico_id(*)
      `)
      .eq('orcamento_id', quoteId);
    
    if (error) throw error;
    return data;
  }
};