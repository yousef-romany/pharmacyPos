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

export function CartItem({ item }: CartItemProps) {
  const { updateItemQuantity, removeItem } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = React.useState(item.cartQuantity);

  // Update local state if cart state changes externally
  React.useEffect(() => {
    setQuantity(item.cartQuantity);
  }, [item.cartQuantity]);

  const handleQuantityChange = (newQuantity: number) => {
    const validatedQuantity = Math.max(0, Math.min(newQuantity, item.quantity)); // Ensure quantity is between 0 and available stock
    setQuantity(validatedQuantity); // Update local state immediately for responsiveness
    updateItemQuantity(item.id, validatedQuantity); // Update global cart state

     if (validatedQuantity === 0) {
       toast({
         title: "تمت الإزالة من السلة",
         description: `${item.nameAr} تمت إزالته من سلة المشتريات.`,
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
    }
  };

  const handleBlur = () => {
      // If input is empty on blur, set quantity to 1 or remove if it was 0
      if (quantity === 0 && item.cartQuantity > 0) {
           // If it was previously > 0 and now cleared, remove it fully
            handleQuantityChange(0);
      } else if (quantity === 0) {
          // If it was 0 or invalid, reset based on cart or remove if cart thinks it's 0
          if (item.cartQuantity <= 0) {
               handleQuantityChange(0); // Ensure removal if cart agrees it's 0
          } else {
               setQuantity(item.cartQuantity); // Reset to cart quantity if valid
          }
      } else {
          // Validate again on blur in case of direct input
          handleQuantityChange(quantity);
      }
  };


  const handleRemove = () => {
    removeItem(item.id);
    toast({
      title: "تمت الإزالة من السلة",
      description: `${item.nameAr} تمت إزالته من سلة المشتريات.`,
      variant: "destructive",
    });
  };


  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div className="flex-1 min-w-0 mr-4"> {/* Use mr-4 for spacing in RTL */}
        <p className="font-medium truncate">{item.nameAr}</p>
        <p className="text-sm text-muted-foreground">{(item.price * quantity).toFixed(2)} ر.س</p>
      </div>
      <div className="flex items-center space-x-2 space-x-reverse"> {/* Reverse space for RTL */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(quantity - 1)}
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          min="0"
          max={item.quantity}
          value={quantity === 0 && document.activeElement !== event?.target ? '' : quantity} // Show empty string if focused and 0
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
          disabled={quantity >= item.quantity} // Disable if max stock reached
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
