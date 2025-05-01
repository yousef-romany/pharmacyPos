
'use client';

import * as React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePicker } from '@/components/ui/date-picker'; // Assuming you have a DatePicker component
import { Trash2, Plus, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PurchaseTransaction, PurchaseTransactionItem, Product, Supplier } from '@/lib/types';
import { getProducts, getProductById } from '@/lib/data'; // Import product fetching functions

// --- Zod Schema for Validation ---
const purchaseItemSchema = z.object({
  productId: z.string().min(1, "يجب اختيار منتج"),
  productName: z.string().optional(), // For display only
  quantity: z.number().min(0.01, "الكمية يجب أن تكون أكبر من 0"),
  cost: z.number().min(0, "التكلفة لا يمكن أن تكون سالبة"),
});

const purchaseFormSchema = z.object({
  supplierId: z.string().min(1, "يجب اختيار مورد"),
  date: z.date({ required_error: "تاريخ الفاتورة مطلوب" }),
  items: z.array(purchaseItemSchema).min(1, "يجب إضافة منتج واحد على الأقل"),
});

type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

// --- Component Props ---
interface PurchaseFormProps {
  suppliers: Supplier[];
  onSubmit: (data: Omit<PurchaseTransaction, 'id'>) => Promise<void>;
  onClose: () => void;
}

