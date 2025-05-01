"use client"; // Required for hooks like useState, useEffect, and custom hooks

import * as React from 'react';
import { getProducts } from '@/lib/data';
import type { Product } from '@/lib/types';
import { PosHeader } from '@/components/pos/pos-header'; // Keep header for consistency or remove if redundant with layout
import { ProductSearch } from '@/components/pos/product-search';
import { ProductList } from '@/components/pos/product-list';
import { CartSummary } from '@/components/pos/cart-summary'; // Moved CartSummary to header in layout

export default function PharmacyPosPage() {
  const [allProducts, setAllProducts] = React.useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      try {
        const products = await getProducts();
        setAllProducts(products);
        setFilteredProducts(products); // Initially show all products
      } catch (error) {
        console.error("Failed to load products:", error);
        // Handle error state here, e.g., show a toast message
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, []);

  React.useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const results = allProducts.filter(product =>
      product.nameAr.toLowerCase().includes(lowerCaseSearchTerm) ||
      product.nameEn.toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredProducts(results);
  }, [searchTerm, allProducts]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  return (
    // Removed the outer div and PosHeader as they are handled by the layout now
    <main className="flex-1 flex flex-col overflow-hidden h-[calc(100vh-4rem)]"> {/* Adjust height based on layout header */}
      <div className="p-4 border-b bg-secondary/30 sticky top-0 z-10"> {/* Make search sticky */}
        <ProductSearch onSearch={handleSearch} />
      </div>
      <div className="flex-1 overflow-y-auto bg-secondary/10">
        <ProductList products={filteredProducts} isLoading={isLoading} />
      </div>
    </main>
  );
}
