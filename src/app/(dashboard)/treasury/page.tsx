'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Landmark, DollarSign, ArrowRightLeft, PlusCircle, MinusCircle, Loader2, TrendingUp, TrendingDown, Banknote, Pencil, Trash2 as TrashIcon, Filter, Coins, CreditCard, Smartphone, Wallet, Calendar } from 'lucide-react'; // Added payment method icons
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getTreasuryBalance, getTreasuryTransactions, addTreasuryTransaction, getTreasuries, addTreasury, updateTreasury, deleteTreasury } from '@/lib/data'; // Import Treasury CRUD functions
import type { TreasuryTransaction, TreasuryTransactionType, Treasury, PaymentMethod } from '@/lib/types'; // Import Treasury and PaymentMethod type
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth-store'; // Import auth store to get current user if needed
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox

// Helper function to parse float, can be moved to utils
const parseFloatFromDB = (value: string | number | null | undefined, defaultValue: number = 0): number => {
  if (value === null || value === undefined) return defaultValue;
  const stringValue = String(value);
  const parsed = parseFloat(stringValue);
  return isNaN(parsed) ? defaultValue : parsed;
};

// --- Treasury (Account) Form ---
interface TreasuryFormProps {
  initialData?: Treasury | null;
  onSubmit: (data: Omit<Treasury, 'id'> | Treasury) => Promise<void>;
  onClose: () => void;
}

function TreasuryForm({ initialData, onSubmit, onClose }: TreasuryFormProps) {
  const [formData, setFormData] = React.useState<Omit<Treasury, 'id'>>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    isDefault: initialData?.isDefault || false,
    paymentMethodType: initialData?.paymentMethodType || undefined,
  });
  const [isLoading, setIsLoading] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
    setFormData(prev => ({ ...prev, isDefault: Boolean(checked) }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const treasuryData = initialData ? { ...initialData, ...formData } : formData;
      await onSubmit(treasuryData);
      onClose();
    } catch (error) {
      console.error("Treasury form submission error:", error);
      // Error handling is likely done in the parent component's toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{initialData ? 'تعديل الخزنة' : 'إضافة خزنة جديدة'}</DialogTitle>
      </DialogHeader>
      <div>
        <Label htmlFor="name">اسم الخزنة/الحساب <span className="text-destructive">*</span></Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="description">الوصف (اختياري)</Label>
        <Textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="paymentMethodType">نوع طريقة الدفع (اختياري)</Label>
        <Select
          value={formData.paymentMethodType || 'none'}
          onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethodType: value === 'none' ? undefined : value as PaymentMethod }))}
        >
          <SelectTrigger id="paymentMethodType">
            <SelectValue placeholder="اختر نوع طريقة الدفع..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">غير محدد (خزينة عامة)</SelectItem>
            <SelectItem value="cash">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4" /> نقداً
              </div>
            </SelectItem>
            <SelectItem value="card">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> بطاقة
              </div>
            </SelectItem>
            <SelectItem value="instapay">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" /> إنستا باي
              </div>
            </SelectItem>
            <SelectItem value="vodafone_cash">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4" /> فودافون كاش
              </div>
            </SelectItem>
            <SelectItem value="debt">
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4" /> آجل/مديونية
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          ربط الخزينة بطريقة دفع محددة (مثلاً: حساب إنستا باي 1، حساب إنستا باي 2)
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="isDefault" name="isDefault" checked={formData.isDefault} onCheckedChange={handleCheckboxChange} />
        <Label htmlFor="isDefault">الخزنة الافتراضية؟</Label>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
        </DialogClose>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'جاري الحفظ...' : (initialData ? 'تحديث الخزنة' : 'إضافة خزنة')}
        </Button>
      </DialogFooter>
    </form>
  );
}


// --- Transaction Form ---
interface TransactionFormProps {
  transactionType: 'deposit' | 'withdrawal';
  treasuries: Treasury[]; // Pass financial accounts
  onSubmit: (data: { amount: number; description: string; treasuryId?: string }) => Promise<void>; // Use treasuryId
  onClose: () => void;
}

