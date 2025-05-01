import type { Product, Supplier, Customer, SaleTransaction, PurchaseTransaction, PurchaseTransactionItem, SaleTransactionItem, User, ProductExpiryInfo, InventoryReportItem, PaymentMethod, PaymentStatus, UserRole } from '@/lib/types';
import { Pill, Baby, SprayCan, Activity } from 'lucide-react';
import { differenceInDays, addDays, isBefore, isSameDay, startOfDay, endOfDay } from 'date-fns'; // Added startOfDay, endOfDay

// --- In-Memory Data Store (Replace with actual database/API calls) ---
// This is a simple in-memory store for demonstration.
// Data will reset on server restart. Use a persistent store in a real application.

// --- Products Data ---
let sampleProducts: Product[] = [
   {
    id: 'prod-001',
    nameAr: 'بنادول اكسترا',
    nameEn: 'Panadol Extra',
    manufacturer: 'GSK',
    concentration: '500mg Paracetamol, 65mg Caffeine',
    activeIngredient: 'Paracetamol, Caffeine',
    price: 15.50,
    lastPurchaseCost: 10.50,
    quantity: 8, // Low stock example based on minStockLevel
    categoryIcon: Pill,
    barcode: '6281060000010',
    unitType: 'علبة',
    subUnitType: 'شريط',
    subUnitsPerUnit: 2,
    expiryDate: addDays(new Date(), 60), // Nearing expiry
    minStockLevel: 10,
    discountRate: 5,
  },
  {
    id: 'prod-002',
    nameAr: 'فيتامين سي فوار',
    nameEn: 'Vitamin C Effervescent',
    manufacturer: 'Generic Pharma',
    concentration: '1000mg Vitamin C',
    activeIngredient: 'Ascorbic Acid',
    price: 22.00,
    lastPurchaseCost: 16.00,
    quantity: 80,
    categoryIcon: Activity,
    barcode: '6281060000027',
    unitType: 'علبة',
    subUnitType: 'قرص',
    subUnitsPerUnit: 10,
    expiryDate: addDays(new Date(), 300),
    minStockLevel: 20,
  },
  {
    id: 'prod-003',
    nameAr: 'حليب أطفال المرحلة 1',
    nameEn: 'Baby Milk Stage 1',
    manufacturer: 'Nestle',
    price: 55.75,
    lastPurchaseCost: 45.00,
    quantity: 0, // Out of stock
    categoryIcon: Baby,
    barcode: '6281060000034',
    unitType: 'علبة',
    expiryDate: addDays(new Date(), 15), // Nearing expiry
    minStockLevel: 15,
  },
  {
    id: 'prod-004',
    nameAr: 'بخاخ الأنف',
    nameEn: 'Nasal Spray',
    manufacturer: 'Pharma Co.',
    concentration: '0.05% Oxymetazoline',
    activeIngredient: 'Oxymetazoline',
    price: 30.00,
    lastPurchaseCost: 20.00,
    quantity: 60,
    categoryIcon: SprayCan,
    barcode: '6281060000041',
    unitType: 'بخاخ',
    expiryDate: addDays(new Date(), -10), // Expired
    minStockLevel: 10,
  },
  {
    id: 'prod-005',
    nameAr: 'أقراص مسكنة للألم',
    nameEn: 'Pain Relief Tablets',
    manufacturer: 'Jamjoom Pharma',
    concentration: '400mg Ibuprofen',
    activeIngredient: 'Ibuprofen',
    price: 12.25,
    lastPurchaseCost: 8.00,
    quantity: 200,
    categoryIcon: Pill,
    barcode: '6281060000058',
    unitType: 'علبة',
    subUnitType: 'شريط',
    subUnitsPerUnit: 3,
    expiryDate: addDays(new Date(), 180),
    minStockLevel: 50,
  },
  {
    id: 'prod-006',
    nameAr: 'مكمل غذائي حديد',
    nameEn: 'Iron Supplement',
    manufacturer: 'VitaHealth',
    activeIngredient: 'Ferrous Sulfate',
    price: 40.00,
    lastPurchaseCost: 28.00,
    quantity: 5, // Low stock example
    categoryIcon: Activity,
    barcode: '6281060000065',
    unitType: 'علبة',
    expiryDate: addDays(new Date(), 400),
    minStockLevel: 10,
  },
    {
    id: 'prod-007',
    nameAr: 'كريم حفاضات للأطفال',
    nameEn: 'Baby Diaper Cream',
    manufacturer: 'Sudocrem',
    activeIngredient: 'Zinc Oxide',
    price: 25.50,
    lastPurchaseCost: 18.00,
    quantity: 70,
    categoryIcon: Baby,
    barcode: '6281060000072',
    unitType: 'أنبوب',
    expiryDate: addDays(new Date(), 90),
    minStockLevel: 25,
     discountRate: 10,
  },
  {
    id: 'prod-008',
    nameAr: 'شراب سعال',
    nameEn: 'Cough Syrup',
    manufacturer: 'Prospan',
    activeIngredient: 'Ivy Leaf Extract',
    price: 18.00,
    lastPurchaseCost: 12.50,
    quantity: 110,
    categoryIcon: SprayCan,
    barcode: '6281060000089',
    unitType: 'زجاجة',
    expiryDate: addDays(new Date(), 500),
    minStockLevel: 30,
  },
   {
    id: 'prod-009', // Alternative for Panadol Extra
    nameAr: 'أدول اكسترا',
    nameEn: 'Adol Extra',
    manufacturer: 'Julphar',
    concentration: '500mg Paracetamol, 65mg Caffeine',
    activeIngredient: 'Paracetamol, Caffeine', // Same active ingredient
    price: 14.00,
    lastPurchaseCost: 10.00,
    quantity: 50, // In stock
    categoryIcon: Pill,
    barcode: '6291103620014',
    unitType: 'علبة',
    subUnitType: 'شريط',
    subUnitsPerUnit: 2,
    expiryDate: addDays(new Date(), 365),
    minStockLevel: 10,
  },
   {
    id: 'prod-010', // Alternative for Baby Milk Stage 1 (similar purpose)
    nameAr: 'حليب أطفال المرحلة 1 - بديل',
    nameEn: 'Baby Milk Stage 1 - Alt',
    manufacturer: 'Danone',
    price: 60.00,
    lastPurchaseCost: 48.00,
    quantity: 30, // In stock
    categoryIcon: Baby,
    barcode: '3033490000000', // Example barcode
    unitType: 'علبة',
    expiryDate: addDays(new Date(), 120),
    minStockLevel: 15,
  },
];

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

