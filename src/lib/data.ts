
import type { Product, Supplier, Customer, SaleTransaction, PurchaseTransaction, PurchaseTransactionItem, SaleTransactionItem, User, ProductExpiryInfo } from '@/lib/types';
import { Pill, Baby, SprayCan, Activity } from 'lucide-react';
import { differenceInDays, addDays, isBefore, isSameDay } from 'date-fns';

// --- Products Data ---
let sampleProducts: Product[] = [
   {
    id: 'prod-001',
    nameAr: 'بنادول اكسترا',
    nameEn: 'Panadol Extra',
    price: 15.50, // Price per box
    quantity: 8, // Boxes in stock - LOW STOCK EXAMPLE
    categoryIcon: Pill,
    barcode: '6281060000010',
    unitType: 'علبة', // Main unit
    subUnitType: 'شريط', // Sub unit
    subUnitsPerUnit: 2, // 2 strips per box
    expiryDate: addDays(new Date(), 60), // Expires in ~2 months
    minStockLevel: 10, // Minimum 10 boxes
    discountRate: 5, // 5% discount
  },
  {
    id: 'prod-002',
    nameAr: 'فيتامين سي فوار',
    nameEn: 'Vitamin C Effervescent',
    price: 22.00, // Price per tube/box
    quantity: 80,
    categoryIcon: Activity,
    barcode: '6281060000027',
    unitType: 'علبة', // Main unit (e.g., a tube)
    subUnitType: 'قرص', // Sub unit
    subUnitsPerUnit: 10, // 10 tablets per tube
    expiryDate: addDays(new Date(), 300), // Expires in ~10 months
    minStockLevel: 20,
  },
  {
    id: 'prod-003',
    nameAr: 'حليب أطفال المرحلة 1',
    nameEn: 'Baby Milk Stage 1',
    price: 55.75,
    quantity: 45,
    categoryIcon: Baby,
    barcode: '6281060000034',
    unitType: 'علبة', // Only main unit
    expiryDate: addDays(new Date(), 15), // EXPIRES SOON EXAMPLE
    minStockLevel: 15,
  },
  {
    id: 'prod-004',
    nameAr: 'بخاخ الأنف',
    nameEn: 'Nasal Spray',
    price: 30.00,
    quantity: 60,
    categoryIcon: SprayCan,
    barcode: '6281060000041',
    unitType: 'بخاخ', // Only main unit
    expiryDate: addDays(new Date(), -10), // EXPIRED EXAMPLE
    minStockLevel: 10,
  },
  {
    id: 'prod-005',
    nameAr: 'أقراص مسكنة للألم',
    nameEn: 'Pain Relief Tablets',
    price: 12.25, // Price per box
    quantity: 200, // Boxes in stock
    categoryIcon: Pill,
    barcode: '6281060000058',
    unitType: 'علبة',
    subUnitType: 'شريط',
    subUnitsPerUnit: 3, // 3 strips per box
    expiryDate: addDays(new Date(), 180), // Expires in ~6 months
    minStockLevel: 50,
  },
  {
    id: 'prod-006',
    nameAr: 'مكمل غذائي حديد',
    nameEn: 'Iron Supplement',
    price: 40.00,
    quantity: 5, // LOW STOCK EXAMPLE
    categoryIcon: Activity,
    barcode: '6281060000065',
    unitType: 'علبة', // Only main unit
    expiryDate: addDays(new Date(), 400),
    minStockLevel: 10,
  },
    {
    id: 'prod-007',
    nameAr: 'كريم حفاضات للأطفال',
    nameEn: 'Baby Diaper Cream',
    price: 25.50,
    quantity: 70,
    categoryIcon: Baby,
    barcode: '6281060000072',
    unitType: 'أنبوب', // Only main unit
    expiryDate: addDays(new Date(), 90), // Expires in ~3 months
    minStockLevel: 25,
     discountRate: 10, // 10% discount
  },
  {
    id: 'prod-008',
    nameAr: 'شراب سعال',
    nameEn: 'Cough Syrup',
    price: 18.00,
    quantity: 110,
    categoryIcon: SprayCan, // Placeholder, could be Bottle icon
    barcode: '6281060000089',
    unitType: 'زجاجة', // Only main unit
    expiryDate: addDays(new Date(), 500),
    minStockLevel: 30,
  },
];

// Simulate fetching products (e.g., from an API or database)
export async function getProducts(): Promise<Product[]> {
  // In a real app, this would fetch data from a source
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay
   // Parse expiry dates if they are stored as strings
   return sampleProducts.map(p => ({
     ...p,
     expiryDate: p.expiryDate ? new Date(p.expiryDate) : undefined, // Ensure expiryDate is a Date object
   }));
}

export async function getProductById(id: string): Promise<Product | undefined> {
  await new Promise(resolve => setTimeout(resolve, 20));
  const product = sampleProducts.find(p => p.id === id);
  return product ? { ...product, expiryDate: product.expiryDate ? new Date(product.expiryDate) : undefined } : undefined;
}