export function PurchaseForm({ suppliers, onSubmit, onClose }: PurchaseFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [productSearchTerm, setProductSearchTerm] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<Product[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      supplierId: '',
      date: new Date(),
      items: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // --- Product Search Logic ---
  React.useEffect(() => {
    const searchProducts = async () => {
      if (!productSearchTerm.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        // Basic search: filter by name or ID (improve as needed)
        const allProducts = await getProducts(); // Consider caching or more efficient fetch
        const lowerSearch = productSearchTerm.toLowerCase();
        const results = allProducts.filter(
          (p) =>
            p.nameAr.toLowerCase().includes(lowerSearch) ||
            p.nameEn.toLowerCase().includes(lowerSearch) ||
            p.id.toLowerCase().includes(lowerSearch) ||
            (p.barcode && p.barcode.includes(productSearchTerm))
        ).slice(0, 10); // Limit results
        setSearchResults(results);
      } catch (error) {
        console.error("Failed to search products:", error);
        toast({ title: "خطأ", description: "فشل البحث عن المنتجات.", variant: "destructive" });
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce search
    const debounceTimeout = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimeout);

  }, [productSearchTerm, toast]);

  const handleAddProduct = (product: Product) => {
    // Check if product already exists in the form items
    const exists = fields.some(item => item.productId === product.id);
    if (exists) {
         toast({ title: "موجود بالفعل", description: `منتج "${product.nameAr}" موجود بالفعل في الفاتورة.`, variant: "default"});
         return;
    }

    append({
      productId: product.id,
      productName: product.nameAr, // Store name for display
      quantity: 1,
      cost: 0, // Default cost to 0, user should update
    });
    setProductSearchTerm(''); // Clear search after adding
    setSearchResults([]);
  };

  // --- Form Submission ---
  const processSubmit = async (data: PurchaseFormValues) => {
    setIsLoading(true);
    try {
      const purchaseData: Omit<PurchaseTransaction, 'id'> = {
        supplierId: data.supplierId,
        date: data.date,
        items: data.items.map(({ productId, quantity, cost }) => ({ productId, quantity, cost })),
        totalAmount: data.items.reduce((sum, item) => sum + item.quantity * item.cost, 0),
      };
      await onSubmit(purchaseData);
    } catch (error) {
      // Error handling is done in the parent component's onSubmit
      console.error("Purchase form submission error:", error); // Log error here too
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total amount
  const totalAmount = form.watch('items').reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const cost = Number(item.cost) || 0;
    return sum + quantity * cost;
   }, 0);


  return (
    <form onSubmit={form.handleSubmit(processSubmit)} className="space-y-6">
      {/* Header Section: Supplier and Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supplier Select */}
        <div>
          <Label htmlFor="supplierId">المورد <span className="text-destructive">*</span></Label>
          <Controller
            name="supplierId"
            control={form.control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <SelectTrigger id="supplierId">
                  <SelectValue placeholder="اختر المورد..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
           {form.formState.errors.supplierId && <p className="text-xs text-destructive mt-1">{form.formState.errors.supplierId.message}</p>}
        </div>

        {/* Date Picker */}
        <div>
          <Label htmlFor="date">تاريخ الفاتورة <span className="text-destructive">*</span></Label>
           <Controller
              name="date"
              control={form.control}
              render={({ field }) => (
                 <DatePicker
                    date={field.value}
                    setDate={(date) => field.onChange(date)} // Pass the onChange handler
                    buttonClassName="w-full justify-start text-left font-normal"
                 />
              )}
           />
          {form.formState.errors.date && <p className="text-xs text-destructive mt-1">{form.formState.errors.date.message}</p>}
        </div>
      </div>

      <Separator />

      {/* Product Search and Add Section */}
      <div className="space-y-2 relative">
        <Label htmlFor="productSearch">بحث عن منتج لإضافته</Label>
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            id="productSearch"
            placeholder="ابحث بالاسم, الكود, أو الباركود..."
            value={productSearchTerm}
            onChange={(e) => setProductSearchTerm(e.target.value)}
            className="flex-grow"
          />
        </div>
         {/* Search Results Dropdown */}
        {(isSearching || searchResults.length > 0) && (
          <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center text-muted-foreground">جاري البحث...</div>
            ) : (
              searchResults.map((product) => (
                <div
                  key={product.id}
                  className="p-3 hover:bg-secondary cursor-pointer flex justify-between items-center"
                  onClick={() => handleAddProduct(product)}
                >
                  <span>{product.nameAr} ({product.nameEn})</span>
                   <span className="text-sm text-muted-foreground">الكود: {product.id.substring(0,6)}</span>
                </div>
              ))
            )}
             {searchResults.length === 0 && !isSearching && productSearchTerm && (
                 <div className="p-4 text-center text-muted-foreground">لم يتم العثور على منتجات.</div>
            )}
          </div>
        )}
      </div>


      <Separator />

      {/* Items Table Section */}
      <div>
        <h3 className="text-lg font-medium mb-2">أصناف الفاتورة</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">المنتج</TableHead>
                <TableHead>الكمية</TableHead>
                <TableHead>تكلفة الوحدة</TableHead>
                <TableHead>الإجمالي</TableHead>
                <TableHead className="w-[50px]"> </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell>{field.productName || field.productId}</TableCell>
                  <TableCell>
                    <Controller
                      name={`items.${index}.quantity`}
                      control={form.control}
                      render={({ field: inputField }) => (
                        <Input
                          {...inputField}
                          type="number"
                          step="any" // Allow fractional quantities if needed
                          min="0.01"
                          className="h-8 w-24"
                           onChange={e => inputField.onChange(parseFloat(e.target.value) || 0)}
                           value={inputField.value || ''}
                        />
                      )}
                    />
                    {form.formState.errors.items?.[index]?.quantity && <p className="text-xs text-destructive mt-1">{form.formState.errors.items?.[index]?.quantity?.message}</p>}
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`items.${index}.cost`}
                      control={form.control}
                      render={({ field: inputField }) => (
                        <Input
                          {...inputField}
                          type="number"
                          step="0.01"
                          min="0"
                          className="h-8 w-24"
                           onChange={e => inputField.onChange(parseFloat(e.target.value) || 0)}
                           value={inputField.value || ''}
                        />
                      )}
                    />
                     {form.formState.errors.items?.[index]?.cost && <p className="text-xs text-destructive mt-1">{form.formState.errors.items?.[index]?.cost?.message}</p>}
                  </TableCell>
                  <TableCell>
                     {((form.watch(`items.${index}.quantity`) || 0) * (form.watch(`items.${index}.cost`) || 0)).toFixed(2)} ر.س
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
               {fields.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            لم يتم إضافة أصناف بعد. ابحث عن منتج وأضفه.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
          </Table>
        </div>
         {form.formState.errors.items && fields.length > 0 && <p className="text-xs text-destructive mt-1">{form.formState.errors.items.message}</p>}
      </div>

      {/* Footer Section: Total and Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-lg font-bold">
          الإجمالي: {totalAmount.toFixed(2)} ر.س
        </div>
        <div className="flex gap-2">
           <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
             إلغاء
           </Button>
          <Button type="submit" disabled={isLoading || fields.length === 0}>
            {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Plus className="ml-2 h-4 w-4" />}
            {isLoading ? 'جاري الحفظ...' : 'حفظ فاتورة الشراء'}
          </Button>
        </div>
      </div>
    </form>
  );
}
