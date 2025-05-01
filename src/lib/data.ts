import type { Product, Supplier, Customer, SaleTransaction, PurchaseTransaction, PurchaseTransactionItem, SaleTransactionItem, User, ProductExpiryInfo, InventoryReportItem, PaymentMethod, PaymentStatus, UserRole } from '@/lib/types';
import { Pill, Baby, SprayCan, Activity } from 'lucide-react';
import { differenceInDays, addDays, isBefore, isSameDay } from 'date-fns';

// --- Products Data ---
let sampleProducts: Product[] = [
   {
    id: 'prod-001',
    nameAr: 'بنادول اكسترا',
    nameEn: 'Panadol Extra',
    manufacturer: 'GSK',
    concentration: '500mg Paracetamol, 65mg Caffeine',
    activeIngredient: 'Paracetamol, Caffeine', // Added
    price: 15.50,
    lastPurchaseCost: 10.50, // Added
    quantity: 8,
    categoryIcon: Pill,
    barcode: '6281060000010',
    unitType: 'علبة',
    subUnitType: 'شريط',
    subUnitsPerUnit: 2,
    expiryDate: addDays(new Date(), 60),
    minStockLevel: 10,
    discountRate: 5,
  },
  {
    id: 'prod-002',
    nameAr: 'فيتامين سي فوار',
    nameEn: 'Vitamin C Effervescent',
    manufacturer: 'Generic Pharma',
    concentration: '1000mg Vitamin C',
    activeIngredient: 'Ascorbic Acid', // Added
    price: 22.00,
    lastPurchaseCost: 16.00, // Added
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
    // No active ingredient for milk
    price: 55.75,
    lastPurchaseCost: 45.00, // Added
    quantity: 0, // Out of stock
    categoryIcon: Baby,
    barcode: '6281060000034',
    unitType: 'علبة',
    expiryDate: addDays(new Date(), 15),
    minStockLevel: 15,
  },
  {
    id: 'prod-004',
    nameAr: 'بخاخ الأنف',
    nameEn: 'Nasal Spray',
    manufacturer: 'Pharma Co.',
    concentration: '0.05% Oxymetazoline',
    activeIngredient: 'Oxymetazoline', // Added
    price: 30.00,
    lastPurchaseCost: 20.00, // Added
    quantity: 60,
    categoryIcon: SprayCan,
    barcode: '6281060000041',
    unitType: 'بخاخ',
    expiryDate: addDays(new Date(), -10),
    minStockLevel: 10,
  },
  {
    id: 'prod-005',
    nameAr: 'أقراص مسكنة للألم',
    nameEn: 'Pain Relief Tablets',
    manufacturer: 'Jamjoom Pharma',
    concentration: '400mg Ibuprofen',
    activeIngredient: 'Ibuprofen', // Added
    price: 12.25,
    lastPurchaseCost: 8.00, // Added
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
    activeIngredient: 'Ferrous Sulfate', // Added
    price: 40.00,
    lastPurchaseCost: 28.00, // Added
    quantity: 5,
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
    activeIngredient: 'Zinc Oxide', // Added
    price: 25.50,
    lastPurchaseCost: 18.00, // Added
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
    activeIngredient: 'Ivy Leaf Extract', // Added
    price: 18.00,
    lastPurchaseCost: 12.50, // Added
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

// Simulate fetching products (e.g., from an API or database)
export async function getProducts(): Promise<Product[]> {
  // In a real app, this would fetch data from a source
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay
   // Parse expiry dates if they are stored as strings
   return sampleProducts.map(p => ({
     ...p,
     lastPurchaseCost: p.lastPurchaseCost ?? p.price * 0.7, // Estimate cost if missing
     expiryDate: p.expiryDate ? new Date(p.expiryDate) : undefined, // Ensure expiryDate is a Date object
   }));
}

export async function getProductById(id: string): Promise<Product | undefined> {
  await new Promise(resolve => setTimeout(resolve, 20));
  const product = sampleProducts.find(p => p.id === id);
  return product ? {
      ...product,
      lastPurchaseCost: product.lastPurchaseCost ?? product.price * 0.7, // Estimate cost if missing
      expiryDate: product.expiryDate ? new Date(product.expiryDate) : undefined
  } : undefined;
}

// Simulate finding product by barcode (in real app, query DB/API)
export async function getProductByBarcode(barcode: string): Promise<Product | undefined> {
    await new Promise(resolve => setTimeout(resolve, 20));
    const product = sampleProducts.find(p => p.barcode === barcode);
     return product ? {
         ...product,
         lastPurchaseCost: product.lastPurchaseCost ?? product.price * 0.7, // Estimate cost if missing
         expiryDate: product.expiryDate ? new Date(product.expiryDate) : undefined
     } : undefined;
}


export async function addProduct(productData: Omit<Product, 'id'>): Promise<Product> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const newProduct: Product = {
    id: `prod-${Date.now().toString()}-${Math.random().toString(16).substring(2, 8)}`, // Generate unique ID
    nameAr: productData.nameAr,
    nameEn: productData.nameEn,
    manufacturer: productData.manufacturer,
    concentration: productData.concentration,
    activeIngredient: productData.activeIngredient, // Added
    price: productData.price || 0,
    lastPurchaseCost: productData.lastPurchaseCost, // Store initial purchase cost if provided
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

   // Ensure lastPurchaseCost is non-negative
   if (updates.lastPurchaseCost !== undefined && typeof updates.lastPurchaseCost === 'number' && updates.lastPurchaseCost < 0) {
      updatedProduct.lastPurchaseCost = 0;
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

export async function getCustomers(): Promise<Customer[]> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return [...sampleCustomers.map(c => ({ ...c, balance: c.balance ?? 0 }))]; // Ensure balance is initialized
}

export async function addCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const newCustomer: Customer = {
    ...customerData,
    id: `cust-${Date.now().toString()}-${Math.random().toString(16).substring(2, 8)}`,
    balance: customerData.balance ?? 0, // Initialize balance
    // Initialize insurance fields if not provided
    insuranceCompany: customerData.insuranceCompany || undefined,
    policyNumber: customerData.policyNumber || undefined,
    insuranceDiscountRate: customerData.insuranceDiscountRate || undefined,
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
  // Ensure balance and insurance rate are handled correctly
  const updatedCustomer = { ...sampleCustomers[index], ...updates };
   if (updates.balance !== undefined && typeof updates.balance !== 'number') {
     updatedCustomer.balance = sampleCustomers[index].balance ?? 0;
   }
   if (updates.insuranceDiscountRate !== undefined) {
       updatedCustomer.insuranceDiscountRate = typeof updates.insuranceDiscountRate === 'number' && updates.insuranceDiscountRate >= 0 && updates.insuranceDiscountRate <= 100
           ? updates.insuranceDiscountRate
           : undefined;
   }
  sampleCustomers[index] = updatedCustomer;
   console.log("Updated Customer:", sampleCustomers[index]);
   console.log("Current Customers:", sampleCustomers);
  return updatedCustomer;
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
    { id: 'pur-001', supplierId: 'supp-001', invoiceNumber: 'INV-SUP-1001', items: [{ productId: 'prod-001', quantity: 100, cost: 10.50 }, { productId: 'prod-005', quantity: 150, cost: 8.00 }], totalAmount: 2250.00, paymentStatus: 'paid', amountPaid: 2250.00, date: new Date(2024, 6, 14) },
    { id: 'pur-002', supplierId: 'supp-002', invoiceNumber: 'INV-SUP-1002', items: [{ productId: 'prod-003', quantity: 50, cost: 45.00 }], totalAmount: 2250.00, paymentStatus: 'partial', amountPaid: 1000.00, date: new Date(2024, 6, 13) },
    { id: 'pur-003', supplierId: 'supp-003', items: [{ productId: 'prod-008', quantity: 200, cost: 15.00 }], totalAmount: 3000.00, paymentStatus: 'unpaid', amountPaid: 0.00, date: new Date(2024, 6, 15) },
];

export async function getSales(): Promise<SaleTransaction[]> {
  await new Promise(resolve => setTimeout(resolve, 50));
  // Sort sales by date descending before returning
  return [...sampleSales].map(s => ({
      ...s,
      date: new Date(s.date) // Ensure date is Date object
    })).sort((a, b) => b.date.getTime() - a.date.getTime());
}

// Function to add a sale and update product quantities, costAtSale, and customer balance/insurance
export async function addSale(saleData: Omit<SaleTransaction, 'id'>): Promise<SaleTransaction> {
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate delay

    const customer = saleData.customerId ? await getCustomerById(saleData.customerId) : undefined;
    const insuranceRate = customer?.insuranceDiscountRate ?? 0;

     // Calculate original total amount before discount and prepare items with cost
    const calculateOriginalTotalAndPrepareItems = async (items: SaleTransactionItem[]): Promise<{ originalTotal: number; subTotal: number; preparedItems: SaleTransactionItem[] }> => {
        let originalTotal = 0;
        let subTotal = 0; // Total after product discount, before insurance
        const preparedItems: SaleTransactionItem[] = [];
        for (const item of items) {
            const product = await getProductById(item.productId);
             const costAtSale = product?.lastPurchaseCost; // Get cost at time of sale
            if (product) {
                 const originalPrice = item.soldUnitType === 'sub' && product.subUnitsPerUnit
                     ? product.price / product.subUnitsPerUnit
                     : product.price;
                 originalTotal += originalPrice * item.quantity;
                 subTotal += item.price * item.quantity; // item.price is already discounted (product discount)
            } else {
                 // Fallback if product details are missing, use the sale price as original
                 originalTotal += item.price * item.quantity;
                 subTotal += item.price * item.quantity;
            }
            preparedItems.push({ ...item, costAtSale });
        }
        return { originalTotal, subTotal, preparedItems };
    };


    const { originalTotal, subTotal, preparedItems } = await calculateOriginalTotalAndPrepareItems(saleData.items);

     // Apply insurance discount to the subtotal (after product discounts)
     const finalTotalAmount = subTotal * (1 - (insuranceRate / 100));


    const newSale: SaleTransaction = {
        customerId: saleData.customerId,
        items: preparedItems, // Use items with costAtSale
        totalAmount: finalTotalAmount, // Final amount after all discounts
        subTotalAmount: subTotal, // Amount after product discount
        paymentMethod: saleData.paymentMethod,
        amountPaid: saleData.amountPaid,
        id: `sale-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`, // Unique sale ID
        date: saleData.date || new Date(), // Ensure date exists
        originalTotalAmount: originalTotal, // Store original total before any discount
        appliedInsuranceDiscountRate: insuranceRate, // Store the applied rate
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

    // --- Update Customer Balance if it's a debt transaction ---
    if (newSale.customerId && newSale.paymentMethod === 'debt') {
       // Customer balance is already updated if a customer object was passed,
       // here we handle the debt calculation specifically for the transaction record.
       const debtAmount = newSale.totalAmount - newSale.amountPaid; // Calculate the debt incurred from *this specific transaction*
       if (debtAmount > 0 && customer) {
           const newBalance = (customer.balance ?? 0) - debtAmount; // Decrease balance (more negative means more debt)
           await updateCustomer(newSale.customerId, { balance: newBalance });
           console.log(`Updated customer ${newSale.customerId} balance to ${newBalance} due to debt`);
       }
    } else if (newSale.customerId && newSale.paymentMethod !== 'debt' && newSale.amountPaid > newSale.totalAmount) {
        // Handle overpayment potentially increasing balance (credit)
         if (customer) {
             const creditAmount = newSale.amountPaid - newSale.totalAmount;
             const newBalance = (customer.balance || 0) + creditAmount;
             await updateCustomer(newSale.customerId, { balance: newBalance });
              console.log(`Updated customer ${newSale.customerId} balance to ${newBalance} due to overpayment.`);
         }
    }

    return newSale;
}


// Function to get purchase transactions
export async function getPurchases(): Promise<PurchaseTransaction[]> {
  await new Promise(resolve => setTimeout(resolve, 50));
   return [...samplePurchases].map(p => ({
      ...p,
      date: new Date(p.date) // Ensure date is Date object
   })).sort((a, b) => b.date.getTime() - a.date.getTime()); // Return sorted copy
}

// Function to add a purchase transaction and update product quantities and cost
export async function addPurchase(purchaseData: Omit<PurchaseTransaction, 'id'>): Promise<PurchaseTransaction> {
    await new Promise(resolve => setTimeout(resolve, 50));

     // Calculate total amount from items cost
     const totalAmount = purchaseData.items.reduce((sum, item) => sum + item.quantity * item.cost, 0);

     // Determine payment status based on amountPaid
     let paymentStatus: PaymentStatus;
     if (purchaseData.amountPaid >= totalAmount) {
         paymentStatus = 'paid';
     } else if (purchaseData.amountPaid > 0) {
         paymentStatus = 'partial';
     } else {
         paymentStatus = 'unpaid';
     }


    const newPurchase: PurchaseTransaction = {
        ...purchaseData,
        id: `pur-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`, // Unique purchase ID
        date: purchaseData.date || new Date(), // Ensure date exists
        totalAmount: totalAmount, // Set calculated total amount
        paymentStatus: paymentStatus, // Set calculated payment status
    };
    samplePurchases.push(newPurchase);
    console.log("Added Purchase:", newPurchase);

    // Update product quantities and lastPurchaseCost after purchase
     await Promise.all(newPurchase.items.map(async (item: PurchaseTransactionItem) => {
        const product = await getProductById(item.productId);
        if (product) {
            const newQuantity = product.quantity + item.quantity;
             // Update last purchase cost and expiry date if provided
            const updates: Partial<Omit<Product, 'id'>> = {
                quantity: newQuantity,
                lastPurchaseCost: item.cost // Update the last cost
            };
            if (item.expiryDate) {
                updates.expiryDate = new Date(item.expiryDate);
            }

            await updateProduct(item.productId, updates);
            console.log(`Updated product ${item.productId}: quantity=${newQuantity}, cost=${item.cost} ${updates.expiryDate ? `, expiry=${updates.expiryDate.toLocaleDateString()}` : ''}`);
        } else {
            console.warn(`Product with ID ${item.productId} not found during purchase update.`);
            // Handle adding the product if it doesn't exist (or log error)
            // For now, we assume products exist before purchase
        }
     }));
    console.log("Product quantities updated after purchase.");

    // TODO: Update supplier balance/account if tracking supplier debts

    return newPurchase;
}

// --- Helper to get product name by ID (for displaying in invoices) ---
// In a real app, this might be optimized or data joined earlier
export async function getProductNameById(id: string): Promise<string> {
    const product = await getProductById(id);
    return product ? product.nameAr : `منتج غير معروف (${id.substring(0,6)})`;
}

// --- Helper to get customer by ID ---
export async function getCustomerById(id: string): Promise<Customer | undefined> {
   await new Promise(resolve => setTimeout(resolve, 20));
   const customer = sampleCustomers.find(c => c.id === id);
   return customer ? { ...customer, balance: customer.balance ?? 0 } : undefined;
}


// --- User Management Data ---
let sampleUsers: User[] = [
  { id: 'user-001', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
  { id: 'user-002', name: 'Seller User', email: 'seller@example.com', role: 'seller' },
  { id: 'user-003', name: 'Manager User', email: 'manager@example.com', role: 'manager' },
   { id: 'user-004', name: 'Accountant User', email: 'accountant@example.com', role: 'accountant' },
];

export async function getUsers(): Promise<User[]> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return [...sampleUsers];
}

// Add functions for addUser, updateUser, deleteUser later as needed
export async function addUser(userData: Omit<User, 'id'>): Promise<User> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const newUser: User = {
    ...userData,
    id: `user-${Date.now().toString()}-${Math.random().toString(16).substring(2, 8)}`,
  };
  sampleUsers.push(newUser);
   console.log("Added User:", newUser);
   console.log("Current Users:", sampleUsers);
  return newUser;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const index = sampleUsers.findIndex(u => u.id === id);
  if (index === -1) return null;
  // Prevent changing ID
  const { id: _, ...safeUpdates } = updates;
  sampleUsers[index] = { ...sampleUsers[index], ...safeUpdates };
    console.log("Updated User:", sampleUsers[index]);
    console.log("Current Users:", sampleUsers);
  return sampleUsers[index];
}

export async function deleteUser(id: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const initialLength = sampleUsers.length;
  sampleUsers = sampleUsers.filter(u => u.id !== id);
   const success = sampleUsers.length < initialLength;
  console.log(`Deleted User ${id}?`, success);
  console.log("Current Users:", sampleUsers);
  return success;
}


// --- Expiry Date Logic ---
export function calculateDaysUntilExpiry(expiryDate?: Date): number {
    if (!expiryDate) return Infinity; // Or some large number if no expiry
    const today = new Date();
    // Set time to 00:00:00 for accurate day difference calculation
    today.setHours(0, 0, 0, 0);
    // Make a copy before modifying
    const expiryDateNormalized = new Date(expiryDate);
    expiryDateNormalized.setHours(0, 0, 0, 0);
    return differenceInDays(expiryDateNormalized, today);
}


// Get products nearing expiry (e.g., within the next 90 days)
export async function getProductsNearingExpiry(daysThreshold: number = 60): Promise<ProductExpiryInfo[]> { // Changed threshold to 60
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

// --- Alternative Product Logic ---
export async function findAlternativeProducts(productId: string): Promise<Product[]> {
    await new Promise(resolve => setTimeout(resolve, 70)); // Simulate slightly longer delay
    const originalProduct = await getProductById(productId);
    if (!originalProduct || !originalProduct.activeIngredient) {
        return []; // Cannot find alternatives without active ingredient
    }

    const allProducts = await getProducts();
    const alternatives = allProducts.filter(p =>
        p.id !== productId && // Not the same product
        p.activeIngredient && // Must have an active ingredient defined
        p.activeIngredient.toLowerCase() === originalProduct.activeIngredient!.toLowerCase() // Match active ingredient (case-insensitive)
        // Add more sophisticated matching logic here if needed (e.g., concentration, form)
    );

    return alternatives;
}



// --- Reports (Placeholders - Implement complex logic later) ---

// Example: Get total sales value for a period (e.g., today)
export async function getTotalSalesForToday(): Promise<number> {
    const sales = await getSales();
    const today = new Date();
    const total = sales
        .filter(sale => isSameDay(new Date(sale.date), today))
        .reduce((sum, sale) => sum + sale.totalAmount, 0);
    return total;
}

// Example: Get total purchases value for a period (e.g., today)
export async function getTotalPurchasesForToday(): Promise<number> {
    const purchases = await getPurchases();
    const today = new Date();
    const total = purchases
        .filter(purchase => isSameDay(new Date(purchase.date), today))
        .reduce((sum, purchase) => sum + purchase.totalAmount, 0);
    return total;
}

// Example: Get customers with debt (negative balance)
export async function getCustomersWithDebt(): Promise<Customer[]> {
    const customers = await getCustomers();
    return customers.filter(customer => (customer.balance ?? 0) < 0);
}

// --- Inventory Report Data ---
export async function getInventoryReportData(): Promise<InventoryReportItem[]> {
  const products = await getProducts();
  return products.map(product => ({
    id: product.id,
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    barcode: product.barcode,
    quantity: product.quantity,
    price: product.price,
    lastPurchaseCost: product.lastPurchaseCost, // Use the stored cost
    unitType: product.unitType,
    expiryDate: product.expiryDate,
    inventoryValue: product.quantity * (product.lastPurchaseCost || 0), // Calculate inventory value
  }));
}
