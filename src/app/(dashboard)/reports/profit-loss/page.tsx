
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Calendar, Filter, Loader2 } from 'lucide-react';
import { getSales, getProductById } from '@/lib/data'; // Import necessary data functions
import type { SaleTransaction, SaleTransactionItem, Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, format } from 'date-fns'; // Import format
import { arSA } from 'date-fns/locale'; // Import Arabic locale

// Helper function to safely parse floats (can be moved to utils)
const safeParseFloat = (value: string | number | null | undefined, defaultValue = 0): number => {
    if (value === null || value === undefined) return defaultValue;
    const parsed = parseFloat(value.toString());
    return isNaN(parsed) ? defaultValue : parsed;
};

export default function ProfitLossReportPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [totalSales, setTotalSales] = React.useState(0);
  const [totalCostOfGoodsSold, setTotalCostOfGoodsSold] = React.useState(0);
  const [grossProfit, setGrossProfit] = React.useState(0);
  const [netProfit, setNetProfit] = React.useState(0); // For now, net profit = gross profit
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(startOfMonth(new Date()));
  const [dateTo, setDateTo] = React.useState<Date | undefined>(endOfMonth(new Date()));

  const calculateProfitLoss = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const allSales = await getSales();

      // Filter sales by date range
      const startDate = dateFrom ? startOfDay(dateFrom) : null;
      const endDate = dateTo ? endOfDay(dateTo) : null;

      const filteredSales = allSales.filter(sale => {
        const saleDate = new Date(sale.date);
        const afterStart = startDate ? saleDate >= startDate : true;
        const beforeEnd = endDate ? saleDate <= endDate : true;
        return afterStart && beforeEnd;
      });

      let calculatedTotalSales = 0;
      let calculatedTotalCOGS = 0;

      // Use Promise.all for potentially fetching product details concurrently (though sample data is fast)
      await Promise.all(filteredSales.map(async (sale) => {
        calculatedTotalSales += safeParseFloat(sale.totalAmount); // Parse totalAmount
        // Calculate COGS for this sale
        for (const item of sale.items) {
           const itemQuantityNum = safeParseFloat(item.quantity); // Parse quantity
           // If costAtSale is stored, use it directly
          if (item.costAtSale !== undefined && item.costAtSale !== null) {
            calculatedTotalCOGS += safeParseFloat(item.costAtSale) * itemQuantityNum; // Parse costAtSale
          } else {
             // Fallback: Fetch product cost if not stored on the sale item
            const product = await getProductById(item.productId);
             // Cost needs to be per *sold unit*
             let costPerSoldUnit = 0;
             if (product && product.lastPurchaseCost !== undefined) {
                 const lastPurchaseCostNum = safeParseFloat(product.lastPurchaseCost); // Parse cost
                 costPerSoldUnit = item.soldUnitType === 'sub' && product.subUnitsPerUnit
                     ? lastPurchaseCostNum / product.subUnitsPerUnit
                     : lastPurchaseCostNum;
             }
             // else: handle missing product or cost (e.g., log warning, assume 0 cost)

            calculatedTotalCOGS += costPerSoldUnit * itemQuantityNum;
          }
        }
      }));

      setTotalSales(calculatedTotalSales);
      setTotalCostOfGoodsSold(calculatedTotalCOGS);
      const calculatedGrossProfit = calculatedTotalSales - calculatedTotalCOGS;
      setGrossProfit(calculatedGrossProfit);
      // For simplicity, assume no other expenses for now
      setNetProfit(calculatedGrossProfit);

    } catch (error) {
      console.error("Failed to calculate profit/loss:", error);
      // Handle error (e.g., show toast)
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo]); // Recalculate when date range changes

  React.useEffect(() => {
    calculateProfitLoss();
  }, [calculateProfitLoss]);

  const ProfitIcon = netProfit > 0 ? TrendingUp : netProfit < 0 ? TrendingDown : Minus;
  const profitColor = netProfit > 0 ? 'text-green-600' : netProfit < 0 ? 'text-red-600' : 'text-muted-foreground';

  const resetFilters = () => {
    setDateFrom(startOfMonth(new Date()));
    setDateTo(endOfMonth(new Date()));
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <ProfitIcon className={`w-6 h-6 ${profitColor}`} />
            تقرير الأرباح والخسائر
          </h2>
          <div className="flex items-center gap-2">
              {/* Filter Popover */}
               <Popover>
                   <PopoverTrigger asChild>
                       <Button variant="outline">
                          <Filter className="ml-2 h-4 w-4" />
                           تحديد الفترة
                       </Button>
                   </PopoverTrigger>
                   <PopoverContent className="w-80">
                       <div className="grid gap-4">
                           <div className="space-y-2">
                               <h4 className="font-medium leading-none">الفترة الزمنية</h4>
                               <p className="text-sm text-muted-foreground">
                                   اختر فترة لعرض التقرير.
                               </p>
                           </div>
                           <div className="grid gap-2">
                               <div className="grid grid-cols-2 items-center gap-4">
                                  <Label htmlFor="dateFrom">من تاريخ</Label>
                                   <DatePicker date={dateFrom} setDate={setDateFrom} buttonClassName="h-8 text-xs w-full" />
                               </div>
                               <div className="grid grid-cols-2 items-center gap-4">
                                  <Label htmlFor="dateTo">إلى تاريخ</Label>
                                   <DatePicker date={dateTo} setDate={setDateTo} buttonClassName="h-8 text-xs w-full" />
                               </div>
                           </div>
                           <div className='flex gap-2'>
                              <Button variant="outline" size="sm" onClick={resetFilters} className='flex-1'>إعادة تعيين (الشهر الحالي)</Button>
                              <Button size="sm" onClick={calculateProfitLoss} disabled={isLoading} className='flex-1'>
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تطبيق'}
                              </Button>
                           </div>
                       </div>
                   </PopoverContent>
               </Popover>
          </div>
      </div>


      <Card>
        <CardHeader>
          <CardTitle>ملخص الأرباح والخسائر</CardTitle>
           <CardDescription>
             الأداء المالي للفترة من {dateFrom ? format(dateFrom, 'dd/MM/yyyy', { locale: arSA }) : 'البداية'} إلى {dateTo ? format(dateTo, 'dd/MM/yyyy', { locale: arSA }) : 'النهاية'}.
           </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="space-y-4">
                <div className="flex justify-between items-center"><span className="text-muted-foreground">إجمالي المبيعات:</span> <Skeleton className="h-6 w-24" /></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">تكلفة البضاعة المباعة:</span> <Skeleton className="h-6 w-24" /></div>
                <div className="flex justify-between items-center font-medium"><span className="text-muted-foreground">إجمالي الربح:</span> <Skeleton className="h-6 w-24" /></div>
                 {/* <div className="flex justify-between items-center"><span className="text-muted-foreground">المصروفات:</span> <Skeleton className="h-6 w-24" /></div> */}
                <div className="flex justify-between items-center text-lg font-bold"><span className="text-muted-foreground">صافي الربح/الخسارة:</span> <Skeleton className="h-8 w-32" /></div>
             </div>
          ) : (
            <div className="space-y-2 text-base">
              <div className="flex justify-between">
                <span className="text-muted-foreground">إجمالي المبيعات:</span>
                <span>{totalSales.toFixed(2)} ر.س</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">تكلفة البضاعة المباعة (COGS):</span>
                <span>{totalCostOfGoodsSold.toFixed(2)} ر.س</span>
              </div>
               <div className="flex justify-between font-medium border-t pt-2">
                <span className="text-muted-foreground">إجمالي الربح:</span>
                <span>{grossProfit.toFixed(2)} ر.س</span>
              </div>
               {/* <div className="flex justify-between">
                <span className="text-muted-foreground">المصروفات (مثال):</span>
                <span>{(totalSales - netProfit - totalCostOfGoodsSold).toFixed(2)} ر.س</span>
              </div> */}
              <div className={`flex justify-between text-lg font-bold border-t pt-2 ${profitColor}`}>
                <span className="text-foreground">صافي الربح/الخسارة (مبدئي):</span>
                <span>{netProfit.toFixed(2)} ر.س</span>
              </div>
            </div>
          )}
           <p className="text-xs text-muted-foreground mt-4">
             * ملاحظة: تكلفة البضاعة المباعة تعتمد على آخر سعر شراء مسجل للمنتج وقت البيع. صافي الربح لا يشمل المصروفات الأخرى (إيجار، رواتب، إلخ) التي يجب إضافتها يدوياً أو عبر نظام محاسبي منفصل.
           </p>
        </CardContent>
      </Card>

      {/* Add more detailed breakdown or charts later */}
      <Card>
         <CardHeader>
           <CardTitle>تفاصيل إضافية</CardTitle>
           <CardDescription>(سيتم بناء هذه الواجهة لاحقاً)</CardDescription>
         </CardHeader>
         <CardContent className="text-center text-muted-foreground p-10">
             يمكن إضافة رسوم بيانية وتحليلات تفصيلية للمبيعات والتكاليف والمصروفات هنا.
         </CardContent>
      </Card>
    </div>
  );
}

