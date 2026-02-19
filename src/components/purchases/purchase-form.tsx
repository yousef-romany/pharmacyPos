
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
import { Trash2, Plus, Search, Loader2, Calendar as CalendarIcon, Warehouse as WarehouseIcon, Coins, CreditCard, Landmark, Smartphone, Wallet, X } from 'lucide-react'; // Added payment method icons, X
import { useToast } from '@/hooks/use-toast';
import type { PurchaseTransaction, PurchaseTransactionItem, Product, Supplier, PaymentStatus, Warehouse, PaymentMethod, Treasury, PurchasePayment } from '@/lib/types'; // Import PaymentMethod, Treasury, PurchasePayment types
import { getProducts, getProductById, getWarehouses, getDefaultWarehouseId, getTreasuries } from '@/lib/data'; // Import getTreasuries
import { Separator } from '@/components/ui/separator'; // Import Separator

// --- Zod Schema for Validation ---
const purchaseItemSchema = z.object({
  productId: z.string().min(1, "يجب اختيار منتج"),
  productName: z.string().optional(), // For display only
  quantity: z.number().min(0.01, "الكمية يجب أن تكون أكبر من 0"),
  cost: z.number().min(0, "التكلفة لا يمكن أن تكون سالبة"),
  expiryDate: z.date().optional(), // Optional expiry date for the batch
  warehouseId: z.string().optional(), // Make warehouseId optional to match PurchaseTransactionItem type
});

// Payment Method Options for Purchases
const purchasePaymentMethods: { value: PaymentMethod, label: string, icon: React.ElementType }[] = [
  { value: 'cash', label: 'نقداً', icon: Coins },
  { value: 'card', label: 'بطاقة', icon: CreditCard },
  { value: 'instapay', label: 'إنستا باي', icon: Smartphone },
  { value: 'vodafone_cash', label: 'فودافون كاش', icon: Wallet },
  { value: 'debt', label: 'آجل/مديونية', icon: Landmark },
];

const purchaseFormSchema = z.object({
  supplierId: z.string().min(1, "يجب اختيار مورد"),
  date: z.date({ required_error: "تاريخ الفاتورة مطلوب" }),
  invoiceNumber: z.string().optional(), // Supplier's invoice number
  destinationWarehouseId: z.string().optional(), // Optional: Overall destination warehouse for the whole purchase
  items: z.array(purchaseItemSchema).min(1, "يجب إضافة منتج واحد على الأقل"),
  // Note: payments will be handled separately outside the form
});

type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

// --- Component Props ---
interface PurchaseFormProps {
  suppliers: Supplier[];
  warehouses: Warehouse[]; // Add warehouses prop
  onSubmit: (data: Omit<PurchaseTransaction, 'id' | 'totalAmount' | 'paymentStatus'>) => Promise<void>; // Adjusted onSubmit type
  onClose: () => void;
  defaultValues?: PurchaseTransaction; // Add optional defaultValues for editing
}

