
import type { Product, Supplier, Customer, SaleTransaction, PurchaseTransaction, PurchaseTransactionItem, SaleTransactionItem, User, ProductExpiryInfo, InventoryReportItem, PaymentMethod, PaymentStatus, UserRole } from '@/lib/types';
import { Pill, Baby, SprayCan, Activity, LucideIcon } from 'lucide-react';
import { differenceInDays, addDays, isBefore, isSameDay, startOfDay, endOfDay } from 'date-fns';
import db from '@/lib/db'; // Import the database instance

// --- Helper Functions ---

const SIMULATE_DELAY = 0; // Can remove delay when using a real DB

// Map icon string names (from DB) to Lucide components
function getIconComponent(name?: string): React.ComponentType<any> | LucideIcon | undefined {
    switch (name) {
        case 'Pill': return Pill;
        case 'Baby': return Baby;
        case 'SprayCan': return SprayCan;
        case 'Activity': return Activity;
        default: return Pill; // Default or handle unknown case
    }
}
function getIconName(IconComponent?: React.ComponentType<any> | LucideIcon): string | undefined {
    if (!IconComponent) return undefined;
    if (IconComponent === Pill) return 'Pill';
    if (IconComponent === Baby) return 'Baby';
    if (IconComponent === SprayCan) return 'SprayCan';
    if (IconComponent === Activity) return 'Activity';
    // Fallback might be needed if using other icons or custom components
    return (IconComponent as any).displayName || (IconComponent as any).name || undefined;
}

// Ensures Date objects are correctly handled when retrieving data from DB
// Also maps categoryIcon string to component
const mapProductData = (product: any): Product => ({
    ...product,
    price: parseFloat(product.price || 0),
    lastPurchaseCost: product.lastPurchaseCost ? parseFloat(product.lastPurchaseCost) : undefined,
    quantity: parseFloat(product.quantity || 0),
    subUnitsPerUnit: product.subUnitsPerUnit ? parseInt(product.subUnitsPerUnit, 10) : undefined,
    discountRate: product.discountRate ? parseFloat(product.discountRate) : undefined,
    minStockLevel: product.minStockLevel ? parseInt(product.minStockLevel, 10) : undefined,
    expiryDate: product.expiryDate ? new Date(product.expiryDate) : undefined,
    categoryIcon: getIconComponent(product.categoryIcon),
});

const mapSalesData = (sale: any): SaleTransaction => ({
    ...sale,
    totalAmount: parseFloat(sale.totalAmount || 0),
    originalTotalAmount: sale.originalTotalAmount ? parseFloat(sale.originalTotalAmount) : undefined,
    subTotalAmount: sale.subTotalAmount ? parseFloat(sale.subTotalAmount) : undefined,
    amountPaid: parseFloat(sale.amountPaid || 0),
    appliedInsuranceDiscountRate: sale.appliedInsuranceDiscountRate ? parseFloat(sale.appliedInsuranceDiscountRate) : undefined,
    date: new Date(sale.date),
    // Items need to be fetched separately usually
    items: sale.items || [], // Assuming items might be joined or fetched separately
});

const mapPurchaseData = (purchase: any): PurchaseTransaction => ({
    ...purchase,
    totalAmount: parseFloat(purchase.totalAmount || 0),
    amountPaid: parseFloat(purchase.amountPaid || 0),
    date: new Date(purchase.date),
     // Items need to be fetched separately usually
    items: purchase.items || [], // Assuming items might be joined or fetched separately
});

const mapCustomerData = (customer: any): Customer => ({
    ...customer,
    balance: customer.balance ? parseFloat(customer.balance) : 0,
    insuranceDiscountRate: customer.insuranceDiscountRate ? parseFloat(customer.insuranceDiscountRate) : undefined,
});


// --- Product Data Operations ---
export async function getProducts(): Promise<Product[]> {
    if (!db) { console.error("DB not available in getProducts"); return []; }
    try {
        const results = await db.select("SELECT * FROM Products", []);
        return (results as any[]).map(mapProductData);
    } catch (error) {
        console.error("Error fetching products:", error);
        throw error; // Re-throw or handle as needed
    }
}

export async function getProductById(id: string): Promise<Product | undefined> {
    if (!db) { console.error("DB not available in getProductById"); return undefined; }
    try {
        const results = await db.select("SELECT * FROM Products WHERE id = ?", [id]);
        if (results && results.length > 0) {
            return mapProductData(results[0]);
        }
        return undefined;
    } catch (error) {
        console.error(`Error fetching product by id ${id}:`, error);
        throw error;
    }
}

