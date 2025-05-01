'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-2xl font-semibold flex items-center gap-2">
        <SettingsIcon className="w-6 h-6" />
        الإعدادات
      </h2>

      <Card>
        <CardHeader>
          <CardTitle>إعدادات عامة</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            هذه الصفحة مخصصة لإعدادات التطبيق. سيتم إضافة المزيد من الخيارات هنا قريبًا.
          </p>
          {/* Add settings options here later */}
           <div className="mt-4 space-y-4">
             {/* Example Setting 1 */}
              <div className="flex items-center justify-between p-4 border rounded-md">
                <span className="font-medium">تنسيق التاريخ</span>
                 <span>DD/MM/YYYY (مثال)</span> {/* Placeholder */}
              </div>
             {/* Example Setting 2 */}
              <div className="flex items-center justify-between p-4 border rounded-md">
                <span className="font-medium">العملة الافتراضية</span>
                 <span>ريال سعودي (ر.س)</span> {/* Placeholder */}
             </div>
          </div>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>إعدادات المستخدم</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            إدارة معلومات المستخدم وتفضيلاته.
          </p>
           {/* Add user settings here */}
       </CardContent>
      </Card>
    </div>
  );
}
