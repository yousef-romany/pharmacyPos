
'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Archive, Package, AlertCircle, CalendarX, CalendarClock, DollarSign, Filter, Printer, Warehouse as WarehouseIcon, PlusCircle, Edit, Trash2 } from 'lucide-react'; // Kept WarehouseIcon
import { getInventoryReportData, calculateDaysUntilExpiry, getWarehouses, addWarehouse, updateWarehouse, deleteWarehouse, getProducts } from '@/lib/data'; // Removed Treasury functions
import type { InventoryReportItem, ProductExpiryInfo, Product, Warehouse } from '@/lib/types'; // Kept Warehouse
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox'; // Import Combobox
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select for warehouse filter
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'; // Import Dialog components
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
} from '@/components/ui/alert-dialog'; // Import AlertDialog for delete confirmation
import { useToast } from '@/hooks/use-toast'; // Import useToast

// Helper function to safely parse floats (can be moved to utils)
const safeParseFloat = (value: string | number | null | undefined, defaultValue = 0): number => {
  if (value === null || value === undefined) return defaultValue;
  const parsed = parseFloat(value.toString());
  return isNaN(parsed) ? defaultValue : parsed;
};

// --- Warehouse Form ---
interface WarehouseFormProps {
  initialData?: Warehouse | null;
  onSubmit: (data: Omit<Warehouse, 'id'> | Warehouse) => Promise<void>;
  onClose: () => void;
}