// --- Customers Data ---
let sampleCustomers: Customer[] = [
  {
    id: 'cust-001',
    name: 'خالد الغامدي',
    phone: '050-1122334',
    address: 'الرياض، حي الملز',
    balance: -50.00, // Has debt
    insuranceCompany: 'بوبا',
    policyNumber: 'BUPA-12345',
    insuranceDiscountRate: 10, // 10% discount for this customer
  },
  {
    id: 'cust-002',
    name: 'فاطمة الزهراني',
    phone: '055-9988776',
    email: 'fatima.z@email.com',
    balance: 0,
    // No insurance
  },
   {
    id: 'cust-003',
    name: 'علي الشهري',
    address: 'جدة، حي الشاطئ',
    balance: 100.00, // Has credit
    insuranceCompany: 'التعاونية',
    policyNumber: 'TAW-67890',
    insuranceDiscountRate: 5, // 5% discount
  },
];

// --- Sales Transactions Data ---
let sampleSales: SaleTransaction[] = []; // Start with empty sales

// --- Purchase Transactions Data ---
let samplePurchases: PurchaseTransaction[] = [
    { id: 'pur-001', supplierId: 'supp-001', invoiceNumber: 'INV-SUP-1001', items: [{ productId: 'prod-001', quantity: 100, cost: 10.50 }, { productId: 'prod-005', quantity: 150, cost: 8.00 }], totalAmount: 2250.00, paymentStatus: 'paid', amountPaid: 2250.00, date: new Date(2024, 6, 14) },
    { id: 'pur-002', supplierId: 'supp-002', invoiceNumber: 'INV-SUP-1002', items: [{ productId: 'prod-003', quantity: 50, cost: 45.00 }], totalAmount: 2250.00, paymentStatus: 'partial', amountPaid: 1000.00, date: new Date(2024, 6, 13) },
    { id: 'pur-003', supplierId: 'supp-003', items: [{ productId: 'prod-008', quantity: 200, cost: 15.00 }], totalAmount: 3000.00, paymentStatus: 'unpaid', amountPaid: 0.00, date: new Date(2024, 6, 15) },
];

