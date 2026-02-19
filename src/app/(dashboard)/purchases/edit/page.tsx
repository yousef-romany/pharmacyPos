'use client';

import { PurchaseForm } from '@/components/purchases/purchase-form';
import { useToast } from '@/hooks/use-toast';
import { getPurchaseById, getSuppliers, getWarehouses, updatePurchase } from '@/lib/data';
import type { PurchaseTransaction, Supplier, Warehouse } from '@/lib/types';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';

function EditPurchaseContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const { toast } = useToast();
    const router = useRouter();
    const [purchase, setPurchase] = React.useState<PurchaseTransaction | null>(null);
    const [allSuppliers, setAllSuppliers] = React.useState<Supplier[]>([]);
    const [allWarehouses, setAllWarehouses] = React.useState<Warehouse[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        if (!id) {
            // If no ID, redirect immediately
            router.push('/purchases');
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [purchaseData, suppliersData, warehousesData] = await Promise.all([
                    getPurchaseById(id),
                    getSuppliers(),
                    getWarehouses(),
                ]);

                if (!purchaseData) {
                    toast({
                        title: "خطأ",
                        description: "لم يتم العثور على فاتورة الشراء.",
                        variant: "destructive",
                    });
                    router.push('/purchases');
                    return;
                }
                setPurchase(purchaseData);
                setAllSuppliers(suppliersData);
                setAllWarehouses(warehousesData);
            } catch (error) {
                console.error("Failed to fetch data for editing purchase:", error);
                toast({
                    title: "خطأ",
                    description: "فشل تحميل البيانات لتعديل فاتورة الشراء.",
                    variant: "destructive",
                });
                router.push('/purchases');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id, router, toast]);

    const handleUpdatePurchase = async (updatedData: Omit<PurchaseTransaction, 'id' | 'totalAmount' | 'paymentStatus'>) => {
        if (!id) return;
        try {
            await updatePurchase(id, updatedData);
            toast({ title: "نجاح", description: "تم تحديث فاتورة الشراء بنجاح." });
            router.push('/purchases');
        } catch (error) {
            console.error("Failed to update purchase:", error);
            toast({
                title: "خطأ",
                description: `فشل تحديث فاتورة الشراء: ${error instanceof Error ? error.message : String(error)}`,
                variant: "destructive",
            });
        }
    };

    if (isLoading) {
        return (
            <div className="p-4 md:p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                        <Truck className="w-6 h-6" />
                        تعديل فاتورة شراء
                    </h2>
                    <Button variant="outline" disabled>
                        العودة إلى فواتير الشراء
                    </Button>
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        );
    }

    if (!purchase) {
        return null;
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <Truck className="w-6 h-6" />
                    تعديل فاتورة شراء <span className="text-muted-foreground text-xl">({purchase.invoiceNumber || purchase.id.substring(0, 8)})</span>
                </h2>
                <Button variant="outline" onClick={() => router.push('/purchases')}>
                    العودة إلى فواتير الشراء
                </Button>
            </div>

            <PurchaseForm
                suppliers={allSuppliers}
                warehouses={allWarehouses}
                onSubmit={handleUpdatePurchase}
                onClose={() => router.push('/purchases')}
                defaultValues={purchase}
            />
        </div>
    );
}

export default function EditPurchasePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EditPurchaseContent />
        </Suspense>
    );
}