// Simulate finding product by barcode (in real app, query DB/API)
export async function getProductByBarcode(barcode: string): Promise<Product | undefined> {
    await new Promise(resolve => setTimeout(resolve, 20));
    const product = sampleProducts.find(p => p.barcode === barcode);
     return product ? { ...product, expiryDate: product.expiryDate ? new Date(product.expiryDate) : undefined } : undefined;
}


export async function addProduct(productData: Omit<Product, 'id'>): Promise<Product> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const newProduct: Product = {
    id: `prod-${Date.now().toString()}-${Math.random().toString(16).substring(2, 8)}`, // Generate unique ID
    nameAr: productData.nameAr,
    nameEn: productData.nameEn,
    price: productData.price || 0,
    quantity: productData.quantity || 0,
    categoryIcon: productData.categoryIcon || Pill, // Default icon
    barcode: productData.barcode || '',
    unitType: productData.unitType || 'قطعة',
    subUnitType: productData.subUnitType,
    subUnitsPerUnit: productData.subUnitsPerUnit,
    discountRate: productData.discountRate,
    expiryDate: productData.expiryDate ? new Date(productData.expiryDate) : undefined,
    minStockLevel: productData.minStockLevel,
  };
  sampleProducts.push(newProduct);
  console.log("Added Product:", newProduct);
  console.log("Current Products:", sampleProducts);
  return newProduct;
}

export async function updateProduct(id: string, updates: Partial<Omit<Product, 'id'>>): Promise<Product | null> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const index = sampleProducts.findIndex(p => p.id === id);
  if (index === -1) return null;

  const currentProduct = sampleProducts[index];
  // Ensure date is properly handled if updated
  const updateData = { ...updates };
  if (updateData.expiryDate) {
      updateData.expiryDate = new Date(updateData.expiryDate);
  }

  let updatedProduct = { ...currentProduct, ...updateData };

  // --- Validation and Cleaning ---
  // Ensure quantity is non-negative
  if (typeof updatedProduct.quantity === 'number' && updatedProduct.quantity < 0) {
    updatedProduct.quantity = 0;
  } else if (typeof updatedProduct.quantity !== 'number') {
    updatedProduct.quantity = currentProduct.quantity;
  }

  // Ensure subUnitsPerUnit is handled
  if (updates.subUnitsPerUnit !== undefined) {
    updatedProduct.subUnitsPerUnit = updates.subUnitsPerUnit > 0 ? updates.subUnitsPerUnit : undefined;
    if (!updatedProduct.subUnitsPerUnit) {
      updatedProduct.subUnitType = undefined;
    }
  }

  // Ensure price is non-negative
  if (typeof updatedProduct.price === 'number' && updatedProduct.price < 0) {
    updatedProduct.price = 0;
  }
  // Ensure minStockLevel is non-negative integer or undefined
   if (updates.minStockLevel !== undefined) {
     updatedProduct.minStockLevel = Number.isInteger(updates.minStockLevel) && updates.minStockLevel >= 0 ? updates.minStockLevel : undefined;
   }
  // Ensure discountRate is between 0 and 100 or undefined
  if (updates.discountRate !== undefined) {
      updatedProduct.discountRate = typeof updates.discountRate === 'number' && updates.discountRate >= 0 && updates.discountRate <= 100 ? updates.discountRate : undefined;
  }


  sampleProducts[index] = updatedProduct;
  console.log("Updated Product:", sampleProducts[index]);
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
let sampleSales: SaleTransaction[] = [];
let samplePurchases: PurchaseTransaction[] = [
     // Add some initial purchase data for testing
    { id: 'pur-001', supplierId: 'supp-001', items: [{ productId: 'prod-001', quantity: 100, cost: 10.50 }, { productId: 'prod-005', quantity: 150, cost: 8.00 }], totalAmount: 2250.00, date: new Date(2024, 6, 14) },
    { id: 'pur-002', supplierId: 'supp-002', items: [{ productId: 'prod-003', quantity: 50, cost: 45.00 }], totalAmount: 2250.00, date: new Date(2024, 6, 13) },
];

export async function getSales(): Promise<SaleTransaction[]> {
  await new Promise(resolve => setTimeout(resolve, 50));
  // Sort sales by date descending before returning
  return [...sampleSales].sort((a, b) => b.date.getTime() - a.date.getTime());
}

// Function to add a sale and update product quantities
export async function addSale(saleData: Omit<SaleTransaction, 'id'>): Promise<SaleTransaction> {
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate delay

    const newSale: SaleTransaction = {
        ...saleData,
        id: `sale-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`, // Unique sale ID
        date: saleData.date || new Date(), // Ensure date exists
    };
    sampleSales.push(newSale);
    console.log("Added Sale:", newSale);

    // --- Update Product Quantities ---
    await Promise.all(newSale.items.map(async (item: SaleTransactionItem) => {
        const product = await getProductById(item.productId);
        if (product) {
            let quantityToDeduct = item.quantity; // Quantity of the sold unit

            // If a sub-unit was sold, convert the quantity to the equivalent main unit quantity
            if (item.soldUnitType === 'sub' && product.subUnitsPerUnit && product.subUnitsPerUnit > 0) {
                quantityToDeduct = item.quantity / product.subUnitsPerUnit;
            }

            // Calculate the new quantity (can be fractional)
            const newQuantity = product.quantity - quantityToDeduct;

            // Update the product in the data source
            await updateProduct(item.productId, { quantity: newQuantity });
            console.log(`Updated product ${item.productId} quantity to ${newQuantity}`);
        } else {
            console.warn(`Product with ID ${item.productId} not found during sale update.`);
            // Handle cases where product might not exist (e.g., log error)
        }
    }));
    console.log("Product quantities updated after sale.");

    return newSale;
}


