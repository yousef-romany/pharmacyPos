'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings as SettingsIcon, Landmark, Archive, Users, Warehouse as WarehouseIcon, Banknote } from 'lucide-react'; // Added Banknote for Treasury
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-2xl font-semibold flex items-center gap-2">
        <SettingsIcon className="w-6 h-6" />
        الإعدادات
      </h2>

      {/* General Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>إعدادات عامة</CardTitle>
          <CardDescription>الإعدادات الأساسية للتطبيق.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Example Setting 1 */}
            <div className="flex items-center justify-between p-4 border rounded-md">
              <span className="font-medium">تنسيق التاريخ</span>
              <span>DD/MM/YYYY (مثال)</span> {/* Placeholder */}
            </div>
            {/* Example Setting 2 */}
            <div className="flex items-center justify-between p-4 border rounded-md">
              <span className="font-medium">العملة الافتراضية</span>
              <span>جنيه مصرى (ج.م)</span> {/* Placeholder */}
            </div>
            {/* Add more general settings here */}
          </div>
        </CardContent>
      </Card>

      {/* Modules Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"> {/* Adjusted grid columns */}
        {/* Treasury Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Banknote className="w-5 h-5" /> إعدادات الخزنة والحسابات</CardTitle>
            <CardDescription>إدارة الحسابات المالية والعمليات.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">
              تكوين حسابات الخزنة، وتتبع الإيداعات والسحوبات والمصروفات. تتم الإدارة من صفحة الخزنة.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/treasury">الذهاب إلى إدارة الخزنة</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Warehouse Settings (Physical Inventory) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><WarehouseIcon className="w-5 h-5" /> إدارة المخازن</CardTitle>
            <CardDescription>إضافة وتعديل أماكن تخزين المنتجات.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">
              إدارة المخازن الفعلية التي يتم تخزين المنتجات بها وتحديد المخزن الافتراضي. تتم الإدارة من صفحة المخزون.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/inventory">الذهاب إلى إدارة المخازن</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Inventory Settings (Alerts etc.) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Archive className="w-5 h-5" /> إعدادات المخزون</CardTitle>
            <CardDescription>إدارة تنبيهات المخزون العامة.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">
              إعدادات حدود التنبيه لنقص المخزون وتواريخ الصلاحية. (يتم عرضها في تقرير المخزون)
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/inventory">الذهاب إلى المخزون</Link>
            </Button>
          </CardContent>
        </Card>

        {/* User Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> إدارة المستخدمين</CardTitle>
            <CardDescription>إدارة المستخدمين وأدوارهم وصلاحياتهم.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">
              إنشاء المستخدمين، تعيين الأدوار (مدير، بائع)، وتحديد الصلاحيات لكل دور داخل النظام.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/users">الذهاب إلى إدارة المستخدمين</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}