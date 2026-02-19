
"use client";

import * as React from 'react';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Package, Box, PackageCheck, BadgePercent, CalendarX, CalendarClock } from 'lucide-react'; // Added discount/expiry icons
import { useCart } from '@/hooks/use-cart';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils'; // Import cn
import { calculateDaysUntilExpiry } from '@/lib/data'; // Import expiry helper

interface ProductCardProps {
  product: Product;
}

// Helper to apply discount
const applyDiscount = (price: number, discountRate?: number): number => {
  if (discountRate && discountRate > 0 && discountRate <= 100) {
    return price * (1 - discountRate / 100);
  }
  return price;
};

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const Icon = product.categoryIcon || Package; // Fallback icon

  const canSellSubUnit = !!product.subUnitType && !!product.subUnitsPerUnit && product.subUnitsPerUnit > 0;

  // Parse string values to numbers for calculations
  const priceNum = parseFloat(product.price) || 0;
  const quantityNum = parseFloat(product.quantity) || 0;
  const discountRateNum = product.discountRate ? parseFloat(product.discountRate) : 0;

  // Calculate original prices
  const originalMainUnitPrice = priceNum;
  const originalSubUnitPrice = canSellSubUnit ? (priceNum / product.subUnitsPerUnit!) : null;

  // Calculate discounted prices
  const discountedMainUnitPrice = applyDiscount(originalMainUnitPrice, discountRateNum);
  const discountedSubUnitPrice = originalSubUnitPrice ? applyDiscount(originalSubUnitPrice, discountRateNum) : null;

  // Calculate available quantity
  const mainUnitsAvailable = Math.floor(quantityNum);
  const subUnitsAvailable = canSellSubUnit ? Math.floor(quantityNum * product.subUnitsPerUnit!) : 0;

  // Calculate expiry status
  const daysLeft = product.expiryDate ? calculateDaysUntilExpiry(new Date(product.expiryDate)) : null;
  const isExpired = daysLeft !== null && daysLeft < 0;
  const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 60; // Example: 60 days threshold

  const handleAddToCart = (unitType: 'main' | 'sub') => {
    if (isExpired) {
      toast({
        title: "منتج منتهي الصلاحية",
        description: `لا يمكن إضافة ${product.nameAr} لأنه منتهي الصلاحية.`,
        variant: "destructive",
      });
      return;
    }

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
    <Card className={cn(
      "flex flex-col justify-between h-full shadow-md hover:shadow-lg transition-shadow duration-200 border",
      isExpired ? "border-red-500/50 bg-red-50/30" : isExpiringSoon ? "border-orange-500/50 bg-orange-50/30" : "border-border/50"
    )}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Icon className="w-6 h-6 text-primary flex-shrink-0 mt-1" aria-label="Product Category Icon" />
          <div className="text-right flex-grow ml-2">
            <CardTitle className="text-base font-semibold mb-1">{product.nameAr}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">{product.nameEn}</CardDescription>
            {/* Expiry/Discount Badges */}
            <div className="mt-1 flex justify-end gap-1 items-center flex-wrap">
              {isExpired && (
                <span className="text-xs text-red-700 font-bold flex items-center gap-1"><CalendarX size={14} /> منتهي</span>
              )}
              {isExpiringSoon && !isExpired && (
                <span className="text-xs text-orange-600 font-medium flex items-center gap-1"><CalendarClock size={14} /> سينتهي قريباً</span>
              )}
              {discountRateNum > 0 && (
                <span className="text-xs text-green-600 font-medium flex items-center gap-1"><BadgePercent size={14} /> خصم {discountRateNum}%</span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow pt-2 pb-4 text-right text-sm">
        {/* Main Unit Pricing */}
        <div className="mb-2">
          <p className="font-medium">
            {product.unitType}:{' '}
            {product.discountRate ? (
              <>
                <span className="text-primary font-bold">{discountedMainUnitPrice.toFixed(2)} ج.م</span>
                <span className="text-xs text-muted-foreground line-through ml-1">{originalMainUnitPrice.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-primary font-bold">{originalMainUnitPrice.toFixed(2)} ج.م</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            الكمية: {mainUnitsAvailable} {product.unitType}
          </p>
        </div>
        {/* Sub Unit Pricing */}
        {canSellSubUnit && originalSubUnitPrice !== null && discountedSubUnitPrice !== null && (
          <div className="border-t border-border/50 pt-2">
            <p className="font-medium">
              {product.subUnitType}:{' '}
              {discountRateNum > 0 ? (
                <>
                  <span className="text-primary font-bold">{discountedSubUnitPrice.toFixed(2)} ج.م</span>
                  <span className="text-xs text-muted-foreground line-through ml-1">{originalSubUnitPrice.toFixed(2)}</span>
                </>
              ) : (
                <span className="text-primary font-bold">{originalSubUnitPrice.toFixed(2)} ج.م</span>
              )}
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
          disabled={mainUnitsAvailable <= 0 || isExpired}
          aria-label={`Add ${product.nameAr} (${product.unitType}) to cart`}
        >
          <Box className="ml-1.5 h-4 w-4" />
          {product.unitType}
        </Button>

        {/* Add Sub Unit Button (if applicable) */}
        {canSellSubUnit && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handleAddToCart('sub')}
            disabled={subUnitsAvailable <= 0 || isExpired}
            aria-label={`Add ${product.nameAr} (${product.subUnitType}) to cart`}
          >
            <PackageCheck className="ml-1.5 h-4 w-4" />
            {product.subUnitType}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