function WarehouseForm({ initialData, onSubmit, onClose }: WarehouseFormProps) {
  const [formData, setFormData] = React.useState<Omit<Warehouse, 'id'>>({
    name: initialData?.name || '',
    location: initialData?.location || '',
    isDefault: initialData?.isDefault || false,
  });
  const [isLoading, setIsLoading] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
    setFormData(prev => ({ ...prev, isDefault: Boolean(checked) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const warehouseData = initialData ? { ...initialData, ...formData } : formData;
      await onSubmit(warehouseData);
      onClose();
    } catch (error) {
      console.error("Warehouse form submission error:", error);
      // Error handling is likely done in the parent component's toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{initialData ? 'تعديل المخزن' : 'إضافة مخزن جديد'}</DialogTitle>
      </DialogHeader>
      <div>
        <Label htmlFor="name">اسم المخزن <span className="text-destructive">*</span></Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="location">الموقع (اختياري)</Label>
        <Input id="location" name="location" value={formData.location || ''} onChange={handleChange} />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="isDefault" name="isDefault" checked={formData.isDefault} onCheckedChange={handleCheckboxChange} />
        <Label htmlFor="isDefault">المخزن الافتراضي؟</Label>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
        </DialogClose>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'جاري الحفظ...' : (initialData ? 'تحديث المخزن' : 'إضافة مخزن')}
        </Button>
      </DialogFooter>
    </form>
  );
}


export default function InventoryPage() {
  const [inventory, setInventory] = React.useState<InventoryReportItem[]>([]);
  const [filteredInventory, setFilteredInventory] = React.useState<InventoryReportItem[]>([]);
  const [allProducts, setAllProducts] = React.useState<Product[]>([]); // For product filter dropdown
  const [allWarehouses, setAllWarehouses] = React.useState<Warehouse[]>([]); // For warehouse filter dropdown and management
  const [warehouseMap, setWarehouseMap] = React.useState<Map<string, string>>(new Map()); // Map warehouse ID to name
  const [expiredProductsCount, setExpiredProductsCount] = React.useState<number>(0); // Count only
  const [nearingExpiryProductsCount, setNearingExpiryProductsCount] = React.useState<number>(0); // Count only
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = React.useState(true);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = React.useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedProductId, setSelectedProductId] = React.useState<string | undefined>(undefined); // Filter by specific product
  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState<string | undefined>(undefined); // Filter by warehouse
  const [showExpired, setShowExpired] = React.useState(false);
  const [showNearingExpiry, setShowNearingExpiry] = React.useState(false); // Within 60 days

  // State for warehouse management modals
  const [isWarehouseFormOpen, setIsWarehouseFormOpen] = React.useState(false);
  const [editingWarehouse, setEditingWarehouse] = React.useState<Warehouse | null>(null);
  const [warehouseToDelete, setWarehouseToDelete] = React.useState<Warehouse | null>(null);
  const { toast } = useToast();


  const fetchInventoryAndRelatedData = React.useCallback(async (warehouseFilter?: string) => {
    setIsLoading(true);
    setIsLoadingProducts(true);
    try {
      // Fetch inventory report which includes product details needed for the table
      const inventoryData = await getInventoryReportData(warehouseFilter);
      setInventory(inventoryData);
      setFilteredInventory(inventoryData);

      // Calculate counts based on the fetched inventory data
      const today = new Date();
      let expiredCount = 0;
      let nearingCount = 0;
      inventoryData.forEach(item => {
        if (item.expiryDate) {
          const daysLeft = calculateDaysUntilExpiry(item.expiryDate);
          if (daysLeft < 0) {
            expiredCount++;
          } else if (daysLeft <= 60) {
            nearingCount++;
          }
        }
      });
      setExpiredProductsCount(expiredCount);
      setNearingExpiryProductsCount(nearingCount);

      // Fetch all products *only* for the product filter combobox
      const productsData = await getProducts();
      setAllProducts(productsData);

    } catch (error) {
      console.error("Failed to load inventory data:", error);
      toast({ title: "خطأ", description: "فشل تحميل بيانات المخزون.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsLoadingProducts(false);
    }
  }, [toast]); // Added toast dependency

  const fetchWarehousesData = React.useCallback(async () => {
    setIsLoadingWarehouses(true);
    try {
      const warehousesData = await getWarehouses();
      setAllWarehouses(warehousesData);
      const wMap = new Map<string, string>();
      warehousesData.forEach(w => wMap.set(w.id, w.name));
      setWarehouseMap(wMap); // Update map when warehouses are fetched/refetched
    } catch (error) {
      console.error("Failed to load warehouses:", error);
      toast({ title: "خطأ", description: "فشل تحميل قائمة المخازن.", variant: "destructive" });
    } finally {
      setIsLoadingWarehouses(false);
    }
  }, [toast]); // Added toast dependency


  React.useEffect(() => {
    // Fetch inventory based on the selected warehouse filter
    fetchInventoryAndRelatedData(selectedWarehouseId);
  }, [selectedWarehouseId, fetchInventoryAndRelatedData]); // Refetch inventory when warehouse filter changes

  React.useEffect(() => {
    // Fetch warehouses on mount and potentially after CRUD operations
    fetchWarehousesData();
  }, [fetchWarehousesData]);


  // --- Filtering Logic ---
  React.useEffect(() => {
    let results = inventory; // Start with data fetched for the selected warehouse

    // Filter by Search Term
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      results = results.filter(item =>
        item.nameAr.toLowerCase().includes(lowerSearchTerm) ||
        (item.nameEn && item.nameEn.toLowerCase().includes(lowerSearchTerm)) ||
        (item.barcode && item.barcode.toLowerCase().includes(lowerSearchTerm)) ||
        item.id.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Filter by Selected Product
    if (selectedProductId && selectedProductId !== 'all') {
      results = results.filter(item => item.id === selectedProductId);
    }

    // Filter by Expired
    if (showExpired) {
      results = results.filter(item => {
        const daysLeft = item.expiryDate ? calculateDaysUntilExpiry(new Date(item.expiryDate)) : null;
        return daysLeft !== null && daysLeft < 0;
      });
    }

    // Filter by Nearing Expiry (and not already expired)
    if (showNearingExpiry) {
      results = results.filter(item => {
        const daysLeft = item.expiryDate ? calculateDaysUntilExpiry(new Date(item.expiryDate)) : null;
        // Ensure it's not already expired when filtering for nearing expiry
        return daysLeft !== null && daysLeft >= 0 && daysLeft <= 60;
      });
    }

    // Warehouse filtering is handled by the initial data fetch based on selectedWarehouseId

    setFilteredInventory(results);
  }, [searchTerm, selectedProductId, showExpired, showNearingExpiry, inventory]); // Re-apply client-side filters when these change


  const totalInventoryValue = filteredInventory.reduce((sum, item) => sum + item.inventoryValue, 0);
  const totalItemCount = inventory.length; // Count based on fetched data (for the selected warehouse)
  const totalFilteredItemCount = filteredInventory.length; // Count after client-side filtering


  const resetFilters = () => {
    setSearchTerm('');
    setSelectedProductId(undefined); // Reset product filter
    setSelectedWarehouseId(undefined); // Reset Warehouse Filter
    setShowExpired(false);
    setShowNearingExpiry(false);
  };

  // Prepare options for the product combobox
  const productOptions = allProducts.map(product => ({
    value: product.id,
    label: `${product.nameAr} (${product.nameEn})`,
  }));

  // Prepare options for the warehouse select
  const warehouseOptions = allWarehouses.map(warehouse => ({
    value: warehouse.id,
    label: warehouse.name,
  }));

  // --- Warehouse CRUD Handlers ---
  const handleAddWarehouse = async (data: Omit<Warehouse, 'id'>) => {
    try {
      await addWarehouse(data);
      toast({ title: "نجاح", description: "تمت إضافة المخزن بنجاح." });
      fetchWarehousesData(); // Refresh warehouse list
      setIsWarehouseFormOpen(false);
    } catch (error) {
      console.error("Failed to add warehouse:", error);
      toast({ title: "خطأ", description: `فشلت إضافة المخزن: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
    }
  };

  const handleUpdateWarehouse = async (data: Warehouse | Omit<Warehouse, 'id'>) => {
    const warehouse = data as Warehouse;
    try {
      await updateWarehouse(warehouse.id, warehouse);
      toast({ title: "نجاح", description: "تم تحديث المخزن بنجاح." });
      fetchWarehousesData(); // Refresh warehouse list
      setEditingWarehouse(null);
      setIsWarehouseFormOpen(false);
    } catch (error) {
      console.error("Failed to update warehouse:", error);
      toast({ title: "خطأ", description: `فشل تحديث المخزن: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
    }
  };

  const handleDeleteWarehouse = async () => {
    if (!warehouseToDelete) return;
    try {
      await deleteWarehouse(warehouseToDelete.id);
      toast({ title: "نجاح", description: "تم حذف المخزن بنجاح.", variant: "destructive" });
      fetchWarehousesData(); // Refresh warehouse list
      setWarehouseToDelete(null); // Close confirmation dialog
      // If the deleted warehouse was the selected filter, reset filter
      if (selectedWarehouseId === warehouseToDelete.id) {
        setSelectedWarehouseId(undefined);
      }
    } catch (error) {
      console.error("Failed to delete warehouse:", error);
      toast({ title: "خطأ", description: `فشل حذف المخزن: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
      setWarehouseToDelete(null); // Close confirmation dialog
    }
  };

  const handleCloseWarehouseForm = () => {
    setIsWarehouseFormOpen(false);
    setEditingWarehouse(null);
  };


  return (
    <AlertDialog> {/* Outer wrapper for Delete confirmation */}
      <Dialog open={isWarehouseFormOpen} onOpenChange={setIsWarehouseFormOpen}> {/* Wrapper for Add/Edit Warehouse */}
        <div className="p-4 md:p-6 space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Archive className="w-6 h-6" />
              إدارة المخزون والمخازن
            </h2>
            <div className="flex items-center gap-2">
              {/* Filter Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Filter className="ml-2 h-4 w-4" />
                    تصفية المخزون
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">فلاتر تقرير المخزون</h4>
                      <p className="text-sm text-muted-foreground">
                        حدد معايير تصفية لعرض المخزون.
                      </p>
                    </div>
                    <div className="grid gap-2">
                      {/* Warehouse Filter */}
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="warehouseFilter" className="col-span-1">المخزن</Label>
                        <Select
                          value={selectedWarehouseId || 'all'}
                          onValueChange={(value) => setSelectedWarehouseId(value === 'all' ? undefined : value)}
                          disabled={isLoadingWarehouses}
                        >
                          <SelectTrigger className="col-span-2 h-8">
                            <SelectValue placeholder="جميع المخازن" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">جميع المخازن</SelectItem>
                            {warehouseOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="searchTerm" className="col-span-1">بحث</Label>
                        <Input
                          id="searchTerm"
                          placeholder="اسم, كود, باركود..."
                          className="h-8 col-span-2"
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                        />
                      </div>
                      {/* Product Filter Combobox */}
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="productFilter" className="col-span-1">منتج محدد</Label>
                        <Combobox
                          id="productFilter"
                          options={[{ value: 'all', label: 'جميع المنتجات' }, ...productOptions]}
                          value={selectedProductId || 'all'}
                          onSelect={(value) => setSelectedProductId(value === 'all' ? undefined : value)}
                          placeholder="اختر منتج..."
                          searchPlaceholder="ابحث عن منتج..."
                          notFoundText="لم يتم العثور على منتج."
                          className="col-span-2 h-8"
                          isLoading={isLoadingProducts}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="showExpired" checked={showExpired} onCheckedChange={(checked) => setShowExpired(Boolean(checked))} />
                        <Label htmlFor="showExpired" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          عرض المنتهي الصلاحية فقط
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="showNearingExpiry" checked={showNearingExpiry} onCheckedChange={(checked) => setShowNearingExpiry(Boolean(checked))} />
                        <Label htmlFor="showNearingExpiry" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          عرض ما قارب على الانتهاء (60 يوم)
                        </Label>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={resetFilters}>إعادة تعيين الفلاتر</Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Button variant="outline" onClick={() => window.print()}> {/* Basic print */}
                <Printer className="ml-2 h-4 w-4" />
                طباعة التقرير
              </Button>
            </div>
          </div>


          {/* Inventory Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">قيمة المخزون (المصفى)</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{totalInventoryValue.toFixed(2)} ج.م</div>}
                <p className="text-xs text-muted-foreground pt-1">
                  (حسب آخر سعر شراء)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">عدد الأصناف (المصفى)</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-1/3" /> : <div className="text-2xl font-bold">{totalFilteredItemCount}</div>}
                <p className="text-xs text-muted-foreground pt-1">
                  ({totalItemCount} إجمالي في هذا المخزن/المخازن)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">أصناف قاربت على الانتهاء</CardTitle>
                <CalendarClock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-1/3" /> : <div className="text-2xl font-bold text-orange-600">{nearingExpiryProductsCount}</div>}
                <p className="text-xs text-muted-foreground pt-1">
                  (أقل من 60 يوم)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">أصناف منتهية الصلاحية</CardTitle>
                <CalendarX className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-1/3" /> : <div className="text-2xl font-bold text-red-600">{expiredProductsCount}</div>}
                <p className="text-xs text-muted-foreground pt-1">
                  يجب التخلص منها
                </p>
              </CardContent>
            </Card>
          </div>


          {/* Inventory Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>تقرير المخزون التفصيلي</CardTitle>
              <CardDescription>عرض لجميع الأصناف في المخزون مع تفاصيلها وقيمتها (حسب الفلاتر المحددة).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[20%]">المنتج</TableHead>
                      <TableHead>الباركود</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>الوحدة</TableHead>
                      <TableHead>آخر تكلفة</TableHead>
                      <TableHead>سعر البيع</TableHead>
                      <TableHead>الصلاحية</TableHead>
                      <TableHead>المخزن</TableHead> {/* Added Warehouse Column */}
                      <TableHead>قيمة المخزون</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell> {/* Warehouse Skeleton */}
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredInventory.length > 0 ? (
                      filteredInventory.map((item) => {
                        const daysLeft = item.expiryDate ? calculateDaysUntilExpiry(new Date(item.expiryDate)) : null;
                        const isExpired = daysLeft !== null && daysLeft < 0;
                        const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 60;
                        const expiryColorClass = isExpired ? 'text-red-700 font-bold' : isExpiringSoon ? 'text-orange-600 font-medium' : '';
                        const quantityNum = safeParseFloat(item.quantity);
                        const priceNum = safeParseFloat(item.price);
                        const costNum = safeParseFloat(item.lastPurchaseCost, 0);

                        return (
                          <TableRow key={item.id + (item.warehouseId || '')}> {/* Ensure unique key with warehouse */}
                            <TableCell className="font-medium">
                              <div>{item.nameAr}</div>
                              <div className="text-xs text-muted-foreground">{item.nameEn}</div>
                            </TableCell>
                            <TableCell>{item.barcode || '-'}</TableCell>
                            <TableCell>{Number.isInteger(quantityNum) ? quantityNum : quantityNum.toFixed(2)}</TableCell>
                            <TableCell>{item.unitType}</TableCell>
                            <TableCell>{costNum.toFixed(2)}</TableCell>
                            <TableCell>{priceNum.toFixed(2)}</TableCell>
                            <TableCell className={cn(expiryColorClass)}>
                              {item.expiryDate ? format(new Date(item.expiryDate), 'dd/MM/yyyy', { locale: arSA }) : '-'}
                              {isExpired && <span className="text-xs block">(منتهي)</span>}
                              {isExpiringSoon && !isExpired && <span className="text-xs block">(خلال {daysLeft} يوم)</span>}
                            </TableCell>
                            <TableCell>{item.warehouseName || '-'}</TableCell> {/* Display Warehouse Name */}
                            <TableCell>{item.inventoryValue.toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center text-muted-foreground"> {/* Adjusted colSpan */}
                          لا توجد أصناف في المخزون تطابق الفلاتر المحددة.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* Add Pagination if needed */}
            </CardContent>
          </Card>

          {/* Warehouse Management Section */}
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2"><WarehouseIcon className="w-5 h-5" /> إدارة المخازن</CardTitle>
                <CardDescription>إضافة وتعديل المخازن التي يتم تخزين المنتجات بها.</CardDescription>
              </div>
              {/* Wrap the Button with DialogTrigger */}
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => { setEditingWarehouse(null); setIsWarehouseFormOpen(true); }}>
                  <PlusCircle className="ml-2 h-4 w-4" /> إضافة مخزن
                </Button>
              </DialogTrigger>
            </CardHeader>
            <CardContent>
              {isLoadingWarehouses ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : allWarehouses.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>اسم المخزن</TableHead>
                        <TableHead>الموقع</TableHead>
                        <TableHead>افتراضي؟</TableHead>
                        <TableHead className="text-right">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allWarehouses.map(w => (
                        <TableRow key={w.id}>
                          <TableCell>{w.name}</TableCell>
                          <TableCell>{w.location || '-'}</TableCell>
                          <TableCell>{w.isDefault ? 'نعم' : 'لا'}</TableCell>
                          <TableCell className="text-right space-x-1">
                            {/* Wrap Edit button with DialogTrigger */}
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => { setEditingWarehouse(w); setIsWarehouseFormOpen(true); }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            {/* Wrap Delete button with AlertDialogTrigger */}
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setWarehouseToDelete(w)} disabled={w.isDefault}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">لا توجد مخازن معرفة حالياً.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Warehouse Add/Edit Dialog Content */}
        <DialogContent className="sm:max-w-[425px]">
          {/* The WarehouseForm is now rendered based on Dialog's open state */}
          <WarehouseForm
            initialData={editingWarehouse}
            onSubmit={editingWarehouse ? handleUpdateWarehouse : handleAddWarehouse}
            onClose={handleCloseWarehouseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Warehouse Delete Confirmation Dialog Content */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
          <AlertDialogDescription>
            هل أنت متأكد أنك تريد حذف المخزن "{warehouseToDelete?.name}"؟ لا يمكن حذف المخزن الافتراضي أو إذا كان يحتوي على منتجات.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setWarehouseToDelete(null)}>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90"
            onClick={handleDeleteWarehouse}
            disabled={!warehouseToDelete || warehouseToDelete.isDefault}>
            حذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
