
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Package, Pill, Baby, SprayCan, Activity, Barcode, Boxes, Percent, Calendar, AlertCircle, BadgePercent, Building, Beaker, FlaskConical, Warehouse as WarehouseIcon } from 'lucide-react'; // Added FlaskConical for active ingredient, WarehouseIcon
import type { Product, Warehouse } from '@/lib/types'; // Import Warehouse type
import { getProducts, addProduct, updateProduct, deleteProduct, calculateDaysUntilExpiry, getWarehouses } from '@/lib/data'; // Import CRUD functions, expiry helper, getWarehouses
import { DatePicker } from '@/components/ui/date-picker'; // Import DatePicker
import { format } from 'date-fns'; // Import format function
import { arSA } from 'date-fns/locale'; // Import Arabic locale
import { cn } from '@/lib/utils'; // Import cn for conditional classes
import { Separator } from '@/components/ui/separator'; // Import Separator

// Helper function to get icon component name (adjust if needed)
function getIconName(IconComponent?: React.ComponentType<any>): string | undefined {
  if (!IconComponent) return undefined;
  // Example: Check specific components
  if (IconComponent === Pill) return 'Pill';
  if (IconComponent === Baby) return 'Baby';
  if (IconComponent === SprayCan) return 'SprayCan';
  if (IconComponent === Activity) return 'Activity';
  // Add other mappings if necessary
  return IconComponent.displayName || IconComponent.name || undefined; // Fallback using component name/displayName
}
// Helper function to get icon component from name (adjust if needed)
function getIconComponent(name?: string): React.ComponentType<any> | undefined {
  switch (name) {
    case 'Pill': return Pill;
    case 'Baby': return Baby;
    case 'SprayCan': return SprayCan;
    case 'Activity': return Activity;
    default: return Pill; // Default or handle unknown case
  }
}

// --- Product Form ---
interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (data: Omit<Product, 'id'> | Product) => Promise<void>;
  onClose: () => void;
  warehouses: Warehouse[]; // Add warehouses prop
}