function TransactionForm({ transactionType, treasuries, onSubmit, onClose }: TransactionFormProps) {
  const [amount, setAmount] = React.useState<number | ''>('');
  const [description, setDescription] = React.useState('');
  const [selectedTreasuryId, setSelectedTreasuryId] = React.useState<string | undefined>(undefined); // State for treasury selection
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '' || amount <= 0) {
      toast({ title: "خطأ", description: "يجب إدخال مبلغ صحيح أكبر من صفر.", variant: "destructive" });
      return;
    }
    if (!description.trim()) {
      toast({ title: "خطأ", description: "يجب إدخال الوصف.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await onSubmit({
        amount: Number(amount),
        description,
        treasuryId: selectedTreasuryId === 'general' ? undefined : selectedTreasuryId, // Pass treasury ID or undefined for general
      });
      onClose(); // Close dialog on success
    } catch (error) {
      console.error("Transaction form error:", error);
      // Error is usually handled by the parent toast
    } finally {
      setIsLoading(false);
    }
  };

  const title = transactionType === 'deposit' ? 'إيداع جديد' : 'سحب / مصروفات جديدة';
  const amountLabel = transactionType === 'deposit' ? 'مبلغ الإيداع' : 'مبلغ السحب';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div>
        <Label htmlFor="amount">{amountLabel} (ج.م)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01" // Ensure positive amount
          value={amount}
          onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
          required
          placeholder="0.00"
        />
      </div>
      <div>
        <Label htmlFor="description">الوصف / البيان</Label>
        <Textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          placeholder="مثال: إيداع مبيعات اليوم، مصروفات كهرباء..."
        />
      </div>
      {/* Treasury Selection */}
      <div>
        <Label htmlFor="treasuryId">الخزنة/الحساب</Label>
        <Select onValueChange={setSelectedTreasuryId} value={selectedTreasuryId}>
          <SelectTrigger id="treasuryId">
            <SelectValue placeholder="الخزنة الافتراضية (أو العامة إذا لم تحدد افتراضية)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">الخزنة العامة (غير مرتبط بحساب محدد)</SelectItem>
            {treasuries.map((treasury) => (
              <SelectItem key={treasury.id} value={treasury.id}>
                {treasury.name} {treasury.isDefault ? '(افتراضي)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className='text-xs text-muted-foreground mt-1'>حدد الخزنة/الحساب الذي تتم فيه العملية.</p>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
        </DialogClose>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : (transactionType === 'deposit' ? <PlusCircle className="ml-2 h-4 w-4" /> : <MinusCircle className="ml-2 h-4 w-4" />)}
          {isLoading ? 'جاري الحفظ...' : (transactionType === 'deposit' ? 'تأكيد الإيداع' : 'تأكيد السحب')}
        </Button>
      </DialogFooter>
    </form>
  );
}


// --- Treasury Page ---
export default function TreasuryPage() {
  const [currentBalance, setCurrentBalance] = React.useState<number | null>(null);
  const [transactions, setTransactions] = React.useState<TreasuryTransaction[]>([]);
  const [allTreasuries, setAllTreasuries] = React.useState<Treasury[]>([]); // State for financial accounts
  const [selectedTreasuryFilter, setSelectedTreasuryFilter] = React.useState<string | undefined>(undefined); // Filter state for treasury
  const [selectedTypeFilter, setSelectedTypeFilter] = React.useState<TreasuryTransactionType | 'all'>('all'); // Filter by transaction type
  const [isLoadingBalance, setIsLoadingBalance] = React.useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = React.useState(true);
  const [isLoadingTreasuries, setIsLoadingTreasuries] = React.useState(true);
  const [isDepositModalOpen, setIsDepositModalOpen] = React.useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = React.useState(false);
  // State for Treasury CRUD modals
  const [isTreasuryFormOpen, setIsTreasuryFormOpen] = React.useState(false);
  const [editingTreasury, setEditingTreasury] = React.useState<Treasury | null>(null);
  const [treasuryToDelete, setTreasuryToDelete] = React.useState<Treasury | null>(null);

  const { toast } = useToast();
  const { user } = useAuthStore(); // Get current user for recording transactions


  // Fetch treasuries
  const fetchTreasuries = React.useCallback(async () => {
    setIsLoadingTreasuries(true);
    try {
      const treasuries = await getTreasuries();
      setAllTreasuries(treasuries);
    } catch (error) {
      console.error("Failed to load treasuries:", error);
      toast({ title: "خطأ", description: "فشل تحميل قائمة الخزنات/الحسابات.", variant: "destructive" });
    } finally {
      setIsLoadingTreasuries(false);
    }
  }, [toast]);

  // Fetch balance and transactions based on filter
  const fetchData = React.useCallback(async () => {
    setIsLoadingBalance(true);
    setIsLoadingTransactions(true);
    try {
      const treasuryId = selectedTreasuryFilter === 'all' ? undefined : selectedTreasuryFilter;
      const [balance, fetchedTransactions] = await Promise.all([
        getTreasuryBalance(), // Balance across all accounts
        getTreasuryTransactions({ treasuryId }) // Pass filter
      ]);
      setCurrentBalance(balance);
      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error("Failed to load treasury data:", error);
      toast({ title: "خطأ", description: "فشل تحميل بيانات الخزنة.", variant: "destructive" });
    } finally {
      setIsLoadingBalance(false);
      setIsLoadingTransactions(false);
    }
  }, [toast, selectedTreasuryFilter]); // Depend on filter state

  React.useEffect(() => {
    fetchTreasuries(); // Fetch treasuries once on mount
  }, [fetchTreasuries]);

  React.useEffect(() => {
    fetchData(); // Fetch balance/transactions when filter changes
  }, [fetchData]);


  // Handle adding transactions
  const handleAddTransaction = async (type: TreasuryTransactionType, data: { amount: number; description: string; treasuryId?: string }) => {
    try {
      await addTreasuryTransaction({
        type: type,
        // amount will be handled (negated if needed) by addTreasuryTransaction function
        amount: String(data.amount), // TreasuryTransaction.amount is VARCHAR
        description: data.description,
        userId: user?.id, // Optionally record the user ID
        date: new Date(), // Use current date/time for manual transactions
        treasuryId: data.treasuryId, // Pass the selected treasuryId
      });
      toast({ title: "نجاح", description: `تم تسجيل عملية ${type === 'deposit' ? 'الإيداع' : 'السحب'} بنجاح.` });
      fetchData(); // Refresh data after adding transaction
      setIsDepositModalOpen(false); // Close modals on success
      setIsWithdrawalModalOpen(false);
    } catch (error) {
      console.error(`Failed to add ${type} transaction:`, error);
      toast({ title: "خطأ", description: `فشل تسجيل عملية ${type === 'deposit' ? 'الإيداع' : 'السحب'}.`, variant: "destructive" });
    }
  };

  const handleAddDeposit = (data: { amount: number; description: string; treasuryId?: string }) => {
    return handleAddTransaction('deposit', data);
  };

  const handleAddWithdrawal = (data: { amount: number; description: string; treasuryId?: string }) => {
    return handleAddTransaction('withdrawal', data);
  };

  // TODO: Implement Transfer Modal and Logic
  const handleAddTransfer = () => {
    console.log("Add Transfer clicked - Not Implemented");
    toast({ title: "غير متاح حالياً", description: "خاصية التحويل بين الخزنات سيتم إضافتها لاحقاً." });
    /* Open Transfer Modal */
  };

  // --- Treasury CRUD Handlers ---
  const handleAddTreasury = async (data: Omit<Treasury, 'id'>) => {
    try {
      await addTreasury(data);
      toast({ title: "نجاح", description: "تمت إضافة الخزنة بنجاح." });
      fetchTreasuries(); // Refresh treasury list
      setIsTreasuryFormOpen(false);
    } catch (error) {
      console.error("Failed to add treasury:", error);
      toast({ title: "خطأ", description: `فشلت إضافة الخزنة: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
    }
  };

  const handleUpdateTreasury = async (data: Treasury | Omit<Treasury, 'id'>) => {
    const treasury = data as Treasury;
    try {
      await updateTreasury(treasury.id, treasury);
      toast({ title: "نجاح", description: "تم تحديث الخزنة بنجاح." });
      fetchTreasuries(); // Refresh treasury list
      setEditingTreasury(null);
      setIsTreasuryFormOpen(false);
    } catch (error) {
      console.error("Failed to update treasury:", error);
      toast({ title: "خطأ", description: `فشل تحديث الخزنة: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
    }
  };

  const handleDeleteTreasury = async () => {
    if (!treasuryToDelete) return;
    try {
      await deleteTreasury(treasuryToDelete.id);
      toast({ title: "نجاح", description: "تم حذف الخزنة بنجاح.", variant: "destructive" });
      fetchTreasuries(); // Refresh treasury list
      setTreasuryToDelete(null); // Close confirmation dialog
      // If the deleted treasury was the selected filter, reset filter
      if (selectedTreasuryFilter === treasuryToDelete.id) {
        setSelectedTreasuryFilter(undefined);
      }
    } catch (error) {
      console.error("Failed to delete treasury:", error);
      toast({ title: "خطأ", description: `فشل حذف الخزنة: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
      setTreasuryToDelete(null); // Close confirmation dialog
    }
  };

  const handleCloseTreasuryForm = () => {
    setIsTreasuryFormOpen(false);
    setEditingTreasury(null);
  };


  // Get treasury name from ID
  const getTreasuryName = (id?: string): string => {
    if (!id) return 'عامة';
    return allTreasuries.find(t => t.id === id)?.name || id.substring(0, 6);
  };

  // Filter transactions by type
  const filteredTransactions = React.useMemo(() => {
    if (selectedTypeFilter === 'all') return transactions;
    return transactions.filter(tx => tx.type === selectedTypeFilter);
  }, [transactions, selectedTypeFilter]);

  // Calculate statistics by payment type
  const paymentStats = React.useMemo(() => {
    const stats = {
      cash: 0,
      card: 0,
      instapay: 0,
      vodafone_cash: 0,
      debt: 0,
    };

    transactions.forEach(tx => {
      const amount = parseFloatFromDB(tx.amount);
      // Only count sale_payment transactions for payment statistics
      if (tx.type === 'sale_payment' && amount > 0) {
        // We need to get the payment method from the related sale
        // For now, we'll show all sale payments combined
        // You might want to extend TreasuryTransaction to include paymentMethod
      }
    });

    return stats;
  }, [transactions]);

  return (
    <AlertDialog> {/* Outer wrapper for Delete confirmation */}
      <Dialog> {/* Base Dialog for modals */}
        <div className="p-4 md:p-6 space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Landmark className="w-6 h-6" />
              إدارة الخزنة
            </h2>
            {/* Treasury Filter */}
            <div className='w-full sm:w-auto'>
              <Label htmlFor="treasuryFilter" className='sr-only'>فلتر حسب الخزنة</Label>
              <Select
                value={selectedTreasuryFilter || 'all'}
                onValueChange={setSelectedTreasuryFilter}
                disabled={isLoadingTreasuries}
              >
                <SelectTrigger id="treasuryFilter" className="w-full sm:w-[250px]">
                  <SelectValue placeholder="عرض جميع الخزنات/الحسابات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الخزنة العامة (غير مرتبط بحساب)</SelectItem>
                  {allTreasuries.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      <div className='flex items-center gap-2'>
                        <Banknote className="h-4 w-4 text-muted-foreground" /> {option.name} {option.isDefault ? '(افتراضي)' : ''}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>رصيد الخزنة ({getTreasuryName(selectedTreasuryFilter === 'all' ? undefined : selectedTreasuryFilter)})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                {isLoadingBalance ? (
                  <Skeleton className="h-10 w-32 mx-auto" />
                ) : currentBalance !== null ? (
                  <>
                    <p className="text-3xl font-bold">{currentBalance.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">ج.م</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">خطأ في تحميل الرصيد.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons using DialogTrigger */}
          <Card>
            <CardHeader>
              <CardTitle>عمليات الخزنة</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
              <DialogTrigger asChild>
                <Button className="flex-1" onClick={() => setIsDepositModalOpen(true)} disabled={isLoadingBalance || isLoadingTransactions}>
                  <PlusCircle className="ml-2 h-5 w-5" />
                  إيداع جديد
                </Button>
              </DialogTrigger>
              <DialogTrigger asChild>
                <Button variant="destructive" className="flex-1" onClick={() => setIsWithdrawalModalOpen(true)} disabled={isLoadingBalance || isLoadingTransactions}>
                  <MinusCircle className="ml-2 h-5 w-5" />
                  سحب / مصروفات
                </Button>
              </DialogTrigger>
              <Button variant="secondary" className="flex-1" onClick={handleAddTransfer} disabled={true}> {/* Keep transfer disabled for now */}
                <ArrowRightLeft className="ml-2 h-5 w-5" />
                تحويل (لاحقاً)
              </Button>
            </CardContent>
          </Card>

          {/* Treasury Management Section */}
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2"><Banknote className="w-5 h-5" /> إدارة الخزنات/الحسابات</CardTitle>
                <CardDescription>إضافة وتعديل الحسابات المالية.</CardDescription>
              </div>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => { setEditingTreasury(null); setIsTreasuryFormOpen(true); }}>
                  <PlusCircle className="ml-2 h-4 w-4" /> إضافة خزنة/حساب
                </Button>
              </DialogTrigger>
            </CardHeader>
            <CardContent>
              {isLoadingTreasuries ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : allTreasuries.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>اسم الخزنة/الحساب</TableHead>
                        <TableHead>نوع طريقة الدفع</TableHead>
                        <TableHead>الوصف</TableHead>
                        <TableHead>افتراضي؟</TableHead>
                        <TableHead className="text-right">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allTreasuries.map(t => {
                        const paymentMethodMap: Record<string, { label: string; icon: React.ElementType }> = {
                          'cash': { label: 'نقداً', icon: Coins },
                          'card': { label: 'بطاقة', icon: CreditCard },
                          'instapay': { label: 'إنستا باي', icon: Smartphone },
                          'vodafone_cash': { label: 'فودافون كاش', icon: Wallet },
                          'debt': { label: 'آجل', icon: Landmark },
                        };
                        const methodInfo = t.paymentMethodType ? paymentMethodMap[t.paymentMethodType] : null;
                        const MethodIcon = methodInfo?.icon;

                        return (
                          <TableRow key={t.id}>
                            <TableCell>{t.name}</TableCell>
                            <TableCell>
                              {methodInfo ? (
                                <div className="flex items-center gap-2">
                                  {MethodIcon && <MethodIcon className="h-4 w-4 text-muted-foreground" />}
                                  {methodInfo.label}
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell>{t.description || '-'}</TableCell>
                            <TableCell>{t.isDefault ? 'نعم' : 'لا'}</TableCell>
                            <TableCell className="text-right space-x-1">
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => { setEditingTreasury(t); setIsTreasuryFormOpen(true); }}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setTreasuryToDelete(t)} disabled={t.isDefault}>
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">لا توجد خزنات معرفة حالياً.</p>
              )}
            </CardContent>
          </Card>


          {/* Payment Methods Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">نقداً</CardTitle>
                  <Coins className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{filteredTransactions.filter(tx => tx.type === 'sale_payment' && tx.description?.includes('نقداً')).reduce((sum, tx) => sum + parseFloatFromDB(tx.amount), 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">ج.م</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">بطاقة</CardTitle>
                  <CreditCard className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{filteredTransactions.filter(tx => tx.type === 'sale_payment' && tx.description?.includes('بطاقة')).reduce((sum, tx) => sum + parseFloatFromDB(tx.amount), 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">ج.م</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">إنستا باي</CardTitle>
                  <Smartphone className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700">{filteredTransactions.filter(tx => tx.type === 'sale_payment' && tx.description?.includes('إنستا')).reduce((sum, tx) => sum + parseFloatFromDB(tx.amount), 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">ج.م</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">فودافون كاش</CardTitle>
                  <Wallet className="h-4 w-4 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">{filteredTransactions.filter(tx => tx.type === 'sale_payment' && tx.description?.includes('فودافون')).reduce((sum, tx) => sum + parseFloatFromDB(tx.amount), 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">ج.م</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">آجل</CardTitle>
                  <Landmark className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-700">{filteredTransactions.filter(tx => tx.type === 'sale_payment' && tx.description?.includes('آجل')).reduce((sum, tx) => sum + parseFloatFromDB(tx.amount), 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">ج.م</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <CardTitle>كشف حساب الخزنة ({getTreasuryName(selectedTreasuryFilter === 'all' ? undefined : selectedTreasuryFilter)})</CardTitle>
                  <CardDescription>سجل جميع العمليات التي تمت على الخزنة المحددة.</CardDescription>
                </div>
                <div className="flex gap-2 items-center">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedTypeFilter} onValueChange={(value) => setSelectedTypeFilter(value as TreasuryTransactionType | 'all')}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="فلتر حسب النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع العمليات</SelectItem>
                      <SelectItem value="deposit">إيداع</SelectItem>
                      <SelectItem value="withdrawal">سحب</SelectItem>
                      <SelectItem value="sale_payment">دفعة مبيعات</SelectItem>
                      <SelectItem value="purchase_payment">دفعة مشتريات</SelectItem>
                      <SelectItem value="expense">مصروفات</SelectItem>
                      <SelectItem value="transfer_in">تحويل وارد</SelectItem>
                      <SelectItem value="transfer_out">تحويل صادر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ والوقت</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>المبلغ (ج.م)</TableHead>
                      <TableHead>المستند المرتبط</TableHead>
                      <TableHead>الخزنة/الحساب</TableHead> {/* Changed from Warehouse */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingTransactions ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell> {/* Skeleton for treasury */}
                        </TableRow>
                      ))
                    ) : filteredTransactions.length > 0 ? (
                      filteredTransactions.map((tx) => {
                        const amount = parseFloatFromDB(tx.amount);
                        const isPositive = amount > 0;
                        const transactionTypeMap: Record<TreasuryTransactionType, string> = {
                          deposit: 'إيداع',
                          withdrawal: 'سحب',
                          sale_payment: 'دفعة مبيعات',
                          purchase_payment: 'دفعة مشتريات',
                          expense: 'مصروفات',
                          transfer_in: 'تحويل وارد',
                          transfer_out: 'تحويل صادر',
                          opening_balance: 'رصيد افتتاحي',
                          sale_payment_reversal: 'عكس دفعة بيع',
                          purchase_payment_reversal: 'عكس دفعة شراء',
                        };
                        const typeLabel = transactionTypeMap[tx.type] || tx.type;
                        const treasuryName = getTreasuryName(tx.treasuryId); // Get treasury name
                        return (
                          <TableRow key={tx.id}>
                            <TableCell>{format(new Date(tx.date), 'PPpp', { locale: arSA })}</TableCell> {/* More detailed format */}
                            <TableCell>
                              <span className={cn(
                                'font-medium flex items-center gap-1',
                                isPositive ? 'text-green-600' : 'text-red-600'
                              )}>
                                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {typeLabel}
                              </span>
                            </TableCell>
                            <TableCell>{tx.description || '-'}</TableCell>
                            <TableCell className={cn(
                              'font-semibold',
                              isPositive ? 'text-green-700' : 'text-red-700'
                            )}>
                              {amount.toFixed(2)}
                            </TableCell>
                            <TableCell>{tx.relatedDocumentId || '-'}</TableCell>
                            <TableCell>{treasuryName}</TableCell> {/* Display treasury name */}
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground"> {/* Adjusted colspan */}
                          لا توجد حركات مسجلة حالياً للخزنة المحددة.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* TODO: Add Pagination */}
            </CardContent>
          </Card>

        </div>

        {/* Deposit Modal */}
        <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
          <DialogContent>
            <TransactionForm
              transactionType="deposit"
              treasuries={allTreasuries} // Pass treasuries
              onSubmit={handleAddDeposit}
              onClose={() => setIsDepositModalOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Withdrawal Modal */}
        <Dialog open={isWithdrawalModalOpen} onOpenChange={setIsWithdrawalModalOpen}>
          <DialogContent>
            <TransactionForm
              transactionType="withdrawal"
              treasuries={allTreasuries} // Pass treasuries
              onSubmit={handleAddWithdrawal}
              onClose={() => setIsWithdrawalModalOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Treasury Add/Edit Modal */}
        <Dialog open={isTreasuryFormOpen} onOpenChange={handleCloseTreasuryForm}>
          <DialogContent className="sm:max-w-[425px]">
            <TreasuryForm
              initialData={editingTreasury}
              onSubmit={editingTreasury ? handleUpdateTreasury : handleAddTreasury}
              onClose={handleCloseTreasuryForm}
            />
          </DialogContent>
        </Dialog>

        {/* TODO: Add Transfer Modal */}

      </Dialog>

      {/* Treasury Delete Confirmation Dialog Content */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
          <AlertDialogDescription>
            هل أنت متأكد أنك تريد حذف الخزنة "{treasuryToDelete?.name}"؟ لا يمكن حذف الخزنة الافتراضية أو إذا كانت تحتوي على حركات مالية.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setTreasuryToDelete(null)}>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90"
            onClick={handleDeleteTreasury}
            disabled={!treasuryToDelete || treasuryToDelete.isDefault}>
            حذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}