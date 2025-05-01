
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HandCoins, Printer, Eye, Calendar, Filter } from 'lucide-react'; // Added Calendar, Filter
import { getSales, getCustomers, getProductById } from '@/lib/data'; // Assuming these exist
import type { SaleTransaction, Customer, SaleTransactionItem } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker'; // Assuming you have this
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // For potential filtering
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'; // For filter popover
import { SaleDetailsDialog } from '@/app/(dashboard)/sales/page'; // Reuse SaleDetailsDialog if appropriate, adjust path if needed

// Helper to determine if SaleDetailsDialog is defined (adjust path if needed)
const isSaleDetailsDialogAvailable = typeof SaleDetailsDialog !== 'undefined';


export default function SalesReportPage() {
  const [sales, setSales] = React.useState<SaleTransaction[]>([]);
  const [filteredSales, setFilteredSales] = React.useState<SaleTransaction[]>([]);
  const [customers, setCustomers] = React.useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedSale, setSelectedSale] = React.useState<SaleTransaction | null>(null); // For details dialog

  // Filters State
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = React.useState<Date | undefined>(undefined);
  const [customerFilter, setCustomerFilter] = React.useState<string>(''); // Customer Name/ID filter
  const [paymentMethodFilter, setPaymentMethodFilter] = React.useState<string>('all'); // Payment method filter

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [salesData, customerData] = await Promise.all([
          getSales(), // Fetch all sales initially
          getCustomers(),
        ]);
        setSales(salesData);
        setFilteredSales(salesData); // Initially show all

        const customerMap = new Map<string, string>();
        customerData.forEach((c) => customerMap.set(c.id, c.name));
        setCustomers(customerMap);
      } catch (error) {
        console.error("Failed to fetch sales report data:", error);
        // Handle error (e.g., show toast)
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Filtering Logic ---
  React.useEffect(() => {
    let results = sales;

    // Filter by Date Range
    if (dateFrom) {
        const startOfDay = new Date(dateFrom);
        startOfDay.setHours(0, 0, 0, 0);
        results = results.filter(sale => new Date(sale.date) >= startOfDay);
    }
     if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        results = results.filter(sale => new Date(sale.date) <= endOfDay);
     }

    // Filter by Customer Name/ID (if customer map is ready)
     if (customerFilter.trim() && customers.size > 0) {
         const lowerFilter = customerFilter.toLowerCase();
         results = results.filter(sale => {
             const customerName = sale.customerId ? customers.get(sale.customerId)?.toLowerCase() : 'عميل نقدي';
             return customerName?.includes(lowerFilter) || sale.customerId?.toLowerCase().includes(lowerFilter) || sale.id.toLowerCase().includes(lowerFilter);
         });
     }

     // Filter by Payment Method
     if (paymentMethodFilter !== 'all') {
         results = results.filter(sale => sale.paymentMethod === paymentMethodFilter);
     }


    setFilteredSales(results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())); // Sort by date desc
  }, [sales, dateFrom, dateTo, customerFilter, paymentMethodFilter, customers]);

  const totalFilteredSalesAmount = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);


  const resetFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setCustomerFilter('');
    setPaymentMethodFilter('all');
  };

  return (
     // Wrap with Dialog provider if SaleDetailsDialog is used
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <HandCoins className="w-6 h-6" />
          تقرير المبيعات
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
                                 حدد معايير التصفية لعرض المبيعات.
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
                             <div className="grid grid-cols-2 items-center gap-4">
                                 <Label htmlFor="customerFilter">العميل</Label>
                                 <Input id="customerFilter" placeholder="اسم أو كود..." className="h-8" value={customerFilter} onChange={e => setCustomerFilter(e.target.value)} />
                             </div>
                              <div className="grid grid-cols-2 items-center gap-4">
                                 <Label htmlFor="paymentMethodFilter">طريقة الدفع</Label>
                                  <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                                    <SelectTrigger className="h-8">
                                        <SelectValue placeholder="الكل" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">الكل</SelectItem>
                                        <SelectItem value="cash">نقداً</SelectItem>
                                        <SelectItem value="card">بطاقة</SelectItem>
                                        <SelectItem value="debt">آجل</SelectItem>
                                    </SelectContent>
                                </Select>
                             </div>
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

      <Card>
        <CardHeader>
          <CardTitle>ملخص المبيعات (الفترة المحددة)</CardTitle>
          <CardDescription>إجمالي المبيعات وعدد الفواتير حسب الفلاتر المطبقة.</CardDescription>
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
                <p className="text-sm text-muted-foreground">عدد الفواتير</p>
                <p className="text-2xl font-bold">{filteredSales.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي قيمة المبيعات</p>
                <p className="text-2xl font-bold">{totalFilteredSalesAmount.toFixed(2)} ر.س</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تفاصيل فواتير المبيعات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>التاريخ والوقت</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>إجمالي المبلغ (ر.س)</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                       <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredSales.length > 0 ? (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.id.substring(0, 8)}...</TableCell>
                      <TableCell>{sale.customerId ? (customers.get(sale.customerId) || sale.customerId) : 'عميل نقدي'}</TableCell>
                      <TableCell>{format(new Date(sale.date), 'dd/MM/yyyy HH:mm', { locale: arSA })}</TableCell>
                      <TableCell>{sale.paymentMethod}</TableCell> {/* TODO: Enhance display */}
                      <TableCell>{sale.totalAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                           {isSaleDetailsDialogAvailable ? (
                              <Popover> {/* Use Popover for quick view or Dialog for full details */}
                                  <PopoverTrigger asChild>
                                       <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => setSelectedSale(sale)}>
                                         <Eye className="h-4 w-4" />
                                       </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-96">
                                      {/* Render a compact version of sale details here or link to full dialog */}
                                      <p>تفاصيل سريعة للفاتورة {sale.id.substring(0,6)}...</p>
                                      <p>الإجمالي: {sale.totalAmount.toFixed(2)}</p>
                                      {/* Consider adding a button to open full SaleDetailsDialog */}
                                  </PopoverContent>
                              </Popover>
                           ) : (
                               <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => alert(`عرض تفاصيل الفاتورة ${sale.id}`)}>
                                 <Eye className="h-4 w-4" />
                               </Button>
                           )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      لا توجد فواتير مبيعات تطابق الفلاتر المحددة.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
           {/* Add Pagination if needed */}
        </CardContent>
      </Card>

       {/* Full Sale Details Dialog - Requires Dialog provider */}
        {isSaleDetailsDialogAvailable && selectedSale && (
            <SaleDetailsDialog
                sale={selectedSale}
                customerName={selectedSale?.customerId ? customers.get(selectedSale.customerId) : undefined}
                onClose={() => setSelectedSale(null)}
            />
        )}
    </div>
  );
}