export async function getProductByBarcode(barcode: string): Promise<Product | undefined> {
    if (!db) { console.error("DB not available in getProductByBarcode"); return undefined; }
     try {
        const results = await db.select("SELECT * FROM Products WHERE barcode = ?", [barcode]);
        if (results && results.length > 0) {
            return mapProductData(results[0]);
        }
        return undefined;
    } catch (error) {
        console.error(`Error fetching product by barcode ${barcode}:`, error);
        throw error;
    }
}

export async function addProduct(productData: Omit<Product, 'id'>): Promise<Product> {
    if (!db) { throw new Error("DB not available in addProduct"); }
    const newId = `prod-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`;
    const query = `
        INSERT INTO Products (
            id, nameAr, nameEn, manufacturer, concentration, activeIngredient, price,
            lastPurchaseCost, quantity, categoryIcon, barcode, unitType, subUnitType,
            subUnitsPerUnit, discountRate, expiryDate, minStockLevel
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        newId,
        productData.nameAr,
        productData.nameEn,
        productData.manufacturer,
        productData.concentration,
        productData.activeIngredient,
        Math.max(0, productData.price || 0),
        productData.lastPurchaseCost !== undefined ? Math.max(0, productData.lastPurchaseCost) : null,
        Math.max(0, productData.quantity || 0),
        getIconName(productData.categoryIcon || Pill),
        productData.barcode,
        productData.unitType,
        productData.subUnitType,
        productData.subUnitsPerUnit,
        productData.discountRate !== undefined ? Math.max(0, Math.min(100, productData.discountRate)) : null,
        productData.expiryDate, // Pass Date object directly if driver supports it
        productData.minStockLevel !== undefined ? Math.max(0, productData.minStockLevel) : null,
    ];
    try {
        await db.execute(query, params);
        const newProduct = { ...productData, id: newId };
        console.log("Added Product (DB):", newProduct);
        // Return the mapped product to include the icon component
        return mapProductData(newProduct);
    } catch (error) {
        console.error("Error adding product:", error);
        throw error;
    }
}

export async function updateProduct(id: string, updates: Partial<Omit<Product, 'id'>>): Promise<Product | null> {
     if (!db) { throw new Error("DB not available in updateProduct"); }
    const currentProduct = await getProductById(id);
    if (!currentProduct) return null;

    const updatedFields = { ...currentProduct, ...updates };

     // Apply validation logic to the fields that will be updated
    const safeUpdates: { [key: string]: any } = {};
    const updateKeys = Object.keys(updates) as (keyof typeof updates)[];
    let setClause = [];
    let params = [];

    for (const key of updateKeys) {
        let value = updatedFields[key];
        // Validation and preparation
        if (key === 'quantity') value = Math.max(0, Number(value) || 0);
        if (key === 'price') value = Math.max(0, Number(value) || 0);
        if (key === 'lastPurchaseCost') value = value !== undefined ? Math.max(0, Number(value)) : null;
        if (key === 'minStockLevel') value = value !== undefined ? Math.max(0, Number(value)) : null;
        if (key === 'discountRate') value = value !== undefined ? Math.max(0, Math.min(100, Number(value))) : null;
        if (key === 'subUnitsPerUnit') value = value !== undefined && Number(value) > 0 ? Number(value) : null;
        if (key === 'expiryDate') value = value ? new Date(value) : null; // Assuming DB driver handles Date object
        if (key === 'categoryIcon') value = getIconName(value as LucideIcon);

        // Only add to update if the value has actually changed (optional, but good practice)
        // Use a loose comparison for dates
        if (key === 'expiryDate') {
             if ((value && !currentProduct[key]) || (!value && currentProduct[key]) || (value && currentProduct[key] && value.getTime() !== currentProduct[key]!.getTime())) {
                 safeUpdates[key] = value;
                 setClause.push(`${key} = ?`);
                 params.push(value);
             }
         } else if (value !== currentProduct[key]) {
            safeUpdates[key] = value;
            setClause.push(`${key} = ?`);
            params.push(value);
        }
    }

    if (setClause.length === 0) {
        // No actual changes detected
        return currentProduct; // Return the original product
    }

    const query = `UPDATE Products SET ${setClause.join(', ')} WHERE id = ?`;
    params.push(id);

    try {
        await db.execute(query, params);
        const resultProduct = { ...currentProduct, ...safeUpdates };
        console.log("Updated Product (DB):", resultProduct);
        // Re-fetch or return mapped updated data
        return mapProductData(resultProduct);
    } catch (error) {
        console.error(`Error updating product ${id}:`, error);
        throw error;
    }
}

export async function deleteProduct(id: string): Promise<boolean> {
    if (!db) { throw new Error("DB not available in deleteProduct"); }
    // --- Dependency Check ---
    // Check Sales
    const salesCheck = await db.select("SELECT 1 FROM SaleTransactionItems WHERE productId = ? LIMIT 1", [id]);
    if (salesCheck && salesCheck.length > 0) {
        console.warn(`Cannot delete product ${id}: Used in sales transactions.`);
        // Consider throwing a specific error or returning a status code
        throw new Error(`لا يمكن حذف المنتج لأنه مرتبط بفواتير بيع.`);
        // return false;
    }
    // Check Purchases
    const purchasesCheck = await db.select("SELECT 1 FROM PurchaseTransactionItems WHERE productId = ? LIMIT 1", [id]);
    if (purchasesCheck && purchasesCheck.length > 0) {
         console.warn(`Cannot delete product ${id}: Used in purchase transactions.`);
        throw new Error(`لا يمكن حذف المنتج لأنه مرتبط بفواتير شراء.`);
        // return false;
    }
    // --- End Dependency Check ---

    const query = "DELETE FROM Products WHERE id = ?";
    try {
        const result = await db.execute(query, [id]);
        const success = result.affectedRows > 0;
        console.log(`Deleted Product ${id}? (DB)`, success);
        return success;
    } catch (error) {
        console.error(`Error deleting product ${id}:`, error);
        throw error; // Re-throw database errors
    }
}

// --- Supplier Data Operations ---
export async function getSuppliers(): Promise<Supplier[]> {
    if (!db) { console.error("DB not available in getSuppliers"); return []; }
    try {
        const results = await db.select("SELECT * FROM Suppliers", []);
        return results as Supplier[];
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        throw error;
    }
}

export async function addSupplier(supplierData: Omit<Supplier, 'id'>): Promise<Supplier> {
    if (!db) { throw new Error("DB not available in addSupplier"); }
    const newId = `supp-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`;
    const query = `
        INSERT INTO Suppliers (id, name, contactPerson, phone, email, address)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
        newId,
        supplierData.name,
        supplierData.contactPerson,
        supplierData.phone,
        supplierData.email,
        supplierData.address,
    ];
    try {
        await db.execute(query, params);
        const newSupplier = { ...supplierData, id: newId };
        console.log("Added Supplier (DB):", newSupplier);
        return newSupplier;
    } catch (error) {
        console.error("Error adding supplier:", error);
        throw error;
    }
}