export function PurchaseForm({ suppliers, warehouses, onSubmit, onClose, defaultValues }: PurchaseFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [productSearchTerm, setProductSearchTerm] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<Product[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [defaultWarehouseId, setDefaultWarehouseId] = React.useState<string | undefined>(undefined);
  const [treasuries, setTreasuries] = React.useState<Treasury[]>([]); // State for treasuries
  const [payments, setPayments] = React.useState<Array<{ treasuryId: string; amount: number }>>(
    defaultValues?.payments?.map(p => ({ treasuryId: p.treasuryId, amount: parseFloat(p.amount) || 0 })) || []
  );  // Split payments

  // Helper to safely parse float from DB string, similar to what's in lib/data.ts
  const safeParseFloat = (value: string | number | null | undefined, defaultValue = 0): number => {
    if (value === null || value === undefined) return defaultValue;
    const parsed = parseFloat(value.toString());
    return isNaN(parsed) ? defaultValue : parsed;
  };

  // Function to get product name for an item, might need to fetch if not present
  const getProductName = React.useCallback(async (productId: string): Promise<string> => {
    // This is a simplified approach. In a real app, you might have a cached list of products
    // or a dedicated API endpoint to fetch a single product's name efficiently.
    const product = await getProductById(productId);
    return product?.nameAr || productId;
  }, []);

  // Fetch default warehouse ID and treasuries on mount
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [id, fetchedTreasuries] = await Promise.all([
          getDefaultWarehouseId(),
          getTreasuries()
        ]);
        setDefaultWarehouseId(id);
        setTreasuries(fetchedTreasuries);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({ title: "خطأ", description: "فشل تحميل البيانات.", variant: "destructive" });
      }
    };
    fetchData();
  }, [toast]);


  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      supplierId: defaultValues?.supplierId || '',
      date: defaultValues?.date ? new Date(defaultValues.date) : new Date(), // Ensure Date object
      invoiceNumber: defaultValues?.invoiceNumber || '',
      destinationWarehouseId: defaultValues?.destinationWarehouseId || '', // Initialize overall warehouse
      items: defaultValues?.items?.map(item => ({
        productId: item.productId,
        productName: item.productName, // Assuming productName is available or fetched
        quantity: safeParseFloat(item.quantity),
        cost: safeParseFloat(item.cost),
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
        warehouseId: item.destinationWarehouseId, // Map to item's specific warehouse
      })) || [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Effect to populate product names for default items if not already present
  React.useEffect(() => {
    if (defaultValues?.items && fields.length > 0) {
      defaultValues.items.forEach(async (item, index) => {
        if (!form.getValues(`items.${index}.productName`)) {
          const name = await getProductName(item.productId);
          form.setValue(`items.${index}.productName`, name);
        }
      });
    }
  }, [defaultValues, fields, form, getProductName]);

  // Update default destination warehouse for the form when fetched
  React.useEffect(() => {
    if (defaultWarehouseId && !form.getValues('destinationWarehouseId')) {
      form.setValue('destinationWarehouseId', defaultWarehouseId);
    }
    // If we are editing and a specific destinationWarehouseId is set in defaultValues, use that.
    if (defaultValues?.destinationWarehouseId) {
      form.setValue('destinationWarehouseId', defaultValues.destinationWarehouseId);
    }
  }, [defaultWarehouseId, form, defaultValues]);



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
    // Check if product already exists in the form items (consider warehouse later if needed)
    const exists = fields.some(item => item.productId === product.id);
    if (exists) {
      toast({ title: "موجود بالفعل", description: `منتج "${product.nameAr}" موجود بالفعل في الفاتورة.`, variant: "default" });
      return;
    }

    const warehouseId = form.getValues('destinationWarehouseId') || defaultWarehouseId;
    if (!warehouseId) {
      toast({
        title: "خطأ",
        description: "يجب اختيار مخزن الوجهة أولاً قبل إضافة منتجات.",
        variant: "destructive"
      });
      return;
    }

    append({
      productId: product.id,
      productName: product.nameAr, // Store name for display
      quantity: 1,
      cost: parseFloat(product.lastPurchaseCost || '0'), // Use last purchase cost as default if available
      expiryDate: undefined, // Default expiry to undefined
      warehouseId: warehouseId, // Use overall destination or default
    });
    setProductSearchTerm(''); // Clear search after adding
    setSearchResults([]);
  };

  // --- Payment Management Functions ---
  const handleAddPayment = () => {
    const defaultTreasury = treasuries.find(t => t.isDefault) || treasuries[0];
    if (defaultTreasury) {
      setPayments([...payments, { treasuryId: defaultTreasury.id, amount: 0 }]);
    }
  };

  const handleRemovePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const handleUpdatePaymentTreasury = (index: number, treasuryId: string) => {
    const newPayments = [...payments];
    newPayments[index] = { ...newPayments[index], treasuryId };
    setPayments(newPayments);
  };

  const handleUpdatePaymentAmount = (index: number, amount: number) => {
    const newPayments = [...payments];
    newPayments[index] = { ...newPayments[index], amount };
    setPayments(newPayments);
  };

  // Calculate total purchase amount
  const totalAmount = fields.reduce((sum, item) => sum + (item.quantity * item.cost), 0);

  // Calculate total paid
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingToPay = totalAmount - totalPaid;

  // --- Form Submission ---
  const processSubmit = async (data: PurchaseFormValues) => {
    // Validation for payments
    if (payments.length === 0) {
      toast({ title: "مطلوب دفعة", description: "يجب إضافة دفعة واحدة على الأقل.", variant: "destructive" });
      return;
    }

    // Check if any payment has invalid treasury
    const hasInvalidTreasury = payments.some(p => !p.treasuryId);
    if (hasInvalidTreasury) {
      toast({ title: "خطأ في الدفعات", description: "يجب اختيار خزينة لكل دفعة.", variant: "destructive" });
      return;
    }

    // Check if any payment has negative amount
    const hasNegativeAmount = payments.some(p => p.amount < 0);
    if (hasNegativeAmount) {
      toast({ title: "مبلغ غير صحيح", description: "المبلغ المدفوع لا يمكن أن يكون سالباً.", variant: "destructive" });
      return;
    }

    // Note: For purchases, we allow partial payment (totalPaid < totalAmount)

    setIsLoading(true);
    try {
      // Prepare split payments
      const purchasePayments: PurchasePayment[] = payments.map(p => ({
        treasuryId: p.treasuryId,
        amount: String(p.amount)
      }));

      // Omit totalAmount and paymentStatus, they will be calculated in the data layer
      const purchaseData: Omit<PurchaseTransaction, 'id' | 'totalAmount' | 'paymentStatus'> = {
        supplierId: data.supplierId,
        date: data.date,
        invoiceNumber: data.invoiceNumber,
        payments: purchasePayments, // Include split payments
        destinationWarehouseId: data.destinationWarehouseId, // Include overall destination
        items: data.items.map(({ productId, quantity, cost, expiryDate, warehouseId }) => ({ // Include warehouseId per item
          productId,
          quantity: String(quantity), // Convert number to string as required by PurchaseTransactionItem type
          cost: String(cost), // Convert number to string as required by PurchaseTransactionItem type
          expiryDate,
          destinationWarehouseId: warehouseId // Map form field to item property
        })),
      };
      await onSubmit(purchaseData);
      setPayments([]); // Reset payments after successful submission
    } catch (error) {
      // Error handling is done in the parent component's onSubmit
      console.error("Purchase form submission error:", error); // Log error here too
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(processSubmit)} className="space-y-6">
      {/* Header Section: Supplier, Date, Invoice #, Amount Paid, Destination Warehouse */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Supplier Select */}
        <div>
          <Label htmlFor="supplierId">المورد <span className="text-destructive">*</span></Label>
          <Controller
            name="supplierId"
            control={form.control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ''}>
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

        {/* Supplier Invoice Number */}
        <div>
          <Label htmlFor="invoiceNumber">رقم فاتورة المورد</Label>
          <Input
            id="invoiceNumber"
            {...form.register('invoiceNumber')}
            placeholder="اختياري"
          />
          {form.formState.errors.invoiceNumber && <p className="text-xs text-destructive mt-1">{form.formState.errors.invoiceNumber.message}</p>}
        </div>


        {/* Overall Destination Warehouse */}
        <div>
          <Label htmlFor="destinationWarehouseId">مخزن الوجهة (لجميع الأصناف)</Label>
          <Controller
            name="destinationWarehouseId"
            control={form.control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ''}>
                <SelectTrigger id="destinationWarehouseId">
                  <SelectValue placeholder="اختر المخزن..." />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.name} {wh.isDefault ? '(افتراضي)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <p className="text-xs text-muted-foreground mt-1">يمكن تغيير المخزن لكل صنف في الجدول أدناه.</p>
          {form.formState.errors.destinationWarehouseId && <p className="text-xs text-destructive mt-1">{form.formState.errors.destinationWarehouseId.message}</p>}
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
                  <span className="text-sm text-muted-foreground">الكود: {product.id.substring(0, 6)}</span>
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
                <TableHead className="w-[25%]">المنتج</TableHead>
                <TableHead>الكمية</TableHead>
                <TableHead>تكلفة الوحدة</TableHead>
                <TableHead>الصلاحية</TableHead>
                <TableHead>المخزن</TableHead> {/* Added Warehouse Header */}
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
                          className="h-8 w-20" // Adjusted width
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
                          className="h-8 w-20" // Adjusted width
                          onChange={e => inputField.onChange(parseFloat(e.target.value) || 0)}
                          value={inputField.value || ''}
                        />
                      )}
                    />
                    {form.formState.errors.items?.[index]?.cost && <p className="text-xs text-destructive mt-1">{form.formState.errors.items?.[index]?.cost?.message}</p>}
                  </TableCell>
                  <TableCell> {/* Expiry Date Picker Cell */}
                    <Controller
                      name={`items.${index}.expiryDate`}
                      control={form.control}
                      render={({ field: dateField }) => (
                        <DatePicker
                          date={dateField.value}
                          setDate={(date) => dateField.onChange(date)}
                          buttonClassName="w-32 justify-start text-left font-normal h-8 text-xs px-2 py-1" // Small date picker button
                          buttonContent={dateField.value ? undefined : <span className='flex items-center'><CalendarIcon className="mr-1 h-3 w-3" /> اختياري </span>} // Placeholder text
                        />
                      )}
                    />
                    {form.formState.errors.items?.[index]?.expiryDate && <p className="text-xs text-destructive mt-1">{form.formState.errors.items?.[index]?.expiryDate?.message}</p>}
                  </TableCell>
                  <TableCell> {/* Warehouse Select Cell */}
                    <Controller
                      name={`items.${index}.warehouseId`}
                      control={form.control}
                      render={({ field: selectField }) => (
                        <Select onValueChange={selectField.onChange} value={selectField.value || ''}>
                          <SelectTrigger className="h-8 text-xs w-32">
                            <SelectValue placeholder="اختر مخزن..." />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouses.map((wh) => (
                              <SelectItem key={wh.id} value={wh.id}>
                                {wh.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.items?.[index]?.warehouseId && <p className="text-xs text-destructive mt-1">{form.formState.errors.items?.[index]?.warehouseId?.message}</p>}
                  </TableCell>
                  <TableCell>
                    {((form.watch(`items.${index}.quantity`) || 0) * (form.watch(`items.${index}.cost`) || 0)).toFixed(2)} ج.م
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
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground"> {/* Adjusted colspan */}
                    لم يتم إضافة أصناف بعد. ابحث عن منتج وأضفه.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {form.formState.errors.items?.root && <p className="text-xs text-destructive mt-1">{form.formState.errors.items.root.message}</p>}
      </div>

      {/* Split Payments Section */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex justify-between items-center">
          <Label className="text-lg font-semibold">الدفعات</Label>
          <Button type="button" variant="outline" size="sm" onClick={handleAddPayment} disabled={treasuries.length === 0 || isLoading}>
            <Plus className="h-4 w-4 ml-1" /> إضافة دفعة
          </Button>
        </div>

        {payments.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4 border rounded-md">
            لا توجد دفعات. اضغط "إضافة دفعة" للبدء.
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map((payment, index) => {
              const treasury = treasuries.find(t => t.id === payment.treasuryId);
              const paymentMethodMap: Record<string, { label: string; icon: React.ElementType }> = {
                'cash': { label: 'نقداً', icon: Coins },
                'card': { label: 'بطاقة', icon: CreditCard },
                'instapay': { label: 'إنستا باي', icon: Smartphone },
                'vodafone_cash': { label: 'فودافون كاش', icon: Wallet },
                'debt': { label: 'آجل', icon: Landmark },
              };

              return (
                <div key={index} className="border rounded-md p-3 space-y-2 bg-muted/30">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">دفعة {index + 1}</span>
                    {payments.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemovePayment(index)}>
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">الخزينة</Label>
                      <Select value={payment.treasuryId} onValueChange={(value) => handleUpdatePaymentTreasury(index, value)}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="اختر الخزينة..." />
                        </SelectTrigger>
                        <SelectContent>
                          {treasuries.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              <div className="flex items-center gap-2">
                                {t.paymentMethodType && paymentMethodMap[t.paymentMethodType] && (
                                  React.createElement(paymentMethodMap[t.paymentMethodType].icon, { className: "h-4 w-4" })
                                )}
                                {t.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">المبلغ (ج.م)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={payment.amount || ''}
                        onChange={(e) => handleUpdatePaymentAmount(index, parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Payment Summary */}
        <div className="space-y-1 text-sm bg-muted/50 p-3 rounded-md">
          <div className="flex justify-between font-semibold">
            <span>إجمالي الفاتورة:</span>
            <span>{totalAmount.toFixed(2)} ج.م</span>
          </div>
          <div className="flex justify-between text-blue-600 font-medium">
            <span>إجمالي المدفوع:</span>
            <span>{totalPaid.toFixed(2)} ج.م</span>
          </div>
          <Separator className="my-2" />
          {remainingToPay > 0 && (
            <div className="flex justify-between text-destructive font-medium">
              <span>المبلغ المتبقي (على الحساب):</span>
              <span>{remainingToPay.toFixed(2)} ج.م</span>
            </div>
          )}
          {remainingToPay < 0 && (
            <div className="flex justify-between text-yellow-600 font-medium">
              <span>مدفوع زيادة:</span>
              <span>{Math.abs(remainingToPay).toFixed(2)} ج.م</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Section: Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          إلغاء
        </Button>
        <Button type="submit" disabled={isLoading || fields.length === 0 || payments.length === 0}>
          {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Plus className="ml-2 h-4 w-4" />}
          {isLoading ? 'جاري الحفظ...' : 'حفظ فاتورة الشراء'}
        </Button>
      </div>
    </form>
  );
}
