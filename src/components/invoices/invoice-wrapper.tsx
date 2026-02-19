'use client';

import * as React from 'react';
import { Printer } from 'lucide-react';
import type { SaleTransaction, Customer, Product, InvoiceLanguage } from '@/lib/types';
import { ArabicInvoiceTemplate } from './arabic-invoice-template';
import { EnglishInvoiceTemplate } from './english-invoice-template';
import { Button } from '@/components/ui/button';

interface InvoiceWrapperProps {
    sale: SaleTransaction;
    customer?: Customer;
    products: Product[];
    language: InvoiceLanguage;
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    companyEmail: string;
}

export function InvoiceWrapper({
    sale,
    customer,
    products,
    language,
    companyName,
    companyAddress,
    companyPhone,
    companyEmail
}: InvoiceWrapperProps) {
    // Handle print function
    const handlePrint = () => {
        window.print();
    };

    // Select appropriate template based on language
    const isArabic = language.isRTL || language.code === 'ar';

    return (
        <div className="invoice-wrapper">
            {isArabic ? (
                <ArabicInvoiceTemplate
                    sale={sale}
                    customer={customer}
                    products={products}
                    companyName={companyName}
                    companyAddress={companyAddress}
                    companyPhone={companyPhone}
                    companyEmail={companyEmail}
                />
            ) : (
                <EnglishInvoiceTemplate
                    sale={sale}
                    customer={customer}
                    products={products}
                    companyName={companyName}
                    companyAddress={companyAddress}
                    companyPhone={companyPhone}
                    companyEmail={companyEmail}
                />
            )}
            
            {/* Print Button */}
            <div className="fixed bottom-4 right-4 print:hidden">
                <Button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 shadow-lg"
                >
                    <Printer className="w-4 h-4" />
                    {isArabic ? 'طباعة' : 'Print Invoice'}
                </Button>
            </div>

            {/* Print Styles */}
            <style jsx>{`
                @media print {
                    .invoice-wrapper {
                        padding: 0;
                        margin: 0;
                    }
                    .invoice-container {
                        box-shadow: none !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 20px !important;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    button {
                        display: none !important;
                    }
                }
                
                @page {
                    margin: 0.5cm;
                    size: A4;
                }
            `}</style>
        </div>
    );
}
