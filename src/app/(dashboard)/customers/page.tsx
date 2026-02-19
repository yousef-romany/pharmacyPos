
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
import { PlusCircle, Edit, Trash2, User, Coins, ShieldCheck } from 'lucide-react'; // Added ShieldCheck icon
import type { Customer } from '@/lib/types';
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from '@/lib/data';
import { cn } from '@/lib/utils'; // Import cn
import { Separator } from '@/components/ui/separator'; // Import Separator

// --- Customer Form ---
interface CustomerFormProps {
  initialData?: Customer | null;
  onSubmit: (data: Omit<Customer, 'id'> | Customer) => Promise<void>;
  onClose: () => void;
}

function CustomerForm({ initialData, onSubmit, onClose }: CustomerFormProps) {
  const [formData, setFormData] = React.useState<Omit<Customer, 'id'>>({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    balance: initialData?.balance || 0, // Add balance field
    insuranceCompany: initialData?.insuranceCompany || '',
    policyNumber: initialData?.policyNumber || '',
    insuranceDiscountRate: initialData?.insuranceDiscountRate || undefined,
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'balance' ? parseFloat(value) || 0 // Parse balance as float
        : name === 'insuranceDiscountRate' ? parseFloat(value) || undefined // Parse insurance rate
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Validate insurance rate
      if (formData.insuranceDiscountRate !== undefined && (formData.insuranceDiscountRate < 0 || formData.insuranceDiscountRate > 100)) {
        toast({ title: "خطأ", description: "نسبة خصم التأمين يجب أن تكون بين 0 و 100.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const customerData = initialData ? { ...initialData, ...formData } : formData;
      await onSubmit(customerData);
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
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">اسم العميل <span className="text-destructive">*</span></Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="phone">رقم الهاتف</Label>
          <Input id="phone" name="phone" type="tel" value={formData.phone || ''} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="address">العنوان</Label>
          <Input id="address" name="address" value={formData.address || ''} onChange={handleChange} />
        </div>
      </div>

      <Separator />

      {/* Financial Info */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <Label htmlFor="balance">الرصيد (المديونية/الائتمان)</Label>
          <Input
            id="balance"
            name="balance"
            type="number"
            step="0.01"
            value={formData.balance}
            onChange={handleChange}
          />
          <p className="text-xs text-muted-foreground mt-1">
            أدخل قيمة سالبة للمديونية (عليه)، وقيمة موجبة للائتمان (له).
          </p>
        </div>
      </div>

      <Separator />

      {/* Insurance Info */}
      <h4 className="text-md font-medium">بيانات التأمين (اختياري)</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="insuranceCompany">شركة التأمين</Label>
          <Input id="insuranceCompany" name="insuranceCompany" value={formData.insuranceCompany || ''} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="policyNumber">رقم البوليصة</Label>
          <Input id="policyNumber" name="policyNumber" value={formData.policyNumber || ''} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="insuranceDiscountRate">نسبة الخصم (%)</Label>
          <Input id="insuranceDiscountRate" name="insuranceDiscountRate" type="number" min="0" max="100" step="0.01" placeholder="مثال: 10" value={formData.insuranceDiscountRate || ''} onChange={handleChange} />
          <p className="text-xs text-muted-foreground mt-1">
            نسبة الخصم التي يتحملها التأمين (0-100).
          </p>
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
        </DialogClose>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'جاري الحفظ...' : (initialData ? 'تحديث العميل' : 'إضافة عميل')}
        </Button>
      </DialogFooter>
    </form>
  );
}


// --- Customers Table ---
export default function CustomersPage() {
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const { toast } = useToast();

  const fetchCustomers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toast({ title: "خطأ", description: "فشل تحميل قائمة العملاء.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAddCustomer = async (customerData: Omit<Customer, 'id'>) => {
    try {
      await addCustomer(customerData);
      toast({ title: "نجاح", description: "تمت إضافة العميل بنجاح." });
      fetchCustomers(); // Refresh list
    } catch (error) {
      console.error("Failed to add customer:", error);
      toast({ title: "خطأ", description: "فشلت إضافة العميل.", variant: "destructive" });
    }
  };

  const handleUpdateCustomer = async (customerData: Customer) => {
    if (!customerData.id) return;
    try {
      await updateCustomer(customerData.id, customerData);
      toast({ title: "نجاح", description: "تم تحديث العميل بنجاح." });
      setEditingCustomer(null);
      fetchCustomers(); // Refresh list
    } catch (error) {
      console.error("Failed to update customer:", error);
      toast({ title: "خطأ", description: "فشل تحديث العميل.", variant: "destructive" });
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      const success = await deleteCustomer(customerId);
      if (success) {
        toast({ title: "نجاح", description: "تم حذف العميل بنجاح.", variant: "destructive" });
        fetchCustomers(); // Refresh list
      } else {
        throw new Error("Delete operation returned false");
      }
    } catch (error) {
      console.error("Failed to delete customer:", error);
      toast({ title: "خطأ", description: "فشل حذف العميل.", variant: "destructive" });
    }
  };


  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "name",
      header: "اسم العميل",
      size: 150,
    },
    {
      accessorKey: "phone",
      header: "الهاتف",
      size: 120,
    },
    {
      accessorKey: "insuranceCompany",
      header: "التأمين",
      cell: ({ row }) => {
        const customer = row.original;
        if (!customer.insuranceCompany) return '-';
        return (
          <div className='flex flex-col text-xs'>
            <span className='font-medium'>{customer.insuranceCompany}</span>
            {customer.policyNumber && <span className='text-muted-foreground'>#{customer.policyNumber}</span>}
            {customer.insuranceDiscountRate !== undefined && <span className='text-blue-600'>خصم: {customer.insuranceDiscountRate}%</span>}
          </div>
        )
      },
      size: 150,
    },
    {
      accessorKey: "balance",
      header: "الرصيد (ج.م)",
      cell: ({ row }) => {
        const balance = row.original.balance ?? 0;
        const colorClass = balance < 0 ? "text-red-600" : balance > 0 ? "text-green-600" : "text-muted-foreground";
        return <span className={cn("font-semibold", colorClass)}>{balance.toFixed(2)}</span>;
      },
      size: 100,
    },
    {
      id: "actions",
      header: "إجراءات",
      cell: ({ row }) => (
        <div className="flex justify-end space-x-1 space-x-reverse">
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => setEditingCustomer(row.original)}>
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
                هل أنت متأكد أنك تريد حذف العميل "{row.original.name}"؟
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={() => handleDeleteCustomer(row.original.id)}>
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </div>
      ),
      size: 80,
    },
  ];

  const table = useReactTable({
    data: customers,
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
    setEditingCustomer(null);
  };


  return (
    <AlertDialog> {/* Wrap with AlertDialog for delete confirmation */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) handleCloseForm(); else setIsFormOpen(true); }}> {/* Manage Dialog state */}
        <div className="p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">إدارة العملاء</h2>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingCustomer(null); setIsFormOpen(true); }}> {/* Ensure editingCustomer is null for add */}
                <PlusCircle className="ml-2 h-5 w-5" />
                إضافة عميل
              </Button>
            </DialogTrigger>
          </div>

          <div className="flex items-center py-4 gap-4 flex-wrap">
            <Input
              placeholder="ابحث باسم العميل أو الهاتف..."
              value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
              onChange={(event) => {
                table.getColumn("name")?.setFilterValue(event.target.value);
                table.getColumn("phone")?.setFilterValue(event.target.value); // Search both
              }}
              className="max-w-sm"
            />
            <Input
              placeholder="ابحث بشركة التأمين..."
              value={(table.getColumn("insuranceCompany")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("insuranceCompany")?.setFilterValue(event.target.value)
              }
              className="max-w-xs"
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
                        className={cn("text-center", header.column.getCanSort() ? 'cursor-pointer select-none' : '', 'whitespace-nowrap')} // Add whitespace-nowrap
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        {header.column.getCanSort() && {
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string]}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      جاري تحميل العملاء...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell className='text-center' key={cell.id} style={{ width: cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : undefined }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      لا يوجد عملاء لعرضهم.
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
        <DialogContent className="sm:max-w-2xl"> {/* Adjust width */}
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'تعديل العميل' : 'إضافة عميل جديد'}</DialogTitle>
          </DialogHeader>
          <CustomerForm
            initialData={editingCustomer}
            onSubmit={editingCustomer ? handleUpdateCustomer : handleAddCustomer}
            onClose={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </AlertDialog>
  );
}
