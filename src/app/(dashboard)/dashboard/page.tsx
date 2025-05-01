'use client';

import * as React from 'react';
import Link from 'next/link'; // Import Link
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Users, Package, ShoppingCart, Truck, AlertTriangle, Pill, Baby, SprayCan, Activity } from 'lucide-react'; // Added product category icons
import { getProducts, getSuppliers, getCustomers, getSales, getPurchases } from '@/lib/data'; // Import data functions
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { Button } from '@/components/ui/button'; // Import Button for link

// Define a simple type for dashboard stats
type DashboardStat = {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
};

// Define types for chart data
interface CategorySalesData {
    name: string; // Category name (should be unique)
    label: string; // Display label (Arabic)
    totalSales: number;
    fill: string; // Color for the pie slice
}

interface LowStockProduct {
    id: string;
    nameAr: string;
    quantity: number;
}

// Helper to get icon name from component
function getIconName(IconComponent?: React.ComponentType<any>): string {
    if (!IconComponent) return 'Unknown';
    const component = IconComponent as any;
    if (component.displayName) return component.displayName;
    if (component.name) return component.name;

    // Fallback check for specific Lucide icons
    if (IconComponent === Pill) return 'Pill';
    if (IconComponent === Baby) return 'Baby';
    if (IconComponent === SprayCan) return 'SprayCan';
    if (IconComponent === Activity) return 'Activity';

    return 'Unknown';
}


// Mapping from icon name (or component name) to Arabic label
const categoryLabels: { [key: string]: string } = {
    Pill: 'أقراص/حبوب',
    Baby: 'مستلزمات أطفال',
    SprayCan: 'بخاخ/شراب',
    Activity: 'مكملات/فيتامينات',
    Unknown: 'غير مصنف'
};


