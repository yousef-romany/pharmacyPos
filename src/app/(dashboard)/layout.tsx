
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/use-cart'; // Import useCart

// Sidebar Navigation Items
const sidebarNavItems = [
  { href: '/dashboard/dashboard', icon: Home, label: 'لوحة التحكم' },
  { href: '/pos', icon: ShoppingCart, label: 'نقطة البيع', badge: true },
  { href: '/products', icon: Pill, label: 'الأصناف' },
  { href: '/purchases', icon: Truck, label: 'المشتريات' }, // Moved Purchases here
  { href: '/suppliers', icon: Building, label: 'الموردين' },
  { href: '/customers', icon: Users, label: 'العملاء' },
  { href: '/sales', icon: Receipt, label: 'فواتير البيع' },
  // { href: '/inventory', icon: Archive, label: 'المخزون' }, // Keep inventory under settings link for now
  // { href: '/treasury', icon: Landmark, label: 'الخزنة' }, // Keep treasury under settings link for now
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
              {sidebarNavItems.map((item) => (
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
                     <Link href={item.href}>
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
