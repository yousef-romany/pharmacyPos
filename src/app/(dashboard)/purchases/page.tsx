
'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Truck, Eye, Printer, PlusCircle, CheckCircle, XCircle, AlertCircle as AlertCircleIcon, Trash2, Coins, CreditCard, Landmark } from 'lucide-react'; // Added payment method icons
import type { PurchaseTransaction, PurchaseTransactionItem, Supplier, PaymentStatus, Warehouse, PaymentMethod } from '@/lib/types'; // Import types including Warehouse and PaymentMethod
import { getPurchases, getSuppliers, getProductNameById, addPurchase, getProductById, deletePurchase, getWarehouses } from '@/lib/data'; // Import data fetching functions, add deletePurchase, getWarehouses
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogTrigger,
} from '@/components/ui/alert-dialog'; // Import AlertDialog components
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { PurchaseForm } from '@/components/purchases/purchase-form'; // Import the new form component
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge'; // Import Badge
import { cn } from '@/lib/utils';

// Helper function to safely parse floats (can be moved to utils)
const safeParseFloat = (value: string | number | null | undefined, defaultValue = 0): number => {
   if (value === null || value === undefined) return defaultValue;
   const parsed = parseFloat(value.toString());
   return isNaN(parsed) ? defaultValue : parsed;
};


// --- Purchase Details Dialog ---
interface PurchaseDetailsDialogProps {
    purchase: PurchaseTransaction | null;
    supplierName?: string; // Optional supplier name
    warehouseMap: Map<string, string>; // Pass warehouse map
    onClose: () => void;
}

// Helper type for items with product names and expiry
interface PurchaseItemWithDetails extends PurchaseTransactionItem {
    productName: string;
    warehouseName?: string; // Add warehouse name
}


