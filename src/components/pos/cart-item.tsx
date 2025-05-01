
"use client";

import * as React from 'react';
import type { CartItem as CartItemType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useToast } from "@/hooks/use-toast";

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
        // Allow clearing the input, treat as 0 temporarily
        setQuantity(0);
        // Optionally trigger update immediately or wait for blur
        // updateItemQuantity(item.id, item.selectedUnitType, 0);
    }
  };

  const handleBlur = () => {
      // On blur, finalize the quantity update based on the local state
       handleQuantityChange(quantity);
  };


  const handleRemove = () => {
    // Use the specific removeItem signature
    removeItem(item.id, item.selectedUnitType);
    toast({
      title: "تمت الإزالة من السلة",
      description: `${item.nameAr} (${unitLabel}) تمت إزالته.`,
      variant: "destructive",
    });
  };


  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div className="flex-1 min-w-0 mr-4"> {/* Use mr-4 for spacing in RTL */}
        <p className="font-medium truncate">{item.nameAr} <span className="text-xs text-muted-foreground">({unitLabel})</span></p>
        <p className="text-sm text-muted-foreground">{(item.pricePerSelectedUnit * quantity).toFixed(2)} ر.س</p>
      </div>
      <div className="flex items-center space-x-2 space-x-reverse"> {/* Reverse space for RTL */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(quantity - 1)}
          disabled={quantity <= 0} // Disable if quantity is already 0
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          min="0"
          max={availableStockInSelectedUnit} // Set max based on available stock
           value={quantity === 0 && document.activeElement === event?.target ? '' : quantity.toString()} // Show empty if focused and 0
          onChange={handleInputChange}
          onBlur={handleBlur}
          className="h-8 w-14 text-center px-1" // Adjusted width and padding
          aria-label="Item quantity"
        />
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(quantity + 1)}
          disabled={quantity >= availableStockInSelectedUnit} // Disable if max stock reached
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