// Function to get purchase transactions
export async function getPurchases(): Promise<PurchaseTransaction[]> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return [...samplePurchases].sort((a, b) => b.date.getTime() - a.date.getTime()); // Return sorted copy
}

// Function to add a purchase transaction and update product quantities
export async function addPurchase(purchaseData: Omit<PurchaseTransaction, 'id'>): Promise<PurchaseTransaction> {
    await new Promise(resolve => setTimeout(resolve, 50));
    const newPurchase: PurchaseTransaction = {
        ...purchaseData,
        id: `pur-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`, // Unique purchase ID
        date: purchaseData.date || new Date(), // Ensure date exists
    };
    samplePurchases.push(newPurchase);
    console.log("Added Purchase:", newPurchase);

    // Update product quantities after purchase (assuming purchase items are always main units)
     await Promise.all(newPurchase.items.map(async (item: PurchaseTransactionItem) => {
        const product = await getProductById(item.productId);
        if (product) {
            const newQuantity = product.quantity + item.quantity;
            // Update cost only if needed (e.g., based on FIFO/LIFO or average cost)
            // For simplicity, we might just update quantity here. Cost update logic depends on requirements.
            await updateProduct(item.productId, { quantity: newQuantity /* , cost: newCost */ });
            console.log(`Updated product ${item.productId} quantity to ${newQuantity}`);
        } else {
            console.warn(`Product with ID ${item.productId} not found during purchase update.`);
            // Handle adding the product if it doesn't exist (or log error)
            // For now, we assume products exist before purchase
        }
     }));
    console.log("Product quantities updated after purchase.");

    return newPurchase;
}

// --- Helper to get product name by ID (for displaying in invoices) ---
// In a real app, this might be optimized or data joined earlier
export async function getProductNameById(id: string): Promise<string> {
    const product = await getProductById(id);
    return product ? product.nameAr : `منتج غير معروف (${id.substring(0,6)})`;
}

// --- User Management Data ---
let sampleUsers: User[] = [
  { id: 'user-001', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
  { id: 'user-002', name: 'Seller User', email: 'seller@example.com', role: 'seller' },
  { id: 'user-003', name: 'Manager User', email: 'manager@example.com', role: 'manager' },
];

export async function getUsers(): Promise<User[]> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return [...sampleUsers];
}

// Add functions for addUser, updateUser, deleteUser later as needed


// --- Expiry Date Logic ---
export function calculateDaysUntilExpiry(expiryDate?: Date): number {
    if (!expiryDate) return Infinity; // Or some large number if no expiry
    const today = new Date();
    // Set time to 00:00:00 for accurate day difference calculation
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);
    return differenceInDays(expiryDate, today);
}


// Get products nearing expiry (e.g., within the next 90 days)
export async function getProductsNearingExpiry(daysThreshold: number = 90): Promise<ProductExpiryInfo[]> {
    const products = await getProducts();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date

    const nearingExpiry = products
        .filter(p => p.expiryDate) // Only consider products with an expiry date
        .map(p => ({
            ...p,
            expiryDate: new Date(p.expiryDate!), // Ensure it's a Date object
            daysUntilExpiry: calculateDaysUntilExpiry(new Date(p.expiryDate!)),
        }))
        .filter(p => p.daysUntilExpiry >= 0 && p.daysUntilExpiry <= daysThreshold) // Within threshold and not already expired
        .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry); // Sort by soonest expiry first

    return nearingExpiry.map(({ id, nameAr, expiryDate, quantity, daysUntilExpiry }) => ({
        id,
        nameAr,
        expiryDate,
        quantity,
        daysUntilExpiry,
    }));
}

// Get products that have already expired
export async function getExpiredProducts(): Promise<ProductExpiryInfo[]> {
    const products = await getProducts();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date

    const expired = products
        .filter(p => p.expiryDate) // Only consider products with an expiry date
        .map(p => ({
            ...p,
            expiryDate: new Date(p.expiryDate!), // Ensure it's a Date object
            daysUntilExpiry: calculateDaysUntilExpiry(new Date(p.expiryDate!)),
        }))
        .filter(p => p.daysUntilExpiry < 0) // Expired products
        .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry); // Sort by most expired first

     return expired.map(({ id, nameAr, expiryDate, quantity, daysUntilExpiry }) => ({
        id,
        nameAr,
        expiryDate,
        quantity,
        daysUntilExpiry,
    }));
}
