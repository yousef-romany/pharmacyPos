
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, User as UserIcon, LockKeyhole, Briefcase } from 'lucide-react'; // Updated icons
import type { User, UserRole } from '@/lib/types';
import { getUsers, addUser, updateUser, deleteUser } from '@/lib/data'; // Import user data functions
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { Badge } from '@/components/ui/badge'; // Import Badge
import { cn } from '@/lib/utils';

// --- User Roles Mapping ---
const userRoles: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'مدير النظام' },
  { value: 'manager', label: 'مدير صيدلية' },
  { value: 'seller', label: 'بائع' },
  { value: 'accountant', label: 'محاسب' },
];

const roleColors: Record<UserRole, string> = {
  admin: 'bg-red-600 hover:bg-red-700',
  manager: 'bg-blue-600 hover:bg-blue-700',
  seller: 'bg-green-600 hover:bg-green-700',
  accountant: 'bg-purple-600 hover:bg-purple-700',
};


// --- User Form ---
interface UserFormProps {
  initialData?: User | null;
  onSubmit: (data: Omit<User, 'id'> | User) => Promise<void>;
  onClose: () => void;
}

function UserForm({ initialData, onSubmit, onClose }: UserFormProps) {
  const [formData, setFormData] = React.useState<Omit<User, 'id'>>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    role: initialData?.role || 'seller', // Default role
  });
  const [isLoading, setIsLoading] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

   const handleRoleChange = (value: UserRole) => {
        setFormData((prev) => ({ ...prev, role: value }));
   };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
     try {
        const userData = initialData ? { ...initialData, ...formData } : formData;
        // Add password handling here if implementing authentication
        // Example: if (!initialData || formData.password) { userData.password = hash(formData.password); }
        await onSubmit(userData);
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
        <Label htmlFor="name">اسم المستخدم</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
      </div>
       <div>
            <Label htmlFor="role">الدور/الصلاحية</Label>
            <Select onValueChange={handleRoleChange} defaultValue={formData.role} value={formData.role}>
                 <SelectTrigger id="role">
                    <SelectValue placeholder="اختر الدور..." />
                 </SelectTrigger>
                 <SelectContent>
                    {userRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                             {role.label}
                         </SelectItem>
                    ))}
                 </SelectContent>
             </Select>
       </div>
       {/* Add password field if needed */}
       {/* <div>
         <Label htmlFor="password">{initialData ? 'كلمة مرور جديدة (اختياري)' : 'كلمة المرور'}</Label>
         <Input id="password" name="password" type="password" onChange={handleChange} required={!initialData} />
       </div> */}
      <DialogFooter>
         <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
        </DialogClose>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'جاري الحفظ...' : (initialData ? 'تحديث المستخدم' : 'إضافة مستخدم')}
        </Button>
      </DialogFooter>
    </form>
  );
}


