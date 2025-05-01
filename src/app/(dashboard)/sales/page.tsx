
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
import { Receipt, Printer, Eye, CreditCard, Coins, Landmark } from 'lucide-react'; // Added icons for payment methods
import type { SaleTransaction, SaleTransactionItem, Customer, PaymentMethod } from '@/lib/types'; // Import the type and Customer
import { getSales, getCustomers, getProductById } from '@/lib/data'; // Import data fetching functions (getProductById needed for details)
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
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge'; // Import Badge
import { cn } from '@/lib/utils';

// --- Sale Details Dialog ---
interface SaleDetailsDialogProps {
    sale: SaleTransaction | null;
    customerName?: string; // Optional customer name
    onClose: () => void;
}

// Helper type for items with product names and unit labels
interface SaleItemWithDetails extends SaleTransactionItem {
    productName: string;
    unitLabel: string;
    originalPrice: number; // Price before discount for this item's unit
}

// Helper function to get payment method details
const getPaymentMethodInfo = (method: PaymentMethod) => {
    switch (method) {
        case 'cash': return { text: 'نقداً', icon: Coins, color: 'text-green-600' };
        case 'card': return { text: 'بطاقة', icon: CreditCard, color: 'text-blue-600' };
        case 'debt': return { text: 'آجل/مديونية', icon: Landmark, color: 'text-red-600' };
        default: return { text: method, icon: Coins, color: 'text-muted-foreground' };
    }
};


