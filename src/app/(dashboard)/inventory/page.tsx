
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Archive, Package } from 'lucide-react'; // Use relevant icons

export default function InventoryPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-2xl font-semibold flex items-center gap-2">
        <Archive className="w-6 h-6" />
        إدارة المخزون
      </h2>

      <Card>
        <CardHeader>
          <CardTitle>نظرة عامة على المخزون</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            سيتم عرض ملخص لحالة المخزون هنا، مثل قيمة المخزون الإجمالية، عدد الأصناف، الأصناف منتهية الصلاحية أو التي قاربت على الانتهاء.
          </p>
          {/* Placeholder for inventory overview stats */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="border rounded-md p-4 text-center">
                <p className="text-sm text-muted-foreground">قيمة المخزون</p>
                <p className="text-xl font-bold">(لاحقاً)</p>
             </div>
              <div className="border rounded-md p-4 text-center">
                <p className="text-sm text-muted-foreground">عدد الأصناف</p>
                <p className="text-xl font-bold">(لاحقاً)</p>
             </div>
              <div className="border rounded-md p-4 text-center">
                <p className="text-sm text-muted-foreground">أصناف قاربت على الانتهاء</p>
                <p className="text-xl font-bold">(لاحقاً)</p>
             </div>
          </div>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>عمليات المخزون</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            روابط لعمليات المخزون مثل الجرد، تسوية الكميات، نقل المخزون (إذا كان هناك أكثر من مخزن).
          </p>
           {/* Placeholder for inventory actions */}
           <div className="mt-4 border rounded-md p-10 text-center text-muted-foreground">
             (سيتم بناء هذه الواجهة لاحقاً)
           </div>
       </CardContent>
      </Card>
    </div>
  );
}