function PurchaseDetailsDialog({ purchase, supplierName, warehouseMap, onClose }: PurchaseDetailsDialogProps) {
     const [detailedItems, setDetailedItems] = React.useState<PurchaseItemWithDetails[]>([]);
     const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);

    React.useEffect(() => {
       const fetchDetails = async () => {
           if (!purchase) return;
           setIsLoadingDetails(true);
           try {
               const itemsWithDetails = await Promise.all(purchase.items.map(async (item) => {
                   const productName = await getProductNameById(item.productId);
                   const warehouseName = warehouseMap.get(item.destinationWarehouseId || purchase.destinationWarehouseId || ''); // Get warehouse name
                   return { ...item, productName, warehouseName }; // Expiry date already in item if set during purchase
               }));
               setDetailedItems(itemsWithDetails);
           } catch (error) {
               console.error("Failed to fetch purchase item details:", error);
                // Handle error (e.g., show toast)
           } finally {
               setIsLoadingDetails(false);
           }
       };
       fetchDetails();
   }, [purchase, warehouseMap]); // Re-fetch when purchase or map changes


    if (!purchase) return null;

    // Map Payment Status to Badge Variant and Text
    const getPaymentStatusInfo = (status: PaymentStatus) => {
        switch (status) {
            case 'paid': return { variant: 'default', text: 'مدفوع', icon: CheckCircle, color: 'text-green-600' };
            case 'partial': return { variant: 'secondary', text: 'مدفوع جزئياً', icon: AlertCircleIcon, color: 'text-orange-600' };
            case 'unpaid': return { variant: 'destructive', text: 'غير مدفوع', icon: XCircle, color: 'text-red-600' };
            default: return { variant: 'outline', text: status, icon: AlertCircleIcon, color: 'text-muted-foreground' };
        }
    };

    // Map Payment Method to Icon and Text
    const getPaymentMethodInfo = (method?: PaymentMethod) => {
        switch (method) {
            case 'cash': return { text: 'نقداً', icon: Coins, color: 'text-green-600' };
            case 'card': return { text: 'بطاقة', icon: CreditCard, color: 'text-blue-600' };
            case 'debt': return { text: 'آجل/مديونية', icon: Landmark, color: 'text-red-600' };
            default: return { text: 'غير محدد', icon: Coins, color: 'text-muted-foreground' };
        }
    };

    const paymentStatusInfo = getPaymentStatusInfo(purchase.paymentStatus);
    const paymentMethodInfo = getPaymentMethodInfo(purchase.paymentMethod);
    const totalAmountNum = safeParseFloat(purchase.totalAmount);
    const amountPaidNum = safeParseFloat(purchase.amountPaid);


    // Basic print function (opens print dialog for the content)
    const handlePrint = () => {
        const printContent = document.getElementById('purchase-details-content-printable');
        if (printContent) {
             const printWindow = window.open('', '_blank');
             if (printWindow) {
                 // Fetch item details again specifically for printing
                 let itemsHtmlForPrint = '';
                 if (isLoadingDetails) {
                     itemsHtmlForPrint = '<tr><td colspan="6">جاري تحميل تفاصيل الأصناف...</td></tr>'; // Increased colspan
                 } else {
                     detailedItems.forEach(item => {
                          const expiryText = item.expiryDate ? format(new Date(item.expiryDate), 'dd/MM/yyyy', {locale: arSA}) : '-';
                          const itemQuantity = safeParseFloat(item.quantity);
                          const itemCost = safeParseFloat(item.cost);
                         itemsHtmlForPrint += `
                             <tr>
                                 <td>${item.productName}</td>
                                 <td>${itemQuantity}</td>
                                 <td>${itemCost.toFixed(2)}</td>
                                 <td>${expiryText}</td>
                                 <td>${item.warehouseName || '-'}</td> {/* Add warehouse name */}
                                 <td>${(itemQuantity * itemCost).toFixed(2)}</td>
                             </tr>
                         `;
                     });
                 }

                printWindow.document.write(`
                 <html>
                 <head>
                    <title>فاتورة شراء - ${purchase.invoiceNumber || purchase.id}</title>
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
                         .payment-status { font-weight: bold; }
                          @media print {
                              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                              button { display: none; }
                          }
                     </style>
                 </head>
                 <body>
                     <div class="header">
                        <h2>فاتورة شراء</h2>
                     </div>
                     <div class="info">
                        <p><strong>رقم الفاتورة (النظام):</strong> ${purchase.id}</p>
                        <p><strong>رقم فاتورة المورد:</strong> ${purchase.invoiceNumber || '-'}</p>
                        <p><strong>المورد:</strong> ${supplierName || purchase.supplierId}</p>
                        <p><strong>التاريخ:</strong> ${new Date(purchase.date).toLocaleDateString('ar-SA')}</p>
                        <p><strong>طريقة الدفع:</strong> ${paymentMethodInfo.text}</p>
                        <p><strong>مخزن الوجهة:</strong> ${warehouseMap.get(purchase.destinationWarehouseId || '') || '-'}</p> {/* Display overall warehouse */}
                     </div>
                     <table>
                        <thead>
                            <tr>
                                <th>المنتج</th>
                                <th>الكمية</th>
                                <th>التكلفة (ر.س)</th>
                                <th>تاريخ الصلاحية</th>
                                <th>المخزن</th> {/* Add warehouse header */}
                                <th>الإجمالي (ر.س)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtmlForPrint}
                        </tbody>
                     </table>
                     <div class="totals">
                        <div><span>حالة الدفع:</span> <span class="payment-status">${paymentStatusInfo.text}</span></div>
                        <div><span>المبلغ المدفوع:</span> ${amountPaidNum.toFixed(2)} ر.س</div>
                        <div><span>المبلغ المتبقي:</span> ${(totalAmountNum - amountPaidNum).toFixed(2)} ر.س</div>
                        <div><strong>إجمالي الفاتورة:</strong> <strong>${totalAmountNum.toFixed(2)} ر.س</strong></div>
                     </div>
                      <button onclick="window.print()">طباعة</button>
                      <button onclick="window.close()">إغلاق</button>
                 </body>
                 </html>
                `);
                printWindow.document.close();
                printWindow.focus();
            }
        }
    };

    return (
        <DialogContent className="sm:max-w-2xl"> {/* Wider dialog */}
            <DialogHeader>
                <DialogTitle>تفاصيل فاتورة الشراء: {purchase.invoiceNumber || purchase.id}</DialogTitle>
            </DialogHeader>
             {/* Content visible in the dialog */}
            <div className="py-4 space-y-4">
                 <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <p><strong className="ml-1">المورد:</strong> {supplierName || purchase.supplierId}</p>
                    <p><strong className="ml-1">تاريخ الفاتورة:</strong> {format(new Date(purchase.date), 'PPP', { locale: arSA })}</p>
                    <p><strong className="ml-1">رقم فاتورة المورد:</strong> {purchase.invoiceNumber || '-'}</p>
                     <p><strong className="ml-1">مخزن الوجهة:</strong> {warehouseMap.get(purchase.destinationWarehouseId || '') || '-'}</p>
                    <p><strong className="ml-1">طريقة الدفع:</strong>
                       <Badge variant="outline" className={cn("mr-1 px-1.5 py-0.5 text-xs", paymentMethodInfo.color)}>
                           <paymentMethodInfo.icon className="ml-1 h-3 w-3" />
                           {paymentMethodInfo.text}
                       </Badge>
                    </p>
                    <p><strong className="ml-1">حالة الدفع:</strong>
                       <Badge variant={paymentStatusInfo.variant as any} className={cn("mr-1 px-1.5 py-0.5 text-xs", paymentStatusInfo.color)}>
                            <paymentStatusInfo.icon className="ml-1 h-3 w-3" />
                            {paymentStatusInfo.text}
                        </Badge>
                    </p>

                </div>
                <Separator />
                <h4 className="font-medium">الأصناف:</h4>
                 {isLoadingDetails ? (
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ) : (
                    <div className="max-h-60 overflow-y-auto border rounded-md"> {/* Scrollable item list */}
                       <Table>
                           <TableHeader className="sticky top-0 bg-secondary">
                               <TableRow>
                                   <TableHead>المنتج</TableHead>
                                   <TableHead>الكمية</TableHead>
                                   <TableHead>التكلفة</TableHead>
                                   <TableHead>الصلاحية</TableHead>
                                    <TableHead>المخزن</TableHead> {/* Added Warehouse column */}
                                   <TableHead>الإجمالي</TableHead>
                               </TableRow>
                           </TableHeader>
                           <TableBody>
                                {detailedItems.map((item, index) => {
                                   const itemQuantity = safeParseFloat(item.quantity);
                                   const itemCost = safeParseFloat(item.cost);
                                   return (
                                       <TableRow key={`${item.productId}-${index}`}>
                                           <TableCell>{item.productName}</TableCell>
                                           <TableCell>{itemQuantity}</TableCell>
                                           <TableCell>{itemCost.toFixed(2)} ر.س</TableCell>
                                           <TableCell>{item.expiryDate ? format(new Date(item.expiryDate), 'MM/yyyy', {locale: arSA}) : '-'}</TableCell>
                                           <TableCell>{item.warehouseName || '-'}</TableCell> {/* Show warehouse name */}
                                           <TableCell>{(itemQuantity * itemCost).toFixed(2)} ر.س</TableCell>
                                       </TableRow>
                                   );
                                 })}
                           </TableBody>
                       </Table>
                    </div>
                )}
                 <Separator />
                 <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-right text-base mt-4">
                    <span>المبلغ المدفوع:</span>
                    <span className="font-semibold">{amountPaidNum.toFixed(2)} ر.س</span>
                     <span>المبلغ المتبقي:</span>
                     <span className="font-semibold">{(totalAmountNum - amountPaidNum).toFixed(2)} ر.س</span>
                    <span className="text-lg font-bold col-start-1">إجمالي الفاتورة:</span>
                    <span className="text-lg font-bold">{totalAmountNum.toFixed(2)} ر.س</span>
                </div>
            </div>

             {/* Hidden div for printing */}
            <div id="purchase-details-content-printable" style={{ display: 'none' }}>
                {/* Content is generated dynamically in handlePrint */}
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
                <div>{/* Spacer */}</div>
                 <div className="flex gap-2">
                   <Button variant="outline" onClick={handlePrint} disabled={isLoadingDetails}>
                      <Printer className="ml-2 h-4 w-4" />
                      طباعة
                   </Button>
                   <DialogClose asChild>
                        <Button type="button" variant="secondary" onClick={onClose}>إغلاق</Button>
                   </DialogClose>
                 </div>
            </DialogFooter>
        </DialogContent>
    );
}


