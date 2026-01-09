
import type { LucideIcon } from 'lucide-react'; // Import LucideIcon

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

export type PaymentMethod = 'cash' | 'card' | 'debt';

export interface SaleTransaction {
  id: string;
  customerId?: string;
  items: SaleTransactionItem[];
  totalAmount: string; // Represented as VARCHAR in DB
  originalTotalAmount?: string; // Represented as VARCHAR in DB
  subTotalAmount?: string; // Represented as VARCHAR in DB
  paymentMethod: PaymentMethod;
  amountPaid: string; // Represented as VARCHAR in DB
  date: Date; // DATETIME
  appliedInsuranceDiscountRate?: string; // Represented as VARCHAR in DB
   saleWarehouseId?: string; // FK to Physical Warehouse where sale originated
   paymentTreasuryId?: string; // FK to Financial Treasury where payment was deposited
}

export interface PurchaseTransactionItem {
    productId: string;
    quantity: string; // Represented as VARCHAR in DB
    cost: string; // Represented as VARCHAR in DB
    expiryDate?: Date; // DATE
    destinationWarehouseId?: string; // FK to Physical Warehouse where item was received
}

export type PaymentStatus = 'paid' | 'unpaid' | 'partial';

export interface PurchaseTransaction {
  id: string;
  supplierId: string;
  items: PurchaseTransactionItem[];
  totalAmount: string; // Represented as VARCHAR in DB
  paymentStatus: PaymentStatus;
  amountPaid: string; // Represented as VARCHAR in DB
  date: Date; // DATETIME
  invoiceNumber?: string;
   destinationWarehouseId?: string; // FK to Physical Warehouse for the whole purchase (can be overridden per item)
   paymentTreasuryId?: string; // FK to Financial Treasury where payment came from
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
