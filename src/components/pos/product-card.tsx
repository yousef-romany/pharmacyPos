
"use client";

import * as React from 'react';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Package, Box, PackageCheck } from 'lucide-react'; // Added Box and PackageCheck
import { useCart } from '@/hooks/use-cart';
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const Icon = product.categoryIcon || Package; // Fallback icon

  const canSellSubUnit = !!product.subUnitType && !!product.subUnitsPerUnit && product.subUnitsPerUnit > 0;
  const subUnitPrice = canSellSubUnit ? (product.price / product.subUnitsPerUnit!).toFixed(2) : null;

  // Calculate available quantity in terms of main and sub units
  const mainUnitsAvailable = Math.floor(product.quantity);
  const subUnitsAvailable = canSellSubUnit ? Math.floor(product.quantity * product.subUnitsPerUnit!) : 0;

  const handleAddToCart = (unitType: 'main' | 'sub') => {
    const quantityToAdd = 1;
    const isSub = unitType === 'sub';
    const available = isSub ? subUnitsAvailable : mainUnitsAvailable;

    if (available < quantityToAdd) {
       toast({
         title: "نفذت الكمية",
         description: `لا توجد كمية كافية من ${isSub ? product.subUnitType : product.unitType} للمنتج ${product.nameAr}.`,
         variant: "destructive",
       });
       return;
    }

    addItem(product, quantityToAdd, unitType);
    toast({
      title: "تمت الإضافة للسلة",
      description: `تمت إضافة 1 ${isSub ? product.subUnitType : product.unitType} من ${product.nameAr}.`,
    });
  };

  return (
    <Card className="flex flex-col justify-between h-full shadow-md hover:shadow-lg transition-shadow duration-200 border border-border/50">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
           <Icon className="w-6 h-6 text-primary flex-shrink-0 mt-1" aria-label="Product Category Icon"/>
           <div className="text-right flex-grow ml-2"> {/* Align text to the right */}
             <CardTitle className="text-base font-semibold mb-1">{product.nameAr}</CardTitle>
             <CardDescription className="text-xs text-muted-foreground">{product.nameEn}</CardDescription>
           </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow pt-2 pb-4 text-right text-sm"> {/* Align text to the right */}
        <div className="mb-2">
             <p className="font-medium">
                {product.unitType}: <span className="text-primary font-bold">{product.price.toFixed(2)} ر.س</span>
             </p>
             <p className="text-xs text-muted-foreground">
                 الكمية: {mainUnitsAvailable} {product.unitType}
             </p>
        </div>
        {canSellSubUnit && subUnitPrice && (
            <div className="border-t border-border/50 pt-2">
                <p className="font-medium">
                    {product.subUnitType}: <span className="text-primary font-bold">{subUnitPrice} ر.س</span>
                </p>
                <p className="text-xs text-muted-foreground">
                    الكمية: {subUnitsAvailable} {product.subUnitType} ({product.subUnitsPerUnit} {product.subUnitType} / {product.unitType})
                </p>
            </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 p-2 border-t border-border/50">
         {/* Add Main Unit Button */}
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-primary border-primary/50 hover:bg-primary/10"
          onClick={() => handleAddToCart('main')}
          disabled={mainUnitsAvailable <= 0}
          aria-label={`Add ${product.nameAr} (${product.unitType}) to cart`}
        >
          <Box className="ml-1.5 h-4 w-4" /> {/* Icon for main unit */}
          {product.unitType}
        </Button>

        {/* Add Sub Unit Button (if applicable) */}
        {canSellSubUnit && (
             <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleAddToCart('sub')}
                disabled={subUnitsAvailable <= 0}
                 aria-label={`Add ${product.nameAr} (${product.subUnitType}) to cart`}
            >
                <PackageCheck className="ml-1.5 h-4 w-4" /> {/* Icon for sub unit */}
                {product.subUnitType}
             </Button>
        )}
      </CardFooter>
    </Card>
  );
}
