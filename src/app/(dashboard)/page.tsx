'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, Package, ShoppingCart, Truck } from 'lucide-react';
import { getProducts, getSuppliers, getCustomers, getSales, getPurchases } from '@/lib/data'; // Import data functions

// Define a simple type for dashboard stats
type DashboardStat = {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
};

export default function DashboardOverviewPage() {
  const [stats, setStats] = React.useState<DashboardStat[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadStats() {
      setIsLoading(true);
      try {
        // Fetch data in parallel (using dummy data for now for sales/purchases)
        const [products, suppliers, customers, sales, purchases] = await Promise.all([
          getProducts(),
          getSuppliers(),
          getCustomers(),
          // Replace with actual getSales() and getPurchases() when implemented fully
          Promise.resolve([{ totalAmount: 52.00 }, { totalAmount: 31.00 }, {totalAmount: 36.75}]), // Dummy sales
          Promise.resolve([{ totalAmount: 2250.00 }, { totalAmount: 2250.00 }]), // Dummy purchases
        ]);

        const totalSalesValue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const totalPurchaseValue = purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);

        const loadedStats: DashboardStat[] = [
          { title: 'إجمالي المبيعات', value: `${totalSalesValue.toFixed(2)} ر.س`, icon: DollarSign, description: 'قيمة الفواتير المباعة' },
          { title: 'إجمالي المشتريات', value: `${totalPurchaseValue.toFixed(2)} ر.س`, icon: Truck, description: 'قيمة الفواتير المشتراة' },
          { title: 'عدد المنتجات', value: products.length, icon: Package, description: 'الأصناف المتوفرة في المخزون' },
          { title: 'عدد العملاء', value: customers.length, icon: Users, description: 'العملاء المسجلون' },
          { title: 'عدد الموردين', value: suppliers.length, icon: ShoppingCart, description: 'الموردون المسجلون' },

        ];
        setStats(loadedStats);
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
        // Handle error appropriately, maybe show a toast
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-2xl font-semibold">لوحة التحكم الرئيسية</h2>

      {isLoading ? (
        <p>جاري تحميل الإحصائيات...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.description && (
                  <p className="text-xs text-muted-foreground pt-1">
                    {stat.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add more sections later, like recent activity, charts, etc. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <Card>
           <CardHeader>
             <CardTitle>النشاط الأخير</CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-muted-foreground">سيتم عرض آخر العمليات هنا...</p>
             {/* Example: List recent sales/purchases */}
           </CardContent>
         </Card>
         <Card>
           <CardHeader>
             <CardTitle>المنتجات الأكثر مبيعًا</CardTitle>
           </CardHeader>
           <CardContent>
              <p className="text-muted-foreground">سيتم عرض رسم بياني هنا...</p>
             {/* Example: Bar chart of top selling products */}
           </CardContent>
         </Card>
      </div>
    </div>
  );
}