function SaleDetailsDialog({ sale, customerName, onClose }: SaleDetailsDialogProps) {
     const [detailedItems, setDetailedItems] = React.useState<SaleItemWithDetails[]>([]);
     const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);
      const [localOriginalTotal, setLocalOriginalTotal] = React.useState<number>(0);


    React.useEffect(() => {
        const fetchDetails = async () => {
            if (!sale) return;
            setIsLoadingDetails(true);
            let calculatedOriginalTotal = 0;
            try {
                const itemsWithDetails = await Promise.all(sale.items.map(async (item) => {
                     const product = await getProductById(item.productId); // Get full product info
                     const productName = product ? product.nameAr : `منتج (${item.productId.substring(0,6)})`;
                     const unitLabel = item.soldUnitType === 'sub'
                        ? product?.subUnitType || 'فرعية'
                        : product?.unitType || 'رئيسية';

                     // Calculate original price *before* discount for the sold unit
                     const originalUnitPrice = product ? (item.soldUnitType === 'sub' && product.subUnitsPerUnit
                        ? product.price / product.subUnitsPerUnit
                        : product.price) : item.price / (1 - (product?.discountRate ?? 0) / 100); // Estimate if product missing

                     calculatedOriginalTotal += originalUnitPrice * item.quantity;

                    return {
                        ...item,
                        productName: productName,
                        unitLabel: unitLabel,
                        originalPrice: originalUnitPrice,
                    };
                }));
                setDetailedItems(itemsWithDetails);
                 // Use the pre-calculated originalTotalAmount if available, otherwise use the dynamically calculated one
                 setLocalOriginalTotal(sale.originalTotalAmount ?? calculatedOriginalTotal);
            } catch (error) {
                console.error("Failed to fetch sale item details:", error);
                 // Handle error (e.g., show toast)
            } finally {
                setIsLoadingDetails(false);
            }
        };
        fetchDetails();
    }, [sale]); // Re-fetch when sale changes


    if (!sale) return null;

    const paymentInfo = getPaymentMethodInfo(sale.paymentMethod);
     const totalDiscount = localOriginalTotal - sale.totalAmount;


    // Basic print function (opens print dialog for the content)
    const handlePrint = () => {
        const printContent = document.getElementById('sale-details-content-printable');
        if (printContent) {
             const printWindow = window.open('', '_blank');
             if (printWindow) {
                 // Fetch item details again specifically for printing to ensure accuracy
                 let itemsHtmlForPrint = '';
                 if (isLoadingDetails) {
                     itemsHtmlForPrint = '<tr><td colspan="5">جاري تحميل تفاصيل الأصناف...</td></tr>';
                 } else {
                     detailedItems.forEach(item => {
                        const hasDiscount = item.originalPrice !== item.price;
                         itemsHtmlForPrint += `
                             <tr>
                                 <td>${item.productName}</td>
                                 <td>${item.unitLabel}</td>
                                 <td>${item.quantity}</td>
                                 <td>${item.price.toFixed(2)} ${hasDiscount ? `<span style="font-size:0.8em; color:gray; text-decoration: line-through;">(${item.originalPrice.toFixed(2)})</span>` : ''}</td>
                                 <td>${(item.quantity * item.price).toFixed(2)}</td>
                             </tr>
                         `;
                     });
                 }

                printWindow.document.write(`
                 <html>
                 <head>
                    <title>فاتورة بيع - ${sale.id}</title>
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
                         <p><strong>رقم الفاتورة:</strong> ${sale.id}</p>
                         <p><strong>التاريخ:</strong> ${new Date(sale.date).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short'})}</p>
                         <p><strong>العميل:</strong> ${customerName || 'عميل نقدي'}</p>
                         <p><strong>طريقة الدفع:</strong> <span class="payment-method">${paymentInfo.text}</span></p>
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
                             ${itemsHtmlForPrint}
                         </tbody>
                     </table>
                      <div class="totals">
                         <div><span>الإجمالي الأصلي:</span> ${localOriginalTotal.toFixed(2)} ر.س</div>
                         ${totalDiscount > 0 ? `<div><span>الخصم:</span> ${totalDiscount.toFixed(2)} ر.س</div>` : ''}
                         <div><span>المبلغ المدفوع:</span> ${sale.amountPaid.toFixed(2)} ر.س</div>
                          ${sale.paymentMethod === 'debt' ? `<div><span>المبلغ المتبقي (آجل):</span> ${(sale.totalAmount - sale.amountPaid).toFixed(2)} ر.س</div>` : ''}
                         <div><strong>الإجمالي النهائي:</strong> <strong>${sale.totalAmount.toFixed(2)} ر.س</strong></div>
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
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>تفاصيل الفاتورة: {sale.id}</DialogTitle>
            </DialogHeader>
             {/* Content visible in the dialog */}
             <div className="py-4 space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <p><strong className="ml-1">العميل:</strong> {customerName || 'عميل نقدي'}</p>
                    <p><strong className="ml-1">تاريخ الفاتورة:</strong> {format(new Date(sale.date), 'PPP p', { locale: arSA })}</p>
                    <p><strong className="ml-1">طريقة الدفع:</strong>
                         <Badge variant="outline" className={cn("mr-1 px-1.5 py-0.5 text-xs font-medium", paymentInfo.color)}>
                             <paymentInfo.icon className="ml-1 h-3 w-3" />
                             {paymentInfo.text}
                         </Badge>
                     </p>
                     {/* Add any other relevant header info */}
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
                                <TableHead>الوحدة</TableHead>
                                <TableHead>الكمية</TableHead>
                                <TableHead>السعر</TableHead>
                                <TableHead>الإجمالي</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {detailedItems.map((item, index) => {
                                const hasDiscount = item.originalPrice !== item.price;
                                return (
                                    <TableRow key={`${item.productId}-${index}`}>
                                        <TableCell>{item.productName}</TableCell>
                                        <TableCell>{item.unitLabel}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                         <TableCell>
                                             {item.price.toFixed(2)}
                                             {hasDiscount && <span className="text-xs text-muted-foreground line-through mr-1">({item.originalPrice.toFixed(2)})</span>}
                                         </TableCell>
                                        <TableCell>{(item.quantity * item.price).toFixed(2)} ر.س</TableCell>
                                    </TableRow>
                                );
                              })}
                        </TableBody>
                    </Table>
                </div>
                )}
                 <Separator />
                 <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-right text-base mt-4">
                      <span>الإجمالي الأصلي:</span>
                      <span className="font-semibold">{localOriginalTotal.toFixed(2)} ر.س</span>

                      {totalDiscount > 0 && (
                          <>
                             <span>الخصم:</span>
                             <span className="font-semibold text-green-600">-{totalDiscount.toFixed(2)} ر.س</span>
                          </>
                      )}

                     <span>المبلغ المدفوع:</span>
                     <span className="font-semibold">{sale.amountPaid.toFixed(2)} ر.س</span>

                      {sale.paymentMethod === 'debt' && (
                           <>
                             <span>المبلغ المتبقي (آجل):</span>
                             <span className="font-semibold text-red-600">{(sale.totalAmount - sale.amountPaid).toFixed(2)} ر.س</span>
                           </>
                       )}


                    <span className="text-lg font-bold col-start-1">الإجمالي النهائي:</span>
                    <span className="text-lg font-bold">{sale.totalAmount.toFixed(2)} ر.س</span>
                </div>
            </div>

              {/* Hidden div for printing */}
            <div id="sale-details-content-printable" style={{ display: 'none' }}>
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


export default function SalesPage() {
  const [sales, setSales] = React.useState<SaleTransaction[]>([]);
  const [customers, setCustomers] = React.useState<Map<string, string>>(new Map()); // Map customer ID to name
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedSale, setSelectedSale] = React.useState<SaleTransaction | null>(null); // For details dialog
  const { toast } = useToast();

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [salesData, customerData] = await Promise.all([
        getSales(), // Fetch actual sales data
        getCustomers()
      ]);
      setSales(salesData);

      const customerMap = new Map<string, string>();
      customerData.forEach(c => customerMap.set(c.id, c.name));
      setCustomers(customerMap);

    } catch (error) {
      console.error("Failed to fetch sales data:", error);
      toast({ title: "خطأ", description: "فشل تحميل فواتير البيع.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchData(); // Fetch data on mount
  }, [fetchData]);


   const filteredSales = sales.filter(sale =>
     sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (sale.customerId && customers.get(sale.customerId)?.toLowerCase().includes(searchTerm.toLowerCase())) ||
     sale.items.some(item => item.productId.toLowerCase().includes(searchTerm.toLowerCase())) // Simple check on product ID for now
     // TODO: Enhance search to fetch product names if needed for searching item names
  );


  return (
    <Dialog onOpenChange={(open) => !open && setSelectedSale(null)}> {/* Reset selectedSale on dialog close */}
        <div className="p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Receipt className="w-6 h-6" />
              فواتير البيع
            </h2>
             {/* Add New Sale Button (Optional - maybe link to POS) */}
          </div>

          <div className="flex items-center py-4">
            <Input
              placeholder="ابحث برقم الفاتورة, العميل, أو كود المنتج..."
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
                  <TableHead>العميل</TableHead>
                  <TableHead>تاريخ الفاتورة</TableHead>
                   <TableHead>طريقة الدفع</TableHead>
                  <TableHead>إجمالي المبلغ (ر.س)</TableHead>
                  <TableHead>عدد الأصناف</TableHead>
                   <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      جاري تحميل الفواتير...
                    </TableCell>
                  </TableRow>
                ) : filteredSales.length > 0 ? (
                  filteredSales.map((sale) => {
                     const paymentInfo = getPaymentMethodInfo(sale.paymentMethod);
                      return (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">{sale.id.substring(0, 8)}...</TableCell>
                          <TableCell>{sale.customerId ? (customers.get(sale.customerId) || sale.customerId) : 'عميل نقدي'}</TableCell>
                          <TableCell>{format(new Date(sale.date), 'dd/MM/yyyy p', { locale: arSA })}</TableCell>
                           <TableCell>
                               <Badge variant="outline" className={cn("px-1.5 py-0.5 text-xs", paymentInfo.color)}>
                                  <paymentInfo.icon className="ml-1 h-3 w-3" />
                                  {paymentInfo.text}
                              </Badge>
                           </TableCell>
                          <TableCell>{sale.totalAmount.toFixed(2)}</TableCell>
                           <TableCell>{sale.items.length}</TableCell>
                          <TableCell className="text-right">
                             <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => setSelectedSale(sale)}>
                                    <Eye className="h-4 w-4" />
                                </Button>
                             </DialogTrigger>
                          </TableCell>
                        </TableRow>
                      );
                    })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      لا توجد فواتير بيع لعرضها.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
           {/* Add Pagination later if needed */}
        </div>

        {/* Sale Details Dialog Content */}
         <SaleDetailsDialog
            sale={selectedSale}
            customerName={selectedSale?.customerId ? customers.get(selectedSale.customerId) : undefined}
            onClose={() => setSelectedSale(null)}
         />
    </Dialog>
  );
}
