'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Import useRouter
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  Package,
  ShoppingCart,
  Users,
  Receipt,
  Truck, // For Purchases
  Archive, // For Inventory
  Landmark, // For Treasury (keep for general finance concept if needed)
  Banknote, // Use Banknote specifically for Treasury/Accounts page
  Settings,
  LogOut,
  Pill, // For Products
  LineChart, // For Reports
  User as UserIcon, // Renamed User to UserIcon to avoid conflict
  Building2, // For Suppliers (replaced Building)
  HandCoins, // For Sales (replaced Receipt)
  Gauge, // For Dashboard (replaced Home)
  Warehouse as WarehouseIcon, // Keep for Inventory link if separate
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/use-cart';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { useAuthStore, hasRole } from '@/store/auth-store'; // Import auth store and helper
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import type { UserRole } from '@/lib/types';
import { syncService } from '@/services/syncService';

interface NavItem {
  href: string;
  icon?: React.ElementType; // Icon is now optional
  label: string;
  badge?: boolean;
  requiredRoles?: UserRole[]; // Add roles required to see this item
}

// Sidebar Navigation Items with Role Restrictions
const mainNavItems: NavItem[] = [
  { href: '/dashboard', icon: Gauge, label: 'لوحة التحكم' }, // All authenticated users
  { href: '/pos', icon: ShoppingCart, label: 'نقطة البيع', badge: true, requiredRoles: ['admin', 'manager', 'seller'] },
  { href: '/products', icon: Pill, label: 'الأصناف', requiredRoles: ['admin', 'manager'] },
  { href: '/purchases', icon: Truck, label: 'المشتريات', requiredRoles: ['admin', 'manager', 'accountant'] },
  { href: '/suppliers', icon: Building2, label: 'الموردين', requiredRoles: ['admin', 'manager', 'accountant'] },
  { href: '/customers', icon: UserIcon, label: 'العملاء', requiredRoles: ['admin', 'manager', 'seller'] },
  { href: '/sales', icon: HandCoins, label: 'فواتير البيع', requiredRoles: ['admin', 'manager', 'seller', 'accountant'] },
  { href: '/inventory', icon: WarehouseIcon, label: 'المخازن والمخزون', requiredRoles: ['admin', 'manager'] }, // Combined inventory/warehouse management
];

// Reports Navigation Items (for Accordion) with Role Restrictions
const reportNavItems: NavItem[] = [
  { href: '/reports/sales', label: 'تقرير المبيعات', requiredRoles: ['admin', 'manager', 'accountant'] },
  { href: '/reports/profit-loss', label: 'تقرير الأرباح والخسائر', requiredRoles: ['admin', 'manager', 'accountant'] },
  { href: '/reports/debts', label: 'تقرير المديونيات', requiredRoles: ['admin', 'manager', 'accountant'] },
  { href: '/reports/inventory', label: 'تقرير المخزون', requiredRoles: ['admin', 'manager'] },
];


