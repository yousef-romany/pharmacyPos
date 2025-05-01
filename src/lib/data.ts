import type { Product, Supplier, Customer } from '@/lib/types';
import { Pill, Baby, SprayCan, Activity, Building, User } from 'lucide-react';

// --- Products Data ---
let sampleProducts: Product[] = [
   {
    id: 'prod-001',
    nameAr: 'بنادول اكسترا',
    nameEn: 'Panadol Extra',
    price: 15.50,
    quantity: 150,
    categoryIcon: Pill,
  },
  {
    id: 'prod-002',
    nameAr: 'فيتامين سي فوار',
    nameEn: 'Vitamin C Effervescent',
    price: 22.00,
    quantity: 80,
    categoryIcon: Activity,
  },
  {
    id: 'prod-003',
    nameAr: 'حليب أطفال المرحلة 1',
    nameEn: 'Baby Milk Stage 1',
    price: 55.75,
    quantity: 45,
    categoryIcon: Baby,
  },
  {
    id: 'prod-004',
    nameAr: 'بخاخ الأنف',
    nameEn: 'Nasal Spray',
    price: 30.00,
    quantity: 60,
    categoryIcon: SprayCan,
  },
  {
    id: 'prod-005',
    nameAr: 'أقراص مسكنة للألم',
    nameEn: 'Pain Relief Tablets',
    price: 12.25,
    quantity: 200,
    categoryIcon: Pill,
  },
  {
    id: 'prod-006',
    nameAr: 'مكمل غذائي حديد',
    nameEn: 'Iron Supplement',
    price: 40.00,
    quantity: 90,
    categoryIcon: Activity,
  },
    {
    id: 'prod-007',
    nameAr: 'كريم حفاضات للأطفال',
    nameEn: 'Baby Diaper Cream',
    price: 25.50,
    quantity: 70,
    categoryIcon: Baby,
  },
  {
    id: 'prod-008',
    nameAr: 'شراب سعال',
    nameEn: 'Cough Syrup',
    price: 18.00,
    quantity: 110,
    categoryIcon: SprayCan, // Using SprayCan as a placeholder, could be Bottle icon if available
  },
];

// Simulate fetching products (e.g., from an API or database)
export async function getProducts(): Promise<Product[]> {
  // In a real app, this would fetch data from a source
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay
  return [...sampleProducts]; // Return a copy
}

export async function getProductById(id: string): Promise<Product | undefined> {
  await new Promise(resolve => setTimeout(resolve, 20));
  return sampleProducts.find(p => p.id === id);
}

export async function addProduct(productData: Omit<Product, 'id'>): Promise<Product> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const newProduct: Product = {
    ...productData,
    id: `prod-${Date.now().toString()}-${Math.random().toString(16).substring(2, 8)}`, // Generate unique ID
     categoryIcon: productData.categoryIcon || Pill, // Default icon
  };
  sampleProducts.push(newProduct);
  console.log("Added Product:", newProduct);
  console.log("Current Products:", sampleProducts);
  return newProduct;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const index = sampleProducts.findIndex(p => p.id === id);
  if (index === -1) return null;
  sampleProducts[index] = { ...sampleProducts[index], ...updates };
   console.log("Updated Product:", sampleProducts[index]);
   console.log("Current Products:", sampleProducts);
  return sampleProducts[index];
}

export async function deleteProduct(id: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const initialLength = sampleProducts.length;
  sampleProducts = sampleProducts.filter(p => p.id !== id);
  const success = sampleProducts.length < initialLength;
  console.log(`Deleted Product ${id}?`, success);
  console.log("Current Products:", sampleProducts);
  return success;
}


