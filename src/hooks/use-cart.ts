
import type { CartItem, Product } from '@/lib/types';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, unitType?: 'main' | 'sub') => void;
  removeItem: (productId: string, selectedUnitType: 'main' | 'sub') => void; // Need unit type to identify item
  updateItemQuantity: (productId: string, selectedUnitType: 'main' | 'sub', quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number; // Total price *after* discounts
  getOriginalTotalPrice: () => number; // Total price *before* discounts
  getItemCount: () => number; // Total number of *individual pieces* (sub-units or main units)
}

// Helper to apply discount
const applyDiscount = (price: number, discountRate?: number): number => {
    if (discountRate && discountRate > 0 && discountRate <= 100) {
        return price * (1 - discountRate / 100);
    }
    return price;
};


// Helper to calculate price per sub-unit (before discount)
const calculateOriginalSubUnitPrice = (product: Product): number => {
    if (product.subUnitsPerUnit && product.subUnitsPerUnit > 0) {
        return product.price / product.subUnitsPerUnit;
    }
    return product.price; // If no sub-units, sub-unit price is the same as main unit price
};

// Helper to get available quantity in terms of the selected unit
const getAvailableQuantity = (product: Product, selectedUnitType: 'main' | 'sub'): number => {
    if (selectedUnitType === 'sub' && product.subUnitsPerUnit) {
        // Convert main unit quantity to sub-unit quantity
        return Math.floor(product.quantity * product.subUnitsPerUnit);
    }
    // For main unit, return the quantity directly (allow floor for safety, though it might be fractional)
    return Math.floor(product.quantity);
};


export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1, unitType = 'main') =>
        set((state) => {
          const isSubUnit = unitType === 'sub' && !!product.subUnitType && !!product.subUnitsPerUnit;
          const selectedUnitType = isSubUnit ? 'sub' : 'main';
           // Calculate original price based on selected unit
          const originalPricePerSelectedUnit = isSubUnit ? calculateOriginalSubUnitPrice(product) : product.price;
          // Calculate price *after* applying discount
           const discountedPricePerSelectedUnit = applyDiscount(originalPricePerSelectedUnit, product.discountRate);

          const availableStockInSelectedUnit = getAvailableQuantity(product, selectedUnitType);

          const existingItemIndex = state.items.findIndex(
              (item) => item.id === product.id && item.selectedUnitType === selectedUnitType
          );

          const itemsCopy = [...state.items];

          if (existingItemIndex > -1) {
            // Item with the same unit type exists, update quantity
            const existingItem = itemsCopy[existingItemIndex];
            const potentialNewQuantity = existingItem.cartQuantity + quantity;
            const newQuantity = Math.min(potentialNewQuantity, availableStockInSelectedUnit); // Don't exceed available stock
            itemsCopy[existingItemIndex] = { ...existingItem, cartQuantity: newQuantity };
          } else {
             // Add new item or item with a different unit type
            const newQuantity = Math.min(quantity, availableStockInSelectedUnit); // Don't exceed available stock
             if (newQuantity > 0) { // Only add if stock allows
                itemsCopy.push({
                  ...product,
                  cartQuantity: newQuantity,
                  selectedUnitType: selectedUnitType,
                  // Store the price *after* discount for this item in the cart
                  pricePerSelectedUnit: discountedPricePerSelectedUnit,
                });
             }
          }
          return { items: itemsCopy };
        }),
      removeItem: (productId, selectedUnitType) =>
        set((state) => ({
          items: state.items.filter(
              (item) => !(item.id === productId && item.selectedUnitType === selectedUnitType)
          ),
        })),
      updateItemQuantity: (productId, selectedUnitType, quantity) =>
        set((state) => {
           const itemIndex = state.items.findIndex(
             (item) => item.id === productId && item.selectedUnitType === selectedUnitType
            );

            if (itemIndex === -1) return state; // Item not found

            const itemsCopy = [...state.items];
            const currentItem = itemsCopy[itemIndex];
            const availableStockInSelectedUnit = getAvailableQuantity(currentItem, selectedUnitType);

          if (quantity <= 0) {
            // Remove item if quantity is 0 or less
             itemsCopy.splice(itemIndex, 1);
          } else {
             // Update quantity, ensuring it doesn't exceed available stock
              itemsCopy[itemIndex] = {
                  ...currentItem,
                  // Note: pricePerSelectedUnit remains the discounted price
                  cartQuantity: Math.min(quantity, availableStockInSelectedUnit)
              };
          }
           return { items: itemsCopy };
        }),
      clearCart: () => set({ items: [] }),
       // getTotalPrice now reflects the total *after* discounts
       getTotalPrice: () =>
         get().items.reduce((total, item) => total + item.pricePerSelectedUnit * item.cartQuantity, 0),
        // New function to get original total (before discount)
        getOriginalTotalPrice: () =>
            get().items.reduce((total, item) => {
                const originalPrice = item.selectedUnitType === 'sub'
                    ? calculateOriginalSubUnitPrice(item)
                    : item.price;
                return total + originalPrice * item.cartQuantity;
            }, 0),
       // Returns the total count of individual items added (sum of cartQuantity for each line item)
      getItemCount: () =>
         get().items.reduce((total, item) => total + item.cartQuantity, 0),
    }),
    {
      name: 'pharmacy-cart-storage-v3', // Updated storage name due to discount logic
      storage: createJSONStorage(() => localStorage), // use localStorage
    }
  )
);
