
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
 import { Truck, Eye, Printer, PlusCircle, CheckCircle, XCircle, AlertCircle as AlertCircleIcon } from 'lucide-react'; // Added icons for payment status
 import type { PurchaseTransaction, PurchaseTransactionItem, Supplier, PaymentStatus } from '@/lib/types'; // Import types
 import { getPurchases, getSuppliers, getProductNameById, addPurchase, getProductById } from '@/lib/data'; // Import data fetching functions
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
   DialogFooter,
   DialogClose,
 } from '@/components/ui/dialog';
 import { Separator } from '@/components/ui/separator';
 import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
 import { PurchaseForm } from '@/components/purchases/purchase-form'; // Import the new form component
 import { format } from 'date-fns';
 import { arSA } from 'date-fns/locale';
 import { Badge } from '@/components/ui/badge'; // Import Badge
 import { cn } from '@/lib/utils';

 // --- Purchase Details Dialog ---
 interface PurchaseDetailsDialogProps {
     purchase: PurchaseTransaction | null;
     supplierName?: string; // Optional supplier name
     onClose: () => void;
 }

 // Helper type for items with product names and expiry
 interface PurchaseItemWithDetails extends PurchaseTransactionItem {
     productName: string;
 }


 function PurchaseDetailsDialog({ purchase, supplierName, onClose }: PurchaseDetailsDialogProps) {
      const [detailedItems, setDetailedItems] = React.useState<PurchaseItemWithDetails[]>([]);
      const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);

     React.useEffect(() => {
        const fetchDetails = async () => {
            if (!purchase) return;
            setIsLoadingDetails(true);
            try {
                const itemsWithDetails = await Promise.all(purchase.items.map(async (item) => {
                    const productName = await getProductNameById(item.productId);
                    return { ...item, productName }; // Expiry date already in item if set during purchase
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
    }, [purchase]); // Re-fetch when purchase changes


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
     const paymentInfo = getPaymentStatusInfo(purchase.paymentStatus);


     // Basic print function (opens print dialog for the content)
     const handlePrint = () => {
         const printContent = document.getElementById('purchase-details-content-printable');
         if (printContent) {
              const printWindow = window.open('', '_blank');
              if (printWindow) {
                  // Fetch item details again specifically for printing
                  let itemsHtmlForPrint = '';
                  if (isLoadingDetails) {
                      itemsHtmlForPrint = '<tr><td colspan="5">جاري تحميل تفاصيل الأصناف...</td></tr>';
                  } else {
                      detailedItems.forEach(item => {
                           const expiryText = item.expiryDate ? format(new Date(item.expiryDate), 'dd/MM/yyyy', {locale: arSA}) : '-';
                          itemsHtmlForPrint += `
                              <tr>
                                  <td>${item.productName}</td>
                                  <td>${item.quantity}</td>
                                  <td>${item.cost.toFixed(2)}</td>
                                  <td>${expiryText}</td>
                                  <td>${(item.quantity * item.cost).toFixed(2)}</td>
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
                      </div>
                      <table>
                         <thead>
                             <tr>
                                 <th>المنتج</th>
                                 <th>الكمية</th>
                                 <th>التكلفة (ر.س)</th>
                                 <th>تاريخ الصلاحية</th>
                                 <th>الإجمالي (ر.س)</th>
                             </tr>
                         </thead>
                         <tbody>
                             ${itemsHtmlForPrint}
                         </tbody>
                      </table>
                      <div class="totals">
                         <div><span>حالة الدفع:</span> <span class="payment-status">${paymentInfo.text}</span></div>
                         <div><span>المبلغ المدفوع:</span> ${purchase.amountPaid.toFixed(2)} ر.س</div>
                         <div><span>المبلغ المتبقي:</span> ${(purchase.totalAmount - purchase.amountPaid).toFixed(2)} ر.س</div>
                         <div><strong>إجمالي الفاتورة:</strong> <strong>${purchase.totalAmount.toFixed(2)} ر.س</strong></div>
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
                     <p><strong className="ml-1">حالة الدفع:</strong>
                        <Badge variant={paymentInfo.variant} className={cn("mr-1 px-1.5 py-0.5 text-xs", paymentInfo.color)}>
                             <paymentInfo.icon className="ml-1 h-3 w-3" />
                             {paymentInfo.text}
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
                                    <TableHead>الإجمالي</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                 {detailedItems.map((item, index) => (
                                    <TableRow key={`${item.productId}-${index}`}>
                                        <TableCell>{item.productName}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>{item.cost.toFixed(2)} ر.س</TableCell>
                                        <TableCell>{item.expiryDate ? format(new Date(item.expiryDate), 'MM/yyyy', {locale: arSA}) : '-'}</TableCell>
                                        <TableCell>{(item.quantity * item.cost).toFixed(2)} ر.س</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     </div>
                 )}
                  <Separator />
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-right text-base mt-4">
                     <span>المبلغ المدفوع:</span>
                     <span className="font-semibold">{purchase.amountPaid.toFixed(2)} ر.س</span>
                      <span>المبلغ المتبقي:</span>
                      <span className="font-semibold">{(purchase.totalAmount - purchase.amountPaid).toFixed(2)} ر.س</span>
                     <span className="text-lg font-bold col-start-1">إجمالي الفاتورة:</span>
                     <span className="text-lg font-bold">{purchase.totalAmount.toFixed(2)} ر.س</span>
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
   const [isLoading, setIsLoading] = React.useState(true);
   const [searchTerm, setSearchTerm] = React.useState('');
   const [selectedPurchase, setSelectedPurchase] = React.useState<PurchaseTransaction | null>(null); // For details dialog
   const [isPurchaseFormOpen, setIsPurchaseFormOpen] = React.useState(false); // State for Add Purchase Dialog
   const { toast } = useToast();

   const fetchData = React.useCallback(async () => {
     setIsLoading(true);
     try {
         const [purchasesData, suppliersData] = await Promise.all([
             getPurchases(), // Fetch actual purchase data
             getSuppliers()
         ]);

       setPurchases(purchasesData);
       setAllSuppliers(suppliersData); // Store all supplier data

       const supplierMap = new Map<string, string>();
       suppliersData.forEach(s => supplierMap.set(s.id, s.name));
       setSuppliersMap(supplierMap);

     } catch (error) {
       console.error("Failed to fetch purchase data:", error);
       toast({ title: "خطأ", description: "فشل تحميل فواتير الشراء.", variant: "destructive" });
     } finally {
       setIsLoading(false);
     }
   }, [toast]);

   React.useEffect(() => {
      fetchData();
   }, [fetchData]); // Run on mount

   const handleAddPurchase = async (purchaseData: Omit<PurchaseTransaction, 'id'>) => {
     try {
        await addPurchase(purchaseData);
        toast({ title: "نجاح", description: "تمت إضافة فاتورة الشراء بنجاح وتحديث المخزون." });
        setIsPurchaseFormOpen(false); // Close the form dialog
        fetchData(); // Refresh the list of purchases
     } catch (error) {
       console.error("Failed to add purchase:", error);
       toast({ title: "خطأ", description: "فشلت إضافة فاتورة الشراء.", variant: "destructive" });
       // Optionally re-throw or handle differently
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

   return (
      // Dialog for Add Purchase Form
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
                     <Button onClick={() => setIsPurchaseFormOpen(true)}>
                       <PlusCircle className="ml-2 h-5 w-5" />
                       إنشاء فاتورة شراء
                     </Button>
                 </DialogTrigger>
               </div>

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
                       <TableHead>حالة الدفع</TableHead>
                        <TableHead>عدد الأصناف</TableHead>
                       <TableHead className="text-right">إجراءات</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {isLoading ? (
                       <TableRow>
                         <TableCell colSpan={8} className="h-24 text-center">
                           جاري تحميل الفواتير...
                         </TableCell>
                       </TableRow>
                     ) : filteredPurchases.length > 0 ? (
                       filteredPurchases.map((purchase) => {
                            const paymentInfo = getPaymentStatusInfo(purchase.paymentStatus);
                            return (
                                <TableRow key={purchase.id}>
                                    <TableCell className="font-medium">{purchase.id.substring(0, 8)}...</TableCell>
                                    <TableCell>{purchase.invoiceNumber || '-'}</TableCell>
                                    <TableCell>{suppliersMap.get(purchase.supplierId) || purchase.supplierId}</TableCell>
                                    <TableCell>{format(new Date(purchase.date), 'dd/MM/yyyy', { locale: arSA })}</TableCell>
                                    <TableCell>{purchase.totalAmount.toFixed(2)}</TableCell>
                                    <TableCell>
                                         <Badge variant={paymentInfo.variant} className={cn("px-1.5 py-0.5 text-xs", paymentInfo.color)}>
                                             <paymentInfo.icon className="ml-1 h-3 w-3" />
                                             {paymentInfo.text}
                                         </Badge>
                                    </TableCell>
                                    <TableCell>{purchase.items.length}</TableCell>
                                    <TableCell className="text-right">
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => setSelectedPurchase(purchase)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                        {/* Add Edit/Delete buttons later if needed */}
                                    </TableCell>
                                </TableRow>
                            );
                        })
                     ) : (
                       <TableRow>
                         <TableCell colSpan={8} className="h-24 text-center">
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
                onSubmit={handleAddPurchase}
                onClose={() => setIsPurchaseFormOpen(false)}
            />
         </DialogContent>
     </Dialog>
   );
 }