// --- Suppliers Data ---
let sampleSuppliers: Supplier[] = [
  {
    id: 'supp-001',
    name: 'شركة الأدوية المتحدة',
    contactPerson: 'أحمد خالد',
    phone: '011-1234567',
    email: 'ahmed.khalid@unitedpharma.com',
    address: 'الرياض، المنطقة الصناعية',
  },
  {
    id: 'supp-002',
    name: 'مستودع الشفاء الطبي',
    contactPerson: 'سارة عبدالله',
    phone: '012-9876543',
    email: 'sara.abdullah@shifa-depot.sa',
    address: 'جدة، شارع الملك فهد',
  },
   {
    id: 'supp-003',
    name: 'موزعين الصحة العالمية',
    contactPerson: 'محمد علي',
    phone: '013-5551122',
    email: 'm.ali@globalhealthdist.com',
    address: 'الدمام، طريق الخليج',
  },
];

export async function getSuppliers(): Promise<Supplier[]> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return [...sampleSuppliers]; // Return a copy
}

export async function addSupplier(supplierData: Omit<Supplier, 'id'>): Promise<Supplier> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const newSupplier: Supplier = {
    ...supplierData,
    id: `supp-${Date.now().toString()}-${Math.random().toString(16).substring(2, 8)}`,
  };
  sampleSuppliers.push(newSupplier);
   console.log("Added Supplier:", newSupplier);
   console.log("Current Suppliers:", sampleSuppliers);
  return newSupplier;
}

export async function updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier | null> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const index = sampleSuppliers.findIndex(s => s.id === id);
  if (index === -1) return null;
  sampleSuppliers[index] = { ...sampleSuppliers[index], ...updates };
    console.log("Updated Supplier:", sampleSuppliers[index]);
    console.log("Current Suppliers:", sampleSuppliers);
  return sampleSuppliers[index];
}

export async function deleteSupplier(id: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const initialLength = sampleSuppliers.length;
  sampleSuppliers = sampleSuppliers.filter(s => s.id !== id);
   const success = sampleSuppliers.length < initialLength;
  console.log(`Deleted Supplier ${id}?`, success);
  console.log("Current Suppliers:", sampleSuppliers);
  return success;
}

// --- Customers Data ---
let sampleCustomers: Customer[] = [
  {
    id: 'cust-001',
    name: 'خالد الغامدي',
    phone: '050-1122334',
    address: 'الرياض، حي الملز',
  },
  {
    id: 'cust-002',
    name: 'فاطمة الزهراني',
    phone: '055-9988776',
    email: 'fatima.z@email.com',
  },
   {
    id: 'cust-003',
    name: 'علي الشهري',
    address: 'جدة، حي الشاطئ',
  },
];

export async function getCustomers(): Promise<Customer[]> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return [...sampleCustomers]; // Return a copy
}

export async function addCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const newCustomer: Customer = {
    ...customerData,
    id: `cust-${Date.now().toString()}-${Math.random().toString(16).substring(2, 8)}`,
  };
  sampleCustomers.push(newCustomer);
   console.log("Added Customer:", newCustomer);
   console.log("Current Customers:", sampleCustomers);
  return newCustomer;
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const index = sampleCustomers.findIndex(c => c.id === id);
  if (index === -1) return null;
  sampleCustomers[index] = { ...sampleCustomers[index], ...updates };
   console.log("Updated Customer:", sampleCustomers[index]);
   console.log("Current Customers:", sampleCustomers);
  return sampleCustomers[index];
}

export async function deleteCustomer(id: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const initialLength = sampleCustomers.length;
  sampleCustomers = sampleCustomers.filter(c => c.id !== id);
   const success = sampleCustomers.length < initialLength;
  console.log(`Deleted Customer ${id}?`, success);
  console.log("Current Customers:", sampleCustomers);
  return success;
}

// --- Transactions (Invoices) Data ---
// For now, let's just keep this structure simple. We won't implement full CRUD yet.
// In a real app, these would interact with Products (stock levels) etc.
let sampleSales: any[] = []; // Replace 'any' with SaleTransaction later
let samplePurchases: any[] = []; // Replace 'any' with PurchaseTransaction later

export async function getSales(): Promise<any[]> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return [...sampleSales];
}

export async function getPurchases(): Promise<any[]> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return [...samplePurchases];
}
