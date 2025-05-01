import type { CartItem, Product } from '@/lib/types';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getItemCount: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) =>
        set((state) => {
          const existingItem = state.items.find((item) => item.id === product.id);
          if (existingItem) {
            // Increase quantity if item already exists
            const newQuantity = Math.min(existingItem.cartQuantity + quantity, product.quantity); // Don't exceed available stock
            return {
              items: state.items.map((item) =>
                item.id === product.id ? { ...item, cartQuantity: newQuantity } : item
              ),
            };
          } else {
             // Add new item
            const newQuantity = Math.min(quantity, product.quantity); // Don't exceed available stock
            return { items: [...state.items, { ...product, cartQuantity: newQuantity }] };
          }
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        })),
      updateItemQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            // Remove item if quantity is 0 or less
            return { items: state.items.filter((item) => item.id !== productId) };
          }
          return {
            items: state.items.map((item) =>
              item.id === productId ? { ...item, cartQuantity: Math.min(quantity, item.quantity) } : item // Ensure quantity doesn't exceed available stock
            ),
          };
        }),
      clearCart: () => set({ items: [] }),
      getTotalPrice: () =>
        get().items.reduce((total, item) => total + item.price * item.cartQuantity, 0),
      getItemCount: () =>
        get().items.reduce((total, item) => total + item.cartQuantity, 0),
    }),
    {
      name: 'pharmacy-cart-storage', // unique name
      storage: createJSONStorage(() => localStorage), // use localStorage
    }
  )
);