export async function updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier | null> {
     if (!db) { throw new Error("DB not available in updateSupplier"); }
    const currentSupplier = (await db.select("SELECT * FROM Suppliers WHERE id = ?", [id]))?.[0];
    if (!currentSupplier) return null;

    const { id: _, ...safeUpdates } = updates; // Prevent changing ID

     if (Object.keys(safeUpdates).length === 0) return currentSupplier;

    const setClause = Object.keys(safeUpdates).map(key => `${key} = ?`).join(', ');
    const params = [...Object.values(safeUpdates), id];

    const query = `UPDATE Suppliers SET ${setClause} WHERE id = ?`;

    try {
        await db.execute(query, params);
        const updatedSupplier = { ...currentSupplier, ...safeUpdates };
        console.log("Updated Supplier (DB):", updatedSupplier);
        return updatedSupplier;
    } catch (error) {
        console.error(`Error updating supplier ${id}:`, error);
        throw error;
    }
}

export async function deleteSupplier(id: string): Promise<boolean> {
     if (!db) { throw new Error("DB not available in deleteSupplier"); }
    // Dependency Check: Check if supplier is linked to any purchases
    const purchasesCheck = await db.select("SELECT 1 FROM PurchaseTransactions WHERE supplierId = ? LIMIT 1", [id]);
    if (purchasesCheck && purchasesCheck.length > 0) {
        console.warn(`Cannot delete supplier ${id}: Linked to purchase transactions.`);
        throw new Error(`لا يمكن حذف المورد لأنه مرتبط بفواتير شراء.`);
        // return false;
    }

    const query = "DELETE FROM Suppliers WHERE id = ?";
    try {
        const result = await db.execute(query, [id]);
        const success = result.affectedRows > 0;
        console.log(`Deleted Supplier ${id}? (DB)`, success);
        return success;
    } catch (error) {
        console.error(`Error deleting supplier ${id}:`, error);
        throw error;
    }
}

