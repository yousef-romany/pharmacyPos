
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Archive, Package, AlertCircle, CalendarX, CalendarClock, DollarSign } from 'lucide-react';
import { getInventoryReportData, calculateDaysUntilExpiry, getExpiredProducts, getProductsNearingExpiry } from '@/lib/data';
import type { InventoryReportItem, ProductExpiryInfo } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function InventoryPage() {
  const [inventory, setInventory] = React.useState<InventoryReportItem[]>([]);
  const [filteredInventory, setFilteredInventory] = React.useState<InventoryReportItem[]>([]);
  const [expiredProducts, setExpiredProducts] = React.useState<ProductExpiryInfo[]>([]);
  const [nearingExpiryProducts, setNearingExpiryProducts] = React.useState<ProductExpiryInfo[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
         const [inventoryData, expiredData, nearingExpiryData] = await Promise.all([
            getInventoryReportData(),
            getExpiredProducts(),
            getProductsNearingExpiry(60) // Fetch products expiring within 60 days
         ]);
        setInventory(inventoryData);
        setFilteredInventory(inventoryData);
        setExpiredProducts(expiredData);
        setNearingExpiryProducts(nearingExpiryData);
      } catch (error) {
        console.error("Failed to load inventory data:", error);
        // Handle error (e.g., show toast)
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  React.useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const results = inventory.filter(item =>
      item.nameAr.toLowerCase().includes(lowerSearchTerm) ||
      item.nameEn.toLowerCase().includes(lowerSearchTerm) ||
      (item.barcode && item.barcode.toLowerCase().includes(lowerSearchTerm)) ||
      item.id.toLowerCase().includes(lowerSearchTerm)
    );
    setFilteredInventory(results);
  }, [searchTerm, inventory]);

  const totalInventoryValue = inventory.reduce((sum, item) => sum + item.inventoryValue, 0);
  const totalItemCount = inventory.length;
   const totalExpiredCount = expiredProducts.length;
   const totalNearingExpiryCount = nearingExpiryProducts.length;


  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Archive className="w-6 h-6" />
          إدارة المخزون
        </h2>
         <div className="flex items-center py-4">
            <Input
               placeholder="ابحث بالاسم, الكود, أو الباركود..."
               value={searchTerm}
               onChange={(event) => setSearchTerm(event.target.value)}
               className="max-w-sm"
             />
         </div>
      </div>


      {/* Inventory Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">إجمالي قيمة المخزون</CardTitle>
             <DollarSign className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{totalInventoryValue.toFixed(2)} ر.س</div>}
              <p className="text-xs text-muted-foreground pt-1">
                (حسب آخر سعر شراء)
             </p>
           </CardContent>
         </Card>
          <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">عدد الأصناف الفريدة</CardTitle>
             <Package className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             {isLoading ? <Skeleton className="h-8 w-1/3" /> : <div className="text-2xl font-bold">{totalItemCount}</div>}
              <p className="text-xs text-muted-foreground pt-1">
                إجمالي عدد المنتجات المختلفة في المخزون
             </p>
           </CardContent>
         </Card>
          <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">أصناف قاربت على الانتهاء</CardTitle>
             <CalendarClock className="h-4 w-4 text-orange-600" />
           </CardHeader>
           <CardContent>
             {isLoading ? <Skeleton className="h-8 w-1/3" /> : <div className="text-2xl font-bold text-orange-600">{totalNearingExpiryCount}</div>}
             <p className="text-xs text-muted-foreground pt-1">
                (أقل من 60 يوم)
             </p>
           </CardContent>
         </Card>
          <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">أصناف منتهية الصلاحية</CardTitle>
             <CalendarX className="h-4 w-4 text-red-600" />
           </CardHeader>
           <CardContent>
             {isLoading ? <Skeleton className="h-8 w-1/3" /> : <div className="text-2xl font-bold text-red-600">{totalExpiredCount}</div>}
              <p className="text-xs text-muted-foreground pt-1">
                يجب التخلص منها
             </p>
           </CardContent>
         </Card>
       </div>


      {/* Inventory Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>تقرير المخزون التفصيلي</CardTitle>
          <CardDescription>عرض لجميع الأصناف في المخزون مع تفاصيلها وقيمتها.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[25%]">المنتج</TableHead>
                  <TableHead>الباركود</TableHead>
                  <TableHead>الكمية</TableHead>
                  <TableHead>الوحدة</TableHead>
                   <TableHead>آخر تكلفة</TableHead>
                  <TableHead>سعر البيع</TableHead>
                  <TableHead>الصلاحية</TableHead>
                   <TableHead>قيمة المخزون</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                       <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredInventory.length > 0 ? (
                  filteredInventory.map((item) => {
                     const daysLeft = item.expiryDate ? calculateDaysUntilExpiry(new Date(item.expiryDate)) : null;
                     const isExpired = daysLeft !== null && daysLeft < 0;
                     const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 60;
                     const expiryColorClass = isExpired ? 'text-red-700 font-bold' : isExpiringSoon ? 'text-orange-600 font-medium' : '';
                     return (
                         <TableRow key={item.id}>
                             <TableCell className="font-medium">
                                <div>{item.nameAr}</div>
                                <div className="text-xs text-muted-foreground">{item.nameEn}</div>
                             </TableCell>
                             <TableCell>{item.barcode || '-'}</TableCell>
                             <TableCell>{Number.isInteger(item.quantity) ? item.quantity : item.quantity.toFixed(2)}</TableCell>
                             <TableCell>{item.unitType}</TableCell>
                             <TableCell>{(item.lastPurchaseCost ?? 0).toFixed(2)}</TableCell>
                             <TableCell>{item.price.toFixed(2)}</TableCell>
                             <TableCell className={cn(expiryColorClass)}>
                                {item.expiryDate ? format(new Date(item.expiryDate), 'dd/MM/yyyy', { locale: arSA }) : '-'}
                                {isExpired && <span className="text-xs block">(منتهي)</span>}
                                {isExpiringSoon && <span className="text-xs block">(خلال {daysLeft} يوم)</span>}
                             </TableCell>
                             <TableCell>{item.inventoryValue.toFixed(2)}</TableCell>
                         </TableRow>
                     );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      لا توجد أصناف في المخزون تطابق بحثك.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
           {/* Add Pagination if needed */}
        </CardContent>
      </Card>

       {/* Inventory Actions (Placeholder) */}
       <Card>
        <CardHeader>
          <CardTitle>عمليات المخزون</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            روابط لعمليات المخزون مثل الجرد، تسوية الكميات، نقل المخزون (إذا كان هناك أكثر من مخزن).
          </p>
           <div className="mt-4 border rounded-md p-10 text-center text-muted-foreground">
             (سيتم بناء هذه الواجهة لاحقاً)
           </div>
       </CardContent>
      </Card>

    </div>
  );
}
