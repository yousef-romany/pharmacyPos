
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

// Helper to safely parse numbers from potential strings
const safeParseFloat = (value: string | number | null | undefined, defaultValue = 0): number => {
    if (value === null || value === undefined) return defaultValue;
    const parsed = parseFloat(value.toString());
    return isNaN(parsed) ? defaultValue : parsed;
};


// Helper to apply discount
const applyDiscount = (price: number, discountRate?: number | string | null): number => {
    const rate = safeParseFloat(discountRate);
    if (rate > 0 && rate <= 100) {
        return price * (1 - rate / 100);
    }
    return price;
};


// Helper to calculate price per sub-unit (before discount)
const calculateOriginalSubUnitPrice = (product: Product): number => {
    const price = safeParseFloat(product.price);
    if (product.subUnitsPerUnit && product.subUnitsPerUnit > 0) {
        return price / product.subUnitsPerUnit;
    }
    return price; // If no sub-units, sub-unit price is the same as main unit price
};

// Helper to get available quantity in terms of the selected unit
const getAvailableQuantity = (product: Product, selectedUnitType: 'main' | 'sub'): number => {
    const quantityNum = safeParseFloat(product.quantity);
    if (isNaN(quantityNum)) return 0;

    if (selectedUnitType === 'sub' && product.subUnitsPerUnit) {
        // Convert main unit quantity to sub-unit quantity
        return Math.floor(quantityNum * product.subUnitsPerUnit);
    }
    // For main unit, return the quantity directly, flooring for safety
    return Math.floor(quantityNum);
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
          const originalPricePerSelectedUnit = isSubUnit ? calculateOriginalSubUnitPrice(product) : safeParseFloat(product.price);
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
                // Ensure all numeric fields from product are parsed correctly before adding
                itemsCopy.push({
                  ...product,
                  price: safeParseFloat(product.price),
                  lastPurchaseCost: safeParseFloat(product.lastPurchaseCost, undefined), // Allow undefined if null/empty
                  quantity: safeParseFloat(product.quantity),
                  discountRate: safeParseFloat(product.discountRate, undefined), // Allow undefined if null/empty
                  // Cart specific fields
                  cartQuantity: newQuantity,
                  selectedUnitType: selectedUnitType,
                  pricePerSelectedUnit: discountedPricePerSelectedUnit, // Store the discounted price
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

          // Ensure quantity is not negative
          const newQuantity = Math.max(0, quantity);

          if (newQuantity === 0) {
            // Remove item if quantity is 0
             itemsCopy.splice(itemIndex, 1);
          } else {
             // Update quantity, ensuring it doesn't exceed available stock
              const cappedQuantity = Math.min(newQuantity, availableStockInSelectedUnit);
              itemsCopy[itemIndex] = {
                  ...currentItem,
                  cartQuantity: cappedQuantity
              };
          }
           return { items: itemsCopy };
        }),
      clearCart: () => set({ items: [] }),
       // getTotalPrice now reflects the total *after* discounts
       getTotalPrice: () =>
         get().items.reduce((total, item) => total + safeParseFloat(item.pricePerSelectedUnit) * item.cartQuantity, 0),
        // New function to get original total (before discount)
        getOriginalTotalPrice: () =>
            get().items.reduce((total, item) => {
                const originalPrice = item.selectedUnitType === 'sub'
                    ? calculateOriginalSubUnitPrice(item)
                    : safeParseFloat(item.price);
                return total + originalPrice * item.cartQuantity;
            }, 0),
       // Returns the total count of individual items added (sum of cartQuantity for each line item)
      getItemCount: () =>
         get().items.reduce((total, item) => total + item.cartQuantity, 0),
    }),
    {
      name: 'pharmacy-cart-storage-v4', // Incremented version due to parsing changes
      storage: createJSONStorage(() => localStorage), // use localStorage
      // Add migration logic if necessary when changing storage structure significantly
    }
  )
);
