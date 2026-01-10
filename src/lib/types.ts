
import type { LucideIcon } from 'lucide-react'; // Import LucideIcon

// ====================================================================
// Egyptian Drugs Database Types
// أنواع قاعدة بيانات الأدوية المصرية
// ====================================================================

export interface DrugCategory {
  id: string;
  categoryAR: string;
  categoryEN: string;
  description?: string;
  createdAt?: Date;
}

export interface EgyptianDrug {
  id: string;
  nameAR: string;
  nameEN: string;
  activeIngredient: string;
  manufacturer?: string;
  egyptianBarcode: string;
  categoryID?: string;
  categoryAR?: string; // Joined field
  categoryEN?: string; // Joined field
  type: string; // Tablet, Syrup, Injection, etc.
  dosage?: string;
  packaging?: string;
  price?: number;
  registrationNumber?: string;
  approvalDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// ====================================================================
// Invoice & Multi-language Types
// أنواع الفواتير ودعم اللغات المتعددة
// ====================================================================

export interface InvoiceLanguage {
  id: string;
  code: string; // 'ar', 'en', 'fr', 'de', 'es'
  name: string;
  isRTL: boolean;
  createdAt?: Date;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  languageId: string;
  templateContent: string;
  headerContent?: string;
  footerContent?: string;
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InvoiceTranslation {
  id: string;
  languageId: string;
  keyName: string;
  translation: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CustomerPreference {
  id: string;
  customerId: string;
  preferredLanguageId: string;
  preferredCurrency?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ====================================================================
// Warehouse & Treasury Types
// أنواع المخازن والخزائن
// ====================================================================

// Define Warehouse Type (For Physical Product Storage)
export interface Warehouse {
  id: string;
  name: string;
  location?: string; // TEXT
  isDefault?: boolean; // Indicate the main/default warehouse for product placement/deduction
}

// Define Treasury/Account Type (For Financial Management)
export interface Treasury {
    id: string;
    name: string;
    description?: string; // TEXT
    isDefault?: boolean; // Indicate the main/default financial account
    paymentMethodType?: PaymentMethod; // Link treasury to payment method type (cash, card, instapay, etc.)
    // openingBalance?: string; // Optional: Store opening balance as VARCHAR
}


export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  manufacturer?: string;
  concentration?: string;
  activeIngredient?: string;
  price: string; // Represented as VARCHAR in DB
  lastPurchaseCost?: string; // Represented as VARCHAR in DB
  quantity: string; // Represented as VARCHAR in DB
  categoryIcon?: React.ComponentType<{ className?: string }> | LucideIcon;
  barcode?: string;
  unitType: string;
  subUnitType?: string;
  subUnitsPerUnit?: number; // INT
  discountRate?: string; // Represented as VARCHAR in DB
  expiryDate?: Date; // DATE
  minStockLevel?: number; // INT
  warehouseId?: string; // Foreign key to Warehouses table (Physical Location)
}

export interface CartItem extends Product {
  cartQuantity: number;
  selectedUnitType: 'main' | 'sub';
  pricePerSelectedUnit: number; // Keep as number for calculations in cart
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string; // TEXT
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string; // TEXT
  balance?: string; // Represented as VARCHAR in DB
  insuranceCompany?: string;
  policyNumber?: string;
  insuranceDiscountRate?: string; // Represented as VARCHAR in DB
}

export interface SaleTransactionItem {
    productId: string;
    quantity: string; // Represented as VARCHAR in DB
    price: string; // Represented as VARCHAR in DB (Price per unit *after* discount)
    soldUnitType: 'main' | 'sub';
    costAtSale?: string; // Represented as VARCHAR in DB
     warehouseId?: string; // FK to Physical Warehouse where item came from
}

export type PaymentMethod = 'cash' | 'card' | 'debt' | 'instapay' | 'vodafone_cash';

// Split Payment Entry - for multiple payment methods in single transaction
export interface SalePayment {
    treasuryId: string; // Which treasury/account received this payment
    amount: string; // Amount paid to this treasury (as VARCHAR)
}

export interface SaleTransaction {
  id: string;
  customerId?: string;
  items: SaleTransactionItem[];
  totalAmount: string; // Represented as VARCHAR in DB
  originalTotalAmount?: string; // Represented as VARCHAR in DB
  subTotalAmount?: string; // Represented as VARCHAR in DB
  // Legacy single payment fields (kept for backward compatibility)
  paymentMethod?: PaymentMethod;
  amountPaid?: string; // Represented as VARCHAR in DB
  // New split payment support
  payments?: SalePayment[]; // Multiple payments for split payment support
  date: Date; // DATETIME
  appliedInsuranceDiscountRate?: string; // Represented as VARCHAR in DB
   saleWarehouseId?: string; // FK to Physical Warehouse where sale originated
   paymentTreasuryId?: string; // FK to Financial Treasury where payment was deposited (legacy)
  invoiceLanguageId?: string; // FK to InvoiceLanguages for multi-language support
  invoiceNumber?: string; // Auto-generated invoice number
}

export interface PurchaseTransactionItem {
    productId: string;
    quantity: string; // Represented as VARCHAR in DB
    cost: string; // Represented as VARCHAR in DB
    expiryDate?: Date; // DATE
    destinationWarehouseId?: string; // FK to Physical Warehouse where item was received
}

export type PaymentStatus = 'paid' | 'unpaid' | 'partial';

// Purchase Payment Entry - for multiple payment methods in single purchase
export interface PurchasePayment {
    treasuryId: string; // Which treasury/account paid this amount
    amount: string; // Amount paid from this treasury (as VARCHAR)
}

export interface PurchaseTransaction {
  id: string;
  supplierId: string;
  items: PurchaseTransactionItem[];
  totalAmount: string; // Represented as VARCHAR in DB
  paymentStatus: PaymentStatus;
  // Legacy single payment fields (kept for backward compatibility)
  paymentMethod?: PaymentMethod; // Payment method used (cash, card, debt)
  amountPaid?: string; // Represented as VARCHAR in DB
  // New split payment support
  payments?: PurchasePayment[]; // Multiple payments for split payment support
  date: Date; // DATETIME
  invoiceNumber?: string;
   destinationWarehouseId?: string; // FK to Physical Warehouse for the whole purchase (can be overridden per item)
   paymentTreasuryId?: string; // FK to Financial Treasury where payment came from (legacy)
}

export type UserRole = 'admin' | 'manager' | 'seller' | 'accountant';

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string; // Optional
  role: UserRole;
  passwordHash?: string; // Store the password hash (should not be exposed to client)
}

export interface ProductExpiryInfo extends Pick<Product, 'id' | 'nameAr' | 'expiryDate' | 'quantity'> {
    daysUntilExpiry: number;
    warehouseId?: string; // FK to Physical Warehouse
}

export interface InventoryReportItem extends Pick<Product, 'id' | 'nameAr' | 'nameEn' | 'barcode' | 'quantity' | 'price' | 'expiryDate' | 'unitType' | 'lastPurchaseCost'> {
    inventoryValue: number; // Calculated value (number)
    warehouseId?: string; // FK to Physical Warehouse
    warehouseName?: string; // Optional: Add warehouse name for display
}

// Define Treasury Transaction Type
export type TreasuryTransactionType =
    | 'deposit'
    | 'withdrawal'
    | 'sale_payment'
    | 'purchase_payment'
    | 'expense'
    | 'transfer_in'
    | 'transfer_out'
    | 'opening_balance'
    | 'sale_payment_reversal' // Added for reversing sale payments
    | 'purchase_payment_reversal'; // Added for reversing purchase payments

export interface TreasuryTransaction {
  id: string;
  type: TreasuryTransactionType;
  amount: string; // Store as VARCHAR, positive for inflow, negative for outflow
  date: Date; // DATETIME
  description?: string; // TEXT
  userId?: string; // User who performed the transaction (optional)
  relatedDocumentId?: string; // Link to Sale, Purchase, Expense etc. (optional)
  treasuryId?: string; // Foreign key to Treasuries table (Financial Account)
}
