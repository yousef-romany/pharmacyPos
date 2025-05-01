"use client";

import * as React from 'react';
import type { Product } from '@/lib/types';
import { ProductCard } from './product-card';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
}

function ProductSkeleton() {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[125px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-10 w-full mt-2" />
      </div>
    </div>
  );
}


export function ProductList({ products, isLoading }: ProductListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
        {Array.from({ length: 10 }).map((_, index) => (
          <ProductSkeleton key={index} />
        ))}
      </div>
    );
  }

   if (!products || products.length === 0) {
    return <div className="text-center py-10 text-muted-foreground">لا توجد منتجات مطابقة لبحثك.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
