
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, CreditCard, Trash2, Loader2, Printer, BadgePercent, User, Coins, Landmark } from 'lucide-react'; // Added User, Coins, Landmark
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
import { addSale, getProductById, getCustomers } from '@/lib/data'; // Use simplified imports, add getCustomers
import type { SaleTransaction, SaleTransactionItem, Product, Customer, PaymentMethod } from '@/lib/types'; // Import Customer type
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select
import { Label } from '@/components/ui/label'; // Import Label

// Helper to apply discount - copied for local use if needed, but ideally imported
const applyDiscount = (price: number, discountRate?: number): number => {
    if (discountRate && discountRate > 0 && discountRate <= 100) {
        return price * (1 - discountRate / 100);
    }
    return price;
};

// Payment Method Options
const paymentMethods: { value: PaymentMethod, label: string, icon: React.ElementType }[] = [
    { value: 'cash', label: 'نقداً', icon: Coins },
    { value: 'card', label: 'بطاقة', icon: CreditCard },
    { value: 'debt', label: 'آجل/مديونية', icon: Landmark },
];


export function CartSummary() {
  // Use getOriginalTotalPrice from the hook
  const { items, getTotalPrice, getItemCount, clearCart, getOriginalTotalPrice } = useCart();
  const { toast } = useToast();
  const [isClient, setIsClient] = React.useState(false);
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [lastSale, setLastSale] = React.useState<SaleTransaction | null>(null);
  const [productDetailsMap, setProductDetailsMap] = React.useState<Map<string, Product>>(new Map());
  const [customers, setCustomers] = React.useState<Customer[]>([]); // State for customers
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | undefined>(undefined); // State for selected customer
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<PaymentMethod>('cash'); // Default to cash
  const [amountPaid, setAmountPaid] = React.useState<number>(0); // State for amount paid


  React.useEffect(() => {
    setIsClient(true);
     // Fetch customers when component mounts on client
    const loadCustomers = async () => {
        try {
            const fetchedCustomers = await getCustomers();
            setCustomers(fetchedCustomers);
        } catch (error) {
             console.error("Failed to load customers:", error);
             toast({ title: "خطأ", description: "فشل تحميل قائمة العملاء.", variant: "destructive" });
        }
    };
    loadCustomers();
  }, [toast]); // Add toast dependency


  // Reset amountPaid when total price changes
  React.useEffect(() => {
      setAmountPaid(getTotalPrice());
  }, [items, getTotalPrice]);

  // Pre-fetch product details for items in the cart
  React.useEffect(() => {
      const fetchProductDetails = async () => {
          const newMap = new Map(productDetailsMap);
          let mapUpdated = false;
          for (const item of items) {
              if (!newMap.has(item.id)) {
                  try {
                     const product = await getProductById(item.id);
                     if (product) {
                         newMap.set(item.id, product);
                         mapUpdated = true;
                     }
                  } catch (error) {
                      console.error(`Failed to fetch details for product ${item.id}:`, error);
                  }
              }
          }
          if (mapUpdated) {
              setProductDetailsMap(newMap);
          }
      };
      if (items.length > 0) {
          fetchProductDetails();
      }
  }, [items, productDetailsMap]); // Dependency array includes items and map itself to avoid stale data if fetch fails


  // Basic print function for the last sale invoice
  const handlePrintInvoice = async (saleToPrint: SaleTransaction) => {
    if (!saleToPrint) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        toast({ title: "خطأ", description: "فشل فتح نافذة الطباعة. تحقق من إعدادات المتصفح.", variant: "destructive" });
        return;
    }

    let itemRowsHtml = '';
    let totalOriginalAmount = 0;
     // Lookup customer name
    const customer = customers.find(c => c.id === saleToPrint.customerId);
    const customerName = customer ? customer.name : 'عميل نقدي';
    const paymentInfo = paymentMethods.find(p => p.value === saleToPrint.paymentMethod) || { text: saleToPrint.paymentMethod };

    for (const item of saleToPrint.items) {
        let product = productDetailsMap.get(item.productId);
         if (!product) { // Fetch if missing (fallback)
             try {
                 product = await getProductById(item.productId);
                 if (product) {
                     setProductDetailsMap(prevMap => new Map(prevMap).set(item.productId, product!));
                 }
             } catch (error) {
                 console.error(`Failed to fetch details for product ${item.productId} during print:`, error);
             }
         }

        const productName = product ? product.nameAr : `منتج (${item.productId.substring(0,6)})`;
        const unitLabel = item.soldUnitType === 'sub'
                ? product?.subUnitType || 'فرعية'
                : product?.unitType || 'رئيسية';

        // Calculate original price for this item based on the stored product details
         const originalUnitPrice = item.soldUnitType === 'sub'
             ? (product ? product.price / (product.subUnitsPerUnit || 1) : item.price / (1 - (product?.discountRate || 0)/100) ) // Estimate original if needed
             : (product ? product.price : item.price / (1 - (product?.discountRate || 0)/100) ); // Estimate original if needed

        const originalItemTotal = originalUnitPrice * item.quantity;
        totalOriginalAmount += originalItemTotal;
        const hasDiscount = item.price !== originalUnitPrice;

        itemRowsHtml += `
             <tr>
                 <td>${productName}</td>
                 <td>${unitLabel}</td>
                 <td>${item.quantity}</td>
                 <td>${item.price.toFixed(2)} ${hasDiscount ? `<span style="font-size:0.8em; color:gray; text-decoration: line-through;">(${originalUnitPrice.toFixed(2)})</span>` : ''}</td>
                 <td>${(item.quantity * item.price).toFixed(2)}</td>
             </tr>
         `;
     }

    const totalDiscount = (saleToPrint.originalTotalAmount ?? totalOriginalAmount) - saleToPrint.totalAmount;
    const remainingAmount = saleToPrint.totalAmount - saleToPrint.amountPaid;

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
             .totals { margin-top: 15px; text-align: left; font-size: 1.0em; line-height: 1.5; }
             .totals span { display: inline-block; min-width: 100px; }
             .totals strong { font-weight: bold; font-size: 1.1em; }
             .header { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; text-align: center;}
             .header h2 { margin: 0; font-size: 1.5em; }
              .info { margin-bottom: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 5px 15px; }
             .info p { margin: 3px 0; }
              .payment-method { font-weight: bold; }
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
             <p><strong>التاريخ:</strong> ${new Date(saleToPrint.date).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short'})}</p>
             <p><strong>العميل:</strong> ${customerName}</p>
             <p><strong>طريقة الدفع:</strong> <span class="payment-method">${paymentInfo.label || paymentInfo.value}</span></p>
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
          <div class="totals">
             <div><span>الإجمالي الأصلي:</span> ${(saleToPrint.originalTotalAmount ?? totalOriginalAmount).toFixed(2)} ر.س</div>
             ${totalDiscount > 0 ? `<div><span>الخصم:</span> ${totalDiscount.toFixed(2)} ر.س</div>` : ''}
             <div><span>المبلغ المدفوع:</span> ${saleToPrint.amountPaid.toFixed(2)} ر.س</div>
             ${remainingAmount > 0 && saleToPrint.paymentMethod === 'debt' ? `<div><span>المبلغ المتبقي (آجل):</span> ${remainingAmount.toFixed(2)} ر.س</div>` : ''}
             <div><strong>الإجمالي النهائي:</strong> <strong>${saleToPrint.totalAmount.toFixed(2)} ر.س</strong></div>
         </div>
          <button onclick="window.print()">طباعة</button>
          <button onclick="window.close()">إغلاق</button>
     </body>
     </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  };


  const handleCheckout = async () => {
    if (items.length === 0) {
        toast({ title: "السلة فارغة", description: "أضف منتجات أولاً.", variant: "destructive"});
        return;
    }
    // Validation for debt payment
    if (selectedPaymentMethod === 'debt' && !selectedCustomerId) {
        toast({ title: "مطلوب عميل", description: "يجب اختيار عميل لإتمام عملية البيع الآجل.", variant: "destructive"});
        return;
    }
     // Validation for amount paid
     if (amountPaid < 0) {
         toast({ title: "مبلغ غير صحيح", description: "المبلغ المدفوع لا يمكن أن يكون سالباً.", variant: "destructive"});
         return;
     }
      if (selectedPaymentMethod !== 'debt' && amountPaid < getTotalPrice()) {
         toast({ title: "مبلغ غير كاف", description: "المبلغ المدفوع أقل من الإجمالي المطلوب لطرق الدفع غير الآجلة.", variant: "destructive"});
         return;
     }


    setIsCheckingOut(true);
    setLastSale(null);

    try {
      // Prepare sale transaction data using discounted prices stored in cart items
      const saleItems: SaleTransactionItem[] = items.map(item => ({
        productId: item.id,
        quantity: item.cartQuantity,
        price: item.pricePerSelectedUnit, // This is the already discounted price
        soldUnitType: item.selectedUnitType
      }));

      const saleData: Omit<SaleTransaction, 'id'> = {
        customerId: selectedCustomerId, // Include selected customer ID
        items: saleItems,
        totalAmount: getTotalPrice(), // Use the total price after discount
        originalTotalAmount: getOriginalTotalPrice(), // Store original total
        paymentMethod: selectedPaymentMethod, // Include selected payment method
        amountPaid: amountPaid, // Include amount paid
        date: new Date(),
      };

      // Save the sale transaction (which also updates stock and customer balance)
      const newSale = await addSale(saleData);
      setLastSale(newSale);

      clearCart();
      setSelectedCustomerId(undefined); // Reset customer selection
      setSelectedPaymentMethod('cash'); // Reset payment method
      setAmountPaid(0); // Reset amount paid

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

    } catch (error) {
      console.error("Checkout failed:", error);
      toast({
        title: "فشل إتمام الشراء",
        description: "حدث خطأ أثناء تسجيل الفاتورة أو تحديث المخزون/الرصيد.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

    const handleClearCart = () => {
    clearCart();
    setSelectedCustomerId(undefined); // Reset customer
    setSelectedPaymentMethod('cash'); // Reset payment method
    setAmountPaid(0); // Reset amount paid
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
  const finalTotalPrice = getTotalPrice(); // Price after discount
  const originalTotalPrice = getOriginalTotalPrice(); // Price before discount
  const totalDiscount = originalTotalPrice - finalTotalPrice;
  const remainingAmount = finalTotalPrice - amountPaid;


  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
             <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs"
              style={{ lineHeight: '1' }}
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
                <CartItem key={`${item.id}-${item.selectedUnitType}-${index}`} item={item} />
              ))}
            </div>
          )}
        </ScrollArea>
        {items.length > 0 && (
          <SheetFooter className="px-6 py-4 border-t bg-secondary/50">
            <div className="w-full space-y-3">
               {/* Customer Selection */}
                <div className="space-y-1">
                    <Label htmlFor="customer-select">العميل (اختياري)</Label>
                    <Select onValueChange={setSelectedCustomerId} value={selectedCustomerId}>
                        <SelectTrigger id="customer-select">
                            <SelectValue placeholder="عميل نقدي (افتراضي)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="undefined">عميل نقدي (افتراضي)</SelectItem> {/* Represent no selection */}
                            {customers.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                    {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                 {/* Payment Method Selection */}
                 <div className="space-y-1">
                    <Label htmlFor="payment-method-select">طريقة الدفع</Label>
                    <Select onValueChange={(value: PaymentMethod) => setSelectedPaymentMethod(value)} value={selectedPaymentMethod}>
                        <SelectTrigger id="payment-method-select">
                             <SelectValue placeholder="اختر طريقة الدفع..." />
                        </SelectTrigger>
                        <SelectContent>
                            {paymentMethods.map((method) => (
                                <SelectItem key={method.value} value={method.value}>
                                    <div className="flex items-center gap-2">
                                        <method.icon className="h-4 w-4 text-muted-foreground"/>
                                        {method.label}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Amount Paid Input */}
                <div className="space-y-1">
                    <Label htmlFor="amount-paid">المبلغ المدفوع</Label>
                    <Input
                        id="amount-paid"
                        type="number"
                        step="0.01"
                        min="0"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                        placeholder="أدخل المبلغ المدفوع"
                    />
                 </div>


               {/* Pricing Details */}
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span>الإجمالي الأصلي:</span>
                        <span>{originalTotalPrice.toFixed(2)} ر.س</span>
                    </div>
                    {totalDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                             <span>الخصم:</span>
                            <span>- {totalDiscount.toFixed(2)} ر.س</span>
                         </div>
                    )}
                    <Separator className="my-1"/>
                    <div className="flex justify-between items-center font-semibold text-base">
                        <span>الإجمالي بعد الخصم:</span>
                        <span>{finalTotalPrice.toFixed(2)} ر.س</span>
                    </div>
                      {/* Show Remaining Amount only if applicable */}
                      {remainingAmount > 0 && (
                        <div className="flex justify-between text-destructive font-medium">
                            <span>المبلغ المتبقي:</span>
                            <span>{remainingAmount.toFixed(2)} ر.س</span>
                        </div>
                    )}
                    {remainingAmount < 0 && (
                        <div className="flex justify-between text-green-700 font-medium">
                            <span>المبلغ المرجع:</span>
                            <span>{Math.abs(remainingAmount).toFixed(2)} ر.س</span>
                        </div>
                    )}
                </div>

              <Separator />
              <div className="flex gap-2">
                 <Button
                    variant="outline"
                    className="flex-1 text-destructive hover:bg-destructive/10 border-destructive/50"
                    onClick={handleClearCart}
                    disabled={isCheckingOut}
                  >
                    <Trash2 className="ml-2 h-4 w-4" />
                    تفريغ السلة
                  </Button>
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={handleCheckout}
                    disabled={isCheckingOut || (selectedPaymentMethod === 'debt' && !selectedCustomerId)} // Disable if debt without customer
                  >
                     {isCheckingOut ? (
                       <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                     ) : (
                       <CreditCard className="ml-2 h-4 w-4" />
                     )}
                    {isCheckingOut ? 'جاري التنفيذ...' : 'إتمام الشراء'}
                  </Button>
              </div>
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