// --- Users Table ---
export default function UsersPage() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const { toast } = useToast();

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({ title: "خطأ", description: "فشل تحميل قائمة المستخدمين.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = async (userData: Omit<User, 'id'>) => {
     try {
      await addUser(userData);
      toast({ title: "نجاح", description: "تمت إضافة المستخدم بنجاح." });
      fetchUsers(); // Refresh list
    } catch (error) {
       console.error("Failed to add user:", error);
       toast({ title: "خطأ", description: "فشلت إضافة المستخدم.", variant: "destructive" });
    }
  };

  const handleUpdateUser = async (userData: User) => {
    if (!userData.id) return;
     try {
        await updateUser(userData.id, userData);
        toast({ title: "نجاح", description: "تم تحديث المستخدم بنجاح." });
        setEditingUser(null);
        fetchUsers(); // Refresh list
     } catch (error) {
         console.error("Failed to update user:", error);
         toast({ title: "خطأ", description: "فشل تحديث المستخدم.", variant: "destructive" });
     }
  };

  const handleDeleteUser = async (userId: string) => {
     try {
        const success = await deleteUser(userId);
        if(success) {
            toast({ title: "نجاح", description: "تم حذف المستخدم بنجاح.", variant: "destructive" });
            fetchUsers(); // Refresh list
        } else {
             throw new Error("Delete operation returned false");
        }
     } catch (error) {
         console.error("Failed to delete user:", error);
         toast({ title: "خطأ", description: "فشل حذف المستخدم.", variant: "destructive" });
     }
  };


  const columns: ColumnDef<User>[] = [
    {
        accessorKey: "name",
        header: "اسم المستخدم",
    },
    {
        accessorKey: "email",
        header: "البريد الإلكتروني",
    },
    {
        accessorKey: "role",
        header: "الدور/الصلاحية",
         cell: ({ row }) => {
             const role = row.original.role;
             const roleInfo = userRoles.find(r => r.value === role);
             const color = roleColors[role] || 'bg-gray-500 hover:bg-gray-600'; // Fallback color
             return <Badge className={cn("text-white", color)}>{roleInfo?.label || role}</Badge>;
         },
         filterFn: (row, id, value) => { // Custom filter for role dropdown
             return value.includes(row.getValue(id));
         },
    },
    {
      id: "actions",
      header: "إجراءات",
      cell: ({ row }) => (
        <div className="flex justify-end space-x-1 space-x-reverse">
           <DialogTrigger asChild>
             <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => setEditingUser(row.original)}>
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
                         هل أنت متأكد أنك تريد حذف المستخدم "{row.original.name}"؟
                     </AlertDialogDescription>
                 </AlertDialogHeader>
                 <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                     <AlertDialogAction
                         className="bg-destructive hover:bg-destructive/90"
                         onClick={() => handleDeleteUser(row.original.id)}>
                         حذف
                     </AlertDialogAction>
                 </AlertDialogFooter>
             </AlertDialogContent>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: users,
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
      setEditingUser(null);
  };


  return (
      <AlertDialog> {/* Wrap with AlertDialog for delete confirmation */}
       <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) handleCloseForm(); else setIsFormOpen(true); }}> {/* Manage Dialog state */}
            <div className="p-4 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                 <h2 className="text-2xl font-semibold flex items-center gap-2">
                   <UserIcon className="w-6 h-6" />
                   إدارة المستخدمين والصلاحيات
                 </h2>
                <DialogTrigger asChild>
                    <Button onClick={() => { setEditingUser(null); setIsFormOpen(true); }}> {/* Ensure editingUser is null for add */}
                        <PlusCircle className="ml-2 h-5 w-5" />
                        إضافة مستخدم
                    </Button>
                </DialogTrigger>
              </div>

               <div className="flex items-center py-4 gap-4">
                 <Input
                    placeholder="ابحث بالاسم أو الإيميل..."
                     value={(table.getColumn("name")?.getFilterValue() as string) ?? (table.getColumn("email")?.getFilterValue() as string) ?? ""}
                     onChange={(event) =>{
                         table.getColumn("name")?.setFilterValue(event.target.value);
                         table.getColumn("email")?.setFilterValue(event.target.value); // Search both name and email
                      }
                    }
                    className="max-w-sm"
                 />
                  {/* Role Filter Dropdown */}
                  <Select
                      value={(table.getColumn("role")?.getFilterValue() as string) ?? ""}
                      onValueChange={(value) => table.getColumn("role")?.setFilterValue(value === "all" ? "" : value)}
                   >
                       <SelectTrigger className="w-[180px]">
                           <SelectValue placeholder="فلتر حسب الدور" />
                       </SelectTrigger>
                       <SelectContent>
                           <SelectItem value="all">جميع الأدوار</SelectItem>
                           {userRoles.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                  {role.label}
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
                             onClick={header.column.getToggleSortingHandler()}
                             className={cn(header.column.getCanSort() ? 'cursor-pointer select-none' : '', 'whitespace-nowrap')}
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
                             <Skeleton className="h-4 w-1/2 mx-auto mb-2" />
                             <Skeleton className="h-4 w-1/3 mx-auto" />
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
                          لا يوجد مستخدمين لعرضهم.
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
                 <DialogTitle>{editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
                </DialogHeader>
                <UserForm
                    initialData={editingUser}
                    onSubmit={editingUser ? handleUpdateUser : handleAddUser}
                    onClose={handleCloseForm}
                />
            </DialogContent>
        </Dialog>
     </AlertDialog>
  );
}
