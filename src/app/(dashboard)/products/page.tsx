
'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Package, Pill, Baby, SprayCan, Activity, Barcode, Boxes, Percent, Calendar, AlertCircle, BadgePercent } from 'lucide-react'; // Added relevant icons
import type { Product } from '@/lib/types';
import { getProducts, addProduct, updateProduct, deleteProduct, calculateDaysUntilExpiry } from '@/lib/data'; // Import CRUD functions and expiry helper
import { DatePicker } from '@/components/ui/date-picker'; // Import DatePicker
import { format } from 'date-fns'; // Import format function
import { arSA } from 'date-fns/locale'; // Import Arabic locale
import { cn } from '@/lib/utils'; // Import cn for conditional classes

// --- Product Form ---
interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (data: Omit<Product, 'id'> | Product) => Promise<void>;
  onClose: () => void;
}

function ProductForm({ initialData, onSubmit, onClose }: ProductFormProps) {
  const [formData, setFormData] = React.useState<Omit<Product, 'id' | 'categoryIcon'> & { categoryIconName?: string }>({
    nameAr: initialData?.nameAr || '',
    nameEn: initialData?.nameEn || '',
    price: initialData?.price || 0,
    quantity: initialData?.quantity || 0,
    barcode: initialData?.barcode || '',
    categoryIconName: getIconName(initialData?.categoryIcon) || 'Pill',
    unitType: initialData?.unitType || 'قطعة',
    subUnitType: initialData?.subUnitType || '',
    subUnitsPerUnit: initialData?.subUnitsPerUnit || undefined,
    discountRate: initialData?.discountRate || undefined, // Initialize discountRate
    expiryDate: initialData?.expiryDate ? new Date(initialData.expiryDate) : undefined, // Initialize expiryDate
    minStockLevel: initialData?.minStockLevel || undefined, // Initialize minStockLevel
  });
  const [isLoading, setIsLoading] = React.useState(false);
   const { toast } = useToast(); // Moved toast hook here

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
       [name]: name === 'price' ? parseFloat(value) || 0
             : name === 'quantity' ? parseFloat(value) || 0 // Allow float for quantity
             : name === 'subUnitsPerUnit' ? parseInt(value) || undefined
             : name === 'discountRate' ? parseFloat(value) || undefined // Parse discount
             : name === 'minStockLevel' ? parseInt(value) || undefined // Parse min stock
             : value,
    }));
  };

   const handleDateChange = (date: Date | undefined) => {
     setFormData((prev) => ({ ...prev, expiryDate: date }));
   };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const categoryIcon = getIconComponent(formData.categoryIconName);

       // Basic validation before submitting
       if (formData.discountRate !== undefined && (formData.discountRate < 0 || formData.discountRate > 100)) {
         toast({ title: "خطأ", description: "نسبة الخصم يجب أن تكون بين 0 و 100.", variant: "destructive" });
         setIsLoading(false);
         return;
       }
       if (formData.minStockLevel !== undefined && formData.minStockLevel < 0) {
         toast({ title: "خطأ", description: "الحد الأدنى للمخزون لا يمكن أن يكون سالباً.", variant: "destructive" });
         setIsLoading(false);
         return;
       }
       if (formData.subUnitsPerUnit !== undefined && formData.subUnitsPerUnit <= 0) {
          formData.subUnitType = ''; // Clear sub-unit type if count is invalid/missing
          formData.subUnitsPerUnit = undefined;
       } else if (formData.subUnitsPerUnit && !formData.subUnitType) {
            toast({ title: "خطأ", description: "يجب إدخال اسم الوحدة الفرعية عند تحديد عددها.", variant: "destructive" });
            setIsLoading(false);
            return;
       }


        // Remove the temporary categoryIconName
        const { categoryIconName, ...finalData } = formData;

      const productData: Omit<Product, 'id'> | Product = initialData
        ? { ...initialData, ...finalData, categoryIcon }
        : { ...finalData, categoryIcon };

      await onSubmit(productData);
      onClose(); // Close dialog on success
    } catch (error) {
        console.error("Form submission error:", error);
        toast({ title: "خطأ", description: "فشل حفظ بيانات المنتج.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  // Helper functions for icons (remain the same)
   function getIconName(IconComponent?: React.ComponentType<any>): string | undefined {
    if (IconComponent === Pill) return 'Pill';
    if (IconComponent === Baby) return 'Baby';
    if (IconComponent === SprayCan) return 'SprayCan';
    if (IconComponent === Activity) return 'Activity';
    return undefined;
  }
    function getIconComponent(name?: string): React.ComponentType<any> | undefined {
    switch (name) {
      case 'Pill': return Pill;
      case 'Baby': return Baby;
      case 'SprayCan': return SprayCan;
      case 'Activity': return Activity;
      default: return Pill;
    }
  }
    const categoryIcons = [
      { name: 'Pill', label: 'أقراص/حبوب', Icon: Pill },
      { name: 'Baby', label: 'مستلزمات أطفال', Icon: Baby },
      { name: 'SprayCan', label: 'بخاخ/شراب', Icon: SprayCan },
      { name: 'Activity', label: 'مكملات/فيتامينات', Icon: Activity },
    ];


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
       {/* Main Product Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
             <Label htmlFor="nameAr">الاسم (عربي) <span className="text-destructive">*</span></Label>
             <Input id="nameAr" name="nameAr" value={formData.nameAr} onChange={handleChange} required />
          </div>
          <div>
             <Label htmlFor="nameEn">الاسم (إنجليزي) <span className="text-destructive">*</span></Label>
             <Input id="nameEn" name="nameEn" value={formData.nameEn} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="barcode">الباركود</Label>
            <Input id="barcode" name="barcode" value={formData.barcode || ''} onChange={handleChange} />
          </div>
          <div>
             <Label htmlFor="categoryIconName">أيقونة الفئة</Label>
             <select
                id="categoryIconName"
                name="categoryIconName"
                value={formData.categoryIconName}
                onChange={handleChange}
                className="w-full mt-1 p-2 border rounded-md bg-background text-foreground"
                required
            >
                {categoryIcons.map(({ name, label }) => (
                    <option key={name} value={name}>{label}</option>
                ))}
             </select>
          </div>
            <div>
                <Label htmlFor="unitType">الوحدة الرئيسية <span className="text-destructive">*</span></Label>
                <Input id="unitType" name="unitType" placeholder="مثل: علبة, زجاجة..." value={formData.unitType} onChange={handleChange} required />
            </div>
             <div>
                <Label htmlFor="price">سعر الوحدة الرئيسية (ر.س) <span className="text-destructive">*</span></Label>
                <Input id="price" name="price" type="number" step="0.01" min="0" value={formData.price} onChange={handleChange} required />
            </div>
             <div>
                <Label htmlFor="quantity">كمية الوحدة الرئيسية <span className="text-destructive">*</span></Label>
                <Input id="quantity" name="quantity" type="number" step="any" min="0" value={formData.quantity} onChange={handleChange} required />
            </div>
            <div>
                <Label htmlFor="minStockLevel">حد أدنى للمخزون (تنبيه)</Label>
                <Input id="minStockLevel" name="minStockLevel" type="number" min="0" step="1" placeholder="مثال: 10" value={formData.minStockLevel || ''} onChange={handleChange} />
            </div>

      </div>

       {/* Sub-unit section */}
        <div className="border-t pt-4 mt-4 space-y-4">
             <h4 className="text-md font-medium text-muted-foreground">الوحدة الفرعية (اختياري)</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="subUnitType">الوحدة الفرعية</Label>
                    <Input id="subUnitType" name="subUnitType" placeholder="مثل: شريط, حبة..." value={formData.subUnitType || ''} onChange={handleChange} />
                 </div>
                 <div>
                    <Label htmlFor="subUnitsPerUnit">عدد الوحدات الفرعية / الرئيسية</Label>
                    <Input id="subUnitsPerUnit" name="subUnitsPerUnit" type="number" min="1" step="1" placeholder="مثل: 2" value={formData.subUnitsPerUnit || ''} onChange={handleChange} />
                 </div>
            </div>
             <p className="text-xs text-muted-foreground">
                إذا كان المنتج يباع بوحدة أصغر (مثل شريط داخل علبة)، أدخل اسم الوحدة الفرعية وعددها داخل الوحدة الرئيسية.
             </p>
        </div>

        {/* Expiry and Discount Section */}
        <div className="border-t pt-4 mt-4 space-y-4">
            <h4 className="text-md font-medium text-muted-foreground">الصلاحية والخصم</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="expiryDate">تاريخ انتهاء الصلاحية</Label>
                     <DatePicker
                        date={formData.expiryDate}
                        setDate={handleDateChange}
                        buttonClassName="w-full justify-start text-left font-normal mt-1" // Style date picker button
                    />
                 </div>
                 <div>
                    <Label htmlFor="discountRate">نسبة الخصم (%)</Label>
                     <Input id="discountRate" name="discountRate" type="number" min="0" max="100" step="0.01" placeholder="مثال: 5" value={formData.discountRate || ''} onChange={handleChange} />
                 </div>
            </div>
        </div>


      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
        </DialogClose>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'جاري الحفظ...' : (initialData ? 'تحديث المنتج' : 'إضافة منتج')}
        </Button>
      </DialogFooter>
    </form>
  );
}