// --- Customer Data Operations ---
export async function getCustomers(): Promise<Customer[]> {
    if (!db) { console.error("DB not available in getCustomers"); return []; }
    try {
        const results = await db.select("SELECT * FROM Customers", []);
        return (results as any[]).map(mapCustomerData);
    } catch (error) {
        console.error("Error fetching customers:", error);
        throw error;
    }
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
    if (!db) { console.error("DB not available in getCustomerById"); return undefined; }
    try {
        const results = await db.select("SELECT * FROM Customers WHERE id = ?", [id]);
         if (results && results.length > 0) {
            return mapCustomerData(results[0]);
        }
        return undefined;
    } catch (error) {
        console.error(`Error fetching customer by id ${id}:`, error);
        throw error;
    }
}

export async function addCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer> {
    if (!db) { throw new Error("DB not available in addCustomer"); }
    const newId = `cust-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`;
    const query = `
        INSERT INTO Customers (id, name, phone, email, address, balance, insuranceCompany, policyNumber, insuranceDiscountRate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        newId,
        customerData.name,
        customerData.phone,
        customerData.email,
        customerData.address,
        customerData.balance ?? 0,
        customerData.insuranceCompany,
        customerData.policyNumber,
        customerData.insuranceDiscountRate !== undefined ? Math.max(0, Math.min(100, customerData.insuranceDiscountRate)) : null,
    ];
    try {
        await db.execute(query, params);
        const newCustomer = { ...customerData, id: newId, balance: customerData.balance ?? 0 };
        console.log("Added Customer (DB):", newCustomer);
        return newCustomer;
    } catch (error) {
        console.error("Error adding customer:", error);
        throw error;
    }
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    if (!db) { throw new Error("DB not available in updateCustomer"); }
    const currentCustomer = await getCustomerById(id); // Use existing function to get mapped data
    if (!currentCustomer) return null;

    const { id: _, ...safeUpdates } = updates;

     // Apply validation logic before creating query
     if ('balance' in safeUpdates && typeof safeUpdates.balance !== 'number') {
         delete safeUpdates.balance; // Remove invalid balance update
     }
     if ('insuranceDiscountRate' in safeUpdates) {
         const rate = safeUpdates.insuranceDiscountRate;
         if (typeof rate === 'number' && rate >= 0 && rate <= 100) {
             safeUpdates.insuranceDiscountRate = rate;
         } else {
             safeUpdates.insuranceDiscountRate = null; // Set to null if invalid or remove the key
         }
     }

     if (Object.keys(safeUpdates).length === 0) return currentCustomer; // No valid changes

    const setClause = Object.keys(safeUpdates).map(key => `${key} = ?`).join(', ');
    const params = [...Object.values(safeUpdates), id];
    const query = `UPDATE Customers SET ${setClause} WHERE id = ?`;

    try {
        await db.execute(query, params);
        const updatedCustomer = { ...currentCustomer, ...safeUpdates };
        console.log("Updated Customer (DB):", updatedCustomer);
        return updatedCustomer;
    } catch (error) {
        console.error(`Error updating customer ${id}:`, error);
        throw error;
    }
}

export async function deleteCustomer(id: string): Promise<boolean> {
    if (!db) { throw new Error("DB not available in deleteCustomer"); }
    // Dependency Check: Check if customer has sales transactions
    const salesCheck = await db.select("SELECT 1 FROM SalesTransactions WHERE customerId = ? LIMIT 1", [id]);
    if (salesCheck && salesCheck.length > 0) {
        console.warn(`Cannot delete customer ${id}: Linked to sales transactions.`);
        throw new Error(`لا يمكن حذف العميل لأنه مرتبط بفواتير بيع.`);
        // return false;
    }

    const query = "DELETE FROM Customers WHERE id = ?";
    try {
        const result = await db.execute(query, [id]);
        const success = result.affectedRows > 0;
        console.log(`Deleted Customer ${id}? (DB)`, success);
        return success;
    } catch (error) {
        console.error(`Error deleting customer ${id}:`, error);
        throw error;
    }
}

// --- Sale Transaction Operations ---
// Helper to fetch sale items for a given sale ID
async function getSaleItems(saleId: string): Promise<SaleTransactionItem[]> {
    if (!db) { console.error("DB not available in getSaleItems"); return []; }
    try {
        const results = await db.select("SELECT * FROM SaleTransactionItems WHERE saleId = ?", [saleId]);
        return results.map((item: any) => ({
            ...item,
            quantity: parseFloat(item.quantity || 0),
            price: parseFloat(item.price || 0),
            costAtSale: item.costAtSale ? parseFloat(item.costAtSale) : undefined,
        })) as SaleTransactionItem[];
    } catch (error) {
        console.error(`Error fetching items for sale ${saleId}:`, error);
        throw error;
    }
}

export async function getSales(): Promise<SaleTransaction[]> {
    if (!db) { console.error("DB not available in getSales"); return []; }
    try {
        // Fetch main sale data
        const salesResults = await db.select("SELECT * FROM SalesTransactions ORDER BY date DESC", []);
        const sales = (salesResults as any[]).map(mapSalesData);

        // Fetch items for each sale (could be optimized with a JOIN or batch query)
        for (const sale of sales) {
            sale.items = await getSaleItems(sale.id);
        }
        return sales;
    } catch (error) {
        console.error("Error fetching sales:", error);
        throw error;
    }
}

// Function to add a sale and update product quantities, customer balance
export async function addSale(saleData: Omit<SaleTransaction, 'id'>): Promise<SaleTransaction> {
    if (!db) { throw new Error("DB not available in addSale"); }
    const newSaleId = `sale-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`;

    // --- Database Transaction ---
    // You'll need a way to handle transactions with your specific DB driver
    // Start transaction here...

    try {
        // 1. Insert into SalesTransactions table
        const saleQuery = `
            INSERT INTO SalesTransactions (
                id, customerId, totalAmount, originalTotalAmount, subTotalAmount,
                paymentMethod, amountPaid, date, appliedInsuranceDiscountRate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const saleParams = [
            newSaleId,
            saleData.customerId,
            saleData.totalAmount,
            saleData.originalTotalAmount,
            saleData.subTotalAmount,
            saleData.paymentMethod,
            saleData.amountPaid,
            saleData.date ? new Date(saleData.date) : new Date(),
            saleData.appliedInsuranceDiscountRate,
        ];
        await db.execute(saleQuery, saleParams);

        // 2. Insert into SaleTransactionItems table and Update Product Stock
        for (const item of saleData.items) {
            // Insert item
            const itemQuery = `
                INSERT INTO SaleTransactionItems (saleId, productId, quantity, price, soldUnitType, costAtSale)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            // Fetch costAtSale if not already calculated (should ideally be done before calling addSale)
             let costAtSale = item.costAtSale;
             if (costAtSale === undefined) {
                 const product = await getProductById(item.productId);
                 if (product) {
                     costAtSale = item.soldUnitType === 'sub' && product.subUnitsPerUnit && product.lastPurchaseCost
                        ? product.lastPurchaseCost / product.subUnitsPerUnit
                        : product.lastPurchaseCost;
                 }
             }

            const itemParams = [newSaleId, item.productId, item.quantity, item.price, item.soldUnitType, costAtSale];
            await db.execute(itemQuery, itemParams);

            // Update stock
            const product = await getProductById(item.productId);
            if (product) {
                let quantityToDeduct = item.quantity;
                if (item.soldUnitType === 'sub' && product.subUnitsPerUnit && product.subUnitsPerUnit > 0) {
                    quantityToDeduct = item.quantity / product.subUnitsPerUnit;
                }
                 const stockUpdateQuery = "UPDATE Products SET quantity = quantity - ? WHERE id = ?";
                 // Add check to prevent negative stock if DB doesn't enforce it
                 if (product.quantity < quantityToDeduct) {
                     throw new Error(`Insufficient stock for product ${item.productId}. Available: ${product.quantity}, Needed: ${quantityToDeduct}`);
                 }
                await db.execute(stockUpdateQuery, [quantityToDeduct, item.productId]);
            } else {
                 console.warn(`Product with ID ${item.productId} not found during sale stock update.`);
                // Potentially throw error if product MUST exist
            }
        }

        // 3. Update Customer Balance (if applicable)
        if (saleData.customerId) {
            const customer = await getCustomerById(saleData.customerId);
            if (customer) {
                const amountDue = saleData.totalAmount;
                let balanceChange = 0;
                 if (saleData.paymentMethod === 'debt') {
                    balanceChange = -(amountDue - saleData.amountPaid); // Debt increases negative balance
                } else {
                     balanceChange = saleData.amountPaid - amountDue; // Positive if overpaid (credit)
                 }

                 if (balanceChange !== 0) {
                    const balanceUpdateQuery = "UPDATE Customers SET balance = balance + ? WHERE id = ?";
                    await db.execute(balanceUpdateQuery, [balanceChange, saleData.customerId]);
                }
            }
        }

        // Commit transaction here...

        console.log("Added Sale (DB):", newSaleId);
        // Fetch the newly created sale to return complete data
        const finalSaleData = {
            ...saleData,
            id: newSaleId,
            items: (await getSaleItems(newSaleId)) // Fetch items again to get DB IDs etc.
        }
        return finalSaleData as SaleTransaction;

    } catch (error) {
        // Rollback transaction here...
        console.error("Error adding sale transaction:", error);
        throw error;
    }
}


// --- Purchase Transaction Operations ---
// Helper to fetch purchase items for a given purchase ID
async function getPurchaseItems(purchaseId: string): Promise<PurchaseTransactionItem[]> {
    if (!db) { console.error("DB not available in getPurchaseItems"); return []; }
    try {
        const results = await db.select("SELECT * FROM PurchaseTransactionItems WHERE purchaseId = ?", [purchaseId]);
        return results.map((item: any) => ({
            ...item,
            quantity: parseInt(item.quantity || 0, 10),
            cost: parseFloat(item.cost || 0),
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
        })) as PurchaseTransactionItem[];
    } catch (error) {
        console.error(`Error fetching items for purchase ${purchaseId}:`, error);
        throw error;
    }
}

export async function getPurchases(): Promise<PurchaseTransaction[]> {
    if (!db) { console.error("DB not available in getPurchases"); return []; }
    try {
         // Fetch main purchase data
        const purchaseResults = await db.select("SELECT * FROM PurchaseTransactions ORDER BY date DESC", []);
        const purchases = (purchaseResults as any[]).map(mapPurchaseData);

        // Fetch items for each purchase
        for (const purchase of purchases) {
            purchase.items = await getPurchaseItems(purchase.id);
        }
        return purchases;
    } catch (error) {
        console.error("Error fetching purchases:", error);
        throw error;
    }
}

export async function addPurchase(purchaseData: Omit<PurchaseTransaction, 'id' | 'totalAmount' | 'paymentStatus'>): Promise<PurchaseTransaction> {
     if (!db) { throw new Error("DB not available in addPurchase"); }
     const newPurchaseId = `pur-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`;

     // Calculate total amount and determine payment status
     const totalAmount = purchaseData.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.cost || 0), 0);
     let paymentStatus: PaymentStatus = 'unpaid';
     if (purchaseData.amountPaid >= totalAmount && totalAmount > 0) {
         paymentStatus = 'paid';
     } else if (purchaseData.amountPaid > 0) {
         paymentStatus = 'partial';
     }

     // --- Database Transaction ---
     // Start transaction...
    try {
         // 1. Insert into PurchaseTransactions table
         const purchaseQuery = `
            INSERT INTO PurchaseTransactions (
                id, supplierId, totalAmount, paymentStatus, amountPaid, date, invoiceNumber
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
         const purchaseParams = [
            newPurchaseId,
            purchaseData.supplierId,
            totalAmount,
            paymentStatus,
            purchaseData.amountPaid,
            purchaseData.date ? new Date(purchaseData.date) : new Date(),
            purchaseData.invoiceNumber,
        ];
         await db.execute(purchaseQuery, purchaseParams);

         // 2. Insert into PurchaseTransactionItems and Update Product Stock/Cost/Expiry
         for (const item of purchaseData.items) {
            // Insert item
            const itemQuery = `
                INSERT INTO PurchaseTransactionItems (purchaseId, productId, quantity, cost, expiryDate)
                VALUES (?, ?, ?, ?, ?)
            `;
            const itemParams = [newPurchaseId, item.productId, item.quantity, item.cost, item.expiryDate];
            await db.execute(itemQuery, itemParams);

            // Update product stock, last cost, and potentially expiry date
            // Check if product exists first
             const productExistsResult = await db.select("SELECT id FROM Products WHERE id = ?", [item.productId]);
             if (productExistsResult && productExistsResult.length > 0) {
                const stockUpdateQuery = `
                     UPDATE Products
                     SET quantity = quantity + ?, lastPurchaseCost = ?, expiryDate = COALESCE(?, expiryDate)
                     WHERE id = ?
                 `;
                 // Using COALESCE for expiryDate: update only if the new purchase has an expiry, otherwise keep the old one.
                 // Adjust this logic if you need different expiry handling (e.g., always overwrite, keep oldest/newest).
                await db.execute(stockUpdateQuery, [item.quantity, item.cost, item.expiryDate, item.productId]);
             } else {
                 // Option: Create the product if it doesn't exist
                 console.warn(`Product ${item.productId} not found. Consider adding it.`);
                 // Example: await addProduct({ nameAr: `منتج جديد (${item.productId})`, ..., quantity: item.quantity, lastPurchaseCost: item.cost, expiryDate: item.expiryDate });
             }
         }

         // Commit transaction...

         console.log("Added Purchase (DB):", newPurchaseId);
         // Fetch the newly created purchase to return complete data
         const finalPurchaseData = {
            ...purchaseData,
            id: newPurchaseId,
            totalAmount,
            paymentStatus,
            items: (await getPurchaseItems(newPurchaseId))
         }
         return finalPurchaseData as PurchaseTransaction;

    } catch (error) {
        // Rollback transaction...
        console.error("Error adding purchase transaction:", error);
        throw error;
    }
}


// --- User Operations ---
export async function getUsers(): Promise<User[]> {
    if (!db) { console.error("DB not available in getUsers"); return []; }
    try {
        const results = await db.select("SELECT id, name, email, role FROM Users", []);
        return results as User[]; // Assuming DB columns match User type fields
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
}

// Function to fetch a user by email for login purposes (WITHOUT password)
export async function getUserForLogin(email: string): Promise<User | undefined> {
    if (!db) { console.error("DB not available in getUserForLogin"); return undefined; }
    try {
        const results = await db.select("SELECT id, name, email, role FROM Users WHERE email = ?", [email]);
        if (results && results.length > 0) {
            return results[0] as User;
        }
        return undefined;
    } catch (error) {
        console.error(`Error fetching user by email ${email}:`, error);
        throw error;
    }
}


export async function addUser(userData: Omit<User, 'id'>): Promise<User> {
    if (!db) { throw new Error("DB not available in addUser"); }
    const newId = `user-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`;
    // **IMPORTANT**: Password hashing should happen here before saving!
    // const hashedPassword = await hashPassword(userData.password); // Replace with your hashing logic
    const query = `
        INSERT INTO Users (id, name, email, role) -- Add passwordHash column if needed
        VALUES (?, ?, ?, ?) -- Add hashedPassword param if needed
    `;
    const params = [newId, userData.name, userData.email, userData.role];
    try {
        await db.execute(query, params);
        const newUser = { ...userData, id: newId };
        console.log("Added User (DB):", newUser);
        return newUser;
    } catch (error) {
        console.error("Error adding user:", error);
        throw error;
    }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    if (!db) { throw new Error("DB not available in updateUser"); }
    const currentUser = (await db.select("SELECT id, name, email, role FROM Users WHERE id = ?", [id]))?.[0] as User | undefined;
    if (!currentUser) return null;

    const { id: _, ...safeUpdates } = updates; // Prevent changing ID
    // Handle password update separately with hashing if needed

    if (Object.keys(safeUpdates).length === 0) return currentUser;

    const setClause = Object.keys(safeUpdates).map(key => `${key} = ?`).join(', ');
    const params = [...Object.values(safeUpdates), id];
    const query = `UPDATE Users SET ${setClause} WHERE id = ?`;

    try {
        await db.execute(query, params);
        const updatedUser = { ...currentUser, ...safeUpdates };
        console.log("Updated User (DB):", updatedUser);
        return updatedUser;
    } catch (error) {
        console.error(`Error updating user ${id}:`, error);
        throw error;
    }
}

export async function deleteUser(id: string): Promise<boolean> {
    if (!db) { throw new Error("DB not available in deleteUser"); }
     // --- Dependency Check (Optional but recommended) ---
     // Check if user is linked to sales/purchases or other critical data
     // Example:
     // const salesCheck = await db.select("SELECT 1 FROM SalesTransactions WHERE createdByUserId = ? LIMIT 1", [id]);
     // if (salesCheck && salesCheck.length > 0) {
     //     throw new Error(`لا يمكن حذف المستخدم لأنه مرتبط بعمليات بيع.`);
     // }
     // --- End Dependency Check ---

    const query = "DELETE FROM Users WHERE id = ?";
    try {
        const result = await db.execute(query, [id]);
        const success = result.affectedRows > 0;
        console.log(`Deleted User ${id}? (DB)`, success);
        return success;
    } catch (error) {
        console.error(`Error deleting user ${id}:`, error);
        throw error;
    }
}

// --- Helper Functions ---
export async function getProductNameById(id: string): Promise<string> {
    const product = await getProductById(id);
    return product ? product.nameAr : `منتج غير معروف (${id.substring(0,6)})`;
}

// --- Expiry Date Logic ---
export function calculateDaysUntilExpiry(expiryDate?: Date | string): number {
    if (!expiryDate) return Infinity;
    const expiry = startOfDay(new Date(expiryDate)); // Normalize expiry
     // Check if the date is valid after conversion
    if (isNaN(expiry.getTime())) {
        console.warn(`Invalid expiry date encountered: ${expiryDate}`);
        return Infinity; // Or handle as appropriate
    }
    const today = startOfDay(new Date()); // Normalize today
    return differenceInDays(expiry, today);
}

// --- Reporting Functions ---
export async function getProductsNearingExpiry(daysThreshold: number = 60): Promise<ProductExpiryInfo[]> {
    if (!db) { console.error("DB not available in getProductsNearingExpiry"); return []; }
    const query = `
        SELECT id, nameAr, expiryDate, quantity
        FROM Products
        WHERE expiryDate IS NOT NULL
          AND expiryDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
        ORDER BY expiryDate ASC
    `;
    try {
        const results = await db.select(query, [daysThreshold]);
        return (results as any[]).map(p => ({
            id: p.id,
            nameAr: p.nameAr,
            expiryDate: new Date(p.expiryDate),
            quantity: parseFloat(p.quantity || 0),
            daysUntilExpiry: calculateDaysUntilExpiry(p.expiryDate),
        }));
    } catch (error) {
        console.error("Error fetching nearing expiry products:", error);
        throw error;
    }
}

export async function getExpiredProducts(): Promise<ProductExpiryInfo[]> {
    if (!db) { console.error("DB not available in getExpiredProducts"); return []; }
    const query = `
        SELECT id, nameAr, expiryDate, quantity
        FROM Products
        WHERE expiryDate IS NOT NULL AND expiryDate < CURDATE()
        ORDER BY expiryDate ASC
    `;
    try {
        const results = await db.select(query, []);
        return (results as any[]).map(p => ({
             id: p.id,
             nameAr: p.nameAr,
             expiryDate: new Date(p.expiryDate),
             quantity: parseFloat(p.quantity || 0),
             daysUntilExpiry: calculateDaysUntilExpiry(p.expiryDate), // Will be negative
        }));
    } catch (error) {
        console.error("Error fetching expired products:", error);
        throw error;
    }
}

// --- Alternative Products ---
export async function findAlternativeProducts(productId: string): Promise<Product[]> {
    if (!db) { console.error("DB not available in findAlternativeProducts"); return []; }
    try {
        const originalProduct = await getProductById(productId);
        if (!originalProduct || !originalProduct.activeIngredient) {
            return [];
        }
        const query = `
            SELECT * FROM Products
            WHERE id != ? AND activeIngredient = ?
            -- Optionally add more criteria like form (concentration might be harder)
        `;
        const results = await db.select(query, [productId, originalProduct.activeIngredient]);
        return (results as any[]).map(mapProductData);
    } catch (error) {
        console.error(`Error finding alternatives for product ${productId}:`, error);
        throw error;
    }
}

// --- Inventory Report ---
export async function getInventoryReportData(): Promise<InventoryReportItem[]> {
    if (!db) { console.error("DB not available in getInventoryReportData"); return []; }
     const query = `
        SELECT
            p.id, p.nameAr, p.nameEn, p.barcode, p.quantity, p.price, p.expiryDate, p.unitType, p.lastPurchaseCost,
            (p.quantity * COALESCE(p.lastPurchaseCost, 0)) AS inventoryValue
        FROM Products p
    `; // Explicitly alias table
    try {
        const results = await db.select(query, []);
        return (results as any[]).map(item => ({
            ...item,
            quantity: parseFloat(item.quantity || 0),
            price: parseFloat(item.price || 0),
            lastPurchaseCost: item.lastPurchaseCost ? parseFloat(item.lastPurchaseCost) : 0,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
            inventoryValue: parseFloat(item.inventoryValue || 0),
        })) as InventoryReportItem[];
    } catch (error) {
        console.error("Error fetching inventory report data:", error);
        throw error;
    }
}
