
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Users, Package, ShoppingCart, Truck, AlertTriangle, Pill, Baby, SprayCan, Activity, CalendarClock, CalendarX, MinusCircle } from 'lucide-react'; // Added expiry/stock icons
import { getProducts, getSuppliers, getCustomers, getSales, getPurchases, getProductById, getProductsNearingExpiry, getExpiredProducts } from '@/lib/data'; // Import data functions including expiry checks
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { Product, SaleTransactionItem, ProductExpiryInfo } from '@/lib/types';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

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
    minStockLevel?: number; // Include min level for context
}

// Helper to get icon name from component
function getIconName(IconComponent?: React.ComponentType<any>): string {
    if (!IconComponent) return 'Unknown';
    // Example mappings - adjust based on actual icons used in Product data
    if (IconComponent === Pill) return 'Pill';
    if (IconComponent === Baby) return 'Baby';
    if (IconComponent === SprayCan) return 'SprayCan';
    if (IconComponent === Activity) return 'Activity';
    // Add more specific checks if needed

    // Fallback using component name (might be less reliable after minification)
    const nameMatch = IconComponent.displayName || IconComponent.name;
    if (nameMatch) return nameMatch;

    return 'Unknown'; // Default fallback
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
    const [expiringSoonProducts, setExpiringSoonProducts] = React.useState<ProductExpiryInfo[]>([]);
    const [expiredProducts, setExpiredProducts] = React.useState<ProductExpiryInfo[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
    const NEAR_EXPIRY_DAYS = 60; // Alert for products expiring within 60 days

    React.useEffect(() => {
        async function loadDashboardData() {
            setIsLoading(true);
            try {
                const [products, suppliers, customers, sales, purchases, nearingExpiry, expired] = await Promise.all([
                    getProducts(),
                    getSuppliers(),
                    getCustomers(),
                    getSales(),
                    getPurchases(),
                    getProductsNearingExpiry(NEAR_EXPIRY_DAYS), // Fetch products expiring soon
                    getExpiredProducts(), // Fetch expired products
                ]);

                // --- Calculate Stats ---
                const totalSalesValue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
                const totalPurchaseValue = purchases.reduce((sum, purchase) => sum + Number(purchase.totalAmount || 0), 0);

                console.log('DEBUG: totalSalesValue', totalSalesValue, typeof totalSalesValue);
                console.log('DEBUG: totalPurchaseValue', totalPurchaseValue, typeof totalPurchaseValue);

                const loadedStats: DashboardStat[] = [
                    { title: 'إجمالي المبيعات', value: `${(typeof totalSalesValue === 'number' && !isNaN(totalSalesValue) ? totalSalesValue : 0).toFixed(2)} ج.م`, icon: DollarSign, description: `من ${sales.length} فاتورة` },
                    { title: 'إجمالي المشتريات', value: `${(typeof totalPurchaseValue === 'number' && !isNaN(totalPurchaseValue) ? totalPurchaseValue : 0).toFixed(2)} ج.م`, icon: Truck, description: `من ${purchases.length} فاتورة` },
                    { title: 'عدد المنتجات', value: products.length, icon: Package, description: 'الأصناف المتوفرة' },
                    { title: 'عدد العملاء', value: customers.length, icon: Users, description: 'العملاء المسجلون' },
                    { title: 'عدد الموردين', value: suppliers.length, icon: ShoppingCart, description: 'الموردون المسجلون' },
                ];
                setStats(loadedStats);

                // --- Calculate Category Sales ---
                const salesByCategory: { [key: string]: { totalSales: number, label: string } } = {};
                const productDetailsPromises = Array.from(new Set(sales.flatMap(s => s.items.map(i => i.productId))))
                    .map(id => getProductById(id)); // Fetch details for involved products
                const productDetailsResults = await Promise.all(productDetailsPromises);
                const productMap = new Map<string, Product | undefined>(
                    productDetailsResults.map(p => [p?.id || 'unknown', p])
                );

                sales.forEach(sale => {
                    sale.items.forEach((item: SaleTransactionItem) => {
                        const product = productMap.get(item.productId);
                        const categoryKey = product ? getIconName(product.categoryIcon) : 'Unknown';
                        const categoryLabel = categoryLabels[categoryKey] || categoryKey;
                        // Ensure price and quantity are treated as numbers
                        const price = Number(item.price || 0);
                        const quantity = Number(item.quantity || 0);
                        const amount = price * quantity;

                        if (!salesByCategory[categoryKey]) {
                            salesByCategory[categoryKey] = { totalSales: 0, label: categoryLabel };
                        }
                        salesByCategory[categoryKey].totalSales += amount;
                    });
                });

                const categoryData: CategorySalesData[] = Object.entries(salesByCategory)
                    .map(([name, data], index) => ({
                        name: name,
                        label: data.label,
                        totalSales: data.totalSales,
                        fill: COLORS[index % COLORS.length],
                    }))
                    .sort((a, b) => b.totalSales - a.totalSales) // Sort by highest sales
                    .slice(0, 5); // Take top 5

                setCategorySalesData(categoryData);

                // --- Find Low Stock Products ---
                const lowStock = products
                    .filter(p => {
                        const quantity = Number(p.quantity || 0);
                        return p.minStockLevel !== undefined && quantity <= p.minStockLevel;
                    }) // Check against minStockLevel
                    .sort((a, b) => Number(a.quantity || 0) - Number(b.quantity || 0)) // Sort by lowest quantity first
                    .map(p => ({
                        id: p.id,
                        nameAr: p.nameAr,
                        quantity: Number(p.quantity || 0),
                        minStockLevel: p.minStockLevel
                    }));
                setLowStockProducts(lowStock);

                setExpiringSoonProducts(nearingExpiry);
                setExpiredProducts(expired);

            } catch (error) {
                console.error("Failed to load dashboard data:", error);
                // Handle error appropriately (e.g., show toast message)
            } finally {
                setIsLoading(false);
            }
        }
        loadDashboardData();
    }, []); // Empty dependency array means this runs once on mount


    // Configuration for the category sales chart
    const chartConfig = React.useMemo(() => {
        const config: ChartConfig = { totalSales: { label: "إجمالي المبيعات (ج.م)" } };
        categorySalesData.forEach(cur => {
            // Use the unique 'name' as the key for config
            config[cur.name] = { label: cur.label, color: cur.fill };
        });
        return config;
    }, [categorySalesData]); // Recompute when category data changes


    // --- Reusable Alert List Component ---
    // Defined inside the main component or imported if used elsewhere
    const AlertList = ({ title, description, icon: Icon, items, itemKey, itemValueKey, itemDateKey, linkPrefix, emptyMessage, isLoading, alertType }: {
        title: string;
        description?: string;
        icon: React.ElementType;
        items: any[]; // Use specific types like LowStockProduct or ProductExpiryInfo if possible
        itemKey: string; // e.g., 'id'
        itemValueKey: string; // e.g., 'quantity' or 'daysUntilExpiry'
        itemDateKey?: string; // e.g., 'expiryDate'
        linkPrefix: string; // Base path for links (e.g., '/products')
        emptyMessage: string;
        isLoading: boolean;
        alertType: 'lowStock' | 'expiringSoon' | 'expired'; // For styling
    }) => (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${alertType === 'expired' ? 'text-red-700' : alertType === 'lowStock' ? 'text-amber-600' : 'text-orange-500'}`} />
                    {title}
                </CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
                {isLoading ? (
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ) : items.length > 0 ? (
                    <>
                        <div className="flex-1 overflow-y-auto max-h-[200px]"> {/* Limit height and make scrollable */}
                            <ul className="space-y-2 text-sm pr-2"> {/* Add padding for scrollbar */}
                                {items.map((item) => (
                                    <li key={item[itemKey]} className="flex justify-between items-center border-b pb-1.5 gap-2">
                                        <Link href={`${linkPrefix}?search=${item[itemKey]}`} className="hover:underline hover:text-primary truncate pr-2 flex-1">
                                            {item.nameAr || 'اسم غير متوفر'} {/* Fallback name */}
                                        </Link>
                                        <span className={`font-semibold whitespace-nowrap ${alertType === 'expired' ? 'text-red-700' : alertType === 'lowStock' ? 'text-amber-600' : 'text-orange-500'}`}>
                                            {/* Display value based on alert type */}
                                            {alertType === 'lowStock' && `${item[itemValueKey]} (الحد: ${item.minStockLevel ?? '-'})`}
                                            {alertType === 'expiringSoon' && `خلال ${item[itemValueKey]} يوم`}
                                            {alertType === 'expired' && `منذ ${Math.abs(item[itemValueKey])} يوم`}
                                        </span>
                                        {itemDateKey && item[itemDateKey] && (
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {/* Ensure date is valid before formatting */}
                                                {new Date(item[itemDateKey]) instanceof Date && !isNaN(new Date(item[itemDateKey]).valueOf())
                                                    ? format(new Date(item[itemDateKey]), 'dd/MM/yyyy', { locale: arSA })
                                                    : '-'
                                                }
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <Button variant="outline" size="sm" className="mt-4 self-start" asChild>
                            <Link href={linkPrefix}>عرض الكل</Link>
                        </Button>
                    </>
                ) : (
                    <p className="text-muted-foreground text-center py-10 flex-1 flex items-center justify-center">{emptyMessage}</p>
                )}
            </CardContent>
        </Card>
    );


    return (
        <div className="p-4 md:p-6 space-y-6">
            <h2 className="text-2xl font-semibold">لوحة التحكم الرئيسية</h2>

            {/* Stats Cards Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                        <Card key={index}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-4 w-2/4" />
                                <Skeleton className="h-4 w-4 rounded-full" />
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
                                {/* Render icon safely */}
                                {React.createElement(stat.icon, { className: "h-4 w-4 text-muted-foreground" })}
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


            {/* Charts and Alert Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Sales Chart */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>المبيعات حسب الفئة (أعلى 5)</CardTitle>
                        <CardDescription>توزيع إجمالي المبيعات على فئات المنتجات.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-0">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-full min-h-[250px]"> {/* Ensure skeleton has height */}
                                <Skeleton className="w-48 h-48 rounded-full" />
                            </div>
                        ) : categorySalesData.length > 0 ? (
                            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="label" />} />
                                        <Pie
                                            data={categorySalesData}
                                            dataKey="totalSales"
                                            nameKey="label" // Use the display label for the chart legend/tooltip
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            innerRadius={60}
                                            paddingAngle={2}
                                            labelLine={false}
                                        >
                                            {categorySalesData.map((entry) => (
                                                <Cell key={`cell-${entry.name}`} fill={entry.fill} /> // Use unique name for key
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        ) : (
                            <p className="text-muted-foreground text-center py-10 flex-1 flex items-center justify-center min-h-[250px]">لا توجد بيانات مبيعات لعرضها.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Low Stock Products */}
                <AlertList
                    title="أصناف قاربت على النفاد"
                    description={`المنتجات التي كميتها أقل من أو تساوي حدها الأدنى.`}
                    icon={MinusCircle}
                    items={lowStockProducts}
                    itemKey="id"
                    itemValueKey="quantity"
                    linkPrefix="/products"
                    emptyMessage="لا توجد منتجات بقرب النفاد."
                    isLoading={isLoading}
                    alertType="lowStock"
                />
            </div>

            {/* Expiry Alerts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expiring Soon Products */}
                <AlertList
                    title={`منتجات قاربت على الانتهاء (خلال ${NEAR_EXPIRY_DAYS} يوم)`}
                    icon={CalendarClock}
                    items={expiringSoonProducts}
                    itemKey="id"
                    itemValueKey="daysUntilExpiry"
                    itemDateKey="expiryDate" // Pass the key for the expiry date
                    linkPrefix="/products"
                    emptyMessage={`لا توجد منتجات ستنتهي خلال ${NEAR_EXPIRY_DAYS} يوم.`}
                    isLoading={isLoading}
                    alertType="expiringSoon"
                />

                {/* Expired Products */}
                <AlertList
                    title="منتجات منتهية الصلاحية"
                    icon={CalendarX}
                    items={expiredProducts}
                    itemKey="id"
                    itemValueKey="daysUntilExpiry"
                    itemDateKey="expiryDate" // Pass the key for the expiry date
                    linkPrefix="/products"
                    emptyMessage="لا توجد منتجات منتهية الصلاحية."
                    isLoading={isLoading}
                    alertType="expired"
                />
            </div>
        </div>
    );
}