function ProductForm({ initialData, onSubmit, onClose, warehouses }: ProductFormProps) {
  const [formData, setFormData] = React.useState<Omit<Product, 'id' | 'categoryIcon'> & { categoryIconName?: string }>({
    nameAr: initialData?.nameAr || '',
    nameEn: initialData?.nameEn || '',
    manufacturer: initialData?.manufacturer || '',
    concentration: initialData?.concentration || '',
    activeIngredient: initialData?.activeIngredient || '',
    price: initialData?.price || '0', // Keep as string initially
    quantity: initialData?.quantity || '0', // Keep as string initially
    barcode: initialData?.barcode || '',
    categoryIconName: getIconName(initialData?.categoryIcon) || 'Pill',
    unitType: initialData?.unitType || 'قطعة',
    subUnitType: initialData?.subUnitType || '',
    subUnitsPerUnit: initialData?.subUnitsPerUnit || undefined,
    discountRate: initialData?.discountRate || undefined,
    expiryDate: initialData?.expiryDate ? new Date(initialData.expiryDate) : undefined,
    minStockLevel: initialData?.minStockLevel || undefined,
    warehouseId: initialData?.warehouseId || '', // Initialize warehouseId
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast(); // Moved toast hook here

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value, // Keep values as strings for input fields
    }));
  };

  const handleSelectChange = (name: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
      const discountRateNum = parseFloat(formData.discountRate || '0');
      const minStockLevelNum = parseInt(formData.minStockLevel?.toString() || '-1');
      const subUnitsNum = parseInt(formData.subUnitsPerUnit?.toString() || '0');

      if (formData.discountRate !== undefined && (discountRateNum < 0 || discountRateNum > 100)) {
        toast({ title: "خطأ", description: "نسبة الخصم يجب أن تكون بين 0 و 100.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      if (formData.minStockLevel !== undefined && minStockLevelNum < 0) {
        toast({ title: "خطأ", description: "الحد الأدنى للمخزون لا يمكن أن يكون سالباً.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      if (subUnitsNum > 0 && !formData.subUnitType?.trim()) {
        toast({ title: "خطأ", description: "يجب إدخال اسم الوحدة الفرعية عند تحديد عددها.", variant: "destructive" });
        setIsLoading(false);
        return;
      } else if (subUnitsNum <= 0) {
        formData.subUnitType = ''; // Clear sub-unit type if count is invalid/missing
        formData.subUnitsPerUnit = undefined;
      }
      // Validate warehouse selection
      if (!formData.warehouseId) {
        toast({ title: "خطأ", description: "يجب اختيار المخزن.", variant: "destructive" });
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


  const categoryIcons = [
    { name: 'Pill', label: 'أقراص/حبوب', Icon: Pill },
    { name: 'Baby', label: 'مستلزمات أطفال', Icon: Baby },
    { name: 'SprayCan', label: 'بخاخ/شراب', Icon: SprayCan },
    { name: 'Activity', label: 'مكملات/فيتامينات', Icon: Activity },
  ];


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Main Product Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="nameAr">الاسم (عربي) <span className="text-destructive">*</span></Label>
          <Input id="nameAr" name="nameAr" value={formData.nameAr} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="nameEn">الاسم (إنجليزي) <span className="text-destructive">*</span></Label>
          <Input id="nameEn" name="nameEn" value={formData.nameEn} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="manufacturer">الشركة المصنعة</Label>
          <Input id="manufacturer" name="manufacturer" value={formData.manufacturer || ''} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="concentration">التركيز</Label>
          <Input id="concentration" name="concentration" value={formData.concentration || ''} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="activeIngredient">المادة الفعالة</Label>
          <Input id="activeIngredient" name="activeIngredient" value={formData.activeIngredient || ''} onChange={handleChange} placeholder="مثل: باراسيتامول" />
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
        {/* Warehouse Selection */}
        <div>
          <Label htmlFor="warehouseId">المخزن <span className="text-destructive">*</span></Label>
          <Select
            value={formData.warehouseId || ''}
            onValueChange={(value) => handleSelectChange('warehouseId', value)}
            required
          >
            <SelectTrigger id="warehouseId" className="mt-1">
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
        </div>
      </div>

      <Separator className="my-4" />

      {/* Pricing, Quantity, Units Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="unitType">الوحدة الرئيسية <span className="text-destructive">*</span></Label>
          <Input id="unitType" name="unitType" placeholder="مثل: علبة, زجاجة..." value={formData.unitType} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="price">سعر الوحدة الرئيسية (ج.م) <span className="text-destructive">*</span></Label>
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
        {/* Sub-unit section */}
        <div>
          <Label htmlFor="subUnitType">الوحدة الفرعية</Label>
          <Input id="subUnitType" name="subUnitType" placeholder="مثل: شريط, حبة..." value={formData.subUnitType || ''} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="subUnitsPerUnit">عدد الوحدات الفرعية / الرئيسية</Label>
          <Input id="subUnitsPerUnit" name="subUnitsPerUnit" type="number" min="1" step="1" placeholder="مثل: 2" value={formData.subUnitsPerUnit || ''} onChange={handleChange} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground col-span-full md:col-span-2 lg:col-span-3">
        إذا كان المنتج يباع بوحدة أصغر (مثل شريط داخل علبة)، أدخل اسم الوحدة الفرعية وعددها داخل الوحدة الرئيسية.
      </p>

      <Separator className="my-4" />

      {/* Expiry and Discount Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]); // State for warehouses
  const [warehouseMap, setWarehouseMap] = React.useState<Map<string, string>>(new Map()); // Map warehouse ID to name
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const { toast } = useToast();

  const fetchProductsAndWarehouses = React.useCallback(async () => {
    setIsLoading(true);
    setIsLoadingWarehouses(true);
    try {
      const [productData, warehouseData] = await Promise.all([
        getProducts(),
        getWarehouses()
      ]);
      setProducts(productData);
      setWarehouses(warehouseData);

      const wMap = new Map<string, string>();
      warehouseData.forEach(w => wMap.set(w.id, w.name));
      setWarehouseMap(wMap);

    } catch (error) {
      console.error("Failed to fetch products or warehouses:", error);
      toast({ title: "خطأ", description: "فشل تحميل البيانات الأولية.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsLoadingWarehouses(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchProductsAndWarehouses();
  }, [fetchProductsAndWarehouses]);

  const handleAddProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      await addProduct(productData);
      toast({ title: "نجاح", description: "تمت إضافة المنتج بنجاح." });
      fetchProductsAndWarehouses(); // Refresh list
    } catch (error) {
      console.error("Failed to add product:", error);
      toast({ title: "خطأ", description: `فشلت إضافة المنتج: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
    }
  };

  const handleUpdateProduct = async (productData: Product) => {
    if (!productData.id) return; // Should have id if editing
    try {
      await updateProduct(productData.id, productData);
      toast({ title: "نجاح", description: "تم تحديث المنتج بنجاح." });
      setEditingProduct(null); // Clear editing state
      fetchProductsAndWarehouses(); // Refresh list
    } catch (error) {
      console.error("Failed to update product:", error);
      toast({ title: "خطأ", description: `فشل تحديث المنتج: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const success = await deleteProduct(productId);
      if (success) {
        toast({ title: "نجاح", description: "تم حذف المنتج بنجاح.", variant: "destructive" });
        fetchProductsAndWarehouses(); // Refresh list
      } else {
        throw new Error("Delete operation returned false");
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast({ title: "خطأ", description: `فشل حذف المنتج: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
    }
  };


  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "categoryIcon",
      header: "",
      cell: ({ row }) => {
        const Icon = row.original.categoryIcon || Package;
        // Handle case where Icon might be a Lucide icon directly
        if (typeof Icon === 'function') {
          return <Icon className="w-5 h-5 text-muted-foreground mx-auto" />;
        }
        return <Package className="w-5 h-5 text-muted-foreground mx-auto" />; // Fallback
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
          {row.original.concentration && <span className="text-xs text-muted-foreground/80">{row.original.concentration}</span>}
        </div>
      ),
      size: 220, // Increased size for more info
    },
    {
      accessorKey: "activeIngredient", // Added Active Ingredient column
      header: "المادة الفعالة",
      cell: ({ row }) => row.original.activeIngredient || '-',
      size: 140,
    },
    {
      accessorKey: "manufacturer", // Added Manufacturer column
      header: "الشركة",
      cell: ({ row }) => row.original.manufacturer || '-',
      size: 120,
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
          <span>{parseFloat(row.original.price || '0').toFixed(2)}</span>
          {row.original.discountRate && parseFloat(row.original.discountRate) > 0 && (
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
        const qty = parseFloat(row.original.quantity || '0');
        const minStock = row.original.minStockLevel;
        const isLowStock = minStock !== undefined && qty <= minStock;
        return (
          <div className="flex items-center gap-1">
            <span className={cn(isLowStock && "text-amber-600 font-bold")}>
              {Number.isInteger(qty) ? qty : qty.toFixed(2)} {/* Handle potential fractional quantity */}
            </span>
            {isLowStock && <AlertCircle className="w-4 h-4 text-amber-600" title={`الكمية أقل من الحد الأدنى (${minStock})`} />}
          </div>
        );
      },
      size: 90,
    },
    {
      accessorKey: "warehouseId", // Add warehouse column
      header: "المخزن",
      cell: ({ row }) => warehouseMap.get(row.original.warehouseId || '') || '-',
      size: 120,
      filterFn: (row, id, value) => { // Filter function for warehouse
        return value.includes(row.getValue(id));
      },
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

          <div className="flex items-center py-4 gap-4 flex-wrap"> {/* Allow wrapping */}
            <Input
              placeholder="ابحث بالاسم..."
              value={(table.getColumn("nameAr")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("nameAr")?.setFilterValue(event.target.value)
              }
              className="max-w-xs"
            />
            <Input
              placeholder="ابحث بالشركة..."
              value={(table.getColumn("manufacturer")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("manufacturer")?.setFilterValue(event.target.value)
              }
              className="max-w-xs"
            />
            <Input
              placeholder="ابحث بالمادة الفعالة..."
              value={(table.getColumn("activeIngredient")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("activeIngredient")?.setFilterValue(event.target.value)
              }
              className="max-w-xs"
            />
            <Input
              placeholder="ابحث بالباركود..."
              value={(table.getColumn("barcode")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("barcode")?.setFilterValue(event.target.value)
              }
              className="max-w-xs" // Shorter width for barcode search
            />
            {/* Warehouse Filter */}
            <Select
              value={(table.getColumn("warehouseId")?.getFilterValue() as string) ?? "all"}
              onValueChange={(value) => table.getColumn("warehouseId")?.setFilterValue(value === "all" ? "" : value)}
              disabled={isLoadingWarehouses}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="فلتر حسب المخزن" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المخازن</SelectItem>
                {warehouses.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                      className={cn( // Apply row background based on expiry
                        row.original.expiryDate && calculateDaysUntilExpiry(new Date(row.original.expiryDate)) < 0 ? "bg-red-100/30" :
                          row.original.expiryDate && calculateDaysUntilExpiry(new Date(row.original.expiryDate)) <= 60 ? "bg-orange-100/30" : ""
                      )}
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
                      لا يوجد منتجات لعرضها.
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

        <DialogContent className="sm:max-w-4xl"> {/* Wider dialog */}
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</DialogTitle>
          </DialogHeader>
          <ProductForm
            initialData={editingProduct}
            onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
            onClose={handleCloseForm}
            warehouses={warehouses} // Pass warehouses to the form
          />
        </DialogContent>
      </Dialog>
    </AlertDialog>
  );
}