// --- Users Data ---
let sampleUsers: User[] = [
  { id: 'user-001', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
  { id: 'user-002', name: 'Seller User', email: 'seller@example.com', role: 'seller' },
  { id: 'user-003', name: 'Manager User', email: 'manager@example.com', role: 'manager' },
   { id: 'user-004', name: 'Accountant User', email: 'accountant@example.com', role: 'accountant' },
];

// --- Helper Functions ---

const SIMULATE_DELAY = 50; // milliseconds

// Ensures Date objects are correctly handled when retrieving data
const parseDates = <T extends { date?: Date | string, expiryDate?: Date | string }>(items: T[]): T[] => {
  return items.map(item => ({
    ...item,
    ...(item.date && { date: new Date(item.date) }),
    ...(item.expiryDate && { expiryDate: new Date(item.expiryDate) }),
  }));
};

// --- Product Data Operations ---
export async function getProducts(): Promise<Product[]> {
  await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY));
  return parseDates([...sampleProducts]).map(p => ({
    ...p,
    lastPurchaseCost: p.lastPurchaseCost ?? p.price * 0.7, // Estimate cost if missing
  }));
}

export async function getProductById(id: string): Promise<Product | undefined> {
  await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY / 2));
  const product = sampleProducts.find(p => p.id === id);
  return product ? {
    ...product,
    lastPurchaseCost: product.lastPurchaseCost ?? product.price * 0.7, // Estimate cost
    expiryDate: product.expiryDate ? new Date(product.expiryDate) : undefined
  } : undefined;
}

export async function getProductByBarcode(barcode: string): Promise<Product | undefined> {
    await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY / 2));
    const product = sampleProducts.find(p => p.barcode === barcode);
    return product ? {
        ...product,
        lastPurchaseCost: product.lastPurchaseCost ?? product.price * 0.7,
        expiryDate: product.expiryDate ? new Date(product.expiryDate) : undefined
    } : undefined;
}

export async function addProduct(productData: Omit<Product, 'id'>): Promise<Product> {
  await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY));
  const newProduct: Product = {
    id: `prod-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`,
    ...productData,
    quantity: Math.max(0, productData.quantity || 0), // Ensure non-negative
    price: Math.max(0, productData.price || 0), // Ensure non-negative
    lastPurchaseCost: productData.lastPurchaseCost !== undefined ? Math.max(0, productData.lastPurchaseCost) : undefined, // Ensure non-negative
    minStockLevel: productData.minStockLevel !== undefined ? Math.max(0, productData.minStockLevel) : undefined,
    discountRate: productData.discountRate !== undefined ? Math.max(0, Math.min(100, productData.discountRate)) : undefined,
    expiryDate: productData.expiryDate ? new Date(productData.expiryDate) : undefined,
    categoryIcon: productData.categoryIcon || Pill,
  };
  sampleProducts.push(newProduct);
  console.log("Added Product:", newProduct);
  return newProduct;
}

export async function updateProduct(id: string, updates: Partial<Omit<Product, 'id'>>): Promise<Product | null> {
  await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY));
  const index = sampleProducts.findIndex(p => p.id === id);
  if (index === -1) return null;

  const currentProduct = sampleProducts[index];
  const updatedProduct = { ...currentProduct, ...updates };

  // --- Apply validation logic ---
  if (updates.quantity !== undefined) {
    updatedProduct.quantity = Math.max(0, updates.quantity);
  }
  if (updates.price !== undefined) {
    updatedProduct.price = Math.max(0, updates.price);
  }
  if (updates.lastPurchaseCost !== undefined) {
    updatedProduct.lastPurchaseCost = Math.max(0, updates.lastPurchaseCost);
  }
  if (updates.minStockLevel !== undefined) {
    updatedProduct.minStockLevel = Math.max(0, updates.minStockLevel);
  }
  if (updates.discountRate !== undefined) {
    updatedProduct.discountRate = Math.max(0, Math.min(100, updates.discountRate));
  }
  if (updates.subUnitsPerUnit !== undefined) {
    updatedProduct.subUnitsPerUnit = updates.subUnitsPerUnit > 0 ? updates.subUnitsPerUnit : undefined;
    if (!updatedProduct.subUnitsPerUnit) updatedProduct.subUnitType = undefined;
  }
  if (updates.expiryDate) {
    updatedProduct.expiryDate = new Date(updates.expiryDate);
  }

  sampleProducts[index] = updatedProduct;
  console.log("Updated Product:", updatedProduct);
  return updatedProduct;
}

