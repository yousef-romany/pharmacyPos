
"use client"; // Required for hooks like useState, useEffect, and custom hooks

import * as React from 'react';
import { getProducts, getProductById, findAlternativeProducts, getProductByBarcode } from '@/lib/data'; // Add getProductByBarcode
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
import { Box, Search, Trash2, Plus, Minus, X, CheckCircle, Keyboard } from 'lucide-react';

// Helper to safely parse numbers from potential strings
const safeParseFloat = (value: string | number | null | undefined, defaultValue = 0): number => {
  if (value === null || value === undefined) return defaultValue;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? defaultValue : parsed;
};

export default function PharmacyPosPage() {
  const [allProducts, setAllProducts] = React.useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { addItem, removeItem, updateItemQuantity, clearCart, items } = useCart(); // Get cart functions
  const { toast } = useToast(); // Get toast function
  const [showAlternativesDialog, setShowAlternativesDialog] = React.useState(false);
  const [originalScannedProduct, setOriginalScannedProduct] = React.useState<Product | null>(null);
  const [alternativeProducts, setAlternativeProducts] = React.useState<Product[]>([]);
  const [showUnitSelectionDialog, setShowUnitSelectionDialog] = React.useState(false);
  const [scannedProductForUnitSelection, setScannedProductForUnitSelection] = React.useState<Product | null>(null);
  const [showShortcutsDialog, setShowShortcutsDialog] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

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

  // Keyboard shortcuts handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields (except for specific shortcuts)
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Allow F1-F12 keys even when input is focused
      const isFunctionKey = e.key.startsWith('F');

      if (isInputFocused && !isFunctionKey) {
        return;
      }

      // F1 or Ctrl+F1: Focus search
      if (e.key === 'F1' || (e.ctrlKey && e.key === 'f' && !e.shiftKey)) {
        e.preventDefault();
        searchInputRef.current?.focus();
        toast({
          title: "التركيز على البحث",
          description: "تم التركيز على حقل البحث",
        });
      }

      // F2 or Ctrl+F2: Add first product to cart
      else if (e.key === 'F2' || (e.ctrlKey && e.key === 'f' && e.shiftKey)) {
        e.preventDefault();
        if (filteredProducts.length > 0) {
          const firstProduct = filteredProducts[0];
          if (safeParseFloat(firstProduct.quantity) > 0) {
            setScannedProductForUnitSelection(firstProduct);
            setShowUnitSelectionDialog(true);
          } else {
            toast({
              title: "نفذت الكمية",
              description: `المنتج ${firstProduct.nameAr} غير متوفر`,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "لا توجد منتجات",
            description: "لا توجد منتجات للإضافة",
            variant: "destructive",
          });
        }
      }

      // F3 or Ctrl+F3: Remove last item from cart
      else if (e.key === 'F3' || (e.ctrlKey && e.key === 'r' && e.shiftKey)) {
        e.preventDefault();
        if (items.length > 0) {
          const lastItem = items[items.length - 1];
          removeItem(lastItem.id, lastItem.selectedUnitType);
          toast({
            title: "تمت الإزالة",
            description: `تمت إزالة ${lastItem.nameAr} من السلة`,
          });
        } else {
          toast({
            title: "السلة فارغة",
            description: "لا توجد عناصر للإزالة",
            variant: "destructive",
          });
        }
      }

      // F4 or Ctrl+F4: Clear cart
      else if (e.key === 'F4' || (e.ctrlKey && e.key === 'c' && e.shiftKey)) {
        e.preventDefault();
        if (items.length > 0) {
          clearCart();
          toast({
            title: "تم تفريغ السلة",
            description: "تمت إزالة جميع العناصر من السلة",
          });
        } else {
          toast({
            title: "السلة فارغة",
            description: "السلة فارغة بالفعل",
            variant: "destructive",
          });
        }
      }

      // Escape: Clear search or close dialogs
      else if (e.key === 'Escape') {
        e.preventDefault();
        if (showAlternativesDialog) {
          setShowAlternativesDialog(false);
          setOriginalScannedProduct(null);
          setAlternativeProducts([]);
        } else if (showUnitSelectionDialog) {
          setShowUnitSelectionDialog(false);
          setScannedProductForUnitSelection(null);
        } else if (searchTerm) {
          setSearchTerm('');
          toast({
            title: "تم مسح البحث",
            description: "تم مسح نص البحث",
          });
        }
      }

      // Enter: Add first product to cart (when not in input)
      else if (e.key === 'Enter' && !isInputFocused) {
        e.preventDefault();
        if (filteredProducts.length > 0) {
          const firstProduct = filteredProducts[0];
          if (safeParseFloat(firstProduct.quantity) > 0) {
            setScannedProductForUnitSelection(firstProduct);
            setShowUnitSelectionDialog(true);
          }
        }
      }

      // + or =: Increase quantity of first cart item
      else if ((e.key === '+' || e.key === '=') && !isInputFocused) {
        e.preventDefault();
        if (items.length > 0) {
          const firstItem = items[0];
          const newQuantity = firstItem.cartQuantity + 1;
          updateItemQuantity(firstItem.id, firstItem.selectedUnitType, newQuantity);
          toast({
            title: "تم زيادة الكمية",
            description: `${firstItem.nameAr}: ${newQuantity}`,
          });
        }
      }

      // - or _: Decrease quantity of first cart item
      else if ((e.key === '-' || e.key === '_') && !isInputFocused) {
        e.preventDefault();
        if (items.length > 0) {
          const firstItem = items[0];
          const newQuantity = Math.max(0, firstItem.cartQuantity - 1);
          if (newQuantity === 0) {
            removeItem(firstItem.id, firstItem.selectedUnitType);
            toast({
              title: "تمت الإزالة",
              description: `تمت إزالة ${firstItem.nameAr} من السلة`,
            });
          } else {
            updateItemQuantity(firstItem.id, firstItem.selectedUnitType, newQuantity);
            toast({
              title: "تم تقليل الكمية",
              description: `${firstItem.nameAr}: ${newQuantity}`,
            });
          }
        }
      }

      // F12 or Ctrl+? or Ctrl+/: Show shortcuts help
      else if (e.key === 'F12' || (e.ctrlKey && (e.key === '?' || e.key === '/'))) {
        e.preventDefault();
        setShowShortcutsDialog(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredProducts, items, searchTerm, showAlternativesDialog, showUnitSelectionDialog, toast, removeItem, updateItemQuantity, clearCart]);

  // Handle barcode scan: Find product and add to cart or suggest alternatives
  const handleBarcodeScan = async (barcodeOrId: string) => {
    if (!barcodeOrId) return; // Ignore empty scans

    setIsLoading(true); // Show loading indicator while searching
    try {
      // Attempt to find by barcode first, then by ID as fallback
      let product = await getProductByBarcode(barcodeOrId);
      if (!product) {
        product = await getProductById(barcodeOrId); // Try finding by ID
      }

      if (product) {
        if (safeParseFloat(product.quantity) > 0) {
          // Show unit selection dialog instead of directly adding
          setScannedProductForUnitSelection(product);
          setShowUnitSelectionDialog(true);
        } else {
          // Product found but out of stock, find alternatives
          toast({
            title: "نفذت الكمية",
            description: `المنتج ${product.nameAr} غير متوفر حالياً. جاري البحث عن بدائل...`,
            variant: "default", // Use default, not destructive yet
          });
          setOriginalScannedProduct(product);
          const alternatives = await findAlternativeProducts(product.id);
          const availableAlternatives = alternatives.filter(alt => safeParseFloat(alt.quantity) > 0); // Filter only available alternatives
          setAlternativeProducts(availableAlternatives);
          if (availableAlternatives.length > 0) {
            setShowAlternativesDialog(true); // Show dialog only if alternatives are found and available
          } else {
            toast({
              title: "لا توجد بدائل متوفرة",
              description: `لم يتم العثور على بدائل متوفرة للمنتج ${product.nameAr}.`,
              variant: "destructive",
            });
            setOriginalScannedProduct(null); // Reset if no alternatives found
          }
        }
      } else {
        toast({
          title: "لم يتم العثور على المنتج",
          description: `لم يتم العثور على منتج بالباركود أو الكود: ${barcodeOrId}`,
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
    addItem(alternative, 1, 'main'); // Add 1 main unit of alternative
    toast({
      title: "تمت إضافة البديل للسلة",
      description: `${alternative.nameAr} تمت إضافته كبديل.`,
    });
    setShowAlternativesDialog(false); // Close dialog
    setOriginalScannedProduct(null);
    setAlternativeProducts([]);
  };

  const handleAddToCartWithUnit = (product: Product, unitType: 'main' | 'sub') => {
    addItem(product, 1, unitType);
    toast({
      title: "تمت الإضافة للسلة",
      description: `${product.nameAr} تمت إضافته بواسطة الباركود/الكود (${unitType === 'main' ? product.unitType : product.subUnitType}).`,
    });
    setShowUnitSelectionDialog(false);
    setScannedProductForUnitSelection(null);
  };

  return (
    <AlertDialog open={showAlternativesDialog} onOpenChange={setShowAlternativesDialog}>
      <main className="flex-1 flex flex-col overflow-hidden h-[calc(100vh-4rem)]"> {/* Adjust height based on layout header */}
        {/* Sticky Header with Search and Cart */}
        <div className="p-4 border-b bg-secondary/30 sticky top-0 z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex-grow">
            <ProductSearch
              onSearch={handleSearch}
              onBarcodeScan={handleBarcodeScan}
              inputRef={searchInputRef}
            />
          </div>
          <div className="flex-shrink-0 self-end sm:self-center flex items-center gap-2"> {/* Align cart summary */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShortcutsDialog(true)}
              title="عرض اختصارات لوحة المفاتيح"
            >
              <Keyboard className="h-4 w-4" />
              <span className="hidden sm:inline mr-2">اختصارات</span>
            </Button>
            <CartSummary /> {/* Add CartSummary component here */}
          </div>
        </div>
        {/* Scrollable Product List */}
        <div className="flex-1 overflow-y-auto bg-secondary/10">
          <ProductList products={filteredProducts} isLoading={isLoading} />
        </div>

        {/* Unit Selection Dialog */}
        <AlertDialog open={showUnitSelectionDialog} onOpenChange={setShowUnitSelectionDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>اختر الوحدة للمنتج "{scannedProductForUnitSelection?.nameAr}"</AlertDialogTitle>
              <AlertDialogDescription>
                اختر الوحدة التي تريد إضافتها للسلة
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-3">
              <Button
                variant="outline"
                className="w-full h-auto p-4 flex justify-between items-center"
                onClick={() => handleAddToCartWithUnit(scannedProductForUnitSelection!, 'main')}
              >
                <div className="text-right">
                  <p className="font-medium">{scannedProductForUnitSelection?.unitType}</p>
                  <p className="text-sm text-muted-foreground">الوحدة الرئيسية</p>
                </div>
                <div className="text-left">
                  <p className="font-bold text-primary">{parseFloat(scannedProductForUnitSelection?.price || '0').toFixed(2)} ج.م</p>
                  <p className="text-xs text-muted-foreground">الكمية المتوفرة: {safeParseFloat(scannedProductForUnitSelection?.quantity)}</p>
                </div>
              </Button>
              {scannedProductForUnitSelection?.subUnitsPerUnit && scannedProductForUnitSelection.subUnitsPerUnit > 0 && (
                <Button
                  variant="outline"
                  className="w-full h-auto p-4 flex justify-between items-center"
                  onClick={() => handleAddToCartWithUnit(scannedProductForUnitSelection!, 'sub')}
                >
                  <div className="text-right">
                    <p className="font-medium">{scannedProductForUnitSelection?.subUnitType}</p>
                    <p className="text-sm text-muted-foreground">الوحدة الفرعية</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-primary">{(parseFloat(scannedProductForUnitSelection?.price || '0') / (scannedProductForUnitSelection?.subUnitsPerUnit || 1)).toFixed(2)} ج.م</p>
                    <p className="text-xs text-muted-foreground">الكمية المتوفرة: {safeParseFloat(scannedProductForUnitSelection?.quantity) * (scannedProductForUnitSelection?.subUnitsPerUnit || 1)}</p>
                  </div>
                </Button>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowUnitSelectionDialog(false);
                setScannedProductForUnitSelection(null);
              }}>إلغاء</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Alternatives Dialog Content */}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>المنتج "{originalScannedProduct?.nameAr}" غير متوفر</AlertDialogTitle>
            <AlertDialogDescription>
              هل ترغب بإضافة أحد البدائل التالية للسلة؟ (نفس المادة الفعالة)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-60 overflow-y-auto py-4 space-y-2">
            {alternativeProducts.length > 0 ? (
              alternativeProducts.map(alt => (
                <div key={alt.id} className="flex justify-between items-center p-2 border rounded-md hover:bg-secondary">
                  <div className='flex-1 mr-2'>
                    <p className="font-medium">{alt.nameAr}</p>
                    <p className="text-xs text-muted-foreground">{alt.manufacturer} - {alt.concentration}</p>
                    <p className="text-sm font-semibold text-primary">{parseFloat(alt.price).toFixed(2)} ج.م</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleAddAlternative(alt)}>
                    <Box className="ml-2 h-4 w-4" />
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

        {/* Keyboard Shortcuts Help Dialog */}
        <AlertDialog open={showShortcutsDialog} onOpenChange={setShowShortcutsDialog}>
          <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                اختصارات لوحة المفاتيح
              </AlertDialogTitle>
              <AlertDialogDescription>
                استخدم هذه الاختصارات لزيادة سرعة العمل
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search & Navigation */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    البحث والتنقل
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>التركيز على البحث</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">F1</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>التركيز على البحث</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+F</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>مسح البحث</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd>
                    </div>
                  </div>
                </div>

                {/* Cart Operations */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    عمليات السلة
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>إضافة أول منتج</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">F2</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>إضافة أول منتج</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Shift+F</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>إزالة آخر عنصر</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">F3</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>إزالة آخر عنصر</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Shift+R</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>تفريغ السلة</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">F4</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>تفريغ السلة</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Shift+C</kbd>
                    </div>
                  </div>
                </div>

                {/* Quantity Adjustment */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    تعديل الكمية
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>زيادة كمية أول عنصر</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">+</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>تقليل كمية أول عنصر</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">-</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>إضافة أول منتج</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd>
                    </div>
                  </div>
                </div>

                {/* Dialog Control */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                    <X className="h-4 w-4" />
                    التحكم بالنوافذ
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>إغلاق النافذة</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>عرض الاختصارات</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">F12</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>عرض الاختصارات</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+?</kbd>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground text-center">
                  💡 تلميح: يمكنك استخدام هذه الاختصارات حتى عند التركيز في حقول الإدخال
                </p>
              </div>
            </div>
            <AlertDialogFooter>
              <Button onClick={() => setShowShortcutsDialog(false)}>
                حسناً
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </main>
    </AlertDialog>
  );
}
