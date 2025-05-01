
"use client"; // Required for hooks like useState, useEffect, and custom hooks

import * as React from 'react';
import { getProducts, getProductById, findAlternativeProducts } from '@/lib/data'; // Add getProductById, findAlternativeProducts
import type { Product } from '@/lib/types';
import { ProductSearch } from '@/components/pos/product-search';
import { ProductList } from '@/components/pos/product-list';
import { CartSummary } from '@/components/pos/cart-summary'; // Import CartSummary
import { useCart } from '@/hooks/use-cart'; // Import useCart
import { useToast } from "@/hooks/use-toast"; // Import useToast
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger, // Not used directly here, but Alert opens programmatically
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button'; // Import Button
import { Box } from 'lucide-react';

export default function PharmacyPosPage() {
  const [allProducts, setAllProducts] = React.useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { addItem } = useCart(); // Get addItem from cart hook
  const { toast } = useToast(); // Get toast function
  const [showAlternativesDialog, setShowAlternativesDialog] = React.useState(false);
  const [originalScannedProduct, setOriginalScannedProduct] = React.useState<Product | null>(null);
  const [alternativeProducts, setAlternativeProducts] = React.useState<Product[]>([]);

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

   // Handle barcode scan: Find product and add to cart or suggest alternatives
   const handleBarcodeScan = async (barcode: string) => {
    setIsLoading(true); // Show loading indicator while searching
    try {
        let product = allProducts.find(p => p.barcode === barcode || p.id === barcode);

      if (product) {
        if (product.quantity > 0) {
          addItem(product, 1); // Add 1 item to the cart
          toast({
            title: "تمت الإضافة للسلة",
            description: `${product.nameAr} تمت إضافته بواسطة الباركود/الكود.`,
          });
          setOriginalScannedProduct(null); // Reset state if item is added
          setShowAlternativesDialog(false);
        } else {
          // Product found but out of stock, find alternatives
          toast({
            title: "نفذت الكمية",
            description: `المنتج ${product.nameAr} غير متوفر حالياً. جاري البحث عن بدائل...`,
            variant: "default", // Use default, not destructive yet
          });
          setOriginalScannedProduct(product);
          const alternatives = await findAlternativeProducts(product.id);
          const availableAlternatives = alternatives.filter(alt => alt.quantity > 0); // Filter only available alternatives
          setAlternativeProducts(availableAlternatives);
          if (availableAlternatives.length > 0) {
              setShowAlternativesDialog(true); // Show dialog only if alternatives are found and available
          } else {
               toast({
                  title: "لا توجد بدائل متوفرة",
                  description: `لم يتم العثور على بدائل متوفرة للمنتج ${product.nameAr}.`,
                  variant: "destructive",
               });
          }
        }
      } else {
        toast({
          title: "لم يتم العثور على المنتج",
          description: `لم يتم العثور على منتج بالباركود أو الكود: ${barcode}`,
          variant: "destructive",
        });
         setOriginalScannedProduct(null);
         setShowAlternativesDialog(false);
      }
    } catch (error) {
      console.error("Failed to process barcode scan:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء معالجة الباركود.", variant: "destructive" });
       setOriginalScannedProduct(null);
       setShowAlternativesDialog(false);
    } finally {
       setIsLoading(false); // Hide loading indicator
    }
  };

   const handleAddAlternative = (alternative: Product) => {
      addItem(alternative, 1);
      toast({
        title: "تمت إضافة البديل للسلة",
        description: `${alternative.nameAr} تمت إضافته كبديل.`,
      });
      setShowAlternativesDialog(false); // Close the dialog
      setOriginalScannedProduct(null);
      setAlternativeProducts([]);
   };


  return (
    <AlertDialog open={showAlternativesDialog} onOpenChange={setShowAlternativesDialog}>
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

         {/* Alternatives Dialog Content */}
          <AlertDialogContent>
             <AlertDialogHeader>
                 <AlertDialogTitle>المنتج "{originalScannedProduct?.nameAr}" غير متوفر</AlertDialogTitle>
                 <AlertDialogDescription>
                     هل ترغب بإضافة أحد البدائل التالية للسلة؟
                 </AlertDialogDescription>
             </AlertDialogHeader>
             <div className="max-h-60 overflow-y-auto py-4 space-y-2">
                 {alternativeProducts.length > 0 ? (
                     alternativeProducts.map(alt => (
                         <div key={alt.id} className="flex justify-between items-center p-2 border rounded-md hover:bg-secondary">
                             <div className='flex-1 mr-2'>
                                 <p className="font-medium">{alt.nameAr}</p>
                                 <p className="text-xs text-muted-foreground">{alt.manufacturer} - {alt.concentration}</p>
                                 <p className="text-sm font-semibold text-primary">{alt.price.toFixed(2)} ر.س</p>
                             </div>
                             <Button size="sm" variant="outline" onClick={() => handleAddAlternative(alt)}>
                                 <Box className="ml-2 h-4 w-4"/>
                                 إضافة للسلة
                             </Button>
                         </div>
                     ))
                 ) : (
                    <p className="text-center text-muted-foreground">لا توجد بدائل متوفرة حالياً.</p>
                 )}
             </div>
             <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                    setOriginalScannedProduct(null);
                    setAlternativeProducts([]);
                    setShowAlternativesDialog(false); // Ensure state is reset and dialog closes
                 }}>إلغاء</AlertDialogCancel>
                 {/* No primary action needed, adding is done via buttons */}
             </AlertDialogFooter>
         </AlertDialogContent>

      </main>
    </AlertDialog>
  );
}