export async function deleteProduct(id: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY));
  const initialLength = sampleProducts.length;
  sampleProducts = sampleProducts.filter(p => p.id !== id);
  const success = sampleProducts.length < initialLength;
  console.log(`Deleted Product ${id}?`, success);
  return success;
}

// --- Supplier Data Operations ---
export async function getSuppliers(): Promise<Supplier[]> {
  await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY));
  return [...sampleSuppliers];
}

export async function addSupplier(supplierData: Omit<Supplier, 'id'>): Promise<Supplier> {
  await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY));
  const newSupplier: Supplier = {
    id: `supp-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`,
    ...supplierData,
  };
  sampleSuppliers.push(newSupplier);
  console.log("Added Supplier:", newSupplier);
  return newSupplier;
}

export async function updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier | null> {
  await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY));
  const index = sampleSuppliers.findIndex(s => s.id === id);
  if (index === -1) return null;
  // Prevent changing ID
  const { id: _, ...safeUpdates } = updates;
  sampleSuppliers[index] = { ...sampleSuppliers[index], ...safeUpdates };
  console.log("Updated Supplier:", sampleSuppliers[index]);
  return sampleSuppliers[index];
}

export async function deleteSupplier(id: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY));
  const initialLength = sampleSuppliers.length;
  sampleSuppliers = sampleSuppliers.filter(s => s.id !== id);
  const success = sampleSuppliers.length < initialLength;
  console.log(`Deleted Supplier ${id}?`, success);
  return success;
}

// --- Customer Data Operations ---
export async function getCustomers(): Promise<Customer[]> {
  await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY));
  return [...sampleCustomers.map(c => ({ ...c, balance: c.balance ?? 0 }))];
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
   await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY / 2));
   const customer = sampleCustomers.find(c => c.id === id);
   return customer ? { ...customer, balance: customer.balance ?? 0 } : undefined;
}

export async function addCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer> {
  await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY));
  const newCustomer: Customer = {
    id: `cust-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`,
    ...customerData,
    balance: customerData.balance ?? 0,
    insuranceDiscountRate: customerData.insuranceDiscountRate !== undefined ? Math.max(0, Math.min(100, customerData.insuranceDiscountRate)) : undefined,
  };
  sampleCustomers.push(newCustomer);
  console.log("Added Customer:", newCustomer);
  return newCustomer;
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
  await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY));
  const index = sampleCustomers.findIndex(c => c.id === id);
  if (index === -1) return null;
  // Prevent changing ID
  const { id: _, ...safeUpdates } = updates;
  const updatedCustomer = { ...sampleCustomers[index], ...safeUpdates };
  // Validate balance and insurance rate
  if (updates.balance !== undefined && typeof updates.balance !== 'number') {
    updatedCustomer.balance = sampleCustomers[index].balance ?? 0;
  }
  if (updates.insuranceDiscountRate !== undefined) {
      updatedCustomer.insuranceDiscountRate = typeof updates.insuranceDiscountRate === 'number' && updates.insuranceDiscountRate >= 0 && updates.insuranceDiscountRate <= 100
          ? updates.insuranceDiscountRate
          : undefined;
  }
  sampleCustomers[index] = updatedCustomer;
  console.log("Updated Customer:", updatedCustomer);
  return updatedCustomer;
}

export async function deleteCustomer(id: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY));
  const initialLength = sampleCustomers.length;
  sampleCustomers = sampleCustomers.filter(c => c.id !== id);
  const success = sampleCustomers.length < initialLength;
  console.log(`Deleted Customer ${id}?`, success);
  return success;
}

