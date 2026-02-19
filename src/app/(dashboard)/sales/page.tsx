"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Receipt,
  Printer,
  Eye,
  CreditCard,
  Coins,
  Landmark,
  ShieldCheck,
  Trash2,
} from "lucide-react"; // Added icons for payment methods & insurance, Trash2
import type {
  SaleTransaction,
  SaleTransactionItem,
  Customer,
  PaymentMethod,
  Product,
} from "@/lib/types"; // Import type and Customer
import {
  getSales,
  getCustomers,
  getProductById,
  getCustomerById,
  deleteSale,
  getProducts,
} from "@/lib/data"; // Import data fetching functions, add deleteSale
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog"; // Import AlertDialog components
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { Badge } from "@/components/ui/badge"; // Import Badge
import { cn } from "@/lib/utils";
import { InvoiceWrapper } from "@/components/invoices/invoice-wrapper";

// Helper function to safely parse floats (can be moved to utils)
const safeParseFloat = (
  value: string | number | null | undefined,
  defaultValue = 0
): number => {
  if (value === null || value === undefined) return defaultValue;
  const parsed = parseFloat(value.toString());
  return isNaN(parsed) ? defaultValue : parsed;
};

// --- Sale Details Dialog ---
interface SaleDetailsDialogProps {
  sale: SaleTransaction | null;
  customerName?: string; // Optional customer name
  onClose: () => void;
}

// --- Print Invoice Dialog ---
interface PrintInvoiceDialogProps {
  sale: SaleTransaction | null;
  customer?: Customer;
  onClose: () => void;
}

// Helper type for items with product names and unit labels
interface SaleItemWithDetails extends SaleTransactionItem {
  productName: string;
  unitLabel: string;
  originalPrice: number; // Price before discount for this item's unit
}

// Helper function to get payment method details
const getPaymentMethodInfo = (method: PaymentMethod | undefined) => {
  if (!method)
    return { text: method || "", icon: Coins, color: "text-muted-foreground" };
  switch (method) {
    case "cash":
      return { text: "نقداً", icon: Coins, color: "text-green-600" };
    case "card":
      return { text: "بطاقة", icon: CreditCard, color: "text-blue-600" };
    case "debt":
      return { text: "آجل/مديونية", icon: Landmark, color: "text-red-600" };
    default:
      return { text: method, icon: Coins, color: "text-muted-foreground" };
  }
};

