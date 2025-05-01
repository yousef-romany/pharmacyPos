export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  quantity: number;
  categoryIcon?: React.ComponentType<{ className?: string }>; // Optional icon component
}

export interface CartItem extends Product {
  cartQuantity: number;
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
export interface SaleTransaction {
  id: string;
  customerId?: string; // Link to customer
  items: { productId: string; quantity: number; price: number }[];
  totalAmount: number;
  date: Date;
}

export interface PurchaseTransaction {
  id: string;
  supplierId: string; // Link to supplier
  items: { productId: string; quantity: number; cost: number }[];
  totalAmount: number;
  date: Date;
}
