"use client";

import * as React from 'react';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Package } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const Icon = product.categoryIcon || Package; // Fallback icon

  const handleAddToCart = () => {
    addItem(product);
    toast({
      title: "تمت الإضافة للسلة",
      description: `${product.nameAr} تمت إضافته إلى سلة المشتريات.`,
    });
  };

  return (
    <Card className="flex flex-col justify-between h-full shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
           <Icon className="w-6 h-6 text-primary" aria-label="Product Category Icon"/>
           <div className="text-right"> {/* Align text to the right */}
             <CardTitle className="text-lg font-semibold mb-1">{product.nameAr}</CardTitle>
             <CardDescription className="text-sm text-muted-foreground">{product.nameEn}</CardDescription>
           </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow pt-2 pb-4 text-right"> {/* Align text to the right */}
        <p className="text-base font-medium">
          السعر: <span className="text-primary font-bold">{product.price.toFixed(2)} ر.س</span>
        </p>
        <p className="text-sm text-muted-foreground">
          الكمية المتاحة: {product.quantity}
        </p>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={handleAddToCart}
          disabled={product.quantity <= 0} // Disable if out of stock
          aria-label={`Add ${product.nameAr} to cart`}
        >
          <PlusCircle className="ml-2 h-5 w-5" /> {/* Adjusted margin for RTL */}
          أضف للسلة
        </Button>
      </CardFooter>
    </Card>
  );
}