// Export SaleDetailsDialog component
export function SaleDetailsDialog({
  sale,
  customerName,
  onClose,
}: SaleDetailsDialogProps) {
  const [detailedItems, setDetailedItems] = React.useState<
    SaleItemWithDetails[]
  >([]);
  const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);
  const [localOriginalTotal, setLocalOriginalTotal] = React.useState<number>(0);
  const [localSubTotal, setLocalSubTotal] = React.useState<number>(0); // Total after product discount

  React.useEffect(() => {
    const fetchDetails = async () => {
      if (!sale) return;
      setIsLoadingDetails(true);
      let calculatedOriginalTotal = 0;
      let calculatedSubTotal = 0;
      try {
        const itemsWithDetails = await Promise.all(
          sale.items.map(async (item) => {
            const product = await getProductById(item.productId); // Get full product info
            const productName = product
              ? product.nameAr
              : `منتج (${item.productId.substring(0, 6)})`;
            const unitLabel =
              item.soldUnitType === "sub"
                ? product?.subUnitType || "فرعية"
                : product?.unitType || "رئيسية";

            // Calculate original price *before* discount for sold unit
            const originalUnitPrice = product
              ? item.soldUnitType === "sub" && product.subUnitsPerUnit
                ? safeParseFloat(product.price) / product.subUnitsPerUnit
                : safeParseFloat(product.price)
              : safeParseFloat(item.price);

            calculatedOriginalTotal +=
              originalUnitPrice * safeParseFloat(item.quantity);
            calculatedSubTotal +=
              safeParseFloat(item.price) * safeParseFloat(item.quantity); // item.price is after product discount

            return {
              ...item,
              productName: productName,
              unitLabel: unitLabel,
              originalPrice: originalUnitPrice,
            };
          })
        );
        setDetailedItems(itemsWithDetails);
        // Use pre-calculated originalTotalAmount if available, otherwise use dynamically calculated one
        setLocalOriginalTotal(
          safeParseFloat(sale.originalTotalAmount, calculatedOriginalTotal)
        );
        setLocalSubTotal(
          safeParseFloat(sale.subTotalAmount, calculatedSubTotal)
        ); // Use stored subtotal if available
      } catch (error) {
        console.error("Failed to fetch sale item details:", error);
        // Handle error (e.g., show toast)
      } finally {
        setIsLoadingDetails(false);
      }
    };
    if (sale) {
      // Fetch only if a sale is selected
      fetchDetails();
    } else {
      // Reset state when sale is null
      setDetailedItems([]);
      setIsLoadingDetails(false);
      setLocalOriginalTotal(0);
      setLocalSubTotal(0);
    }
  }, [sale]); // Re-fetch when sale changes

  if (!sale) return null;

  const paymentInfo = getPaymentMethodInfo(sale.paymentMethod);
  const totalProductDiscount = localOriginalTotal - localSubTotal;
  const insuranceDiscountAmount =
    localSubTotal * (safeParseFloat(sale.appliedInsuranceDiscountRate) / 100);
  const totalDiscount = totalProductDiscount + insuranceDiscountAmount;
  const finalTotal = safeParseFloat(sale.totalAmount);
  const amountPaid = safeParseFloat(sale.amountPaid);

  // Basic print function (opens print dialog for content)
  const handlePrint = () => {
    const printContent = document.getElementById(
      `sale-details-content-printable-${sale.id}`
    ); // Unique ID for print div
    if (printContent) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        // Use detailedItems and totals already calculated for dialog
        let itemsHtmlForPrint = "";
        if (isLoadingDetails) {
          itemsHtmlForPrint =
            '<tr><td colspan="5">جاري تحميل تفاصيل الأصناف...</td></tr>';
        } else {
          detailedItems.forEach((item) => {
            const hasDiscount =
              item.originalPrice !== safeParseFloat(item.price);
            itemsHtmlForPrint += `
                             <tr>
                                     <td>${item.productName}</td>
                                     <td>${item.unitLabel}</td>
                                     <td>${safeParseFloat(item.quantity)}</td>
                                     <td>${safeParseFloat(item.price).toFixed(
              2
            )} ${hasDiscount
              ? `<span style="font-size:0.8em; color:gray; text-decoration: line-through;">(${item.originalPrice.toFixed(
                2
              )})</span>`
              : ""
              }</td>
                                     <td>${(
                safeParseFloat(item.quantity) *
                safeParseFloat(item.price)
              ).toFixed(2)}</td>
                             </tr>
                         `;
          });
        }
        const remainingAmount = finalTotal - amountPaid;

        printWindow.document.write(`
                 <html>
                 <head>
                     <title>فاتورة بيع - ${sale.id}</title>
                      <style>
                          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
                          body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 20px; font-size: 12px; }
                          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                          th, td { border:1px solid #ddd; padding: 6px; text-align: right; }
                          th { background-color: #f2f2f2; font-weight: bold; }
                           .totals { margin-top: 15px; text-align: left; font-size:1.0em; line-height:1.5; }
                           .totals span { display: inline-block; min-width: 120px; /* Adjusted */ }
                          .totals strong { font-weight: bold; font-size:1.1em; }
                          .header { margin-bottom: 20px; border-bottom:1px solid #eee; padding-bottom: 10px; text-align: center;}
                          .header h2 { margin: 0; font-size:1.5em; }
                           .info { margin-bottom: 15px; display: grid; grid-template-columns:1fr 1fr; gap: 5px 15px; }
                          .info p { margin: 3px 0; }
                          .payment-method { font-weight: bold; }
                          .discount { color: green; }
                           @media print {
                               body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                               button { display: none; }
                           }
                      </style>
                 </head>
                 <body>
                      <div class="header">
                          <h2>صيدليتي</h2>
                          <p>فاتورة بيع</p>
                      </div>
                       <div class="info">
                          <p><strong>رقم الفاتورة:</strong> ${sale.id}</p>
                          <p><strong>التاريخ:</strong> ${new Date(
          sale.date
        ).toLocaleString("ar-SA", {
          dateStyle: "medium",
          timeStyle: "short",
        })}</p>
                          <p><strong>العميل:</strong> ${customerName || "عميل نقدي"
          }</p>
                          <p><strong>طريقة الدفع:</strong> <span class="payment-method">${paymentInfo.text
          }</span></p>
                          ${safeParseFloat(sale.appliedInsuranceDiscountRate) >
            0
            ? `<p><strong>خصم التأمين المطبق:</strong> ${safeParseFloat(
              sale.appliedInsuranceDiscountRate
            )}%</p>`
            : ""
          }
                      </div>
                      <table>
                          <thead>
                              <tr>
                                  <th>المنتج</th>
                                  <th>الوحدة</th>
                                  <th>الكمية</th>
                                  <th>السعر (ج.م)</th>
                                  <th>الإجمالي (ج.م)</th>
                              </tr>
                          </thead>
                          <tbody>
                              ${itemsHtmlForPrint}
                          </tbody>
                      </table>
                       <div class="totals">
                          <div><span>الإجمالي الأصلي:</span> ${localOriginalTotal.toFixed(
            2
          )} ج.م</div>
                          ${totalProductDiscount > 0
            ? `<div><span class="discount">خصم الأصناف:</span> <span class="discount">- ${totalProductDiscount.toFixed(
              2
            )} ج.م</span></div>`
            : ""
          }
                          ${insuranceDiscountAmount > 0
            ? `<div><span class="discount">خصم التأمين:</span> <span class="discount">- ${insuranceDiscountAmount.toFixed(
              2
            )} ج.م</span></div>`
            : ""
          }
                           <hr style="border: none; border-top:1px dashed #ccc; margin: 5px 0;">
                          <div><span>المبلغ المدفوع:</span> ${amountPaid.toFixed(
            2
          )} ج.م</div>
                           ${remainingAmount > 0 &&
            sale.paymentMethod === "debt"
            ? `<div><span>المبلغ المتبقي (آجل):</span> ${remainingAmount.toFixed(
              2
            )} ج.م</div>`
            : ""
          }
                            ${remainingAmount < 0
            ? `<div><span>المبلغ المرجع:</span> ${Math.abs(
              remainingAmount
            ).toFixed(2)} ج.م</div>`
            : ""
          }
                          <div><strong>الإجمالي النهائي:</strong> <strong>${finalTotal.toFixed(
            2
          )} ج.م</strong></div>
                      </div>
                       <button onclick="window.print()">طباعة</button>
                       <button onclick="window.close()">إغلاق</button>
                 </body>
                 </html>
                 `);
        printWindow.document.close();
        printWindow.focus();
      }
    }
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>تفاصيل الفاتورة: {sale.id}</DialogTitle>
      </DialogHeader>
      {/* Content visible in dialog */}
      <div className="py-4 space-y-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <p>
            <strong className="ml-1">العميل:</strong>{" "}
            {customerName || "عميل نقدي"}
          </p>
          <p>
            <strong className="ml-1">تاريخ الفاتورة:</strong>{" "}
            {format(new Date(sale.date), "PPP p", { locale: arSA })}
          </p>
          <p>
            <strong className="ml-1">طريقة الدفع:</strong>
            <Badge
              variant="outline"
              className={cn("mr-1 px-1.5 py-0.5 text-xs", paymentInfo.color)}
            >
              <paymentInfo.icon className="ml-1 h-3 w-3" />
              {paymentInfo.text}
            </Badge>
          </p>
          {safeParseFloat(sale.appliedInsuranceDiscountRate) > 0 && (
            <p className="flex items-center">
              <strong className="ml-1">خصم التأمين:</strong>
              <Badge
                variant="secondary"
                className="mr-1 px-1.5 py-0.5 text-xs font-medium text-blue-700"
              >
                <ShieldCheck className="ml-1 h-3 w-3" />
                {safeParseFloat(sale.appliedInsuranceDiscountRate)}%
              </Badge>
            </p>
          )}
        </div>
        <Separator />
        <h4 className="font-medium">الأصناف:</h4>
        {isLoadingDetails ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto border rounded-md">
            {" "}
            {/* Scrollable item list */}
            <Table>
              <TableHeader className="sticky top-0 bg-secondary">
                <TableRow>
                  <TableHead>المنتج</TableHead>
                  <TableHead>الوحدة</TableHead>
                  <TableHead>الكمية</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>الإجمالي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailedItems.map((item, index) => {
                  const hasDiscount =
                    item.originalPrice !== safeParseFloat(item.price);
                  return (
                    <TableRow key={`${item.productId}-${index}`}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>{item.unitLabel}</TableCell>
                      <TableCell>{safeParseFloat(item.quantity)}</TableCell>
                      <TableCell>
                        {safeParseFloat(item.price).toFixed(2)}
                        {hasDiscount && (
                          <span className="text-xs text-muted-foreground line-through mr-1">
                            ({item.originalPrice.toFixed(2)})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {(
                          safeParseFloat(item.quantity) *
                          safeParseFloat(item.price)
                        ).toFixed(2)}{" "}
                        ج.م
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        <Separator />
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-right text-base mt-4">
          <span>الإجمالي الأصلي:</span>
          <span className="font-semibold">
            {localOriginalTotal.toFixed(2)} ج.م
          </span>

          {totalProductDiscount > 0 && (
            <>
              <span>خصم الأصناف:</span>
              <span className="font-semibold text-green-600">
                -{totalProductDiscount.toFixed(2)} ج.م
              </span>
            </>
          )}
          {insuranceDiscountAmount > 0 && (
            <>
              <span>خصم التأمين:</span>
              <span className="font-semibold text-blue-600">
                -{insuranceDiscountAmount.toFixed(2)} ج.م
              </span>
            </>
          )}

          <span>المبلغ المدفوع:</span>
          <span className="font-semibold">{amountPaid.toFixed(2)} ج.م</span>

          {sale.paymentMethod === "debt" && finalTotal - amountPaid > 0 && (
            <>
              <span>المبلغ المتبقي (آجل):</span>
              <span className="font-semibold text-red-600">
                {(finalTotal - amountPaid).toFixed(2)} ج.م
              </span>
            </>
          )}
          {finalTotal - amountPaid < 0 && (
            <>
              <span>المبلغ المرجع:</span>
              <span className="font-semibold text-green-700">
                {Math.abs(finalTotal - amountPaid).toFixed(2)} ج.م
              </span>
            </>
          )}

          <span className="text-lg font-bold col-start-1">
            الإجمالي النهائي:
          </span>
          <span className="text-lg font-bold">
            {finalTotal.toFixed(2)} ج.م
          </span>
        </div>
      </div>

      {/* Hidden div for printing with unique ID */}
      <div
        id={`sale-details-content-printable-${sale.id}`}
        style={{ display: "none" }}
      >
        {/* Content is generated dynamically in handlePrint */}
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        <div>{/* Spacer */}</div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={isLoadingDetails}
          >
            <Printer className="ml-2 h-4 w-4" />
            طباعة
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="secondary" onClick={onClose}>
              إغلاق
            </Button>
          </DialogClose>
        </div>
      </DialogFooter>
    </DialogContent>
  );
};

// --- Print Invoice Dialog Component ---
function PrintInvoiceDialog({
  sale,
  customer,
  onClose,
}: PrintInvoiceDialogProps) {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [language, setLanguage] = React.useState<"ar" | "en">("ar");
  const [isLoadingProducts, setIsLoadingProducts] = React.useState(false);
  const { toast } = useToast();

  // Fetch products when sale changes
  React.useEffect(() => {
    const fetchProducts = async () => {
      if (!sale) {
        setProducts([]);
        return;
      }
      setIsLoadingProducts(true);
      try {
        const allProducts = await getProducts();
        const productIds = [
          ...new Set(sale.items.map((item) => item.productId)),
        ];
        setProducts(
          allProducts.filter((product) => productIds.includes(product.id))
        );
      } catch (error) {
        console.error("Failed to fetch products for invoice:", error);
        toast({
          title: "خطأ",
          description: "فشل تحميل بيانات المنتجات.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [sale, toast]);

  if (!sale) return null;

  return (
    <Dialog open={!!sale} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>طباعة الفاتورة</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage("ar")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${language === "ar"
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                العربية
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${language === "en"
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                English
              </button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {isLoadingProducts ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Printer className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-pulse" />
                <p className="text-sm text-gray-600">
                  جاري تحميل بيانات الفاتورة...
                </p>
              </div>
            </div>
          ) : (
            <InvoiceWrapper
              sale={sale}
              customer={customer}
              products={products}
              language={{
                id: language === "ar" ? "lang-ar" : "lang-en",
                code: language,
                name: language === "ar" ? "العربية" : "English",
                isRTL: language === "ar",
                createdAt: new Date(),
              }}
              companyName="صيدلية النور / Al-Noor Pharmacy"
              companyAddress="القاهرة - مصر / Cairo, Egypt"
              companyPhone="+20 123 456 7890"
              companyEmail="info@pharmacy.com"
            />
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">إغلاق</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SalesPage() {
  const [sales, setSales] = React.useState<SaleTransaction[]>([]);
  const [customers, setCustomers] = React.useState<Map<string, Customer>>(
    new Map()
  ); // Map customer ID to Customer object
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedSale, setSelectedSale] =
    React.useState<SaleTransaction | null>(null); // For details dialog
  const [saleToDelete, setSaleToDelete] =
    React.useState<SaleTransaction | null>(null); // For delete confirmation
  const [saleToPrint, setSaleToPrint] =
    React.useState<SaleTransaction | null>(null); // For print invoice dialog
  const { toast } = useToast();

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [salesData, customerData] = await Promise.all([
        getSales(), // Fetch actual sales data
        getCustomers(),
      ]);
      setSales(salesData);

      const customerMap = new Map<string, Customer>();
      customerData.forEach((c) => customerMap.set(c.id, c));
      setCustomers(customerMap);
    } catch (error) {
      console.error("Failed to fetch sales data:", error);
      toast({
        title: "خطأ",
        description: "فشل تحميل فواتير البيع.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchData(); // Fetch data on mount
  }, [fetchData]);

  const handleDeleteSale = async () => {
    if (!saleToDelete) return;
    setIsLoading(true); // Consider a specific loading state for deletion
    try {
      const success = await deleteSale(saleToDelete.id);
      if (success) {
        toast({
          title: "نجاح",
          description: `تم حذف الفاتورة ${saleToDelete.id} بنجاح.`,
        });
        setSaleToDelete(null); // Close confirmation dialog
        fetchData(); // Refresh list
      } else {
        throw new Error("Delete operation returned false");
      }
    } catch (error) {
      console.error("Failed to delete sale:", error);
      toast({
        title: "خطأ",
        description: `فشل حذف الفاتورة: ${error instanceof Error ? error.message : String(error)
          }`,
        variant: "destructive",
      });
      setSaleToDelete(null); // Close confirmation dialog even on error
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSales = sales
    .filter(
      (sale) =>
        sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.customerId &&
          customers
            .get(sale.customerId)
            ?.name?.toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        sale.items.some((item) =>
          item.productId.toLowerCase().includes(searchTerm.toLowerCase())
        ) // Simple check on product ID for now
      // TODO: Enhance search to fetch product names if needed for searching item names
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date descending

  return (
    <>
      {/* Main Content */}
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Receipt className="w-6 h-6" />
            فواتير البيع
          </h2>
          {/* Add New Sale Button (Optional - maybe link to POS) */}
        </div>

        <div className="flex items-center py-4">
          <Input
            placeholder="ابحث برقم الفاتورة, العميل, أو كود المنتج..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الفاتورة</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>تاريخ الفاتورة</TableHead>
                <TableHead>طريقة الدفع</TableHead>
                <TableHead>إجمالي المبلغ (ج.م)</TableHead>
                <TableHead>عدد الأصناف</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    جاري تحميل الفواتير...
                  </TableCell>
                </TableRow>
              ) : filteredSales.length > 0 ? (
                filteredSales.map((sale) => {
                  const paymentInfo = getPaymentMethodInfo(
                    sale.paymentMethod
                  );
                  return (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">
                        {sale.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {sale.customerId
                          ? customers.get(sale.customerId)?.name ||
                          sale.customerId
                          : "عميل نقدي"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(sale.date), "dd/MM/yyyy p", {
                          locale: arSA,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-1.5 py-0.5 text-xs",
                            paymentInfo.color
                          )}
                        >
                          <paymentInfo.icon className="ml-1 h-3 w-3" />
                          {paymentInfo.text}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {safeParseFloat(sale.totalAmount).toFixed(2)}
                      </TableCell>
                      <TableCell>{sale.items.length}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:bg-blue-100"
                          onClick={() => setSelectedSale(sale)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:bg-green-100"
                          onClick={() => setSaleToPrint(sale)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => setSaleToDelete(sale)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    لا توجد فواتير بيع لعرضها.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {/* Add Pagination later if needed */}
        </div>
      </div>

      {/* Sale Details Dialog */}
      <Dialog
        open={!!selectedSale}
        onOpenChange={(open) => !open && setSelectedSale(null)}
      >
        <SaleDetailsDialog
          sale={selectedSale}
          customerName={
            selectedSale?.customerId
              ? customers.get(selectedSale.customerId)?.name
              : undefined
          }
          onClose={() => setSelectedSale(null)}
        />
      </Dialog>

      {/* Print Invoice Dialog */}
      {saleToPrint && (
        <PrintInvoiceDialog
          sale={saleToPrint}
          customer={
            saleToPrint?.customerId
              ? customers.get(saleToPrint.customerId)
              : undefined
          }
          onClose={() => setSaleToPrint(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {saleToDelete && (
        <AlertDialog
          open={!!saleToDelete}
          onOpenChange={(open) => !open && setSaleToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد أنك تريد حذف الفاتورة رقم "{saleToDelete?.id}"؟
                سيتم إلغاء تأثير هذه الفاتورة على المخزون ورصيد العميل (إن
                وجد). لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSaleToDelete(null)}>
                إلغاء
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={handleDeleteSale}
                disabled={isLoading}
              >
                {isLoading ? "جاري الحذف..." : "حذف الفاتورة"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