// --- Products Table ---
export default function ProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const { toast } = useToast();

  const fetchProducts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast({ title: "خطأ", description: "فشل تحميل قائمة المنتجات.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      await addProduct(productData);
      toast({ title: "نجاح", description: "تمت إضافة المنتج بنجاح." });
      fetchProducts(); // Refresh list
    } catch (error) {
      console.error("Failed to add product:", error);
      toast({ title: "خطأ", description: "فشلت إضافة المنتج.", variant: "destructive" });
    }
  };

  const handleUpdateProduct = async (productData: Product) => {
     if (!productData.id) return; // Should have id if editing
    try {
      await updateProduct(productData.id, productData);
      toast({ title: "نجاح", description: "تم تحديث المنتج بنجاح." });
       setEditingProduct(null); // Clear editing state
      fetchProducts(); // Refresh list
    } catch (error) {
      console.error("Failed to update product:", error);
      toast({ title: "خطأ", description: "فشل تحديث المنتج.", variant: "destructive" });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const success = await deleteProduct(productId);
      if (success) {
        toast({ title: "نجاح", description: "تم حذف المنتج بنجاح.", variant: "destructive" });
        fetchProducts(); // Refresh list
      } else {
          throw new Error("Delete operation returned false");
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast({ title: "خطأ", description: "فشل حذف المنتج.", variant: "destructive" });
    }
  };


  const columns: ColumnDef<Product>[] = [
     {
      accessorKey: "categoryIcon",
      header: "",
      cell: ({ row }) => {
          const Icon = row.original.categoryIcon || Package;
          return <Icon className="w-5 h-5 text-muted-foreground mx-auto" />;
      },
       enableSorting: false,
       enableHiding: false,
       size: 40,
    },
    {
      accessorKey: "nameAr",
      header: "الاسم", // Shorten header
       cell: ({ row }) => (
           <div className="flex flex-col">
               <span className="font-medium">{row.original.nameAr}</span>
               <span className="text-xs text-muted-foreground">{row.original.nameEn}</span>
           </div>
       ),
      size: 200,
    },
     {
        accessorKey: "barcode",
        header: "الباركود",
        cell: ({ row }) => row.original.barcode || '-',
        size: 100,
     },
     {
       accessorKey: "unitType",
       header: "الوحدة",
       cell: ({ row }) => {
            const p = row.original;
            if (p.subUnitType && p.subUnitsPerUnit) {
                return `${p.unitType} (${p.subUnitsPerUnit} ${p.subUnitType})`;
            }
            return p.unitType;
       },
       size: 110,
     },
    {
      accessorKey: "price",
      header: "السعر",
       cell: ({ row }) => (
           <div className="flex items-center gap-1">
               <span>{row.original.price.toFixed(2)}</span>
                {row.original.discountRate && row.original.discountRate > 0 && (
                    <span className="text-xs text-red-600 font-medium">(-{row.original.discountRate}%)</span>
                )}
           </div>
       ),
       size: 90,
    },
    {
      accessorKey: "quantity",
      header: "الكمية",
       cell: ({ row }) => {
            const qty = row.original.quantity;
            const minStock = row.original.minStockLevel;
            const isLowStock = minStock !== undefined && qty <= minStock;
            return (
                <div className="flex items-center gap-1">
                    <span className={cn(isLowStock && "text-amber-600 font-bold")}>
                        {Number.isInteger(qty) ? qty : qty.toFixed(2)}
                    </span>
                    {isLowStock && <AlertCircle className="w-4 h-4 text-amber-600" title={`الكمية أقل من الحد الأدنى (${minStock})`} />}
                 </div>
            );
        },
      size: 90,
    },
    {
      accessorKey: "expiryDate",
      header: "انتهاء الصلاحية",
      cell: ({ row }) => {
           const expiry = row.original.expiryDate;
           if (!expiry) return '-';

           const daysLeft = calculateDaysUntilExpiry(expiry);
           let colorClass = '';
           if (daysLeft < 0) colorClass = 'text-red-700 font-bold'; // Expired
           else if (daysLeft <= 60) colorClass = 'text-orange-600 font-medium'; // Nearing expiry (e.g., 60 days)

           return (
               <span className={cn(colorClass)}>
                   {format(expiry, "dd/MM/yyyy", { locale: arSA })}
                   {daysLeft < 0 && ` (منتهي)`}
                   {daysLeft >= 0 && daysLeft <= 60 && ` (خلال ${daysLeft} يوم)`}
               </span>
           );
      },
       enableSorting: true,
       sortingFn: 'datetime', // Enable date sorting
       size: 140,
    },
    {
      id: "actions",
      header: "إجراءات",
      cell: ({ row }) => (
        <div className="flex justify-end space-x-1 space-x-reverse">
           <DialogTrigger asChild>
             <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => setEditingProduct(row.original)}>
                <Edit className="h-4 w-4" />
             </Button>
           </DialogTrigger>
            <AlertDialogTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                </Button>
           </AlertDialogTrigger>
            <AlertDialogContent>
                 <AlertDialogHeader>
                     <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                     <AlertDialogDescription>
                         هل أنت متأكد أنك تريد حذف المنتج "{row.original.nameAr}"؟ لا يمكن التراجع عن هذا الإجراء.
                     </AlertDialogDescription>
                 </AlertDialogHeader>
                 <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                     <AlertDialogAction
                         className="bg-destructive hover:bg-destructive/90"
                         onClick={() => handleDeleteProduct(row.original.id)}>
                         حذف
                     </AlertDialogAction>
                 </AlertDialogFooter>
             </AlertDialogContent>
        </div>
      ),
      size: 100,
    },
  ];

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
        pagination: { pageSize: 15 },
        sorting: [{ id: 'expiryDate', desc: false }], // Default sort by expiry ascending
    }
  });

  const handleCloseForm = () => {
      setIsFormOpen(false);
      setEditingProduct(null);
  };


  return (
      <AlertDialog>
       <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) handleCloseForm(); else setIsFormOpen(true); }}>
            <div className="p-4 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">إدارة الأصناف</h2>
                <DialogTrigger asChild>
                    <Button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }}>
                        <PlusCircle className="ml-2 h-5 w-5" />
                        إضافة منتج
                    </Button>
                </DialogTrigger>
              </div>

               <div className="flex items-center py-4 gap-4">
                 <Input
                    placeholder="ابحث بالاسم..."
                    value={(table.getColumn("nameAr")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("nameAr")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                 />
                  <Input
                    placeholder="ابحث بالباركود..."
                    value={(table.getColumn("barcode")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("barcode")?.setFilterValue(event.target.value)
                    }
                    className="max-w-xs" // Shorter width for barcode search
                 />
             </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}
                             style={{ width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined }}
                             onClick={header.column.getToggleSortingHandler()}
                             className={cn(header.column.getCanSort() ? 'cursor-pointer select-none' : '', 'whitespace-nowrap')} // Prevent wrapping header
                          >
                            {header.isPlaceholder ? null : flexRender( header.column.columnDef.header, header.getContext() )}
                            {header.column.getCanSort() && { asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string]}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                       <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                            جاري تحميل المنتجات...
                        </TableCell>
                        </TableRow>
                    ) : table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} style={{ width: cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : undefined }}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                          لا توجد منتجات لعرضها.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
                {/* Pagination Controls */}
                <div className="flex items-center justify-end space-x-2 py-4">
                     <span className="text-sm text-muted-foreground">
                         صفحة {table.getState().pagination.pageIndex + 1} من {table.getPageCount()}
                     </span>
                     <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        >
                        السابق
                    </Button>
                     <Button
                         variant="outline"
                         size="sm"
                         onClick={() => table.nextPage()}
                         disabled={!table.getCanNextPage()}
                        >
                        التالي
                    </Button>
                 </div>
            </div>

            <DialogContent className="sm:max-w-2xl"> {/* Wider dialog */}
                <DialogHeader>
                 <DialogTitle>{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</DialogTitle>
                </DialogHeader>
                <ProductForm
                    initialData={editingProduct}
                    onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
                    onClose={handleCloseForm}
                />
            </DialogContent>
        </Dialog>
     </AlertDialog>
  );
}

