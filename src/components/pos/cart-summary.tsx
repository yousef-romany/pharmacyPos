
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, CreditCard, Trash2, Loader2 } from 'lucide-react'; // Added Loader2
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
import { addSale, updateProduct } from '@/lib/data'; // Import addSale and updateProduct
import type { SaleTransaction } from '@/lib/types'; // Import SaleTransaction type

export function CartSummary() {
  const { items, getTotalPrice, getItemCount, clearCart } = useCart();
  const { toast } = useToast();
  const [isClient, setIsClient] = React.useState(false);
  const [isCheckingOut, setIsCheckingOut] = React.useState(false); // Checkout loading state

  React.useEffect(() => {
    setIsClient(true);
  }, []);


  const handleCheckout = async () => {
    if (items.length === 0) {
        toast({ title: "السلة فارغة", description: "أضف منتجات أولاً.", variant: "destructive"});
        return;
    }
    setIsCheckingOut(true);
    try {
      // 1. Prepare sale transaction data
      const saleData: Omit<SaleTransaction, 'id'> = {
        // customerId: selectedCustomer?.id, // Optional: Add customer selection later
        items: items.map(item => ({
          productId: item.id,
          quantity: item.cartQuantity,
          price: item.price, // Price at the time of sale
        })),
        totalAmount: getTotalPrice(),
        date: new Date(),
      };

      // 2. (Simulated) Save the sale transaction
      const newSale = await addSale(saleData);
      console.log('Sale created:', newSale);

      // 3. Update product quantities in stock
      // Use Promise.all for parallel updates
      await Promise.all(items.map(item => {
          const newQuantity = item.quantity - item.cartQuantity; // Calculate remaining stock
          return updateProduct(item.id, { quantity: newQuantity });
      }));
      console.log('Product quantities updated.');


      // 4. Clear the cart
      clearCart();

      // 5. Show success message
      toast({
        title: "تمت عملية البيع بنجاح",
        description: `تم إنشاء الفاتورة رقم ${newSale.id} بمبلغ ${newSale.totalAmount.toFixed(2)} ر.س.`,
      });

      // Optionally trigger printing or other post-checkout actions here

    } catch (error) {
      console.error("Checkout failed:", error);
      toast({
        title: "فشل إتمام الشراء",
        description: "حدث خطأ أثناء تسجيل الفاتورة أو تحديث المخزون.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
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
          <span className="sr-only">سلة المشتريات ({itemCount})</span>
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
                    disabled={isCheckingOut} // Disable while checking out
                  >
                    <Trash2 className="ml-2 h-4 w-4" />
                    تفريغ السلة
                  </Button>
                {/* Keep checkout button outside SheetClose if we handle closing manually on success */}
                  <Button
                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                    onClick={handleCheckout}
                    disabled={isCheckingOut} // Disable while checking out
                  >
                     {isCheckingOut ? (
                       <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                     ) : (
                       <CreditCard className="ml-2 h-4 w-4" />
                     )}
                    {isCheckingOut ? 'جاري التنفيذ...' : 'إتمام الشراء'}
                  </Button>
                 {/* <SheetClose asChild> needed if button should close sheet directly */}

              </div>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
