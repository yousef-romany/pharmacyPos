
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
import { Receipt, Printer, Eye } from 'lucide-react'; // Added icons
import type { SaleTransaction } from '@/lib/types'; // Import the type
import { getSales, getCustomers } from '@/lib/data'; // Import data fetching functions
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

// --- Sale Details Dialog ---
interface SaleDetailsDialogProps {
    sale: SaleTransaction | null;
    customerName?: string; // Optional customer name
    onClose: () => void;
}

function SaleDetailsDialog({ sale, customerName, onClose }: SaleDetailsDialogProps) {
    if (!sale) return null;

    // Basic print function (opens print dialog for the content)
    const handlePrint = () => {
        const printContent = document.getElementById('sale-details-content');
        if (printContent) {
             const printWindow = window.open('', '_blank');
             if (printWindow) {
                printWindow.document.write(`
                 <html>
                 <head>
                    <title>فاتورة بيع - ${sale.id}</title>
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
                         <h2>فاتورة بيع</h2>
                         <p>رقم الفاتورة: ${sale.id}</p>
                         <p>التاريخ: ${sale.date.toLocaleString('ar-SA')}</p>
                     </div>
                     <div class="info">
                         <p><strong>العميل:</strong> ${customerName || 'عميل نقدي'}</p>
                     </div>
                     ${printContent.innerHTML}
                 </body>
                 </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
                // printWindow.close(); // Close after print (optional)
            }
        }
    };


    return (
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>تفاصيل الفاتورة: {sale.id}</DialogTitle>
            </DialogHeader>
            <div id="sale-details-content" className="py-4 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><strong className="ml-1">العميل:</strong> {customerName || 'عميل نقدي'}</p>
                    <p><strong className="ml-1">تاريخ الفاتورة:</strong> {sale.date.toLocaleString('ar-SA')}</p>
                </div>
                <Separator />
                <h4 className="font-medium">الأصناف:</h4>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>المنتج</TableHead>
                            <TableHead>الكمية</TableHead>
                            <TableHead>السعر</TableHead>
                            <TableHead>الإجمالي</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sale.items.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{item.productId}</TableCell> {/* TODO: Fetch product name later */}
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{item.price.toFixed(2)} ر.س</TableCell>
                                <TableCell>{(item.quantity * item.price).toFixed(2)} ر.س</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 <Separator />
                 <div className="text-right text-lg font-bold mt-4">
                    <span>إجمالي الفاتورة: </span>
                    <span>{sale.totalAmount.toFixed(2)} ر.س</span>
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
    fetchData(); // Fetch data on mount and when fetchData changes (though it shouldn't change)
  }, [fetchData]);


   const filteredSales = sales.filter(sale =>
     sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (sale.customerId && customers.get(sale.customerId)?.toLowerCase().includes(searchTerm.toLowerCase())) ||
     sale.items.some(item => item.productId.toLowerCase().includes(searchTerm.toLowerCase()))
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
             {/* <Button>
               <PlusCircle className="ml-2 h-5 w-5" />
               إنشاء فاتورة بيع
             </Button> */}
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
                ) : filteredSales.length > 0 ? (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.id}</TableCell>
                      <TableCell>{sale.customerId ? (customers.get(sale.customerId) || sale.customerId) : 'عميل نقدي'}</TableCell>
                      <TableCell>{sale.date.toLocaleString('ar-SA')}</TableCell>
                      <TableCell>{sale.totalAmount.toFixed(2)}</TableCell>
                       <TableCell>{sale.items.length}</TableCell>
                      <TableCell className="text-right">
                         <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => setSelectedSale(sale)}>
                                <Eye className="h-4 w-4" />
                            </Button>
                         </DialogTrigger>
                        {/* Add Print button if needed directly here */}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
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
