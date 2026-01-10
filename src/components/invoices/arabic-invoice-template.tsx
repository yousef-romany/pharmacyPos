'use client';

import * as React from 'react';
import type { SaleTransaction, Customer, Product, InvoiceLanguage } from '@/lib/types';
import { safeParseFloat } from '@/lib/utils';

interface ArabicInvoiceTemplateProps {
    sale: SaleTransaction;
    customer?: Customer;
    products: Product[];
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    companyEmail: string;
}

export function ArabicInvoiceTemplate({
    sale,
    customer,
    products,
    companyName,
    companyAddress,
    companyPhone,
    companyEmail
}: ArabicInvoiceTemplateProps) {
    // Pre-calculate all values
    const totalAmount = safeParseFloat(sale.totalAmount);
    const amountPaid = safeParseFloat(sale.amountPaid);
    const remainingAmount = totalAmount - amountPaid;
    
    // Get product names efficiently
    const productMap = new Map(products.map(p => [p.id, p] as [string, Product]));
    
    // Calculate items with totals
    const invoiceItems = sale.items.map(item => {
        const product = productMap.get(item.productId);
        const productName = product?.nameAr || `منتج (${item.productId.substring(0, 6)})`;
        const quantity = safeParseFloat(item.quantity);
        const price = safeParseFloat(item.price);
        const total = quantity * price;
        return {
            productName,
            unitType: item.soldUnitType === 'sub' ? (product?.subUnitType || 'فرعية') : (product?.unitType || 'رئيسية'),
            quantity,
            price,
            total
        };
    });

    const itemsTotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);

    return (
        <div 
            dir="rtl" 
            className="invoice-container bg-white p-8 max-w-4xl mx-auto font-['Cairo','Segoe UI']"
            style={{ fontFamily: "'Cairo', 'Segoe UI', sans-serif" }}
        >
            {/* Header Section */}
            <div className="border-b-2 border-gray-800 pb-6 mb-6">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{companyName}</h1>
                        <p className="text-sm text-gray-600">{companyAddress}</p>
                        <div className="flex gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1">
                                <span className="font-semibold">هاتف:</span>
                                <span>{companyPhone}</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="font-semibold">بريد:</span>
                                <span>{companyEmail}</span>
                            </span>
                        </div>
                    </div>
                    <div className="text-left">
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">فاتورة ضريبية</h2>
                        <p className="text-lg text-gray-700">Tax Invoice</p>
                        <div className="mt-3 text-sm text-gray-600">
                            <p><span className="font-semibold">رقم الفاتورة:</span> {sale.invoiceNumber || sale.id}</p>
                            <p><span className="font-semibold">التاريخ:</span> {new Date(sale.date).toLocaleDateString('ar-EG')}</p>
                            <p><span className="font-semibold">الوقت:</span> {new Date(sale.date).toLocaleTimeString('ar-EG')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Customer Info */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">بيانات العميل</p>
                        <p className="font-semibold text-lg">{customer?.name || 'عميل نقدي'}</p>
                        {customer?.address && <p className="text-sm text-gray-700 mt-1">{customer.address}</p>}
                        {customer?.phone && <p className="text-sm text-gray-700">{customer.phone}</p>}
                    </div>
                    <div className="text-left">
                        <p className="text-sm text-gray-600 mb-1">طريقة الدفع</p>
                        <p className="font-semibold text-lg">
                            {sale.paymentMethod === 'cash' && 'نقداً'}
                            {sale.paymentMethod === 'card' && 'بطاقة ائتمانية'}
                            {sale.paymentMethod === 'debt' && 'آجل'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-800 text-white">
                            <th className="border border-gray-700 p-3 text-right font-semibold">م</th>
                            <th className="border border-gray-700 p-3 text-right font-semibold">المنتج</th>
                            <th className="border border-gray-700 p-3 text-center font-semibold">الوحدة</th>
                            <th className="border border-gray-700 p-3 text-center font-semibold">الكمية</th>
                            <th className="border border-gray-700 p-3 text-center font-semibold">السعر (ج.م)</th>
                            <th className="border border-gray-700 p-3 text-center font-semibold">الإجمالي (ج.م)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoiceItems.map((item, index) => (
                            <tr key={`${sale.id}-${index}`} className="border-b border-gray-200">
                                <td className="p-3 text-center text-gray-600">{index + 1}</td>
                                <td className="p-3 text-right font-semibold">{item.productName}</td>
                                <td className="p-3 text-center text-gray-700">{item.unitType}</td>
                                <td className="p-3 text-center">{item.quantity}</td>
                                <td className="p-3 text-center">{item.price.toFixed(2)}</td>
                                <td className="p-3 text-center font-semibold">{item.total.toFixed(2)}</td>
                            </tr>
                        ))}
                        <tr className="bg-gray-100 font-bold">
                            <td colSpan={5} className="p-3 text-right">الإجمالي</td>
                            <td className="p-3 text-center">{itemsTotal.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Totals Section */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="max-w-md mr-auto">
                    <div className="flex justify-between py-2 border-b border-gray-300">
                        <span className="text-gray-700">الإجمالي:</span>
                        <span className="font-semibold">{itemsTotal.toFixed(2)} ج.م</span>
                    </div>
                    {safeParseFloat(sale.appliedInsuranceDiscountRate) > 0 && (
                        <div className="flex justify-between py-2 border-b border-gray-300">
                            <span className="text-gray-700">خصم التأمين ({safeParseFloat(sale.appliedInsuranceDiscountRate)}%):</span>
                            <span className="font-semibold text-green-700">
                                -{(itemsTotal * safeParseFloat(sale.appliedInsuranceDiscountRate) / 100).toFixed(2)} ج.م
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between py-2 border-b border-gray-300">
                        <span className="text-gray-700">المبلغ المدفوع:</span>
                        <span className="font-semibold">{amountPaid.toFixed(2)} ج.م</span>
                    </div>
                    {remainingAmount > 0 && (
                        <div className="flex justify-between py-2 border-b border-gray-300">
                            <span className="text-red-700 font-semibold">المبلغ المتبقي (آجل):</span>
                            <span className="font-bold text-red-700">{remainingAmount.toFixed(2)} ج.م</span>
                        </div>
                    )}
                    {remainingAmount < 0 && (
                        <div className="flex justify-between py-2 border-b border-gray-300">
                            <span className="text-green-700 font-semibold">المبلغ المرجع:</span>
                            <span className="font-bold text-green-700">{Math.abs(remainingAmount).toFixed(2)} ج.م</span>
                        </div>
                    )}
                    <div className="flex justify-between py-3 bg-gray-800 text-white px-3 rounded mt-2">
                        <span className="font-bold text-lg">الإجمالي النهائي:</span>
                        <span className="font-bold text-xl">{totalAmount.toFixed(2)} ج.م</span>
                    </div>
                </div>
            </div>

            {/* Footer Section */}
            <div className="border-t-2 border-gray-800 pt-6 mt-8">
                <div className="grid grid-cols-3 gap-8">
                    <div className="text-center">
                        <p className="text-sm text-gray-600 mb-4">توقيع العميل</p>
                        <div className="h-16 border-b border-gray-400"></div>
                        <p className="text-xs text-gray-500 mt-2">التوقيع والختم</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-600 mb-4">توقيع الصيدلي</p>
                        <div className="h-16 border-b border-gray-400"></div>
                        <p className="text-xs text-gray-500 mt-2">التوقيع والختم</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-600 mb-4">توقيع المحاسب</p>
                        <div className="h-16 border-b border-gray-400"></div>
                        <p className="text-xs text-gray-500 mt-2">التوقيع والختم</p>
                    </div>
                </div>
                <div className="mt-8 text-center text-sm text-gray-600">
                    <p className="mb-2">شروط وأحكام</p>
                    <p className="text-xs">• الفاتورة سارية لمدة 15 يوماً من تاريخ الإصدار</p>
                    <p className="text-xs">• يرجى الاحتفاظ بالفاتورة للرجوع إليها عند الحاجة</p>
                    <p className="text-xs">• جميع الأسعار بالجنيه المصري</p>
                    <p className="text-xs">• الفاتورة غير قابلة للإلغاء بعد استلام البضاعة</p>
                </div>
            </div>
        </div>
    );
}
