
export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number; // Price of the main unit (e.g., box)
  quantity: number; // Quantity of the main unit in stock (can be fractional)
  categoryIcon?: React.ComponentType<{ className?: string }>; // Optional icon component
  barcode?: string; // Optional barcode field
  unitType: string; // e.g., 'علبة', 'شريط', 'حبة'
  subUnitType?: string; // Optional: e.g., 'شريط', 'حبة'
  subUnitsPerUnit?: number; // Optional: How many sub-units make up the main unit (e.g., 3 strips per box)
  discountRate?: number; // Optional: Discount percentage (0-100)
  expiryDate?: Date; // Optional: Expiry date
  minStockLevel?: number; // Optional: Minimum stock level for alerts
}

export interface CartItem extends Product {
  cartQuantity: number; // Quantity of the selected unit in the cart
  selectedUnitType: 'main' | 'sub'; // Which unit is currently selected in the cart
  pricePerSelectedUnit: number; // The calculated price for the selected unit
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

// Basic types for transactions, can be expanded later
export interface SaleTransactionItem {
    productId: string;
    quantity: number; // Quantity of the sold unit
    price: number; // Price per sold unit at the time of sale
    soldUnitType: 'main' | 'sub'; // Record which unit was sold
}

export interface SaleTransaction {
  id: string;
  customerId?: string; // Link to customer
  items: SaleTransactionItem[];
  totalAmount: number;
  date: Date;
}

// Type for items within a purchase transaction
export interface PurchaseTransactionItem {
    productId: string;
    quantity: number; // Quantity of the main unit purchased
    cost: number; // Cost per main unit
}

// Type for a purchase transaction (invoice)
export interface PurchaseTransaction {
  id: string;
  supplierId: string; // Link to supplier
  items: PurchaseTransactionItem[];
  totalAmount: number;
  date: Date;
}

// --- User Management Types ---
export type UserRole = 'admin' | 'seller' | 'manager' | 'accountant'; // Example roles

export interface User {
  id: string;
  name: string;
  email: string; // Usually used for login
  role: UserRole;
  // Add other relevant fields like isActive, passwordHash (never store plain password!)
}

// Helper type for products nearing expiry
export interface ProductExpiryInfo extends Pick<Product, 'id' | 'nameAr' | 'expiryDate' | 'quantity'> {
    daysUntilExpiry: number;
}