// --- Sale Transaction Operations ---
export async function getSales(): Promise<SaleTransaction[]> {
  await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY));
  return parseDates([...sampleSales]).sort((a, b) => b.date.getTime() - a.date.getTime());
}

// Function to add a sale and update product quantities, costAtSale, and customer balance/insurance
export async function addSale(saleData: Omit<SaleTransaction, 'id'>): Promise<SaleTransaction> {
    await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY));

    const customer = saleData.customerId ? await getCustomerById(saleData.customerId) : undefined;
    const insuranceRate = customer?.insuranceDiscountRate ?? 0;

    // Calculate original total, subtotal (after product discount), and prepare items with costAtSale
    const calculateTotalsAndPrepareItems = async (items: SaleTransactionItem[]): Promise<{ originalTotal: number; subTotal: number; preparedItems: SaleTransactionItem[] }> => {
        let originalTotal = 0;
        let subTotal = 0;
        const preparedItems: SaleTransactionItem[] = [];
        for (const item of items) {
            const product = await getProductById(item.productId);
            // Determine cost at the time of sale
            let costAtSale: number | undefined;
            let originalPrice = item.price; // Default to sale price if product not found
            if (product) {
                costAtSale = item.soldUnitType === 'sub' && product.subUnitsPerUnit && product.lastPurchaseCost
                    ? product.lastPurchaseCost / product.subUnitsPerUnit
                    : product.lastPurchaseCost; // Cost per sold unit type

                originalPrice = item.soldUnitType === 'sub' && product.subUnitsPerUnit
                    ? product.price / product.subUnitsPerUnit
                    : product.price;
            }

            originalTotal += originalPrice * item.quantity;
            subTotal += item.price * item.quantity; // item.price is already discounted (product discount)
            preparedItems.push({ ...item, costAtSale });
        }
        return { originalTotal, subTotal, preparedItems };
    };

    const { originalTotal, subTotal, preparedItems } = await calculateTotalsAndPrepareItems(saleData.items);

    // Apply insurance discount to the subtotal
    const finalTotalAmount = subTotal * (1 - (insuranceRate / 100));

    const newSale: SaleTransaction = {
        id: `sale-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`,
        customerId: saleData.customerId,
        items: preparedItems, // Use items with costAtSale
        totalAmount: finalTotalAmount, // Final amount after all discounts
        subTotalAmount: subTotal, // Amount after product discount
        originalTotalAmount: originalTotal, // Total amount before any discounts
        paymentMethod: saleData.paymentMethod,
        amountPaid: saleData.amountPaid,
        date: saleData.date ? new Date(saleData.date) : new Date(),
        appliedInsuranceDiscountRate: insuranceRate,
    };
    sampleSales.push(newSale);
    console.log("Added Sale:", newSale);

    // --- Update Product Quantities ---
    await Promise.all(newSale.items.map(async (item) => {
        const product = await getProductById(item.productId);
        if (product) {
            let quantityToDeduct = item.quantity;
            if (item.soldUnitType === 'sub' && product.subUnitsPerUnit && product.subUnitsPerUnit > 0) {
                quantityToDeduct = item.quantity / product.subUnitsPerUnit;
            }
            const newQuantity = Math.max(0, product.quantity - quantityToDeduct); // Ensure quantity doesn't go below zero
            await updateProduct(item.productId, { quantity: newQuantity });
            console.log(`Updated product ${item.productId} quantity to ${newQuantity}`);
        } else {
            console.warn(`Product with ID ${item.productId} not found during sale stock update.`);
        }
    }));
    console.log("Product quantities updated after sale.");

    // --- Update Customer Balance ---
    if (customer) {
        const amountDue = newSale.totalAmount;
        let balanceChange = 0;

        if (newSale.paymentMethod === 'debt') {
             // Debt increases the negative balance (customer owes more)
            balanceChange = -(amountDue - newSale.amountPaid);
        } else {
            // Other payment methods (cash/card) might result in overpayment (credit)
             balanceChange = newSale.amountPaid - amountDue; // Positive if overpaid
        }

        if (balanceChange !== 0) {
             const newBalance = (customer.balance ?? 0) + balanceChange;
             await updateCustomer(customer.id, { balance: newBalance });
             console.log(`Updated customer ${customer.id} balance to ${newBalance}`);
        }
    }

    return newSale;
}

