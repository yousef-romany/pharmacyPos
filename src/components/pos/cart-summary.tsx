
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, CreditCard, Trash2, Loader2, Printer } from 'lucide-react'; // Added Printer
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
import { addSale, updateProduct, getProductNameById } from '@/lib/data'; // Import addSale, updateProduct, getProductNameById
import type { SaleTransaction, SaleTransactionItem } from '@/lib/types'; // Import SaleTransaction type

export function CartSummary() {
  const { items, getTotalPrice, getItemCount, clearCart } = useCart();
  const { toast } = useToast();
  const [isClient, setIsClient] = React.useState(false);
  const [isCheckingOut, setIsCheckingOut] = React.useState(false); // Checkout loading state
  const [lastSale, setLastSale] = React.useState<SaleTransaction | null>(null); // State to hold last sale for printing

  React.useEffect(() => {
    setIsClient(true);
  }, []);


  // Basic print function for the last sale invoice
  const handlePrintInvoice = async (saleToPrint: SaleTransaction) => {
    if (!saleToPrint) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        toast({ title: "خطأ", description: "فشل فتح نافذة الطباعة. تحقق من إعدادات المتصفح.", variant: "destructive" });
        return;
    }

    // Fetch product names for the invoice items
     let itemRowsHtml = '';
     for (const item of saleToPrint.items) {
        const productName = await getProductNameById(item.productId);
        const unitLabel = item.soldUnitType === 'sub'
                ? items.find(cartItem => cartItem.id === item.productId)?.subUnitType || 'وحدة فرعية'
                : items.find(cartItem => cartItem.id === item.productId)?.unitType || 'وحدة رئيسية';

         itemRowsHtml += `
             <tr>
                 <td>${productName}</td>
                 <td>${unitLabel}</td>
                 <td>${item.quantity}</td>
                 <td>${item.price.toFixed(2)}</td>
                 <td>${(item.quantity * item.price).toFixed(2)}</td>
             </tr>
         `;
     }


    printWindow.document.write(`
     <html>
     <head>
        <title>فاتورة بيع - ${saleToPrint.id}</title>
         <style>
             @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
             body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 20px; font-size: 12px; }
             table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
             th, td { border: 1px solid #ddd; padding: 6px; text-align: right; }
             th { background-color: #f2f2f2; font-weight: bold; }
             .total { font-weight: bold; font-size: 1.1em; margin-top: 15px; text-align: left; }
             .header { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; text-align: center;}
             .header h2 { margin: 0; font-size: 1.5em; }
             .info p { margin: 3px 0; }
             @media print {
                 body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                 button { display: none; }
             }
         </style>
     </head>
     <body>
         <div class="header">
             <h2>صيدليتي</h2>
             <p>فاتورة بيع</p>
         </div>
         <div class="info">
             <p><strong>رقم الفاتورة:</strong> ${saleToPrint.id}</p>
             <p><strong>التاريخ:</strong> ${saleToPrint.date.toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short'})}</p>
             <p><strong>العميل:</strong> ${saleToPrint.customerId || 'عميل نقدي'}</p> {/* TODO: Add customer name lookup */}
         </div>
         <table>
             <thead>
                 <tr>
                     <th>المنتج</th>
                     <th>الوحدة</th>
                     <th>الكمية</th>
                     <th>السعر (ر.س)</th>
                     <th>الإجمالي (ر.س)</th>
                 </tr>
             </thead>
             <tbody>
                 ${itemRowsHtml}
             </tbody>
         </table>
         <div class="total">
             <span>إجمالي الفاتورة: </span>
             <span>${saleToPrint.totalAmount.toFixed(2)} ر.س</span>
         </div>
          <button onclick="window.print()">طباعة</button>
          <button onclick="window.close()">إغلاق</button>
     </body>
     </html>
    `);
    printWindow.document.close();
    printWindow.focus(); // Focus the new window (might not work depending on browser)
     // Optional: Automatically trigger print dialog
    // setTimeout(() => printWindow.print(), 500);
  };


  const handleCheckout = async () => {
    if (items.length === 0) {
        toast({ title: "السلة فارغة", description: "أضف منتجات أولاً.", variant: "destructive"});
        return;
    }
    setIsCheckingOut(true);
    setLastSale(null); // Clear previous sale before new checkout

    try {
      // 1. Prepare sale transaction data
      const saleItems: SaleTransactionItem[] = items.map(item => ({
        productId: item.id,
        quantity: item.cartQuantity,
        price: item.pricePerSelectedUnit, // Use the calculated price per selected unit
        soldUnitType: item.selectedUnitType // Record whether 'main' or 'sub' unit was sold
      }));

      const saleData: Omit<SaleTransaction, 'id'> = {
        // customerId: selectedCustomer?.id, // Optional: Add customer selection later
        items: saleItems,
        totalAmount: getTotalPrice(),
        date: new Date(),
      };

      // 2. Save the sale transaction (which now also updates stock in lib/data.ts)
      const newSale = await addSale(saleData);
      console.log('Sale created and stock updated:', newSale);
      setLastSale(newSale); // Store the completed sale for printing

      // 3. Clear the cart
      clearCart();

      // 4. Show success message with print option
      toast({
        title: "تمت عملية البيع بنجاح",
        description: `فاتورة رقم ${newSale.id} | المبلغ ${newSale.totalAmount.toFixed(2)} ر.س`,
        action: (
           <Button variant="outline" size="sm" onClick={() => handlePrintInvoice(newSale)}>
                <Printer className="ml-2 h-4 w-4" />
                طباعة الفاتورة
            </Button>
        ),
      });

      // No need to update product quantities here as it's handled within addSale

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
              {items.map((item, index) => (
                // Need a unique key combining id and unit type
                <CartItem key={`${item.id}-${item.selectedUnitType}-${index}`} item={item} />
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
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" // Changed to primary color
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
                {/* Optional: Add a button to print the last invoice if available */}
                 {lastSale && (
                    <Button variant="secondary" size="sm" className="w-full mt-2" onClick={() => handlePrintInvoice(lastSale)}>
                        <Printer className="ml-2 h-4 w-4" />
                        طباعة الفاتورة الأخيرة ({lastSale.id.substring(0, 8)}...)
                    </Button>
                )}
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

