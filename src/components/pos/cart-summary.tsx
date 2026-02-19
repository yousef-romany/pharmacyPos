
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, CreditCard, Trash2, Loader2, Printer, BadgePercent, User, Coins, Landmark, ShieldCheck, Smartphone, Wallet, Plus, X } from 'lucide-react'; // Added Smartphone, Wallet, Plus, X
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
import { addSale, getProductById, getCustomers, getCustomerById, getTreasuries } from '@/lib/data'; // Use simplified imports, add getCustomers, getCustomerById, getTreasuries
import type { SaleTransaction, SaleTransactionItem, Product, Customer, PaymentMethod, Treasury, SalePayment } from '@/lib/types'; // Import Customer, Treasury, SalePayment types
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select
import { Label } from '@/components/ui/label'; // Import Label
import { Input } from '@/components/ui/input'; // Import Input
import { cn } from '@/lib/utils'; // Import cn

// Helper to apply discount - copied for local use if needed, but ideally imported
const applyDiscount = (price: number, discountRate?: number | string | null): number => {
    const rate = safeParseFloat(discountRate);
    if (rate > 0 && rate <= 100) {
        return price * (1 - rate / 100);
    }
    return price;
};


// Helper to safely parse floats (can be moved to utils)
const safeParseFloat = (value: string | number | null | undefined, defaultValue = 0): number => {
    if (value === null || value === undefined) return defaultValue;
    const parsed = parseFloat(value.toString());
    return isNaN(parsed) ? defaultValue : parsed;
};

// Helper to calculate price per sub-unit (before discount)
const calculateOriginalSubUnitPrice = (product: Product): number => {
    const price = safeParseFloat(product.price);
    if (product.subUnitsPerUnit && product.subUnitsPerUnit > 0) {
        return price / product.subUnitsPerUnit;
    }
    return price; // If no sub-units, sub-unit price is the same as main unit price
};


// Payment Method Options
const paymentMethods: { value: PaymentMethod, label: string, icon: React.ElementType }[] = [
    { value: 'cash', label: 'نقداً', icon: Coins },
    { value: 'card', label: 'بطاقة', icon: CreditCard },
    { value: 'instapay', label: 'إنستا باي', icon: Smartphone },
    { value: 'vodafone_cash', label: 'فودافون كاش', icon: Wallet },
    { value: 'debt', label: 'آجل/مديونية', icon: Landmark },
];

interface CartSummaryProps {
    onCheckoutSuccess?: () => void; // Optional callback after successful checkout
}

