
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
import { Archive, Package, AlertCircle, CalendarX, CalendarClock, DollarSign, Filter, Printer } from 'lucide-react';
import { getInventoryReportData, calculateDaysUntilExpiry } from '@/lib/data';
import type { InventoryReportItem } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox

// Helper function to safely parse floats (can be moved to utils)
const safeParseFloat = (value: string | number | null | undefined, defaultValue = 0): number => {
    if (value === null || value === undefined) return defaultValue;
    const parsed = parseFloat(value.toString());
    return isNaN(parsed) ? defaultValue : parsed;
};

export default function InventoryReportPage() {
  const [inventory, setInventory] = React.useState<InventoryReportItem[]>([]);
  const [filteredInventory, setFilteredInventory] = React.useState<InventoryReportItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showLowStock, setShowLowStock] = React.useState(false); // Filter for low stock (example - depends on product having minStockLevel)
  const [showExpired, setShowExpired] = React.useState(false);
  const [showNearingExpiry, setShowNearingExpiry] = React.useState(false); // Within 60 days

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
         const inventoryData = await getInventoryReportData();
        setInventory(inventoryData);
        setFilteredInventory(inventoryData); // Initially show all
      } catch (error) {
        console.error("Failed to load inventory report data:", error);
        // Handle error (e.g., show toast)
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Filtering Logic ---
  React.useEffect(() => {
    let results = inventory;

    // Filter by Search Term
    if (searchTerm.trim()) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        results = results.filter(item =>
          item.nameAr.toLowerCase().includes(lowerSearchTerm) ||
          (item.nameEn && item.nameEn.toLowerCase().includes(lowerSearchTerm)) || // Check if nameEn exists
          (item.barcode && item.barcode.toLowerCase().includes(lowerSearchTerm)) ||
          item.id.toLowerCase().includes(lowerSearchTerm)
        );
    }

    // Filter by Expired
    if (showExpired) {
        results = results.filter(item => {
            const daysLeft = item.expiryDate ? calculateDaysUntilExpiry(new Date(item.expiryDate)) : null;
            return daysLeft !== null && daysLeft < 0;
        });
    }

    // Filter by Nearing Expiry (and not already expired)
    if (showNearingExpiry) {
         results = results.filter(item => {
             const daysLeft = item.expiryDate ? calculateDaysUntilExpiry(new Date(item.expiryDate)) : null;
             return daysLeft !== null && daysLeft >= 0 && daysLeft <= 60;
         });
    }

    // Filter by Low Stock (TODO: Needs Product.minStockLevel to be reliable)
    // if (showLowStock) {
    //     results = results.filter(item => item.minStockLevel !== undefined && safeParseFloat(item.quantity) <= item.minStockLevel);
    // }


    setFilteredInventory(results);
  }, [searchTerm, showExpired, showNearingExpiry, inventory]); // Dependencies for filtering

  const totalInventoryValue = filteredInventory.reduce((sum, item) => sum + item.inventoryValue, 0);
  const totalFilteredItemCount = filteredInventory.length;

    const resetFilters = () => {
        setSearchTerm('');
        setShowExpired(false);
        setShowNearingExpiry(false);
        setShowLowStock(false);
    };


  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Archive className="w-6 h-6" />
          تقرير المخزون
        </h2>
         <div className="flex items-center gap-2">
            {/* Filter Popover */}
             <Popover>
                <PopoverTrigger asChild>
                     <Button variant="outline">
                        <Filter className="ml-2 h-4 w-4" />
                         تصفية
                     </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                     <div className="grid gap-4">
                         <div className="space-y-2">
                             <h4 className="font-medium leading-none">فلاتر التقرير</h4>
                             <p className="text-sm text-muted-foreground">
                                 حدد معايير تصفية لعرض المخزون.
                             </p>
                         </div>
                         <div className="grid gap-2">
                             <div className="grid grid-cols-3 items-center gap-4">
                                 <Label htmlFor="searchTerm" className="col-span-1">بحث</Label>
                                 <Input
                                    id="searchTerm"
                                    placeholder="اسم, كود, باركود..."
                                    className="h-8 col-span-2"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                  />
                             </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="showExpired" checked={showExpired} onCheckedChange={(checked) => setShowExpired(Boolean(checked))} />
                                <Label htmlFor="showExpired" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                     عرض المنتهي الصلاحية فقط
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="showNearingExpiry" checked={showNearingExpiry} onCheckedChange={(checked) => setShowNearingExpiry(Boolean(checked))} />
                                <Label htmlFor="showNearingExpiry" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                     عرض ما قارب على الانتهاء (60 يوم)
                                </Label>
                            </div>
                            {/* Add Low Stock Checkbox later if minStockLevel is consistently available */}
                            {/* <div className="flex items-center space-x-2">
                                <Checkbox id="showLowStock" checked={showLowStock} onCheckedChange={(checked) => setShowLowStock(Boolean(checked))} />
                                <Label htmlFor="showLowStock" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    عرض الأصناف تحت الحد الأدنى
                                </Label>
                            </div> */}
                         </div>
                          <Button variant="outline" size="sm" onClick={resetFilters}>إعادة تعيين الفلاتر</Button>
                     </div>
                </PopoverContent>
             </Popover>
             <Button variant="outline" onClick={() => window.print()}> {/* Basic print */}
                <Printer className="ml-2 h-4 w-4" />
                 طباعة التقرير
            </Button>
        </div>
      </div>


      {/* Inventory Summary */}
      <Card>
        <CardHeader>
          <CardTitle>ملخص المخزون (حسب الفلاتر)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-around">
                 <Skeleton className="h-8 w-24" />
                 <Skeleton className="h-8 w-32" />
             </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">عدد الأصناف</p>
                <p className="text-2xl font-bold">{totalFilteredItemCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي قيمة المخزون</p>
                <p className="text-2xl font-bold">{totalInventoryValue.toFixed(2)} ر.س</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Inventory Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل أصناف المخزون</CardTitle>
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
                     const quantityNum = safeParseFloat(item.quantity);
                     const priceNum = safeParseFloat(item.price);
                     const costNum = safeParseFloat(item.lastPurchaseCost, 0);

                     return (
                         <TableRow key={item.id}>
                             <TableCell className="font-medium">
                                <div>{item.nameAr}</div>
                                <div className="text-xs text-muted-foreground">{item.nameEn}</div>
                             </TableCell>
                             <TableCell>{item.barcode || '-'}</TableCell>
                             <TableCell>{Number.isInteger(quantityNum) ? quantityNum : quantityNum.toFixed(2)}</TableCell>
                             <TableCell>{item.unitType}</TableCell>
                             <TableCell>{costNum.toFixed(2)}</TableCell>
                             <TableCell>{priceNum.toFixed(2)}</TableCell>
                             <TableCell className={cn(expiryColorClass)}>
                                {item.expiryDate ? format(new Date(item.expiryDate), 'dd/MM/yyyy', { locale: arSA }) : '-'}
                                {isExpired && <span className="text-xs block">(منتهي)</span>}
                                {isExpiringSoon && !isExpired && <span className="text-xs block">(خلال {daysLeft} يوم)</span>}
                             </TableCell>
                             <TableCell>{item.inventoryValue.toFixed(2)}</TableCell>
                         </TableRow>
                     );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      لا توجد أصناف في المخزون تطابق الفلاتر المحددة.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
           {/* Add Pagination later if needed */}
        </CardContent>
      </Card>
    </div>
  );
}

