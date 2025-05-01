
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark, DollarSign, ArrowRightLeft } from 'lucide-react'; // Use relevant icons

export default function TreasuryPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-2xl font-semibold flex items-center gap-2">
        <Landmark className="w-6 h-6" />
        إدارة الخزنة
      </h2>

      <Card>
        <CardHeader>
          <CardTitle>رصيد الخزنة الحالي</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="text-center">
             <p className="text-3xl font-bold">(سيتم حسابه لاحقاً)</p>
             <p className="text-sm text-muted-foreground">ر.س</p>
           </div>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>حركة الخزنة</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            سيتم عرض سجل لجميع عمليات الإيداع والسحب من الخزنة هنا (مثل المبيعات النقدية، المصروفات، تحويلات بنكية، إلخ).
          </p>
           {/* Placeholder for treasury transaction log */}
           <div className="mt-4 border rounded-md p-10 text-center text-muted-foreground">
             (سيتم بناء هذه الواجهة لاحقاً)
           </div>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>عمليات الخزنة</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
             <button className="flex-1 p-4 border rounded-md flex flex-col items-center justify-center hover:bg-secondary transition-colors disabled:opacity-50" disabled>
                <DollarSign className="w-8 h-8 mb-2 text-green-600"/>
                <span className="font-medium">إيداع</span>
                <span className="text-xs text-muted-foreground">(لاحقاً)</span>
             </button>
             <button className="flex-1 p-4 border rounded-md flex flex-col items-center justify-center hover:bg-secondary transition-colors disabled:opacity-50" disabled>
                <DollarSign className="w-8 h-8 mb-2 text-red-600"/>
                 <span className="font-medium">سحب / مصروفات</span>
                 <span className="text-xs text-muted-foreground">(لاحقاً)</span>
             </button>
              <button className="flex-1 p-4 border rounded-md flex flex-col items-center justify-center hover:bg-secondary transition-colors disabled:opacity-50" disabled>
                <ArrowRightLeft className="w-8 h-8 mb-2 text-blue-600"/>
                 <span className="font-medium">تحويل</span>
                 <span className="text-xs text-muted-foreground">(لاحقاً)</span>
             </button>
        </CardContent>
      </Card>
    </div>
  );
}
