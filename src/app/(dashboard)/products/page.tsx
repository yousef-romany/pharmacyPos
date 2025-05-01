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
import { PlusCircle, Edit, Trash2, Package, Pill, Baby, SprayCan, Activity } from 'lucide-react';
import type { Product } from '@/lib/types';
import { getProducts, addProduct, updateProduct, deleteProduct } from '@/lib/data'; // Import CRUD functions

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
    categoryIconName: getIconName(initialData?.categoryIcon) || 'Pill', // Store icon name as string
  });
  const [isLoading, setIsLoading] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'quantity' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const categoryIcon = getIconComponent(formData.categoryIconName); // Get component from name
      const productData: Omit<Product, 'id'> | Product = initialData
        ? { ...initialData, ...formData, categoryIcon }
        : { ...formData, categoryIcon };

      await onSubmit(productData);
      onClose(); // Close dialog on success
    } catch (error) {
        console.error("Form submission error:", error);
        // Optionally show an error toast here
    } finally {
        setIsLoading(false);
    }
  };

  // Helper to get icon name from component (simple implementation)
  function getIconName(IconComponent?: React.ComponentType<any>): string | undefined {
    if (IconComponent === Pill) return 'Pill';
    if (IconComponent === Baby) return 'Baby';
    if (IconComponent === SprayCan) return 'SprayCan';
    if (IconComponent === Activity) return 'Activity';
    return undefined;
  }

  // Helper to get icon component from name
    function getIconComponent(name?: string): React.ComponentType<any> | undefined {
    switch (name) {
      case 'Pill': return Pill;
      case 'Baby': return Baby;
      case 'SprayCan': return SprayCan;
      case 'Activity': return Activity;
      default: return Pill; // Default to Pill if unknown or undefined
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
      <div>
        <Label htmlFor="nameAr">الاسم (عربي)</Label>
        <Input id="nameAr" name="nameAr" value={formData.nameAr} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="nameEn">الاسم (إنجليزي)</Label>
        <Input id="nameEn" name="nameEn" value={formData.nameEn} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="price">السعر (ر.س)</Label>
        <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="quantity">الكمية</Label>
        <Input id="quantity" name="quantity" type="number" value={formData.quantity} onChange={handleChange} required />
      </div>
       <div>
        <Label htmlFor="categoryIconName">أيقونة الفئة</Label>
        <select
            id="categoryIconName"
            name="categoryIconName"
            value={formData.categoryIconName}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded-md bg-background text-foreground" // Basic select styling
            required
        >
            {categoryIcons.map(({ name, label }) => (
                <option key={name} value={name}>{label}</option>
            ))}
        </select>
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
      header: "الفئة",
      cell: ({ row }) => {
          const Icon = row.original.categoryIcon || Package;
          return <Icon className="w-5 h-5 text-muted-foreground mx-auto" />; // Center icon
      },
       enableSorting: false,
       enableHiding: false,
    },
    {
      accessorKey: "nameAr",
      header: "الاسم (عربي)",
    },
    {
      accessorKey: "nameEn",
      header: "الاسم (إنجليزي)",
    },
    {
      accessorKey: "price",
      header: "السعر (ر.س)",
       cell: ({ row }) => ` ${row.original.price.toFixed(2)}`,
    },
    {
      accessorKey: "quantity",
      header: "الكمية",
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
           {/* Alert Dialog for Delete Confirmation */}
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
        pagination: { pageSize: 15 }, // Set page size
    }
  });

   // Close form and reset editing state
  const handleCloseForm = () => {
      setIsFormOpen(false);
      setEditingProduct(null);
  };


  return (
      <AlertDialog> {/* Wrap with AlertDialog for delete confirmation */}
       <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) handleCloseForm(); else setIsFormOpen(true); }}> {/* Manage Dialog state */}
            <div className="p-4 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">إدارة الأصناف</h2>
                <DialogTrigger asChild>
                    <Button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }}> {/* Ensure editingProduct is null for add */}
                        <PlusCircle className="ml-2 h-5 w-5" />
                        إضافة منتج
                    </Button>
                </DialogTrigger>
              </div>

               <div className="flex items-center py-4">
                 <Input
                    placeholder="ابحث بالاسم العربي..."
                    value={(table.getColumn("nameAr")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("nameAr")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                 />
             </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}
                             onClick={header.column.getToggleSortingHandler()}
                             className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                                {{
                                asc: ' 🔼',
                                desc: ' 🔽',
                                }[header.column.getIsSorted() as string] ?? null}
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
                            <TableCell key={cell.id}>
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

             {/* Dialog Content for Add/Edit */}
            <DialogContent className="sm:max-w-[425px]">
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
