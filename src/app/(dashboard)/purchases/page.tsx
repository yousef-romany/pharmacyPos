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
import { Truck } from 'lucide-react'; // Icon for purchases/suppliers
import type { PurchaseTransaction, Supplier } from '@/lib/types'; // Import types
import { getPurchases, getSuppliers } from '@/lib/data'; // Import data fetching functions

export default function PurchasesPage() {
  const [purchases, setPurchases] = React.useState<PurchaseTransaction[]>([]);
  const [suppliers, setSuppliers] = React.useState<Map<string, string>>(new Map()); // Map supplier ID to name
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { toast } = useToast();

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
        const [purchasesData, suppliersData] = await Promise.all([
            getPurchases(), // Use dummy data for now
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
    // Simulate fetching purchase data (replace with actual API call later)
    const dummyPurchases: PurchaseTransaction[] = [
      { id: 'pur-001', supplierId: 'supp-001', items: [{ productId: 'prod-001', quantity: 100, cost: 10.50 }, { productId: 'prod-005', quantity: 150, cost: 8.00 }], totalAmount: 2250.00, date: new Date(2024, 6, 14) },
      { id: 'pur-002', supplierId: 'supp-002', items: [{ productId: 'prod-003', quantity: 50, cost: 45.00 }], totalAmount: 2250.00, date: new Date(2024, 6, 13) },
    ];
     setPurchases(dummyPurchases);

    // Fetch supplier names
     async function loadSuppliers() {
        try {
            const suppliersData = await getSuppliers();
            const supplierMap = new Map<string, string>();
            suppliersData.forEach(s => supplierMap.set(s.id, s.name));
            setSuppliers(supplierMap);
        } catch (error) {
             console.error("Failed to fetch suppliers for purchases:", error);
        } finally {
             setIsLoading(false);
        }
     }
     loadSuppliers();
  }, []); // Run once on mount

  const filteredPurchases = purchases.filter(purchase =>
    purchase.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    suppliers.get(purchase.supplierId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.items.some(item => item.productId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
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
                    {/* Add View/Edit buttons later */}
                    <Button variant="ghost" size="sm">عرض</Button>
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
  );
}
