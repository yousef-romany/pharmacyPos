
"use client";

import * as React from 'react';
import type { CartItem as CartItemType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils'; // Import cn

interface CartItemProps {
  item: CartItemType;
}

// Helper to get available quantity in terms of the selected unit
const getAvailableQuantity = (product: CartItemType, selectedUnitType: 'main' | 'sub'): number => {
    if (selectedUnitType === 'sub' && product.subUnitsPerUnit) {
        // Convert main unit quantity to sub-unit quantity
        // Use floor to prevent selling fractions of sub-units if main quantity is fractional
        return Math.floor(product.quantity * product.subUnitsPerUnit);
    }
    // For main unit, return the quantity directly, flooring for safety
    return Math.floor(product.quantity);
};

// Helper to calculate original price before discount
const calculateOriginalPrice = (item: CartItemType): number => {
     const basePrice = item.selectedUnitType === 'sub'
        ? (item.price / (item.subUnitsPerUnit || 1))
        : item.price;
     // If discount was applied, calculate original from discounted price
     if (item.discountRate && item.pricePerSelectedUnit !== basePrice) {
         return item.pricePerSelectedUnit / (1 - item.discountRate / 100);
     }
     return item.pricePerSelectedUnit; // No discount, return the stored price
};

export function CartItem({ item }: CartItemProps) {
  const { updateItemQuantity, removeItem } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = React.useState(item.cartQuantity);

  // Update local state if cart state changes externally
  React.useEffect(() => {
    setQuantity(item.cartQuantity);
  }, [item.cartQuantity]);

  const unitLabel = item.selectedUnitType === 'sub' ? item.subUnitType : item.unitType;
  const availableStockInSelectedUnit = getAvailableQuantity(item, item.selectedUnitType);
  const originalPrice = calculateOriginalPrice(item); // Calculate original price
  const hasDiscount = item.discountRate && item.discountRate > 0 && originalPrice !== item.pricePerSelectedUnit;


  const handleQuantityChange = (newQuantity: number) => {
    // Validate quantity: must be >= 0 and <= available stock for the selected unit
    const validatedQuantity = Math.max(0, Math.min(newQuantity, availableStockInSelectedUnit));
    setQuantity(validatedQuantity); // Update local state immediately

    // Update global cart state only if the validated quantity is different from current cart quantity
    // Or if it's becoming 0 (to trigger removal)
    if (validatedQuantity !== item.cartQuantity || validatedQuantity === 0) {
         updateItemQuantity(item.id, item.selectedUnitType, validatedQuantity);

         if (validatedQuantity === 0) {
           toast({
             title: "تمت الإزالة من السلة",
             description: `${item.nameAr} (${unitLabel}) تمت إزالته.`,
             variant: "destructive",
           });
        }
    } else if (newQuantity > availableStockInSelectedUnit) {
        // Inform user if they tried to exceed stock
         toast({
             title: "الكمية غير متوفرة",
             description: `الكمية المتاحة لـ ${item.nameAr} (${unitLabel}) هي ${availableStockInSelectedUnit}.`,
             variant: "destructive",
           });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      handleQuantityChange(value);
    } else if (e.target.value === '') {
        setQuantity(0);
    }
  };

  const handleBlur = () => {
       handleQuantityChange(quantity);
  };


  const handleRemove = () => {
    removeItem(item.id, item.selectedUnitType);
    toast({
      title: "تمت الإزالة من السلة",
      description: `${item.nameAr} (${unitLabel}) تمت إزالته.`,
      variant: "destructive",
    });
  };


  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div className="flex-1 min-w-0 mr-4">
        <p className="font-medium truncate">{item.nameAr} <span className="text-xs text-muted-foreground">({unitLabel})</span></p>
        <div className="flex items-baseline gap-1">
             <p className="text-sm text-foreground font-semibold">{(item.pricePerSelectedUnit * quantity).toFixed(2)} ر.س</p>
             {hasDiscount && (
                 <p className="text-xs text-muted-foreground line-through">{(originalPrice * quantity).toFixed(2)} ر.س</p>
             )}
         </div>
      </div>
      <div className="flex items-center space-x-2 space-x-reverse">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(quantity - 1)}
          disabled={quantity <= 0}
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          min="0"
          max={availableStockInSelectedUnit}
           value={quantity === 0 && document.activeElement === event?.target ? '' : quantity.toString()}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className="h-8 w-14 text-center px-1"
          aria-label="Item quantity"
        />
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(quantity + 1)}
          disabled={quantity >= availableStockInSelectedUnit}
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </Button>
         <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10"
          onClick={handleRemove}
          aria-label="Remove item"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