export default function DashboardOverviewPage() {
  const [stats, setStats] = React.useState<DashboardStat[]>([]);
  const [categorySalesData, setCategorySalesData] = React.useState<CategorySalesData[]>([]);
   const [lowStockProducts, setLowStockProducts] = React.useState<LowStockProduct[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

   const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];


  React.useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [products, suppliers, customers, sales, purchases] = await Promise.all([
          getProducts(),
          getSuppliers(),
          getCustomers(),
          getSales(), // Using actual data now
          getPurchases(), // Using actual data now
        ]);

        // --- Calculate Stats ---
        const totalSalesValue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const totalPurchaseValue = purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);

        const loadedStats: DashboardStat[] = [
          { title: 'إجمالي المبيعات', value: `${totalSalesValue.toFixed(2)} ر.س`, icon: DollarSign, description: `من ${sales.length} فاتورة` },
          { title: 'إجمالي المشتريات', value: `${totalPurchaseValue.toFixed(2)} ر.س`, icon: Truck, description: `من ${purchases.length} فاتورة` },
          { title: 'عدد المنتجات', value: products.length, icon: Package, description: 'الأصناف المتوفرة' },
          { title: 'عدد العملاء', value: customers.length, icon: Users, description: 'العملاء المسجلون' },
          { title: 'عدد الموردين', value: suppliers.length, icon: ShoppingCart, description: 'الموردون المسجلون' },
        ];
        setStats(loadedStats);

         // --- Calculate Category Sales ---
         const salesByCategory: { [key: string]: { totalSales: number, label: string } } = {};
         const productMap = new Map(products.map(p => [p.id, p]));

         sales.forEach(sale => {
             sale.items.forEach(item => {
                 const product = productMap.get(item.productId);
                 if (product) {
                     const categoryKey = getIconName(product.categoryIcon);
                     const categoryLabel = categoryLabels[categoryKey] || categoryKey; // Get Arabic label
                     const amount = item.price * item.quantity;
                     if (!salesByCategory[categoryKey]) {
                         salesByCategory[categoryKey] = { totalSales: 0, label: categoryLabel };
                     }
                     salesByCategory[categoryKey].totalSales += amount;
                 } else {
                      // Handle cases where product might not be found (e.g., deleted product in old sale)
                      const categoryKey = 'Unknown';
                      const categoryLabel = categoryLabels[categoryKey];
                       const amount = item.price * item.quantity;
                       if (!salesByCategory[categoryKey]) {
                         salesByCategory[categoryKey] = { totalSales: 0, label: categoryLabel };
                       }
                      salesByCategory[categoryKey].totalSales += amount;
                 }
             });
         });

        const categoryData: CategorySalesData[] = Object.entries(salesByCategory)
            .map(([name, data], index) => ({
                name: name, // Keep the internal key/name
                label: data.label, // Use the Arabic label for display
                totalSales: data.totalSales,
                fill: COLORS[index % COLORS.length],
            }))
            .sort((a, b) => b.totalSales - a.totalSales) // Sort descending
            .slice(0, 5); // Take top 5 categories

        setCategorySalesData(categoryData);


        // --- Find Low Stock Products ---
         const LOW_STOCK_THRESHOLD = 10; // Example threshold
         const lowStock = products
            .filter(p => p.quantity <= LOW_STOCK_THRESHOLD)
            .sort((a,b) => a.quantity - b.quantity) // Sort by lowest quantity first
            .map(p => ({ id: p.id, nameAr: p.nameAr, quantity: p.quantity }));
        setLowStockProducts(lowStock);


      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        // Handle error appropriately
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);


   const chartConfig = {
      ...categorySalesData.reduce((acc, cur) => {
        acc[cur.name] = { label: cur.label, color: cur.fill };
        return acc;
      }, {} as Record<string, { label: string; color: string }>),
       totalSales: { label: "إجمالي المبيعات (ر.س)" } // Ensure totalSales label exists
    } as ChartConfig;



  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-2xl font-semibold">لوحة التحكم الرئيسية</h2>

      {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-2/4" />
                            <Skeleton className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-1/3 mb-2" />
                            <Skeleton className="h-3 w-3/4" />
                        </CardContent>
                    </Card>
                ))
            ) : (
                stats.map((stat, index) => (
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
                ))
            )}
        </div>


      {/* Charts and Other Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Category Sales Chart */}
         <Card className="flex flex-col">
           <CardHeader>
             <CardTitle>المبيعات حسب الفئة (أعلى 5)</CardTitle>
             <CardDescription>توزيع إجمالي المبيعات على فئات المنتجات.</CardDescription>
           </CardHeader>
           <CardContent className="flex-1 flex items-center justify-center pb-6"> {/* Center chart */}
            {isLoading ? (
                 <Skeleton className="h-60 w-full" />
            ) : categorySalesData.length > 0 ? (
             <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]"> {/* Adjusted size */}
                <PieChart>
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel indicator="dot" nameKey="totalSales" formatter={(value, name) => [`${Number(value).toFixed(2)} ر.س`, chartConfig[name]?.label || name]}/>}
                     />
                     <Pie
                        data={categorySalesData}
                        dataKey="totalSales"
                        nameKey="name" // Internal name used here
                        labelKey="label" // Use label for display in tooltip/label if needed directly
                        innerRadius={60}
                        strokeWidth={5}
                    >
                         {categorySalesData.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={entry.fill} className="focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1" />
                         ))}
                    </Pie>
                </PieChart>
             </ChartContainer>
              ) : (
                 <div className="h-60 flex items-center justify-center text-muted-foreground">لا توجد بيانات مبيعات كافية.</div>
              )}
           </CardContent>
         </Card>

          {/* Low Stock Products */}
          <Card className="flex flex-col">
           <CardHeader>
             <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive"/> أصناف قاربت على النفاد</CardTitle>
             <CardDescription>المنتجات التي كميتها أقل من أو تساوي {10}.</CardDescription>
           </CardHeader>
           <CardContent className="flex-1 flex flex-col"> {/* Use flex-col */}
             {isLoading ? (
                <div className="space-y-2 flex-1"> {/* Allow skeleton to take space */}
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            ) : lowStockProducts.length > 0 ? (
                 <div className="flex-1 overflow-y-auto max-h-[240px]"> {/* Scrollable content */}
                     <ul className="space-y-2 text-sm pr-2">
                        {lowStockProducts.map((product) => (
                            <li key={product.id} className="flex justify-between items-center border-b pb-1.5">
                                <Link href={`/products?search=${product.id}`} className="hover:underline hover:text-primary truncate pr-2"> {/* Link to products page */}
                                    {product.nameAr}
                                </Link>
                                <span className={`font-semibold whitespace-nowrap ${product.quantity <= 5 ? 'text-destructive' : 'text-amber-600'}`}>
                                    {product.quantity}
                                </span>
                            </li>
                        ))}
                    </ul>
                 </div>
                 <Button variant="outline" size="sm" className="mt-4 self-start" asChild>
                    <Link href="/products">عرض كل المنتجات</Link>
                 </Button>
            ) : (
                <p className="text-muted-foreground text-center py-10 flex-1 flex items-center justify-center">لا توجد منتجات بقرب النفاد.</p>
             )}
           </CardContent>
         </Card>
      </div>
    </div>
  );
}
