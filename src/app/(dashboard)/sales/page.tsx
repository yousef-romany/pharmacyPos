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
import { Receipt } from 'lucide-react'; // Icon for sales
import type { SaleTransaction } from '@/lib/types'; // Import the type
import { getSales, getCustomers } from '@/lib/data'; // Import data fetching functions

export default function SalesPage() {
  const [sales, setSales] = React.useState<SaleTransaction[]>([]);
  const [customers, setCustomers] = React.useState<Map<string, string>>(new Map()); // Map customer ID to name
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { toast } = useToast();

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [salesData, customerData] = await Promise.all([
        getSales(), // Using the dummy data for now
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
    // Simulate fetching sales data (replace with actual API call later)
    const dummySales: SaleTransaction[] = [
      { id: 'sale-001', customerId: 'cust-001', items: [{ productId: 'prod-001', quantity: 2, price: 15.50 }], totalAmount: 31.00, date: new Date(2024, 6, 15, 10, 30) },
      { id: 'sale-002', customerId: 'cust-002', items: [{ productId: 'prod-004', quantity: 1, price: 30.00 }, { productId: 'prod-002', quantity: 1, price: 22.00 }], totalAmount: 52.00, date: new Date(2024, 6, 15, 14, 15) },
      { id: 'sale-003', items: [{ productId: 'prod-005', quantity: 3, price: 12.25 }], totalAmount: 36.75, date: new Date(2024, 6, 16, 9, 0) }, // Walk-in customer
    ];
     setSales(dummySales);

    // Fetch customer names
     async function loadCustomers() {
         try {
             const customerData = await getCustomers();
             const customerMap = new Map<string, string>();
             customerData.forEach(c => customerMap.set(c.id, c.name));
             setCustomers(customerMap);
         } catch (error) {
             console.error("Failed to fetch customers for sales:", error);
             // Handle error silently or show a less critical toast
         } finally {
            setIsLoading(false);
         }
     }
     loadCustomers();

  }, []); // Run only once on mount for dummy data


   const filteredSales = sales.filter(sale =>
     sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (sale.customerId && customers.get(sale.customerId)?.toLowerCase().includes(searchTerm.toLowerCase())) ||
     sale.items.some(item => item.productId.toLowerCase().includes(searchTerm.toLowerCase()))
  );


  return (
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
                     {/* Add View/Print/Edit buttons later */}
                     <Button variant="ghost" size="sm">عرض</Button>
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
  );
}