const settingsNavItems: NavItem[] = [
  { href: '/settings', icon: Settings, label: 'الإعدادات العامة', requiredRoles: ['admin'] },
  { href: '/users', icon: Users, label: 'المستخدمين والصلاحيات', requiredRoles: ['admin'] },
  { href: '/treasury', icon: Banknote, label: 'الخزنة والحسابات', requiredRoles: ['admin', 'manager', 'accountant'] },
];


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter(); // Get router for navigation
  const { getItemCount } = useCart();
  const { user, logout, isAuthenticated } = useAuthStore(); // Get user, logout fn, and auth state
  const [cartItemCount, setCartItemCount] = React.useState(0);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    if (isClient && isAuthenticated) {
      syncService.startSyncScheduler();
    }
    return () => {
      syncService.stopSyncScheduler();
    };
  }, [isClient, isAuthenticated]);

  React.useEffect(() => {
    if (isClient) {
      const count = getItemCount();
      setCartItemCount(count);
    }
  }, [isClient, getItemCount, pathname]); // Update count when cart or pathname changes

  const handleLogout = () => {
    logout(); // Clear auth state
    // --- IMPORTANT: Clear any server-side session/token cookie ---
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'; // Example cookie removal
    router.replace('/'); // Redirect to login page
  };

  // Filter nav items based on user role
  const filterNavItems = (items: NavItem[]) => {
    if (!user) return []; // Don't show items if no user data
    return items.filter(item => !item.requiredRoles || hasRole(user.role, item.requiredRoles));
  };

  const filteredMainNavItems = filterNavItems(mainNavItems);
  const filteredReportNavItems = filterNavItems(reportNavItems);
  const filteredSettingsNavItems = filterNavItems(settingsNavItems);

  // Show loading skeleton or basic layout if user data is not yet available
  if (!isClient || !isAuthenticated) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        {/* Optional: Skeleton Sidebar */}
        <div className="hidden md:block w-16 shrink-0 border-r p-2 space-y-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-1/4 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }


  return (
    <SidebarProvider defaultOpen side="right">
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar collapsible="icon">
          <SidebarHeader className="p-4 items-center">
            <div className="flex items-center gap-2 flex-grow">
              <Package className="w-7 h-7 text-primary" />
              <h1 className="text-lg font-semibold text-primary whitespace-nowrap group-data-[state=expanded]:group-data-[collapsible=icon]:block group-data-[state=collapsed]:group-data-[collapsible=icon]:hidden">
                صيدليتي
              </h1>
            </div>
            <SidebarTrigger className="ml-auto group-data-[state=collapsed]:group-data-[collapsible=icon]:ml-0" />
          </SidebarHeader>
          <SidebarContent className="flex-1 overflow-y-auto">
            <SidebarMenu>
              {filteredMainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === item.href ||
                      (item.href !== '/dashboard/dashboard' && pathname.startsWith(item.href))
                    }
                    className="justify-end"
                    tooltip={item.label}
                    variant="default"
                    size="default"
                  >
                    <Link href={item.href} dir="rtl" className='w-full flex justify-between items-center relative'>
                      {item.icon && <item.icon />}
                      <span>{item.label}</span>
                      {item.badge && isClient && cartItemCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute top-1 left-1 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs group-data-[state=expanded]:group-data-[collapsible=icon]:block group-data-[state=collapsed]:group-data-[collapsible=icon]:hidden"
                          style={{ lineHeight: '1' }}
                        >
                          {/* Show number of lines in cart, not total quantity */}
                          {filteredMainNavItems.length}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Reports Accordion (only if user has access to reports) */}
              {filteredReportNavItems.length > 0 && (
                <>
                  <SidebarMenuItem className="group-data-[state=expanded]:group-data-[collapsible=icon]:block group-data-[state=collapsed]:group-data-[collapsible=icon]:hidden">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="reports" className="border-b-0">
                        <AccordionTrigger className={cn(
                          "flex items-center justify-between w-full p-2 h-8 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors",
                          pathname.startsWith('/reports') && "bg-sidebar-accent text-sidebar-accent-foreground"
                        )}>
                          <div className="flex items-center gap-2">
                            <LineChart className="h-4 w-4" />
                            <span>التقارير</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-0 pt-1 pl-5">
                          <SidebarMenu>
                            {filteredReportNavItems.map((item) => (
                              <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                  asChild
                                  isActive={pathname === item.href}
                                  className="justify-end h-7 text-xs"
                                  size="sm"
                                >
                                  <Link href={item.href} dir="rtl" className='w-full flex justify-between items-center'>
                                    <span>{item.label}</span>
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            ))}
                          </SidebarMenu>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </SidebarMenuItem>
                  {/* Tooltip for Reports when collapsed */}
                  <SidebarMenuItem className="group-data-[state=expanded]:hidden group-data-[state=collapsed]:group-data-[collapsible=icon]:block hidden">
                    <SidebarMenuButton
                      className="justify-center"
                      tooltip="التقارير"
                      isActive={pathname.startsWith('/reports')}
                    >
                      <LineChart />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}


            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="mt-auto">
            {/* Optional: Display User Info */}
            <div className="p-2 border-t text-center group-data-[state=expanded]:block hidden">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <SidebarMenu>
              {filteredSettingsNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    className="justify-end"
                    tooltip={item.label}
                    variant="default"
                    size="default"
                  >
                    <Link href={item.href} dir="rtl" className='w-full flex justify-between items-center'>
                      {item.icon && <item.icon />}
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {/* Logout Button */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="justify-end"
                  tooltip="تسجيل الخروج"
                  onClick={handleLogout} // Call handleLogout on click
                  variant="destructive"
                  size="default"
                >
                  <LogOut />
                  <span>تسجيل الخروج</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1 overflow-auto w-full">{children}</SidebarInset>
      </div>
    </SidebarProvider>
  );
}