export default function PurchasesPage() {
  const [purchases, setPurchases] = React.useState<PurchaseTransaction[]>([]);
  const [suppliersMap, setSuppliersMap] = React.useState<Map<string, string>>(new Map()); // Map supplier ID to name
  const [allSuppliers, setAllSuppliers] = React.useState<Supplier[]>([]); // For form dropdown
  const [allWarehouses, setAllWarehouses] = React.useState<Warehouse[]>([]); // State for warehouses
  const [warehouseMap, setWarehouseMap] = React.useState<Map<string, string>>(new Map()); // Map warehouse ID to name
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = React.useState(true); // Loading state for warehouses
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedPurchase, setSelectedPurchase] = React.useState<PurchaseTransaction | null>(null); // For details dialog
  const [isPurchaseFormOpen, setIsPurchaseFormOpen] = React.useState(false); // State for Add Purchase Dialog
  const [purchaseToDelete, setPurchaseToDelete] = React.useState<PurchaseTransaction | null>(null); // For delete confirmation
  const { toast } = useToast();

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setIsLoadingWarehouses(true);
    try {
        const [purchasesData, suppliersData, warehousesData] = await Promise.all([
            getPurchases(), // Fetch actual purchase data
            getSuppliers(),
            getWarehouses(), // Fetch warehouses
        ]);

      setPurchases(purchasesData);
      setAllSuppliers(suppliersData); // Store all supplier data
      setAllWarehouses(warehousesData); // Store all warehouse data

      const supplierMap = new Map<string, string>();
      suppliersData.forEach(s => supplierMap.set(s.id, s.name));
      setSuppliersMap(supplierMap);

      const whMap = new Map<string, string>();
      warehousesData.forEach(w => whMap.set(w.id, w.name));
      setWarehouseMap(whMap);


    } catch (error) {
      console.error("Failed to fetch purchase data:", error);
      toast({ title: "خطأ", description: "فشل تحميل فواتير الشراء.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsLoadingWarehouses(false);
    }
  }, [toast]);

  React.useEffect(() => {
     fetchData();
  }, [fetchData]); // Run on mount

  const handleAddPurchase = async (purchaseData: Omit<PurchaseTransaction, 'id' | 'totalAmount' | 'paymentStatus'>) => {
    try {
       await addPurchase(purchaseData);
       toast({ title: "نجاح", description: "تمت إضافة فاتورة الشراء بنجاح وتحديث المخزون." });
       setIsPurchaseFormOpen(false); // Close the form dialog
       fetchData(); // Refresh the list of purchases
    } catch (error) {
      console.error("Failed to add purchase:", error);
      toast({ title: "خطأ", description: `فشلت إضافة فاتورة الشراء: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
      // Optionally re-throw or handle differently
    }
  };

   const handleDeletePurchase = async () => {
     if (!purchaseToDelete) return;
     setIsLoading(true); // Consider a specific loading state for deletion
     try {
       const success = await deletePurchase(purchaseToDelete.id);
       if (success) {
         toast({ title: "نجاح", description: `تم حذف فاتورة الشراء ${purchaseToDelete.id} بنجاح.` });
         setPurchaseToDelete(null); // Close confirmation dialog
         fetchData(); // Refresh the list
       } else {
          throw new Error("Delete operation returned false");
       }
     } catch (error) {
       console.error("Failed to delete purchase:", error);
       toast({ title: "خطأ", description: `فشل حذف فاتورة الشراء: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
       setPurchaseToDelete(null); // Close confirmation dialog even on error
     } finally {
        setIsLoading(false);
     }
   };


  const filteredPurchases = purchases.filter(purchase =>
    purchase.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (purchase.invoiceNumber && purchase.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    suppliersMap.get(purchase.supplierId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.items.some(item => item.productId.toLowerCase().includes(searchTerm.toLowerCase()))
     // TODO: Enhance search to fetch product names if needed for searching item names
  );

    // Map Payment Status to Badge Variant and Text
    const getPaymentStatusInfo = (status: PaymentStatus) => {
        switch (status) {
            case 'paid': return { variant: 'default', text: 'مدفوع', icon: CheckCircle, color: 'text-green-600' };
            case 'partial': return { variant: 'secondary', text: 'جزئي', icon: AlertCircleIcon, color: 'text-orange-600' };
            case 'unpaid': return { variant: 'destructive', text: 'غير مدفوع', icon: XCircle, color: 'text-red-600' };
            default: return { variant: 'outline', text: status, icon: AlertCircleIcon, color: 'text-muted-foreground' };
        }
    };

    // Map Payment Method to Icon and Text
    const getPaymentMethodInfo = (method?: PaymentMethod) => {
        switch (method) {
            case 'cash': return { text: 'نقداً', icon: Coins, color: 'text-green-600' };
            case 'card': return { text: 'بطاقة', icon: CreditCard, color: 'text-blue-600' };
            case 'debt': return { text: 'آجل/مديونية', icon: Landmark, color: 'text-red-600' };
            default: return { text: 'غير محدد', icon: Coins, color: 'text-muted-foreground' };
        }
    };

  return (
     <AlertDialog> {/* Wrap with AlertDialog for delete confirmation */}
        {/* Dialog for Add Purchase Form */}
       <Dialog open={isPurchaseFormOpen} onOpenChange={setIsPurchaseFormOpen}>
           {/* Main page content wrapped in another Dialog provider for the Details view */}
           <Dialog onOpenChange={(open) => !open && setSelectedPurchase(null)}>
                <div className="p-4 md:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                      <Truck className="w-6 h-6" />
                      فواتير الشراء
                    </h2>
                    {/* Add New Purchase Button */}
                     <DialogTrigger asChild>
                        <Button onClick={() => setIsPurchaseFormOpen(true)} disabled={isLoadingWarehouses || allSuppliers.length === 0}>
                          <PlusCircle className="ml-2 h-5 w-5" />
                           {(isLoadingWarehouses || allSuppliers.length === 0) ? 'تحميل...' : 'إنشاء فاتورة شراء'}
                        </Button>
                    </DialogTrigger>
                  </div>
                  {(isLoadingWarehouses || allSuppliers.length === 0) && !isLoading && (
                       <p className="text-sm text-muted-foreground text-center">
                           {isLoadingWarehouses ? 'جاري تحميل المخازن...' : 'يجب إضافة موردين ومخازن أولاً لإنشاء فاتورة شراء.'}
                       </p>
                   )}


                   <div className="flex items-center py-4">
                    <Input
                      placeholder="ابحث برقم الفاتورة, المورد, رقم فاتورة المورد..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      className="max-w-md"
                    />
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>رقم الفاتورة</TableHead>
                          <TableHead>فاتورة المورد</TableHead>
                          <TableHead>المورد</TableHead>
                          <TableHead>تاريخ الفاتورة</TableHead>
                          <TableHead>إجمالي المبلغ</TableHead>
                           <TableHead>مخزن الوجهة</TableHead> {/* Added Warehouse column header */}
                          <TableHead>طريقة الدفع</TableHead> {/* Added Payment Method column header */}
                          <TableHead>حالة الدفع</TableHead>
                           <TableHead>عدد الأصناف</TableHead>
                          <TableHead className="text-right">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={10} className="h-24 text-center"> {/* Adjusted colspan for new column */}
                              جاري تحميل الفواتير...
                            </TableCell>
                          </TableRow>
                        ) : filteredPurchases.length > 0 ? (
                          filteredPurchases.map((purchase) => {
                               const paymentStatusInfo = getPaymentStatusInfo(purchase.paymentStatus);
                               const paymentMethodInfo = getPaymentMethodInfo(purchase.paymentMethod);
                               const totalAmountNum = safeParseFloat(purchase.totalAmount);
                               const destinationWarehouseName = warehouseMap.get(purchase.destinationWarehouseId || '') || '-';
                               return (
                                   <TableRow key={purchase.id}>
                                       <TableCell className="font-medium">{purchase.id.substring(0, 8)}...</TableCell>
                                       <TableCell>{purchase.invoiceNumber || '-'}</TableCell>
                                       <TableCell>{suppliersMap.get(purchase.supplierId) || purchase.supplierId}</TableCell>
                                       <TableCell>{format(new Date(purchase.date), 'dd/MM/yyyy', { locale: arSA })}</TableCell>
                                       <TableCell>{totalAmountNum.toFixed(2)}</TableCell>
                                       <TableCell>{destinationWarehouseName}</TableCell> {/* Display warehouse name */}
                                       <TableCell>
                                           <Badge variant="outline" className={cn("px-1.5 py-0.5 text-xs", paymentMethodInfo.color)}>
                                               <paymentMethodInfo.icon className="ml-1 h-3 w-3" />
                                               {paymentMethodInfo.text}
                                           </Badge>
                                       </TableCell>
                                       <TableCell>
                                            <Badge variant={paymentStatusInfo.variant as any} className={cn("px-1.5 py-0.5 text-xs", paymentStatusInfo.color)}>
                                                <paymentStatusInfo.icon className="ml-1 h-3 w-3" />
                                                {paymentStatusInfo.text}
                                            </Badge>
                                       </TableCell>
                                       <TableCell>{purchase.items.length}</TableCell>
                                       <TableCell className="text-right space-x-1">
                                           <DialogTrigger asChild>
                                               <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => setSelectedPurchase(purchase)}>
                                                   <Eye className="h-4 w-4" />
                                               </Button>
                                           </DialogTrigger>
                                           {/* Add Edit Button later if needed */}
                                           <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setPurchaseToDelete(purchase)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                           </AlertDialogTrigger>
                                       </TableCell>
                                   </TableRow>
                               );
                           })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={9} className="h-24 text-center"> {/* Adjusted colspan */}
                              لا توجد فواتير شراء لعرضها.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                   {/* Add Pagination later if needed */}
                </div>

                 {/* Purchase Details Dialog Content */}
                 <PurchaseDetailsDialog
                    purchase={selectedPurchase}
                    supplierName={selectedPurchase ? suppliersMap.get(selectedPurchase.supplierId) : undefined}
                    warehouseMap={warehouseMap} // Pass warehouse map
                    onClose={() => setSelectedPurchase(null)}
                 />
           </Dialog>

             {/* Add Purchase Form Dialog Content */}
            <DialogContent className="sm:max-w-4xl"> {/* Wider dialog for the form */}
               <DialogHeader>
                  <DialogTitle>إنشاء فاتورة شراء جديدة</DialogTitle>
               </DialogHeader>
                <PurchaseForm
                   suppliers={allSuppliers}
                   warehouses={allWarehouses} // Pass warehouses
                   onSubmit={handleAddPurchase}
                   onClose={() => setIsPurchaseFormOpen(false)}
               />
            </DialogContent>
        </Dialog>

         {/* Alert Dialog for Delete Confirmation */}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
               هل أنت متأكد أنك تريد حذف فاتورة الشراء رقم "{purchaseToDelete?.invoiceNumber || purchaseToDelete?.id}"؟ سيتم محاولة إلغاء تأثير هذه الفاتورة على المخزون (الكميات فقط). لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPurchaseToDelete(null)}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
               className="bg-destructive hover:bg-destructive/90"
               onClick={handleDeletePurchase}
               disabled={isLoading}
            >
               {isLoading ? 'جاري الحذف...' : 'حذف الفاتورة'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
     </AlertDialog>
  );
}
