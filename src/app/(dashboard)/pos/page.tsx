
"use client"; // Required for hooks like useState, useEffect, and custom hooks

import * as React from 'react';
import { getProducts, getProductById } from '@/lib/data'; // Add getProductById
import type { Product } from '@/lib/types';
import { ProductSearch } from '@/components/pos/product-search';
import { ProductList } from '@/components/pos/product-list';
import { useCart } from '@/hooks/use-cart'; // Import useCart
import { useToast } from "@/hooks/use-toast"; // Import useToast

export default function PharmacyPosPage() {
  const [allProducts, setAllProducts] = React.useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { addItem } = useCart(); // Get addItem from cart hook
  const { toast } = useToast(); // Get toast function

  React.useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      try {
        const products = await getProducts();
        setAllProducts(products);
        setFilteredProducts(products); // Initially show all products
      } catch (error) {
        console.error("Failed to load products:", error);
         toast({ title: "خطأ", description: "فشل تحميل قائمة المنتجات.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, [toast]); // Add toast to dependency array

  React.useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const results = allProducts.filter(product =>
      product.nameAr.toLowerCase().includes(lowerCaseSearchTerm) ||
      product.nameEn.toLowerCase().includes(lowerCaseSearchTerm) ||
      product.id.toLowerCase().includes(lowerCaseSearchTerm) // Also search by ID (used as barcode placeholder)
    );
    setFilteredProducts(results);
  }, [searchTerm, allProducts]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

   // Handle barcode scan: Find product and add to cart
   const handleBarcodeScan = async (barcode: string) => {
    setIsLoading(true); // Show loading indicator while searching
    try {
      // --- IMPORTANT ---
      // In a real application, you would have a dedicated barcode field in your Product type
      // and query your data source (API/DB) based on that barcode.
      // For this simulation, we'll use the product ID as a placeholder for the barcode.
      // const product = await getProductByBarcode(barcode);
      const product = allProducts.find(p => p.id === barcode); // Simulating search by ID

      if (product) {
        if (product.quantity > 0) {
          addItem(product, 1); // Add 1 item to the cart
          toast({
            title: "تمت الإضافة للسلة",
            description: `${product.nameAr} تمت إضافته بواسطة الباركود.`,
          });
        } else {
          toast({
            title: "نفذت الكمية",
            description: `المنتج ${product.nameAr} غير متوفر حالياً.`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "لم يتم العثور على المنتج",
          description: `لم يتم العثور على منتج بالباركود: ${barcode}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to process barcode scan:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء معالجة الباركود.", variant: "destructive" });
    } finally {
       setIsLoading(false); // Hide loading indicator
    }
  };


  return (
    <main className="flex-1 flex flex-col overflow-hidden h-[calc(100vh-4rem)]"> {/* Adjust height based on layout header */}
      <div className="p-4 border-b bg-secondary/30 sticky top-0 z-10"> {/* Make search sticky */}
        <ProductSearch onSearch={handleSearch} onBarcodeScan={handleBarcodeScan} />
      </div>
      <div className="flex-1 overflow-y-auto bg-secondary/10">
        <ProductList products={filteredProducts} isLoading={isLoading} />
      </div>
    </main>
  );
}
