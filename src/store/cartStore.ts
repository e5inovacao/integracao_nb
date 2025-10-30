import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  image: string;
  quantity: number;
  observations?: string;
  // Campos específicos para produtos ecológicos
  ecologicalId?: number;
  category?: string;
  subcategory?: string;
  // Novos campos para melhor controle
  selectedColor?: string;
  itemNotes?: string;
  unitPrice?: number;
}

export interface CartState {
  items: CartItem[];
  observations: string;
  isOpen: boolean;
  
  // Actions
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateItemColor: (id: string, color: string) => void;
  updateItemNotes: (id: string, notes: string) => void;
  updateObservations: (observations: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  
  // Computed
  getTotalItems: () => number;
  getCartSummary: () => {
    totalItems: number;
    items: CartItem[];
    observations: string;
  };
}

export const useCartStore = create<CartState>()(persist(
  (set, get) => ({
    items: [],
    observations: '',
    isOpen: false,
    
    addItem: (item) => {
      const { items } = get();
      const existingItem = items.find(i => i.id === item.id);
      
      if (existingItem) {
        // Se o item já existe, aumenta a quantidade
        set({
          items: items.map(i => 
            i.id === item.id 
              ? { ...i, quantity: i.quantity + (item.quantity || 1) }
              : i
          )
        });
      } else {
        // Adiciona novo item
        set({
          items: [...items, { ...item, quantity: item.quantity || 1 }]
        });
      }
    },
    
    removeItem: (id) => {
      set(state => ({
        items: state.items.filter(item => item.id !== id)
      }));
    },
    
    updateQuantity: (id, quantity) => {
      if (quantity <= 0) {
        get().removeItem(id);
        return;
      }
      
      set(state => ({
        items: state.items.map(item => 
          item.id === id ? { ...item, quantity } : item
        )
      }));
    },
    
    updateItemColor: (id, color) => {
      set(state => ({
        items: state.items.map(item => 
          item.id === id ? { ...item, selectedColor: color } : item
        )
      }));
    },
    
    updateItemNotes: (id, notes) => {
      set(state => ({
        items: state.items.map(item => 
          item.id === id ? { ...item, itemNotes: notes } : item
        )
      }));
    },
    
    updateObservations: (observations) => {
      set({ observations });
    },
    
    clearCart: () => {
      set({ items: [], observations: '' });
    },
    
    openCart: () => {
      set({ isOpen: true });
    },
    
    closeCart: () => {
      set({ isOpen: false });
    },
    
    getTotalItems: () => {
      const { items } = get();
      return items.reduce((total, item) => total + item.quantity, 0);
    },
    
    getCartSummary: () => {
      const { items, observations } = get();
      return {
        totalItems: items.reduce((total, item) => total + item.quantity, 0),
        items,
        observations
      };
    }
  }),
  {
    name: 'natureza-brindes-cart',
    partialize: (state) => ({ 
      items: state.items, 
      observations: state.observations 
    })
  }
));