
"use client"; // Required for hooks like useState, useEffect, and custom hooks

import * as React from 'react';
import { getProducts, getProductById } from '@/lib/data'; // Add getProductById
import type { Product } from '@/lib/types';
import { ProductSearch } from '@/components/pos/product-search';
import { ProductList } from '@/components/pos/product-list';
import { CartSummary } from '@/components/pos/cart-summary'; // Import CartSummary
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
      (product.barcode && product.barcode.toLowerCase().includes(lowerCaseSearchTerm)) || // Search barcode if exists
      product.id.toLowerCase().includes(lowerCaseSearchTerm) // Also search by ID (used as internal code)
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
        // Find product by barcode first, then fallback to ID if needed
        let product = allProducts.find(p => p.barcode === barcode);

        // Fallback: If no barcode match, check if the input matches an ID (less common for scanning)
        if (!product) {
             product = allProducts.find(p => p.id === barcode);
        }

      if (product) {
        if (product.quantity > 0) {
          addItem(product, 1); // Add 1 item to the cart
          toast({
            title: "تمت الإضافة للسلة",
            description: `${product.nameAr} تمت إضافته بواسطة الباركود/الكود.`,
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
          description: `لم يتم العثور على منتج بالباركود أو الكود: ${barcode}`,
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
      {/* Sticky Header with Search and Cart */}
      <div className="p-4 border-b bg-secondary/30 sticky top-0 z-10 flex items-center justify-between gap-4">
        <div className="flex-grow">
            <ProductSearch onSearch={handleSearch} onBarcodeScan={handleBarcodeScan} />
        </div>
        <div className="flex-shrink-0">
           <CartSummary /> {/* Add the CartSummary component here */}
        </div>
      </div>
      {/* Scrollable Product List */}
      <div className="flex-1 overflow-y-auto bg-secondary/10">
        <ProductList products={filteredProducts} isLoading={isLoading} />
      </div>
    </main>
  );
}
