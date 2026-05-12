
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
  accountant: 'bg-purple-600 hover:bg-purple-600',
};


// --- User Form ---
interface UserFormProps {
  initialData?: User | null;
  // onSubmit type now includes optional password
  onSubmit: (data: (Omit<User, 'id'> | User) & { password?: string }) => Promise<void>;
  onClose: () => void;
}

function UserForm({ initialData, onSubmit, onClose }: UserFormProps) {
  const [formData, setFormData] = React.useState<Omit<User, 'id'>>({
    username: initialData?.username || '',
    name: initialData?.name || '',
    email: initialData?.email || '',
    role: initialData?.role || 'seller', // Default role
    passwordHash: initialData?.passwordHash || '', // Include passwordHash for display/editing context if needed
  });
  const [password, setPassword] = React.useState(''); // Separate state for password
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

   const handleRoleChange = (value: UserRole) => {
        setFormData((prev) => ({ ...prev, role: value }));
   };

   const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       setPassword(e.target.value);
   };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
     try {
        // Require password for new users
        if (!initialData && !password) {
            toast({ title: "خطأ", description: "كلمة المرور مطلوبة للمستخدم الجديد.", variant: "destructive" });
            setIsLoading(false);
            return;
        }

        // Combine form data and password for submission
        const userData = initialData
           ? { ...initialData, ...formData, ...(password && { password }) } // Include password only if set for update
           : { ...formData, password }; // Password is required for add

        await onSubmit(userData);
        onClose(); // Close dialog on success
     } catch (error) {
        console.error("Form submission error:", error);
         toast({ title: "خطأ", description: "فشل حفظ بيانات المستخدم.", variant: "destructive" });
     } finally {
         setIsLoading(false);
     }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">اسم المستخدم <span className="text-destructive">*</span></Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="email">البريد الإلكتروني <span className="text-destructive">*</span></Label>
        <Input id="email" name="email" type="text" value={formData.email} onChange={handleChange} required />
      </div>
       <div>
            <Label htmlFor="role">الدور/الصلاحية <span className="text-destructive">*</span></Label>
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
       {/* Password Field */}
       <div>
         <Label htmlFor="password">
           {initialData ? 'كلمة مرور جديدة (اتركه فارغاً لعدم التغيير)' : 'كلمة المرور'}
           {!initialData && <span className="text-destructive">*</span>}
          </Label>
         <Input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            required={!initialData} // Required only when adding
            placeholder="********"
            />
       </div>
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

  // Updated to accept password
  const handleAddUser = async (userData: Omit<User, 'id'> & { password?: string }) => {
     try {
      await addUser(userData);
      toast({ title: "نجاح", description: "تمت إضافة المستخدم بنجاح." });
      setIsFormOpen(false); // Close form on success
      fetchUsers(); // Refresh list
    } catch (error) {
       console.error("Failed to add user:", error);
       toast({ title: "خطأ", description: `فشلت إضافة المستخدم: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
    }
  };

  // Updated to accept password - widened to match UserForm's onSubmit signature
  const handleUpdateUser = async (userData: (User | Omit<User, 'id'>) & { password?: string }) => {
    const user = userData as User & { password?: string };
    if (!user.id) return;
     try {
        // Remove password from userData if it's empty or undefined before sending
        const updatePayload = { ...user };
        if (!updatePayload.password) {
            delete updatePayload.password;
        }
        await updateUser(user.id, updatePayload);
        toast({ title: "نجاح", description: "تم تحديث المستخدم بنجاح." });
        setEditingUser(null);
        setIsFormOpen(false); // Close form on success
        fetchUsers(); // Refresh list
     } catch (error) {
         console.error("Failed to update user:", error);
         toast({ title: "خطأ", description: `فشل تحديث المستخدم: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
     }
  };

  const handleDeleteUser = async (userId: string) => {
     try {
        const success = await deleteUser(userId);
        if(success) {
            toast({ title: "نجاح", description: "تم حذف المستخدم بنجاح.", variant: "destructive" });
            fetchUsers(); // Refresh list
        } else {
             throw new Error("Delete operation returned false or affected 0 rows");
        }
     } catch (error) {
         console.error("Failed to delete user:", error);
         toast({ title: "خطأ", description: `فشل حذف المستخدم: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
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
        accessorKey: "passwordHash", // Accessor for the password hash
        header: "كلمة المرور (مشفر)", // Header for the password column
         cell: ({ row }) => {
             // Mask the password or show a limited part for security
             const hash = row.original.passwordHash;
             return hash ? `${hash.substring(0, 8)}...` : 'غير متوفر'; // Show first few characters or indicate if missing
         },
         size: 150, // Adjust size as needed
    },
    {
      id: "actions",
      header: "إجراءات",
      cell: ({ row }) => (
        <div className="flex justify-end space-x-1 space-x-reverse">
           <DialogTrigger asChild>
             <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => { setEditingUser(row.original); setIsFormOpen(true); }}>
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
                      value={(table.getColumn("role")?.getFilterValue() as string) ?? "all"} // Default to "all" if no filter
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
                             style={{ width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined }} // Apply size if not default
                             onClick={header.column.getToggleSortingHandler()}
                             className={cn("text-center", header.column.getCanSort() ? 'cursor-pointer select-none' : '', 'whitespace-nowrap')}
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
                             <TableCell className="text-center" key={cell.id} style={{ width: cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : undefined }}> {/* Apply size if not default */}
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