export function CartSummary({ onCheckoutSuccess }: CartSummaryProps) {
    // Use getOriginalTotalPrice from the hook
    const { items, getTotalPrice, getItemCount, clearCart, getOriginalTotalPrice } = useCart();
    const { toast } = useToast();
    const [isClient, setIsClient] = React.useState(false);
    const [isCheckingOut, setIsCheckingOut] = React.useState(false);
    const [lastSale, setLastSale] = React.useState<SaleTransaction | null>(null);
    const [productDetailsMap, setProductDetailsMap] = React.useState<Map<string, Product>>(new Map());
    const [customers, setCustomers] = React.useState<Customer[]>([]); // State for customers
    const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | undefined>(undefined); // State for selected customer
    const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null); // Store full customer object
    const [treasuries, setTreasuries] = React.useState<Treasury[]>([]); // State for treasuries
    const [payments, setPayments] = React.useState<Array<{ treasuryId: string; amount: number }>>([]);  // Split payments


    React.useEffect(() => {
        setIsClient(true);
        // Fetch customers and treasuries when component mounts on client
        const loadData = async () => {
            try {
                const [fetchedCustomers, fetchedTreasuries] = await Promise.all([
                    getCustomers(),
                    getTreasuries()
                ]);
                setCustomers(fetchedCustomers);
                setTreasuries(fetchedTreasuries);
            } catch (error) {
                console.error("Failed to load data:", error);
                toast({ title: "خطأ", description: "فشل تحميل البيانات.", variant: "destructive" });
            }
        };
        loadData();
    }, [toast]); // Add toast dependency


    // Fetch full customer details when ID changes
    React.useEffect(() => {
        const fetchCustomerDetails = async () => {
            if (selectedCustomerId && selectedCustomerId !== 'undefined') {
                try {
                    const customer = await getCustomerById(selectedCustomerId);
                    setSelectedCustomer(customer || null);
                } catch (error) {
                    console.error("Failed to fetch customer details:", error);
                    toast({ title: "خطأ", description: "فشل تحميل بيانات العميل.", variant: "destructive" });
                    setSelectedCustomer(null); // Reset on error
                }
            } else {
                setSelectedCustomer(null); // Reset if "Cash Customer" is selected
            }
        };
        fetchCustomerDetails();
    }, [selectedCustomerId, toast]);


    // Calculate prices
    const subTotalPrice = getTotalPrice(); // Price after product discounts
    const insuranceDiscountRate = safeParseFloat(selectedCustomer?.insuranceDiscountRate); // Parse rate safely
    const insuranceDiscountAmount = subTotalPrice * (insuranceDiscountRate / 100);
    const finalTotalPrice = subTotalPrice - insuranceDiscountAmount; // Final price after product AND insurance discounts

    // Initialize with one payment when total changes
    React.useEffect(() => {
        if (finalTotalPrice > 0 && payments.length === 0 && treasuries.length > 0) {
            const defaultTreasury = treasuries.find(t => t.isDefault) || treasuries[0];
            if (defaultTreasury) {
                setPayments([{ treasuryId: defaultTreasury.id, amount: finalTotalPrice }]);
            }
        }
    }, [finalTotalPrice, treasuries]);


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
        let calculatedOriginalTotal = 0;
        let calculatedSubTotal = 0; // Total after product discount
        // Lookup customer name
        const customerForPrint = saleToPrint.customerId ? await getCustomerById(saleToPrint.customerId) : null;
        const customerName = customerForPrint ? customerForPrint.name : 'عميل نقدي';
        const paymentInfo = paymentMethods.find(p => p.value === saleToPrint.paymentMethod) || { label: saleToPrint.paymentMethod, value: saleToPrint.paymentMethod };

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

            const productName = product ? product.nameAr : `منتج (${item.productId.substring(0, 6)})`;
            const unitLabel = item.soldUnitType === 'sub'
                ? product?.subUnitType || 'فرعية'
                : product?.unitType || 'رئيسية';

            // Calculate original price for this item based on the stored product details
            const originalUnitPrice = item.soldUnitType === 'sub'
                ? calculateOriginalSubUnitPrice(product!) // Use fetched/cached product
                : safeParseFloat(product?.price); // Use fetched/cached product price

            const originalItemTotal = originalUnitPrice * safeParseFloat(item.quantity);
            calculatedOriginalTotal += originalItemTotal;
            calculatedSubTotal += safeParseFloat(item.price) * safeParseFloat(item.quantity); // item.price is after product discount

            const hasDiscount = safeParseFloat(item.price) !== originalUnitPrice;

            itemRowsHtml += `
             <tr>
                 <td>${productName}</td>
                 <td>${unitLabel}</td>
                 <td>${safeParseFloat(item.quantity)}</td>
                 <td>${safeParseFloat(item.price).toFixed(2)} ${hasDiscount ? `<span style="font-size:0.8em; color:gray; text-decoration: line-through;">(${originalUnitPrice.toFixed(2)})</span>` : ''}</td>
                 <td>${(safeParseFloat(item.quantity) * safeParseFloat(item.price)).toFixed(2)}</td>
             </tr>
         `;
        }

        // Use stored values if available, otherwise use calculated ones
        const printOriginalTotal = safeParseFloat(saleToPrint.originalTotalAmount, calculatedOriginalTotal);
        const printSubTotal = safeParseFloat(saleToPrint.subTotalAmount, calculatedSubTotal);
        const printInsuranceDiscount = printSubTotal * (safeParseFloat(saleToPrint.appliedInsuranceDiscountRate) / 100);
        const printFinalTotal = safeParseFloat(saleToPrint.totalAmount); // Should be correct from the sale record
        const printTotalProductDiscount = printOriginalTotal - printSubTotal;
        const printAmountPaid = safeParseFloat(saleToPrint.amountPaid);


        const remainingAmount = printFinalTotal - printAmountPaid;

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
             .totals span { display: inline-block; min-width: 120px; /* Adjusted width */ }
             .totals strong { font-weight: bold; font-size: 1.1em; }
             .header { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; text-align: center;}
             .header h2 { margin: 0; font-size: 1.5em; }
              .info { margin-bottom: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 5px 15px; }
             .info p { margin: 3px 0; }
              .payment-method { font-weight: bold; }
              .discount { color: green; }
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
             <p><strong>التاريخ:</strong> ${new Date(saleToPrint.date).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' })}</p>
             <p><strong>العميل:</strong> ${customerName}</p>
             <p><strong>طريقة الدفع:</strong> <span class="payment-method">${paymentInfo.label || paymentInfo.value}</span></p>
             ${customerForPrint?.insuranceCompany ? `<p><strong>شركة التأمين:</strong> ${customerForPrint.insuranceCompany} (#${customerForPrint.policyNumber})</p>` : ''}
         </div>
         <table>
             <thead>
                 <tr>
                     <th>المنتج</th>
                     <th>الوحدة</th>
                     <th>الكمية</th>
                     <th>السعر (ج.م)</th>
                     <th>الإجمالي (ج.م)</th>
                 </tr>
             </thead>
             <tbody>
                 ${itemRowsHtml}
             </tbody>
         </table>
          <div class="totals">
             <div><span>الإجمالي الأصلي:</span> ${printOriginalTotal.toFixed(2)} ج.م</div>
             ${printTotalProductDiscount > 0 ? `<div><span class="discount">خصم الأصناف:</span> <span class="discount">- ${printTotalProductDiscount.toFixed(2)} ج.م</span></div>` : ''}
             ${printInsuranceDiscount > 0 ? `<div><span class="discount">خصم التأمين (${safeParseFloat(saleToPrint.appliedInsuranceDiscountRate)}%):</span> <span class="discount">- ${printInsuranceDiscount.toFixed(2)} ج.م</span></div>` : ''}
             <hr style="border: none; border-top: 1px dashed #ccc; margin: 5px 0;">
             <div><span>المبلغ المدفوع:</span> ${printAmountPaid.toFixed(2)} ج.م</div>
             ${remainingAmount > 0 && saleToPrint.paymentMethod === 'debt' ? `<div><span>المبلغ المتبقي (آجل):</span> ${remainingAmount.toFixed(2)} ج.م</div>` : ''}
              ${remainingAmount < 0 ? `<div><span>المبلغ المرجع:</span> ${Math.abs(remainingAmount).toFixed(2)} ج.م</div>` : ''}
             <div><strong>الإجمالي النهائي:</strong> <strong>${printFinalTotal.toFixed(2)} ج.م</strong></div>
         </div>
          <button onclick="window.print()">طباعة</button>
          <button onclick="window.close()">إغلاق</button>
     </body>
     </html>
    `);
        printWindow.document.close();
        printWindow.focus();
    };


    // Add new payment entry
    const handleAddPayment = () => {
        const defaultTreasury = treasuries.find(t => t.isDefault) || treasuries[0];
        if (defaultTreasury) {
            setPayments([...payments, { treasuryId: defaultTreasury.id, amount: 0 }]);
        }
    };

    // Remove payment entry
    const handleRemovePayment = (index: number) => {
        setPayments(payments.filter((_, i) => i !== index));
    };

    // Update payment treasury
    const handleUpdatePaymentTreasury = (index: number, treasuryId: string) => {
        const newPayments = [...payments];
        newPayments[index] = { ...newPayments[index], treasuryId };
        setPayments(newPayments);
    };

    // Update payment amount
    const handleUpdatePaymentAmount = (index: number, amount: number) => {
        const newPayments = [...payments];
        newPayments[index] = { ...newPayments[index], amount };
        setPayments(newPayments);
    };

    // Calculate total paid
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingToPay = finalTotalPrice - totalPaid;

    const handleCheckout = async () => {
        if (items.length === 0) {
            toast({ title: "السلة فارغة", description: "أضف منتجات أولاً.", variant: "destructive" });
            return;
        }

        // Validation for payments
        if (payments.length === 0) {
            toast({ title: "مطلوب دفعة", description: "يجب إضافة دفعة واحدة على الأقل.", variant: "destructive" });
            return;
        }

        // Check if any payment has invalid treasury
        const hasInvalidTreasury = payments.some(p => !p.treasuryId);
        if (hasInvalidTreasury) {
            toast({ title: "خطأ في الدفعات", description: "يجب اختيار خزينة لكل دفعة.", variant: "destructive" });
            return;
        }

        // Check if any payment has negative amount
        const hasNegativeAmount = payments.some(p => p.amount < 0);
        if (hasNegativeAmount) {
            toast({ title: "مبلغ غير صحيح", description: "المبلغ المدفوع لا يمكن أن يكون سالباً.", variant: "destructive" });
            return;
        }

        // Check total paid vs final total (allow overpayment for change)
        if (totalPaid < finalTotalPrice) {
            toast({ title: "مبلغ غير كاف", description: `المبلغ المدفوع (${totalPaid.toFixed(2)}) أقل من الإجمالي المطلوب (${finalTotalPrice.toFixed(2)}).`, variant: "destructive" });
            return;
        }


        setIsCheckingOut(true);
        setLastSale(null);

        try {
            // Prepare sale transaction data using discounted prices stored in cart items
            const saleItems: SaleTransactionItem[] = items.map(item => ({
                productId: item.id,
                quantity: String(item.cartQuantity), // Convert number to string as required by SaleTransactionItem type
                price: String(item.pricePerSelectedUnit), // Convert number to string as required by SaleTransactionItem type
                soldUnitType: item.selectedUnitType,
                costAtSale: item.lastPurchaseCost !== undefined ? String(safeParseFloat(item.lastPurchaseCost)) : undefined, // Convert number to string as required by SaleTransactionItem type
            }));

            // Prepare split payments
            const salePayments: SalePayment[] = payments.map(p => ({
                treasuryId: p.treasuryId,
                amount: String(p.amount)
            }));

            // Determine payment method from the first payment's treasury
            let paymentMethod: PaymentMethod = 'cash'; // Default
            if (salePayments.length > 0) {
                const firstTreasury = treasuries.find(t => t.id === salePayments[0].treasuryId);
                if (firstTreasury?.paymentMethodType) {
                    paymentMethod = firstTreasury.paymentMethodType;
                }
            }

            const saleData: Omit<SaleTransaction, 'id'> = {
                customerId: selectedCustomerId && selectedCustomerId !== 'undefined' ? selectedCustomerId : undefined, // Handle 'undefined' string
                items: saleItems,
                totalAmount: String(finalTotalPrice), // Convert number to string as required by SaleTransaction type
                originalTotalAmount: String(getOriginalTotalPrice()), // Convert number to string as required by SaleTransaction type
                subTotalAmount: String(subTotalPrice), // Convert number to string as required by SaleTransaction type
                paymentMethod: paymentMethod, // Set payment method from first treasury
                amountPaid: String(totalPaid), // Convert number to string as required by SaleTransaction type
                payments: salePayments, // Include split payments (for future use)
                date: new Date(),
                appliedInsuranceDiscountRate: String(insuranceDiscountRate), // Convert number to string as required by SaleTransaction type
                saleWarehouseId: items.length > 0 ? items[0].warehouseId : undefined, // Assign warehouse from first item
            };

            // Save the sale transaction (which also updates stock and customer balance)
            const newSale = await addSale(saleData);
            setLastSale(newSale);

            clearCart();
            setSelectedCustomerId(undefined); // Reset customer selection
            setSelectedCustomer(null);
            setPayments([]); // Reset payments

            toast({
                title: "تمت عملية البيع بنجاح",
                description: `فاتورة رقم ${newSale.id} | المبلغ ${safeParseFloat(newSale.totalAmount).toFixed(2)} ج.م`,
                action: (
                    <Button variant="outline" size="sm" onClick={() => handlePrintInvoice(newSale)}>
                        <Printer className="ml-2 h-4 w-4" />
                        طباعة الفاتورة
                    </Button>
                ),
            });

            // Call the success callback if provided (e.g., to refetch products in POS)
            onCheckoutSuccess?.();


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
        setSelectedCustomer(null);
        setPayments([]); // Reset payments
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
    const originalTotalPrice = getOriginalTotalPrice(); // Price before any discount
    const totalProductDiscount = originalTotalPrice - subTotalPrice;


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
                            {/* We show item count (lines) not total pieces */}
                            {items.length}
                        </Badge>
                    )}
                    <span className="sr-only">سلة المشتريات ({items.length})</span>
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
                                                {customer.insuranceCompany && <Badge variant="secondary" className="mr-2 text-xs px-1 py-0">{customer.insuranceCompany}</Badge>}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {/* Display Insurance Info if customer selected */}
                                {selectedCustomer?.insuranceCompany && (
                                    <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                                        <ShieldCheck className="h-3 w-3 text-blue-600" />
                                        <span>{selectedCustomer.insuranceCompany} (#{selectedCustomer.policyNumber}) - خصم {safeParseFloat(selectedCustomer.insuranceDiscountRate) || 0}%</span>
                                    </div>
                                )}
                            </div>

                            {/* Split Payments */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label>الدفعات</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={handleAddPayment} disabled={treasuries.length === 0}>
                                        <Plus className="h-4 w-4 ml-1" /> إضافة دفعة
                                    </Button>
                                </div>

                                {payments.length === 0 ? (
                                    <div className="text-sm text-muted-foreground text-center py-2 border rounded-md">
                                        لا توجد دفعات. اضغط "إضافة دفعة" للبدء.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {payments.map((payment, index) => {
                                            const treasury = treasuries.find(t => t.id === payment.treasuryId);
                                            const paymentMethodMap: Record<string, { label: string; icon: React.ElementType }> = {
                                                'cash': { label: 'نقداً', icon: Coins },
                                                'card': { label: 'بطاقة', icon: CreditCard },
                                                'instapay': { label: 'إنستا باي', icon: Smartphone },
                                                'vodafone_cash': { label: 'فودافون كاش', icon: Wallet },
                                                'debt': { label: 'آجل', icon: Landmark },
                                            };
                                            const methodInfo = treasury?.paymentMethodType ? paymentMethodMap[treasury.paymentMethodType] : null;
                                            const MethodIcon = methodInfo?.icon;

                                            return (
                                                <div key={index} className="border rounded-md p-2 space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-medium">دفعة {index + 1}</span>
                                                        {payments.length > 1 && (
                                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemovePayment(index)}>
                                                                <X className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <Select value={payment.treasuryId} onValueChange={(value) => handleUpdatePaymentTreasury(index, value)}>
                                                        <SelectTrigger className="h-8">
                                                            <SelectValue placeholder="اختر الخزينة..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {treasuries.map((t) => (
                                                                <SelectItem key={t.id} value={t.id}>
                                                                    <div className="flex items-center gap-2">
                                                                        {t.paymentMethodType && paymentMethodMap[t.paymentMethodType] && (
                                                                            React.createElement(paymentMethodMap[t.paymentMethodType].icon, { className: "h-4 w-4" })
                                                                        )}
                                                                        {t.name}
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={payment.amount || ''}
                                                        onChange={(e) => handleUpdatePaymentAmount(index, parseFloat(e.target.value) || 0)}
                                                        placeholder="المبلغ"
                                                        className="h-8"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>


                            {/* Pricing Details */}
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span>الإجمالي الأصلي:</span>
                                    <span>{originalTotalPrice.toFixed(2)} ج.م</span>
                                </div>
                                {totalProductDiscount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>خصم الأصناف:</span>
                                        <span>- {totalProductDiscount.toFixed(2)} ج.م</span>
                                    </div>
                                )}
                                <Separator className="my-1" />
                                <div className="flex justify-between font-semibold">
                                    <span>المجموع بعد الخصم:</span>
                                    <span>{subTotalPrice.toFixed(2)} ج.م</span>
                                </div>
                                {insuranceDiscountAmount > 0 && (
                                    <div className="flex justify-between text-blue-600">
                                        <span>خصم التأمين ({insuranceDiscountRate}%):</span>
                                        <span>- {insuranceDiscountAmount.toFixed(2)} ج.م</span>
                                    </div>
                                )}
                                <Separator className="my-1" />
                                <div className="flex justify-between items-center font-bold text-base">
                                    <span>الإجمالي النهائي:</span>
                                    <span>{finalTotalPrice.toFixed(2)} ج.م</span>
                                </div>
                                <div className="flex justify-between text-blue-600 font-medium">
                                    <span>إجمالي المدفوع:</span>
                                    <span>{totalPaid.toFixed(2)} ج.م</span>
                                </div>
                                {/* Show Remaining Amount only if applicable */}
                                {remainingToPay > 0 && (
                                    <div className="flex justify-between text-destructive font-medium">
                                        <span>المبلغ المتبقي:</span>
                                        <span>{remainingToPay.toFixed(2)} ج.م</span>
                                    </div>
                                )}
                                {remainingToPay < 0 && (
                                    <div className="flex justify-between text-green-700 font-medium">
                                        <span>المبلغ المرجع:</span>
                                        <span>{Math.abs(remainingToPay).toFixed(2)} ج.م</span>
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
                                    disabled={isCheckingOut || payments.length === 0 || totalPaid < finalTotalPrice}
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
