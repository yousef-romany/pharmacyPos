
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from '@/components/ui/sidebar'; // Assuming this path is correct
import {
  Package,
  Home,
  ShoppingCart,
  Users,
  Building,
  Receipt,
  Truck, // For Purchases
  Archive, // For Inventory
  Landmark, // For Treasury
  Settings,
  LogOut,
  Pill, // For Products
  LineChart, // For Reports
  User, // For Customers (replaced Users)
  Building2, // For Suppliers (replaced Building)
  HandCoins, // For Sales (replaced Receipt)
  Gauge, // For Dashboard (replaced Home)
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/use-cart'; // Import useCart
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'; // Import Accordion
import { cn } from '@/lib/utils';

// Sidebar Navigation Items
const mainNavItems = [
  { href: '/dashboard/dashboard', icon: Gauge, label: 'لوحة التحكم' },
  { href: '/pos', icon: ShoppingCart, label: 'نقطة البيع', badge: true },
  { href: '/products', icon: Pill, label: 'الأصناف' },
  { href: '/purchases', icon: Truck, label: 'المشتريات' },
  { href: '/suppliers', icon: Building2, label: 'الموردين' },
  { href: '/customers', icon: User, label: 'العملاء' },
  { href: '/sales', icon: HandCoins, label: 'فواتير البيع' },
];

// Reports Navigation Items (for Accordion)
const reportNavItems = [
    { href: '/reports/sales', label: 'تقرير المبيعات' },
    { href: '/reports/profit-loss', label: 'تقرير الأرباح والخسائر' },
    { href: '/reports/debts', label: 'تقرير المديونيات' },
    // Add more reports here: Inventory, Expiry, etc.
];


const settingsNavItems = [
    { href: '/settings', icon: Settings, label: 'الإعدادات' },
    // Add logout functionality later
    // { href: '/logout', icon: LogOut, label: 'تسجيل الخروج' },
];


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { getItemCount } = useCart(); // Get cart item count
  const [cartItemCount, setCartItemCount] = React.useState(0);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    // Update cart count only on the client after hydration
    if (isClient) {
      setCartItemCount(getItemCount());
    }
  }, [isClient, getItemCount, pathname]); // Update when pathname changes too, in case cart updates outside layout

  return (
    <SidebarProvider defaultOpen side="right"> {/* Set side to right here */}
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar /* Removed side prop here, comes from provider */ collapsible="icon">
          <SidebarHeader className="p-4 items-center">
            <div className="flex items-center gap-2 flex-grow">
              <Package className="w-7 h-7 text-primary" />
              <h1 className="text-lg font-semibold text-primary whitespace-nowrap group-data-[state=collapsed]:group-data-[collapsible=icon]:hidden"> {/* Use state for hiding */}
                صيدليتي
              </h1>
            </div>
            <SidebarTrigger className="ml-auto group-data-[state=collapsed]:group-data-[collapsible=icon]:ml-0" /> {/* Use state for positioning */}
          </SidebarHeader>
          <SidebarContent className="flex-1 overflow-y-auto">
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild // Use asChild to pass props to the underlying Link -> a
                    isActive={
                      pathname === item.href ||
                      (item.href !== '/dashboard/dashboard' && pathname.startsWith(item.href))
                    }
                    className="justify-end" // Align content to the right
                    tooltip={item.label}
                    variant="default" // Ensure variant is passed if needed
                    size="default" // Ensure size is passed if needed
                  >
                    <Link href={item.href} dir="rtl" className='w-full flex justify-between items-center'> {/* Removed legacyBehavior */}
                        <item.icon />
                        <span>{item.label}</span>
                      {item.badge && isClient && cartItemCount > 0 && (
                         <Badge
                          variant="destructive"
                          className="absolute top-1 left-1 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs group-data-[state=collapsed]:group-data-[collapsible=icon]:hidden" // Use state for hiding
                           style={{ lineHeight: '1' }}
                        >
                          {cartItemCount}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

               {/* Reports Accordion */}
               <SidebarMenuItem className="group-data-[state=collapsed]:group-data-[collapsible=icon]:hidden"> {/* Hide accordion header when collapsed */}
                  <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="reports" className="border-b-0">
                          <AccordionTrigger className={cn(
                              "flex items-center justify-between w-full p-2 h-8 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors",
                              pathname.startsWith('/reports') && "bg-sidebar-accent text-sidebar-accent-foreground" // Highlight if a report page is active
                          )}>
                              <div className="flex items-center gap-2">
                                  <LineChart className="h-4 w-4" />
                                  <span>التقارير</span>
                              </div>
                          </AccordionTrigger>
                           <AccordionContent className="pb-0 pt-1 pl-5"> {/* Indent content */}
                              <SidebarMenu>
                                  {reportNavItems.map((item) => (
                                      <SidebarMenuItem key={item.href}>
                                          <SidebarMenuButton
                                              asChild
                                              isActive={pathname === item.href}
                                              className="justify-end h-7 text-xs" // Smaller button for sub-items
                                              size="sm"
                                              variant="ghost" // Use ghost variant for sub-items
                                          >
                                              <Link href={item.href} dir="rtl" className='w-full flex justify-between items-center'>
                                                  {/* No icon needed for sub-items? Or add specific ones */}
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
                <SidebarMenuItem className="group-data-[state=expanded]:hidden"> {/* Show only when collapsed */}
                    <SidebarMenuButton
                        className="justify-center"
                        tooltip="التقارير"
                         isActive={pathname.startsWith('/reports')}
                    >
                         <LineChart />
                         {/* No text needed, tooltip handles it */}
                    </SidebarMenuButton>
               </SidebarMenuItem>


            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="mt-auto">
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    className="justify-end" // Align content to the right
                    tooltip={item.label}
                    variant="default"
                    size="default"
                  >
                     {/* Updated Button Element structure */}
                     <Link href={item.href} dir="rtl" className='w-full flex justify-between items-center'>
                         <item.icon />
                         <span>{item.label}</span>
                     </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {/* Basic Logout Button Example */}
               <SidebarMenuItem>
                 <SidebarMenuButton
                    className="justify-end" // Align content to the right
                    tooltip="تسجيل الخروج"
                     onClick={() => alert('تسجيل الخروج غير متاح بعد.')} // Placeholder action
                     variant="destructive" // Use destructive variant
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

