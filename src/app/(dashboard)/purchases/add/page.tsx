'use client';

import { PurchaseForm } from '@/components/purchases/purchase-form';
import { useToast } from '@/hooks/use-toast';
import { addPurchase } from '@/lib/data';
import type { PurchaseTransaction, Supplier, Warehouse } from '@/lib/types';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { getSuppliers, getWarehouses } from '@/lib/data'; // Import data fetching functions


export default function AddPurchasePage() {
    const { toast } = useToast();
    const router = useRouter();
    const [allSuppliers, setAllSuppliers] = React.useState<Supplier[]>([]);
    const [allWarehouses, setAllWarehouses] = React.useState<Warehouse[]>([]);
    const [isLoadingDependencies, setIsLoadingDependencies] = React.useState(true);

    React.useEffect(() => {
        const fetchDependencies = async () => {
            setIsLoadingDependencies(true);
            try {
                const [suppliersData, warehousesData] = await Promise.all([
                    getSuppliers(),
                    getWarehouses(),
                ]);
                setAllSuppliers(suppliersData);
                setAllWarehouses(warehousesData);
            } catch (error) {
                console.error("Failed to fetch suppliers or warehouses:", error);
                toast({
                    title: "خطأ",
                    description: "فشل تحميل البيانات الأساسية لإنشاء فاتورة الشراء.",
                    variant: "destructive",
                });
            } finally {
                setIsLoadingDependencies(false);
            }
        };
        fetchDependencies();
    }, [toast]);

    const handleAddPurchase = async (purchaseData: Omit<PurchaseTransaction, 'id' | 'totalAmount' | 'paymentStatus'>) => {
        try {
            await addPurchase(purchaseData);
            toast({ title: "نجاح", description: "تمت إضافة فاتورة الشراء بنجاح وتحديث المخزون." });
            router.push('/purchases'); // Navigate back to the purchases list
        } catch (error) {
            console.error("Failed to add purchase:", error);
            toast({
                title: "خطأ",
                description: `فشلت إضافة فاتورة الشراء: ${error instanceof Error ? error.message : String(error)}`,
                variant: "destructive",
            });
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <Truck className="w-6 h-6" />
                    إنشاء فاتورة شراء جديدة
                </h2>
                <Button variant="outline" onClick={() => router.push('/purchases')}>
                    العودة إلى فواتير الشراء
                </Button>
            </div>

            {isLoadingDependencies ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : (
                <PurchaseForm
                    suppliers={allSuppliers}
                    warehouses={allWarehouses}
                    onSubmit={handleAddPurchase}
                    onClose={() => router.push('/purchases')} // Ensure navigation back on close
                />
            )}

        </div>
    );
}