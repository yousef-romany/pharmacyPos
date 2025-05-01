"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, CreditCard, Trash2 } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { CartItem } from './cart-item';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export function CartSummary() {
  const { items, getTotalPrice, getItemCount, clearCart } = useCart();
  const { toast } = useToast();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    // This ensures the component only renders cart data on the client
    // where localStorage is available and Zustand state is hydrated.
    setIsClient(true);
  }, []);


  const handleCheckout = () => {
    // In a real app, this would trigger the payment process
    console.log('Checkout initiated:', { items, total: getTotalPrice() });
    toast({
      title: "إتمام عملية الشراء",
      description: `تم إنشاء طلب بمبلغ إجمالي ${getTotalPrice().toFixed(2)} ر.س.`,
    });
    // Optionally clear cart after successful checkout
    // clearCart();
  };

    const handleClearCart = () => {
    clearCart();
    toast({
      title: "تم تفريغ السلة",
      description: "تمت إزالة جميع المنتجات من سلة المشتريات.",
      variant: "destructive",
    });
  };

  // Render placeholders or null until client-side hydration is complete
  if (!isClient) {
     return (
      <div className="relative">
        <Button variant="outline" size="icon" className="relative" disabled>
          <ShoppingCart className="h-5 w-5" />
          <span className="sr-only">سلة المشتريات</span>
        </Button>
      </div>
    );
  }

  const itemCount = getItemCount();
  const totalPrice = getTotalPrice();


  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
             <Badge
              variant="destructive" // Use destructive variant for high visibility like red
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs"
              style={{ lineHeight: '1' }} // Ensure number fits well
            >
              {itemCount}
            </Badge>
          )}
          <span className="sr-only">سلة المشتريات</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-lg font-semibold">سلة المشتريات</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <ShoppingCart className="w-16 h-16 mb-4 text-gray-300" />
              <p>سلة المشتريات فارغة.</p>
              <p className="text-sm">أضف منتجات لبدء عملية الشراء.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </ScrollArea>
        {items.length > 0 && (
          <SheetFooter className="px-6 py-4 border-t bg-secondary/50">
            <div className="w-full space-y-4">
               <div className="flex justify-between items-center font-semibold text-lg">
                <span>الإجمالي:</span>
                <span>{totalPrice.toFixed(2)} ر.س</span>
              </div>
              <Separator />
              <div className="flex gap-2">
                 <Button
                    variant="outline"
                    className="flex-1 text-destructive hover:bg-destructive/10 border-destructive/50"
                    onClick={handleClearCart}
                  >
                    <Trash2 className="ml-2 h-4 w-4" />
                    تفريغ السلة
                  </Button>
                <SheetClose asChild>
                  <Button
                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                    onClick={handleCheckout}
                  >
                    <CreditCard className="ml-2 h-4 w-4" />
                    إتمام الشراء
                  </Button>
                 </SheetClose>

              </div>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