// Placeholder for updating a sale (e.g., adding payment to a debt invoice)
// export async function updateSale(id: string, updates: Partial<SaleTransaction>): Promise<SaleTransaction | null> {
//   // Implement logic to find sale, update fields, recalculate balance if needed
//   return null;
// }

// Placeholder for deleting a sale (consider implications on stock and balance)
// export async function deleteSale(id: string): Promise<boolean> {
//   // Implement logic to find sale, reverse stock/balance changes?, delete record
//   return false;
// }

// --- Purchase Transaction Operations ---
export async function getPurchases(): Promise<PurchaseTransaction[]> {
  await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY));
  return parseDates([...samplePurchases]).sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function addPurchase(purchaseData: Omit<PurchaseTransaction, 'id' | 'totalAmount' | 'paymentStatus'>): Promise<PurchaseTransaction> {
    await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY));

    const totalAmount = purchaseData.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.cost || 0), 0);
    let paymentStatus: PaymentStatus = 'unpaid';
    if (purchaseData.amountPaid >= totalAmount && totalAmount > 0) { // Check totalAmount > 0
        paymentStatus = 'paid';
    } else if (purchaseData.amountPaid > 0) {
        paymentStatus = 'partial';
    }

    const newPurchase: PurchaseTransaction = {
        id: `pur-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`,
        ...purchaseData,
        date: purchaseData.date ? new Date(purchaseData.date) : new Date(),
        totalAmount: totalAmount,
        paymentStatus: paymentStatus,
    };
    samplePurchases.push(newPurchase);
    console.log("Added Purchase:", newPurchase);

    // --- Update Product Quantities and Costs ---
    await Promise.all(newPurchase.items.map(async (item) => {
        const product = await getProductById(item.productId);
        if (product) {
            const newQuantity = product.quantity + (item.quantity || 0);
            const updates: Partial<Omit<Product, 'id'>> = {
                quantity: newQuantity,
                lastPurchaseCost: Math.max(0, item.cost || 0) // Update last cost, ensure non-negative
            };
            if (item.expiryDate) {
                updates.expiryDate = new Date(item.expiryDate);
            }
            await updateProduct(item.productId, updates);
            console.log(`Updated product ${item.productId}: quantity=${newQuantity}, cost=${updates.lastPurchaseCost} ${updates.expiryDate ? `, expiry=${updates.expiryDate.toLocaleDateString()}` : ''}`);
        } else {
            console.warn(`Product with ID ${item.productId} not found during purchase stock update.`);
            // Optional: Consider adding the product if it doesn't exist
            // await addProduct({ nameAr: `منتج جديد (${item.productId})`, nameEn: `New Product (${item.productId})`, price: item.cost * 1.2, quantity: item.quantity, lastPurchaseCost: item.cost, expiryDate: item.expiryDate, unitType: 'قطعة' });
        }
    }));
    console.log("Product quantities updated after purchase.");

    // TODO: Update supplier balance/account if tracking supplier debts
    // const supplier = await getSupplierById(newPurchase.supplierId);
    // if (supplier) { ... update supplier balance ... }

    return newPurchase;
}

// Placeholder for updating a purchase
// export async function updatePurchase(id: string, updates: Partial<PurchaseTransaction>): Promise<PurchaseTransaction | null> {
//     // Implement update logic
//     return null;
// }

// Placeholder for deleting a purchase
// export async function deletePurchase(id: string): Promise<boolean> {
//     // Implement delete logic, consider reversing stock changes
//     return false;
// }

// --- User Operations ---
export async function getUsers(): Promise<User[]> {
  await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY));
  return [...sampleUsers];
}

