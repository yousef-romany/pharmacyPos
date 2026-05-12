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
import { PlusCircle, Edit, Trash2, Building } from 'lucide-react';
import type { Supplier } from '@/lib/types';
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier } from '@/lib/data';

// --- Supplier Form ---
interface SupplierFormProps {
  initialData?: Supplier | null;
  onSubmit: (data: Omit<Supplier, 'id'> | Supplier) => Promise<void>;
  onClose: () => void;
}

function SupplierForm({ initialData, onSubmit, onClose }: SupplierFormProps) {
  const [formData, setFormData] = React.useState<Omit<Supplier, 'id'>>({
    name: initialData?.name || '',
    contactPerson: initialData?.contactPerson || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
  });
  const [isLoading, setIsLoading] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
     try {
        const supplierData = initialData ? { ...initialData, ...formData } : formData;
        await onSubmit(supplierData);
        onClose(); // Close dialog on success
     } catch (error) {
        console.error("Form submission error:", error);
        // Optionally show error toast
     } finally {
         setIsLoading(false);
     }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">اسم المورد</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="contactPerson">الشخص المسؤول</Label>
        <Input id="contactPerson" name="contactPerson" value={formData.contactPerson} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="phone">رقم الهاتف</Label>
        <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="address">العنوان</Label>
        <Input id="address" name="address" value={formData.address} onChange={handleChange} />
      </div>
      <DialogFooter>
        <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
        </DialogClose>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'جاري الحفظ...' : (initialData ? 'تحديث المورد' : 'إضافة مورد')}
        </Button>
      </DialogFooter>
    </form>
  );
}


// --- Suppliers Table ---
export default function SuppliersPage() {
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingSupplier, setEditingSupplier] = React.useState<Supplier | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const { toast } = useToast();

  const fetchSuppliers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
      toast({ title: "خطأ", description: "فشل تحميل قائمة الموردين.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleAddSupplier = async (supplierData: Omit<Supplier, 'id'>) => {
     try {
      await addSupplier(supplierData);
      toast({ title: "نجاح", description: "تمت إضافة المورد بنجاح." });
      fetchSuppliers(); // Refresh list
    } catch (error) {
       console.error("Failed to add supplier:", error);
       toast({ title: "خطأ", description: "فشلت إضافة المورد.", variant: "destructive" });
    }
  };

  const handleUpdateSupplier = async (supplierData: Supplier | Omit<Supplier, 'id'>) => {
    const supplier = supplierData as Supplier;
    if (!supplier.id) return;
     try {
        await updateSupplier(supplier.id, supplier);
        toast({ title: "نجاح", description: "تم تحديث المورد بنجاح." });
        setEditingSupplier(null);
        fetchSuppliers(); // Refresh list
     } catch (error) {
         console.error("Failed to update supplier:", error);
         toast({ title: "خطأ", description: "فشل تحديث المورد.", variant: "destructive" });
     }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
     try {
        const success = await deleteSupplier(supplierId);
        if(success) {
            toast({ title: "نجاح", description: "تم حذف المورد بنجاح.", variant: "destructive" });
            fetchSuppliers(); // Refresh list
        } else {
             throw new Error("Delete operation returned false");
        }
     } catch (error) {
         console.error("Failed to delete supplier:", error);
         toast({ title: "خطأ", description: "فشل حذف المورد.", variant: "destructive" });
     }
  };


  const columns: ColumnDef<Supplier>[] = [
    {
        accessorKey: "name",
        header: "اسم المورد",
    },
    {
        accessorKey: "contactPerson",
        header: "الشخص المسؤول",
    },
    {
        accessorKey: "phone",
        header: "الهاتف",
    },
    {
        accessorKey: "email",
        header: "البريد الإلكتروني",
    },
    {
        accessorKey: "address",
        header: "العنوان",
    },
    {
      id: "actions",
      header: "إجراءات",
      cell: ({ row }) => (
        <div className="flex justify-end space-x-1 space-x-reverse">
           <DialogTrigger asChild>
             <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => setEditingSupplier(row.original)}>
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
                         هل أنت متأكد أنك تريد حذف المورد "{row.original.name}"؟
                     </AlertDialogDescription>
                 </AlertDialogHeader>
                 <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                     <AlertDialogAction
                         className="bg-destructive hover:bg-destructive/90"
                         onClick={() => handleDeleteSupplier(row.original.id)}>
                         حذف
                     </AlertDialogAction>
                 </AlertDialogFooter>
             </AlertDialogContent>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: suppliers,
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
        pagination: { pageSize: 10 }, // Set page size
    }
  });

   // Close form and reset editing state
  const handleCloseForm = () => {
      setIsFormOpen(false);
      setEditingSupplier(null);
  };


  return (
      <AlertDialog> {/* Wrap with AlertDialog for delete confirmation */}
       <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) handleCloseForm(); else setIsFormOpen(true); }}> {/* Manage Dialog state */}
            <div className="p-4 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">إدارة الموردين</h2>
                <DialogTrigger asChild>
                    <Button onClick={() => { setEditingSupplier(null); setIsFormOpen(true); }}> {/* Ensure editingSupplier is null for add */}
                        <PlusCircle className="ml-2 h-5 w-5" />
                        إضافة مورد
                    </Button>
                </DialogTrigger>
              </div>

               <div className="flex items-center py-4">
                 <Input
                    placeholder="ابحث باسم المورد..."
                    value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("name")?.setFilterValue(event.target.value)
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
                             className={header.column.getCanSort() ? 'cursor-pointer select-none text-center' : 'text-center'}>
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
                            جاري تحميل الموردين...
                        </TableCell>
                        </TableRow>
                    ) : table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                          
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className='text-center'>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                          لا يوجد موردين لعرضهم.
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
                 <DialogTitle>{editingSupplier ? 'تعديل المورد' : 'إضافة مورد جديد'}</DialogTitle>
                </DialogHeader>
                <SupplierForm
                    initialData={editingSupplier}
                    onSubmit={editingSupplier ? handleUpdateSupplier : handleAddSupplier}
                    onClose={handleCloseForm}
                />
            </DialogContent>
        </Dialog>
     </AlertDialog>
  );
}
