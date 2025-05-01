
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
import { Truck, Eye, Printer } from 'lucide-react'; // Added icons
import type { PurchaseTransaction, Supplier } from '@/lib/types'; // Import types
import { getPurchases, getSuppliers } from '@/lib/data'; // Import data fetching functions
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


// --- Purchase Details Dialog ---
interface PurchaseDetailsDialogProps {
    purchase: PurchaseTransaction | null;
    supplierName?: string; // Optional supplier name
    onClose: () => void;
}

function PurchaseDetailsDialog({ purchase, supplierName, onClose }: PurchaseDetailsDialogProps) {
    if (!purchase) return null;

    // Basic print function (opens print dialog for the content)
    const handlePrint = () => {
        const printContent = document.getElementById('purchase-details-content');
        if (printContent) {
             const printWindow = window.open('', '_blank');
             if (printWindow) {
                printWindow.document.write(`
                 <html>
                 <head>
                    <title>فاتورة شراء - ${purchase.id}</title>
                     <style>
                         body { font-family: sans-serif; direction: rtl; padding: 20px; }
                         table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                         th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                         th { background-color: #f2f2f2; }
                         .total { font-weight: bold; font-size: 1.1em; }
                         .header { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;}
                         .header h2 { margin: 0; }
                         .info p { margin: 5px 0; }
                     </style>
                 </head>
                 <body>
                     <div class="header">
                         <h2>فاتورة شراء</h2>
                         <p>رقم الفاتورة: ${purchase.id}</p>
                         <p>التاريخ: ${purchase.date.toLocaleDateString('ar-SA')}</p>
                     </div>
                     <div class="info">
                         <p><strong>المورد:</strong> ${supplierName || purchase.supplierId}</p>
                     </div>
                     ${printContent.innerHTML}
                 </body>
                 </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
                // printWindow.close(); // Optional
            }
        }
    };

    return (
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>تفاصيل فاتورة الشراء: {purchase.id}</DialogTitle>
            </DialogHeader>
            <div id="purchase-details-content" className="py-4 space-y-4">
                 <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><strong className="ml-1">المورد:</strong> {supplierName || purchase.supplierId}</p>
                    <p><strong className="ml-1">تاريخ الفاتورة:</strong> {purchase.date.toLocaleDateString('ar-SA')}</p>
                </div>
                <Separator />
                <h4 className="font-medium">الأصناف:</h4>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>المنتج</TableHead>
                            <TableHead>الكمية</TableHead>
                            <TableHead>التكلفة</TableHead>
                            <TableHead>الإجمالي</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {purchase.items.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{item.productId}</TableCell> {/* TODO: Fetch product name later */}
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{item.cost.toFixed(2)} ر.س</TableCell>
                                <TableCell>{(item.quantity * item.cost).toFixed(2)} ر.س</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 <Separator />
                 <div className="text-right text-lg font-bold mt-4">
                    <span>إجمالي الفاتورة: </span>
                    <span>{purchase.totalAmount.toFixed(2)} ر.س</span>
                </div>
            </div>
            <DialogFooter className="gap-2">
                 <Button variant="outline" onClick={handlePrint}>
                   <Printer className="ml-2 h-4 w-4" />
                   طباعة
                 </Button>
                <DialogClose asChild>
                    <Button type="button" variant="secondary" onClick={onClose}>إغلاق</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    );
}


export default function PurchasesPage() {
  const [purchases, setPurchases] = React.useState<PurchaseTransaction[]>([]);
  const [suppliers, setSuppliers] = React.useState<Map<string, string>>(new Map()); // Map supplier ID to name
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedPurchase, setSelectedPurchase] = React.useState<PurchaseTransaction | null>(null); // For details dialog
  const { toast } = useToast();

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
        const [purchasesData, suppliersData] = await Promise.all([
            getPurchases(), // Fetch actual purchase data
            getSuppliers()
        ]);

      setPurchases(purchasesData);

      const supplierMap = new Map<string, string>();
      suppliersData.forEach(s => supplierMap.set(s.id, s.name));
      setSuppliers(supplierMap);

    } catch (error) {
      console.error("Failed to fetch purchase data:", error);
      toast({ title: "خطأ", description: "فشل تحميل فواتير الشراء.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
     fetchData();
  }, [fetchData]); // Run on mount and when fetchData changes


  const filteredPurchases = purchases.filter(purchase =>
    purchase.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    suppliers.get(purchase.supplierId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.items.some(item => item.productId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog onOpenChange={(open) => !open && setSelectedPurchase(null)}> {/* Reset selectedPurchase on dialog close */}
        <div className="p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Truck className="w-6 h-6" />
              فواتير الشراء
            </h2>
            {/* Add New Purchase Button (Optional) */}
            {/* <Button>
              <PlusCircle className="ml-2 h-5 w-5" />
              إنشاء فاتورة شراء
            </Button> */}
          </div>

           <div className="flex items-center py-4">
            <Input
              placeholder="ابحث برقم الفاتورة, المورد, أو كود المنتج..."
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
                  <TableHead>المورد</TableHead>
                  <TableHead>تاريخ الفاتورة</TableHead>
                  <TableHead>إجمالي المبلغ (ر.س)</TableHead>
                   <TableHead>عدد الأصناف</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      جاري تحميل الفواتير...
                    </TableCell>
                  </TableRow>
                ) : filteredPurchases.length > 0 ? (
                  filteredPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">{purchase.id}</TableCell>
                      <TableCell>{suppliers.get(purchase.supplierId) || purchase.supplierId}</TableCell>
                      <TableCell>{purchase.date.toLocaleDateString('ar-SA')}</TableCell>
                      <TableCell>{purchase.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>{purchase.items.length}</TableCell>
                      <TableCell className="text-right">
                        <DialogTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => setSelectedPurchase(purchase)}>
                                <Eye className="h-4 w-4" />
                             </Button>
                        </DialogTrigger>
                         {/* Add Edit button later if needed */}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
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
            supplierName={selectedPurchase ? suppliers.get(selectedPurchase.supplierId) : undefined}
            onClose={() => setSelectedPurchase(null)}
         />
    </Dialog>
  );
}