export async function addUser(userData: Omit<User, 'id'>): Promise<User> {
  await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY));
  const newUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`,
    ...userData,
    // Add password hashing here in a real app
  };
  sampleUsers.push(newUser);
  console.log("Added User:", newUser);
  return newUser;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY));
  const index = sampleUsers.findIndex(u => u.id === id);
  if (index === -1) return null;
  const { id: _, ...safeUpdates } = updates; // Prevent changing ID
  // Add logic to handle password update if needed
  sampleUsers[index] = { ...sampleUsers[index], ...safeUpdates };
  console.log("Updated User:", sampleUsers[index]);
  return sampleUsers[index];
}

export async function deleteUser(id: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY));
  // Optional: Prevent deleting the last admin user
  // if (sampleUsers[index].role === 'admin' && sampleUsers.filter(u => u.role === 'admin').length === 1) { return false; }
  const initialLength = sampleUsers.length;
  sampleUsers = sampleUsers.filter(u => u.id !== id);
  const success = sampleUsers.length < initialLength;
  console.log(`Deleted User ${id}?`, success);
  return success;
}

// --- Helper Functions ---
export async function getProductNameById(id: string): Promise<string> {
    const product = await getProductById(id);
    return product ? product.nameAr : `منتج غير معروف (${id.substring(0,6)})`;
}

// --- Expiry Date Logic ---
export function calculateDaysUntilExpiry(expiryDate?: Date): number {
    if (!expiryDate) return Infinity;
    const today = startOfDay(new Date()); // Normalize today
    const expiry = startOfDay(new Date(expiryDate)); // Normalize expiry
    return differenceInDays(expiry, today);
}

// --- Reporting Functions ---
export async function getProductsNearingExpiry(daysThreshold: number = 60): Promise<ProductExpiryInfo[]> {
    const products = await getProducts();
    const nearingExpiry = products
        .filter(p => p.expiryDate)
        .map(p => ({
            ...p,
            expiryDate: new Date(p.expiryDate!),
            daysUntilExpiry: calculateDaysUntilExpiry(new Date(p.expiryDate!)),
        }))
        .filter(p => p.daysUntilExpiry >= 0 && p.daysUntilExpiry <= daysThreshold)
        .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    return nearingExpiry.map(({ id, nameAr, expiryDate, quantity, daysUntilExpiry }) => ({
        id, nameAr, expiryDate, quantity, daysUntilExpiry,
    }));
}

export async function getExpiredProducts(): Promise<ProductExpiryInfo[]> {
    const products = await getProducts();
    const expired = products
        .filter(p => p.expiryDate)
        .map(p => ({
            ...p,
            expiryDate: new Date(p.expiryDate!),
            daysUntilExpiry: calculateDaysUntilExpiry(new Date(p.expiryDate!)),
        }))
        .filter(p => p.daysUntilExpiry < 0)
        .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry); // Most expired first

     return expired.map(({ id, nameAr, expiryDate, quantity, daysUntilExpiry }) => ({
        id, nameAr, expiryDate, quantity, daysUntilExpiry,
    }));
}

export async function findAlternativeProducts(productId: string): Promise<Product[]> {
    await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY));
    const originalProduct = await getProductById(productId);
    if (!originalProduct || !originalProduct.activeIngredient) {
        return [];
    }
    const allProducts = await getProducts();
    const alternatives = allProducts.filter(p =>
        p.id !== productId &&
        p.activeIngredient &&
        p.activeIngredient.toLowerCase() === originalProduct.activeIngredient!.toLowerCase()
        // Consider adding concentration/form matching for better alternatives
    );
    return alternatives;
}

export async function getInventoryReportData(): Promise<InventoryReportItem[]> {
  const products = await getProducts();
  return products.map(product => ({
    id: product.id,
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    barcode: product.barcode,
    quantity: product.quantity,
    price: product.price,
    lastPurchaseCost: product.lastPurchaseCost,
    unitType: product.unitType,
    expiryDate: product.expiryDate,
    inventoryValue: product.quantity * (product.lastPurchaseCost || 0),
  }));
}

// Placeholder for Treasury related functions
// export async function getTreasuryBalance(): Promise<number> { return 0; }
// export async function addTreasuryEntry(type: 'deposit' | 'withdrawal' | 'transfer', amount: number, description: string): Promise<void> {}
// export async function getTreasuryLog(): Promise<any[]> { return []; }

// Placeholder for Label Printing function
// export function generateLabelData(productId: string, dosage: string, instructions: string): object { return {}; }

// Placeholder for generating barcodes (use a library like jsbarcode in practice)
// export function generateBarcode(productId: string): string { return `barcode-for-${productId}`; }