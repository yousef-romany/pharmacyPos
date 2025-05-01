
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Landmark, Users } from 'lucide-react';
import { getCustomers } from '@/lib/data';
import type { Customer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DebtsReportPage() {
  const [debtors, setDebtors] = React.useState<Customer[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchDebtors = async () => {
      setIsLoading(true);
      try {
        const allCustomers = await getCustomers();
        const debtorsList = allCustomers.filter(customer => (customer.balance ?? 0) < 0);
        setDebtors(debtorsList.sort((a, b) => (a.balance ?? 0) - (b.balance ?? 0))); // Sort by most debt first
      } catch (error) {
        console.error("Failed to fetch customer debt data:", error);
        // Handle error (e.g., show toast)
      } finally {
        setIsLoading(false);
      }
    };

    fetchDebtors();
  }, []);

  const totalDebt = debtors.reduce((sum, customer) => sum + Math.abs(customer.balance ?? 0), 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-2xl font-semibold flex items-center gap-2">
        <Landmark className="w-6 h-6" />
        تقرير المديونيات
      </h2>

      <Card>
        <CardHeader>
          <CardTitle>ملخص المديونيات</CardTitle>
          <CardDescription>نظرة عامة على إجمالي مديونيات العملاء.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-1/3" />
          ) : (
            <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                    <p className="text-sm text-muted-foreground">عدد العملاء المدينين</p>
                    <p className="text-2xl font-bold">{debtors.length}</p>
                </div>
                 <div>
                    <p className="text-sm text-muted-foreground">إجمالي المديونية</p>
                    <p className="text-2xl font-bold text-red-600">{totalDebt.toFixed(2)} ر.س</p>
                 </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تفاصيل مديونيات العملاء</CardTitle>
           <CardDescription>قائمة بالعملاء الذين لديهم رصيد سالب (مديونية).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم العميل</TableHead>
                  <TableHead>رقم الهاتف</TableHead>
                  <TableHead>الرصيد (المديونية)</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : debtors.length > 0 ? (
                  debtors.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell className={cn("font-semibold", (customer.balance ?? 0) < 0 ? "text-red-600" : "text-muted-foreground")}>
                        {(customer.balance ?? 0).toFixed(2)} ر.س
                      </TableCell>
                      <TableCell>
                         <Button variant="outline" size="sm" asChild>
                            <Link href={`/customers?search=${customer.id}`}>عرض</Link>
                         </Button>
                         {/* Add action for payment collection later */}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      لا يوجد عملاء لديهم مديونيات حالياً.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
           {/* Add Pagination if needed */}
        </CardContent>
      </Card>
    </div>
  );
}