// Optional: Define SaleDetailsDialog here if not importing from sales/page.tsx
// Ensure it's wrapped in appropriate Dialog components if defined locally.
// Example (minimalistic):
/*
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface MinimalSaleDetailsDialogProps {
    sale: SaleTransaction | null;
    customerName?: string;
    onClose: () => void;
}

function MinimalSaleDetailsDialog({ sale, customerName, onClose }: MinimalSaleDetailsDialogProps) {
     if (!sale) return null;
    return (
        <Dialog open={!!sale} onOpenChange={(open) => !open && onClose()}>
             <DialogContent>
                 <DialogHeader>
                     <DialogTitle>تفاصيل الفاتورة: {sale.id}</DialogTitle>
                 </DialogHeader>
                 <div>
                     <p>العميل: {customerName || 'نقدي'}</p>
                     <p>الإجمالي: {sale.totalAmount.toFixed(2)}</p>
                     {/* Add more details */}
                 </div>
                 <DialogFooter>
                    <DialogClose asChild>
                         <Button variant="outline" onClick={onClose}>إغلاق</Button>
                    </DialogClose>
                 </DialogFooter>
             </DialogContent>
         </Dialog>
    );
}
// Remember to conditionally render this or the imported one based on isSaleDetailsDialogAvailable
*/

