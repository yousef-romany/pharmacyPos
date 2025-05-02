import type { Product, Supplier, Customer, SaleTransaction, PurchaseTransaction, PurchaseTransactionItem, SaleTransactionItem, User, ProductExpiryInfo, InventoryReportItem, PaymentMethod, PaymentStatus, UserRole, TreasuryTransaction, TreasuryTransactionType, Warehouse, Treasury } from '@/lib/types'; // Added Treasury type
import { Pill, Baby, SprayCan, Activity, LucideIcon } from 'lucide-react';
import { differenceInDays, addDays, isBefore, isSameDay, startOfDay, endOfDay, format as formatDate } from 'date-fns'; // Import format from date-fns
import db from '@/lib/db'; // Import the potentially initialized database instance

// --- Helper Functions ---

// Helper function to format Date object to 'YYYY-MM-DD' string for DB DATE columns
const formatDateForDB = (date: Date | string | undefined | null): string | null => {
    if (!date) return null;
    try {
        // If it's already a string in the correct format, return it
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date;
        }
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            console.warn(`Invalid date value encountered for DATE DB formatting: ${date}`);
            return null;
        }
        // Using date-fns format function
        return formatDate(d, 'yyyy-MM-dd');
    } catch (e) {
        console.error(`Error formatting date ${date} for DATE DB:`, e);
        return null;
    }
};

// Helper function to format Date object to 'YYYY-MM-DD HH:MM:SS' string for DB DATETIME columns
const formatDateTimeForDB = (date: Date | string | undefined | null): string | null => {
    if (!date) return null;
    try {
        // If it's already a string in the correct format, return it (less likely for datetime)
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(date)) {
            return date;
        }
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            console.warn(`Invalid date value encountered for DATETIME DB formatting: ${date}`);
            return null;
        }
        // Using date-fns format function
        return formatDate(d, 'yyyy-MM-dd HH:mm:ss');
    } catch (e) {
        console.error(`Error formatting date ${date} for DATETIME DB:`, e);
        return null;
    }
};


// Helper function to parse a date string from DB to Date object
const parseDateFromDB = (dateString: string | null | undefined): Date | undefined => {
    if (!dateString) return undefined;
    try {
        // Adjust parsing if timezone issues arise
        const date = new Date(dateString.replace(' ', 'T') + 'Z'); // Assume UTC if no timezone specified, or adjust based on DB timezone
        if (isNaN(date.getTime())) {
             console.warn(`Invalid date string from DB: ${dateString}`);
             return undefined;
        }
        return date;
    } catch (e) {
         console.error(`Error parsing date string ${dateString} from DB:`, e);
         return undefined;
    }
};

// Helper function to safely parse a string from DB to a number (float)
const parseFloatFromDB = (value: string | number | null | undefined, defaultValue: number = 0): number => {
    if (value === null || value === undefined) return defaultValue;
    // Convert number to string first for consistent parsing logic
    const stringValue = String(value);
    const parsed = parseFloat(stringValue);
    return isNaN(parsed) ? defaultValue : parsed;
};

// Helper function to safely parse a string from DB to an integer
const parseIntFromDB = (value: string | number | null | undefined, defaultValue: number = 0): number => {
    if (value === null || value === undefined) return defaultValue;
    // Convert number to string first for consistent parsing logic
    const stringValue = String(value);
    const parsed = parseInt(stringValue, 10);
    return isNaN(parsed) ? defaultValue : parsed;
};


// Helper function to convert a number to a string for DB storage (VARCHAR)
const formatNumberForDB = (value: number | string | undefined | null, defaultValue: string | null = null): string | null => {
    if (value === undefined || value === null) return defaultValue;
    // Handle cases where it might already be a string representation
    if (typeof value === 'string') {
        // Validate if it's a valid numeric string before returning
        if (!isNaN(parseFloat(value)) && isFinite(Number(value))) {
            return value;
        } else {
             console.warn(`Invalid numeric string encountered for DB formatting: ${value}`);
             return defaultValue; // Return default value or handle as needed
        }
    }
    return String(value); // Convert number to string
};

// Helper function to parse boolean from DB (handles INT 0/1 or other representations)
const parseBooleanFromDB = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1';
    return false;
};

// --- Mappers ---

// Map icon string names (from DB) to Lucide components
function getIconComponent(name?: string): React.ComponentType<any> | LucideIcon | undefined {
    switch (name) {
        case 'Pill': return Pill;
        case 'Baby': return Baby;
        case 'SprayCan': return SprayCan;
        case 'Activity': return Activity;
        default: return Pill;
    }
}
function getIconName(IconComponent?: React.ComponentType<any> | LucideIcon): string | undefined {
    if (!IconComponent) return undefined;
    if (IconComponent === Pill) return 'Pill';
    if (IconComponent === Baby) return 'Baby';
    if (IconComponent === SprayCan) return 'SprayCan';
    if (IconComponent === Activity) return 'Activity';
    return (IconComponent as any).displayName || (IconComponent as any).name || undefined;
}

// Map raw product data from DB to Product type, handling type conversions
const mapProductData = (product: any): Product => ({
    ...product,
    price: product.price, // Keep as string
    lastPurchaseCost: product.lastPurchaseCost, // Keep as string
    quantity: product.quantity, // Keep as string
    subUnitsPerUnit: product.subUnitsPerUnit ? parseIntFromDB(product.subUnitsPerUnit) : undefined, // Keep as number
    discountRate: product.discountRate, // Keep as string
    minStockLevel: product.minStockLevel ? parseIntFromDB(product.minStockLevel) : undefined, // Keep as number
    expiryDate: parseDateFromDB(product.expiryDate),
    categoryIcon: getIconComponent(product.categoryIcon),
    warehouseId: product.warehouseId, // Map warehouseId
});

// Map raw sales data from DB to SaleTransaction type
const mapSalesData = (sale: any): SaleTransaction => ({
    ...sale,
    totalAmount: sale.totalAmount, // Keep as string
    originalTotalAmount: sale.originalTotalAmount, // Keep as string
    subTotalAmount: sale.subTotalAmount, // Keep as string
    amountPaid: sale.amountPaid, // Keep as string
    appliedInsuranceDiscountRate: sale.appliedInsuranceDiscountRate, // Keep as string
    date: parseDateFromDB(sale.date) || new Date(), // Parse DATETIME from DB
    items: sale.items || [], // Items usually fetched separately
});

// Map raw purchase data from DB to PurchaseTransaction type
const mapPurchaseData = (purchase: any): PurchaseTransaction => ({
    ...purchase,
    totalAmount: purchase.totalAmount, // Keep as string
    amountPaid: purchase.amountPaid, // Keep as string
    date: parseDateFromDB(purchase.date) || new Date(), // Parse DATETIME from DB
    items: purchase.items || [], // Items usually fetched separately
});

// Map raw customer data from DB to Customer type
const mapCustomerData = (customer: any): Customer => ({
    ...customer,
    balance: customer.balance, // Keep as string
    insuranceDiscountRate: customer.insuranceDiscountRate, // Keep as string
});

// Map raw warehouse data from DB to Warehouse type
const mapWarehouseData = (warehouse: any): Warehouse => ({
    ...warehouse,
    isDefault: parseBooleanFromDB(warehouse.isDefault), // Parse boolean
});

// Map raw treasury data from DB to Treasury type
const mapTreasuryData = (treasury: any): Treasury => ({
    ...treasury,
    isDefault: parseBooleanFromDB(treasury.isDefault), // Parse boolean
    // openingBalance: treasury.openingBalance, // Keep as string if stored
});

// Map raw treasury transaction data from DB to TreasuryTransaction type
const mapTreasuryTransactionData = (tx: any): TreasuryTransaction => ({
    ...tx,
    amount: tx.amount, // Keep as string
    date: parseDateFromDB(tx.date) || new Date(), // Parse DATETIME
    treasuryId: tx.treasuryId, // Map treasuryId
});

// --- Warehouse Operations (Physical Product Storage) ---
export async function getWarehouses(): Promise<Warehouse[]> {
    if (!db) { console.error("DB not available in getWarehouses"); return []; }
    try {
        const results = await (await db).select("SELECT * FROM Warehouses", []);
        return (results as any[]).map(mapWarehouseData);
    } catch (error) {
        console.error("Error fetching warehouses:", error);
        throw error;
    }
}

export async function addWarehouse(warehouseData: Omit<Warehouse, 'id'>): Promise<Warehouse> {
    if (!db) { throw new Error("DB not available in addWarehouse"); }
    const newId = `wh-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`;

    // Ensure only one default warehouse if isDefault is true
    if (warehouseData.isDefault) {
        await (await db).execute("UPDATE Warehouses SET isDefault = 0 WHERE isDefault = 1", []);
    }

    const query = `
        INSERT INTO Warehouses (id, name, location, isDefault)
        VALUES (?, ?, ?, ?)
    `;
    const params = [
        newId,
        warehouseData.name,
        warehouseData.location,
        warehouseData.isDefault ? 1 : 0, // Store boolean as 1 or 0
    ];
    try {
        await (await db).execute(query, params);
        const newWarehouse = { ...warehouseData, id: newId };
        console.log("Added Warehouse (DB):", newWarehouse);
        return newWarehouse;
    } catch (error) {
        console.error("Error adding warehouse:", error);
        throw error;
    }
}

export async function updateWarehouse(id: string, updates: Partial<Omit<Warehouse, 'id'>>): Promise<Warehouse | null> {
    if (!db) { throw new Error("DB not available in updateWarehouse"); }
    const currentWarehouseResult = await (await db).select("SELECT * FROM Warehouses WHERE id = ?", [id]);
    if (!currentWarehouseResult || currentWarehouseResult.length === 0) return null;
    const currentWarehouse = currentWarehouseResult[0];


    // Ensure only one default warehouse if isDefault is being set to true
    if (updates.isDefault === true && !parseBooleanFromDB(currentWarehouse.isDefault)) {
        await (await db).execute("UPDATE Warehouses SET isDefault = 0 WHERE isDefault = 1", []);
    }

    const updateKeys = Object.keys(updates) as (keyof typeof updates)[];
    let setClause = [];
    let params = [];

    for (const key of updateKeys) {
        let newValue = updates[key];
        let originalValue = currentWarehouse[key];
        let dbValue = newValue;

        if (key === 'isDefault') {
            dbValue = newValue ? 1 : 0;
            originalValue = parseBooleanFromDB(originalValue) ? 1 : 0;
        }

        if (dbValue !== originalValue) {
            setClause.push(`${key} = ?`);
            params.push(dbValue);
        }
    }

    if (setClause.length === 0) return mapWarehouseData(currentWarehouse);

    const query = `UPDATE Warehouses SET ${setClause.join(', ')} WHERE id = ?`;
    params.push(id);

    try {
        await (await db).execute(query, params);
        const updatedWarehouse = { ...mapWarehouseData(currentWarehouse), ...updates };
        console.log("Updated Warehouse (DB):", updatedWarehouse);
        return updatedWarehouse;
    } catch (error) {
        console.error(`Error updating warehouse ${id}:`, error);
        throw error;
    }
}

export async function deleteWarehouse(id: string): Promise<boolean> {
    if (!db) { throw new Error("DB not available in deleteWarehouse"); }
    // Dependency Check: Ensure warehouse is empty before deleting
    const productCheck = await (await db).select("SELECT 1 FROM Products WHERE warehouseId = ? LIMIT 1", [id]);
    if (productCheck && productCheck.length > 0) {
        throw new Error(`لا يمكن حذف المخزن لأنه يحتوي على منتجات.`);
    }
    // Check if it's the default warehouse (prevent deletion?)
    const warehouseResult = await (await db).select("SELECT isDefault FROM Warehouses WHERE id = ?", [id]);
    const warehouse = warehouseResult?.[0];
    if (warehouse && parseBooleanFromDB(warehouse.isDefault)) {
         throw new Error(`لا يمكن حذف المخزن الافتراضي.`);
    }


    const query = "DELETE FROM Warehouses WHERE id = ?";
    try {
        const result = await (await db).execute(query, [id]);
        console.log(`Attempted deletion of Warehouse ${id} (DB)`);
        // Assume success if no error
        return result.affectedRows > 0; // Check affected rows for confirmation
    } catch (error) {
        console.error(`Error deleting warehouse ${id}:`, error);
        throw error;
    }
}

export async function getDefaultWarehouseId(): Promise<string | undefined> {
    if (!db) { console.error("DB not available in getDefaultWarehouseId"); return undefined; }
    try {
        const results = await (await db).select("SELECT id FROM Warehouses WHERE isDefault = 1 LIMIT 1", []);
        if (results && results.length > 0) {
            return results[0].id as string;
        }
        // Fallback: If no default, return the first warehouse found
        const firstWarehouse = await (await db).select("SELECT id FROM Warehouses LIMIT 1", []);
        if (firstWarehouse && firstWarehouse.length > 0) {
            console.warn("No default warehouse set, using the first available warehouse.");
            return firstWarehouse[0].id as string;
        }
        return undefined; // No warehouses exist
    } catch (error) {
        console.error("Error fetching default warehouse ID:", error);
        throw error;
    }
}

// --- Product Data Operations (Linked to Physical Warehouses) ---
export async function getProducts(warehouseId?: string): Promise<Product[]> {
    if (!db) { console.error("DB not available in getProducts"); return []; }
    try {
        let query = "SELECT * FROM Products";
        const params: any[] = [];
        if (warehouseId) {
            query += " WHERE warehouseId = ?";
            params.push(warehouseId);
        }
        const results = await (await db).select(query, params);
        return (results as any[]).map(mapProductData);
    } catch (error) {
        console.error("Error fetching products:", error);
        throw error;
    }
}

export async function getProductById(id: string, warehouseId?: string): Promise<Product | undefined> {
    if (!db) { console.error("DB not available in getProductById"); return undefined; }
    try {
        let query = "SELECT * FROM Products WHERE id = ?";
        const params: any[] = [id];
        if (warehouseId) {
            query += " AND warehouseId = ?";
            params.push(warehouseId);
        }
        query += " LIMIT 1"; // Ensure only one result

        const results = await (await db).select(query, params);
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
        const results = await (await db).select("SELECT * FROM Products WHERE barcode = ?", [barcode]);
        if (results && results.length > 0) {
            // Consider how to handle multiple products with the same barcode across different warehouses
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

    // Ensure warehouseId is set, use default if not provided
    const targetWarehouseId = productData.warehouseId || await getDefaultWarehouseId();
    if (!targetWarehouseId) {
        throw new Error("لا يوجد مخزن افتراضي أو محدد لإضافة المنتج إليه.");
    }

    const query = `
        INSERT INTO Products (
            id, nameAr, nameEn, manufacturer, concentration, activeIngredient, price,
            lastPurchaseCost, quantity, categoryIcon, barcode, unitType, subUnitType,
            subUnitsPerUnit, discountRate, expiryDate, minStockLevel, warehouseId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    // Convert numbers to strings for DB insertion
    const params = [
        newId,
        productData.nameAr,
        productData.nameEn,
        productData.manufacturer,
        productData.concentration,
        productData.activeIngredient,
        formatNumberForDB(productData.price),
        formatNumberForDB(productData.lastPurchaseCost),
        formatNumberForDB(productData.quantity),
        getIconName(productData.categoryIcon || Pill),
        productData.barcode,
        productData.unitType,
        productData.subUnitType,
        productData.subUnitsPerUnit, // INT stays as number
        formatNumberForDB(productData.discountRate),
        formatDateForDB(productData.expiryDate), // Use DATE format
        productData.minStockLevel !== undefined ? Math.max(0, productData.minStockLevel) : null, // INT stays as number
        targetWarehouseId, // Add warehouseId
    ];
    try {
        await (await db).execute(query, params);
        const newProduct = { ...productData, id: newId, warehouseId: targetWarehouseId };
        console.log("Added Product (DB):", newProduct);
        // Return the mapped product (data might still be stringified number)
        return mapProductData(newProduct);
    } catch (error) {
        console.error("Error adding product:", error);
        throw error;
    }
}

export async function updateProduct(id: string, updates: Partial<Omit<Product, 'id'>>): Promise<Product | null> {
     if (!db) { throw new Error("DB not available in updateProduct"); }
    const currentProduct = await getProductById(id); // Fetches product, potentially ignoring warehouse for update context
    if (!currentProduct) return null;

    // Merge updates, keeping original types for return object structure
    const updatedFields: Partial<Product> = {};
    const updateKeys = Object.keys(updates) as (keyof typeof updates)[];
    let setClause = [];
    let params = [];

    for (const key of updateKeys) {
        let newValue = updates[key];
        let originalValue = currentProduct[key]; // Get original value (could be string)
        let dbValue = newValue; // Value to be sent to DB

        // Convert numbers to strings for DB update if the key requires it
        if (key === 'quantity' || key === 'price' || key === 'lastPurchaseCost' || key === 'discountRate' || key === 'balance' || key === 'insuranceDiscountRate') {
            dbValue = formatNumberForDB(newValue);
            originalValue = formatNumberForDB(originalValue); // Compare strings
        }
        // Handle INT types (no conversion needed for DB)
        if (key === 'subUnitsPerUnit') dbValue = newValue !== undefined && Number(newValue) > 0 ? Number(newValue) : null;
        if (key === 'minStockLevel') dbValue = newValue !== undefined ? Math.max(0, Number(newValue)) : null;

        // Handle special types
        if (key === 'expiryDate') {
            dbValue = formatDateForDB(newValue as Date | undefined); // Use DATE format
            originalValue = formatDateForDB(originalValue as Date | undefined);
        }
        if (key === 'categoryIcon') dbValue = getIconName(newValue as LucideIcon);
        // Note: warehouseId updates are handled like other fields if included in `updates`

        // Only add to update if the DB value has actually changed
        if (String(dbValue) !== String(originalValue)) { // Robust comparison
            updatedFields[key] = updates[key]; // Keep original type from updates object
            setClause.push(`${key} = ?`);
            params.push(dbValue); // Use potentially formatted value for DB query
        }
    }


    if (setClause.length === 0) {
        // No changes detected for DB update
        return currentProduct;
    }

    // Construct WHERE clause - Update only the specific product instance
    // If warehouseId is part of the update, it will be in the SET clause
    // The WHERE clause should ideally target the specific product ID.
    // If you need to update across warehouses, the logic needs adjustment.
    const query = `UPDATE Products SET ${setClause.join(', ')} WHERE id = ?`;
    params.push(id);

    try {
        await (await db).execute(query, params);
        // Fetch the product again after update to get the latest state
        const resultProduct = await getProductById(id, updates.warehouseId || currentProduct.warehouseId);
        console.log("Updated Product (DB):", resultProduct);
        return resultProduct || null; // Return fetched product or null if not found after update
    } catch (error) {
        console.error(`Error updating product ${id}:`, error);
        throw error;
    }
}

export async function deleteProduct(id: string): Promise<boolean> {
    if (!db) { throw new Error("DB not available in deleteProduct"); }
    // Dependency Check
    const salesCheck = await (await db).select("SELECT 1 FROM SaleTransactionItems WHERE productId = ? LIMIT 1", [id]);
    if (salesCheck && salesCheck.length > 0) {
        throw new Error(`لا يمكن حذف المنتج لأنه مرتبط بفواتير بيع.`);
    }
    const purchasesCheck = await (await db).select("SELECT 1 FROM PurchaseTransactionItems WHERE productId = ? LIMIT 1", [id]);
    if (purchasesCheck && purchasesCheck.length > 0) {
        throw new Error(`لا يمكن حذف المنتج لأنه مرتبط بفواتير شراء.`);
    }

    const query = "DELETE FROM Products WHERE id = ?";
    try {
        const result = await (await db).execute(query, [id]);
        const success = result.affectedRows > 0;
        console.log(`Deleted Product ${id}? (DB)`, success);
        return success;
    } catch (error) {
        console.error(`Error deleting product ${id}:`, error);
        throw error;
    }
}


// --- Purchase Transaction Operations (Stock goes into a Warehouse) ---
async function getPurchaseItems(purchaseId: string): Promise<PurchaseTransactionItem[]> {
    if (!db) { console.error("DB not available in getPurchaseItems"); return []; }
    try {
        const results = await (await db).select("SELECT * FROM PurchaseTransactionItems WHERE purchaseId = ?", [purchaseId]);
        return results.map((item: any) => ({
            ...item,
            // Keep quantity and cost as strings
            expiryDate: parseDateFromDB(item.expiryDate), // Parse DATE
        })) as PurchaseTransactionItem[];
    } catch (error) {
        console.error(`Error fetching items for purchase ${purchaseId}:`, error);
        throw error;
    }
}

export async function getPurchases(): Promise<PurchaseTransaction[]> {
    if (!db) { console.error("DB not available in getPurchases"); return []; }
    try {
        const purchaseResults = await (await db).select("SELECT * FROM PurchaseTransactions ORDER BY date DESC", []);
        const purchases = (purchaseResults as any[]).map(mapPurchaseData);
        for (const purchase of purchases) {
            purchase.items = await getPurchaseItems(purchase.id); // Make sure getPurchaseItems exists
        }
        return purchases;
    } catch (error) {
        console.error("Error fetching purchases:", error);
        throw error;
    }
}

export async function getPurchaseById(id: string): Promise<PurchaseTransaction | undefined> {
    if (!db) { console.error("DB not available in getPurchaseById"); return undefined; }
    try {
        const results = await (await db).select("SELECT * FROM PurchaseTransactions WHERE id = ?", [id]);
        if (results && results.length > 0) {
            const purchase = mapPurchaseData(results[0]);
            purchase.items = await getPurchaseItems(purchase.id); // Fetch items
            return purchase;
        }
        return undefined;
    } catch (error) {
        console.error(`Error fetching purchase by id ${id}:`, error);
        throw error;
    }
}

export async function addPurchase(purchaseData: Omit<PurchaseTransaction, 'id' | 'totalAmount' | 'paymentStatus'>): Promise<PurchaseTransaction> {
    if (!db) { throw new Error("DB not available in addPurchase"); }
    const newPurchaseId = `pur-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`;

    // Determine target warehouse for the purchase
    const targetWarehouseId = purchaseData.destinationWarehouseId || await getDefaultWarehouseId(); // Use destination or default
    if (!targetWarehouseId) {
        throw new Error("لا يوجد مخزن افتراضي أو محدد لاستلام المشتريات.");
    }

    // Calculate total amount numerically
    const totalAmountNum = purchaseData.items.reduce((sum, item) => {
        const quantityNum = parseFloatFromDB(item.quantity);
        const costNum = parseFloatFromDB(item.cost);
        return sum + quantityNum * costNum;
    }, 0);
    const amountPaidNum = parseFloatFromDB(purchaseData.amountPaid, 0);

    let paymentStatus: PaymentStatus = 'unpaid';
    if (totalAmountNum > 0 && amountPaidNum >= totalAmountNum) {
        paymentStatus = 'paid';
    } else if (amountPaidNum > 0) {
        paymentStatus = 'partial';
    }

    // Determine the target Treasury for the payment
     const defaultTreasuryId = await getDefaultTreasuryId(); // Assume this function exists or create it
     const targetTreasuryId = purchaseData.paymentTreasuryId || defaultTreasuryId; // Allow specifying payment source

    // Start transaction... (Conceptual)
     console.log("Starting addPurchase transaction...");
   try {
         console.log("Inserting Purchase Transaction:", newPurchaseId);
        const purchaseQuery = `
           INSERT INTO PurchaseTransactions (
               id, supplierId, totalAmount, paymentStatus, amountPaid, date, invoiceNumber, destinationWarehouseId, paymentTreasuryId
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       `;
        const purchaseParams = [
           newPurchaseId,
           purchaseData.supplierId,
           formatNumberForDB(totalAmountNum), // Format total amount as string
           paymentStatus,
           formatNumberForDB(amountPaidNum), // Format amount paid as string
           formatDateTimeForDB(purchaseData.date), // Use DATETIME format
           purchaseData.invoiceNumber,
           targetWarehouseId, // Store destination warehouse
           targetTreasuryId, // Store payment treasury
       ];
        await (await db).execute(purchaseQuery, purchaseParams);
         console.log("Purchase Transaction inserted.");


         console.log("Processing purchase items...");
        for (const item of purchaseData.items) {
             console.log(`Processing item: Product ID ${item.productId}, Qty: ${item.quantity}, Cost: ${item.cost}, Expiry: ${item.expiryDate}`);
           const itemQuery = `
               INSERT INTO PurchaseTransactionItems (purchaseId, productId, quantity, cost, expiryDate)
               VALUES (?, ?, ?, ?, ?)
           `;
           const formattedExpiry = formatDateForDB(item.expiryDate); // Use DATE format for expiry
           const itemParams = [
               newPurchaseId,
               item.productId,
               formatNumberForDB(item.quantity), // Format number to string
               formatNumberForDB(item.cost), // Format number to string
               formattedExpiry
           ];
            console.log(`Inserting Purchase Item: ${JSON.stringify(itemParams)}`);
           await (await db).execute(itemQuery, itemParams);
            console.log("Purchase Item inserted.");


           // Update product stock, last cost, expiry (Requires parsing)
            console.log(`Updating stock/cost/expiry for product ${item.productId} in warehouse ${targetWarehouseId}`);
             // Find product specifically in the target warehouse
             const productResults = await (await db).select("SELECT * FROM Products WHERE id = ? AND warehouseId = ?", [item.productId, targetWarehouseId]);
             const product = productResults.length > 0 ? mapProductData(productResults[0]) : undefined;

            if (product) {
                const currentStockNum = parseFloatFromDB(product.quantity);
                const quantityAddedNum = parseFloatFromDB(item.quantity);
                const newStockLevelNum = currentStockNum + quantityAddedNum;
                const purchaseCostNum = parseFloatFromDB(item.cost);
                 console.log(`Current Stock: ${currentStockNum}, Qty Added: ${quantityAddedNum}, New Stock: ${newStockLevelNum}, Purchase Cost: ${purchaseCostNum}`);


               // Only update expiry if the new purchase expiry is provided
               let expiryUpdateClause = "";
               let expiryParams = [];
               if (formattedExpiry) {
                    expiryUpdateClause = ", expiryDate = ?";
                    expiryParams.push(formattedExpiry);
                    console.log(`Updating expiry date to: ${formattedExpiry}`);
               } else {
                    console.log("No expiry date provided for this purchase item, product expiry remains unchanged.");
               }


               const stockUpdateQuery = `
                    UPDATE Products
                    SET quantity = ?, lastPurchaseCost = ? ${expiryUpdateClause}
                    WHERE id = ? AND warehouseId = ?
                `;
                const updateParams = [
                    formatNumberForDB(newStockLevelNum), // Format new stock as string
                    formatNumberForDB(purchaseCostNum), // Format cost as string
                    ...expiryParams, // Spread the expiry parameter(s) if any
                    item.productId,
                    targetWarehouseId // Ensure update happens in the correct warehouse
                ];
                console.log(`Executing stock update query with params: ${JSON.stringify(updateParams)}`);
               await (await db).execute(stockUpdateQuery, updateParams);
                console.log("Stock/cost/expiry updated.");
            } else {
                // Product doesn't exist in this warehouse, add it automatically?
                 console.warn(`Product ${item.productId} not found in warehouse ${targetWarehouseId}. Automatically adding...`);
                 // Create a basic product entry in the target warehouse
                 const newProductData: Omit<Product, 'id'> = {
                     nameAr: 'منتج جديد تلقائي', // Placeholder name, consider fetching from another warehouse or requiring manual entry
                     nameEn: 'Auto-added product',
                     price: '0', // Placeholder price
                     lastPurchaseCost: formatNumberForDB(item.cost),
                     quantity: formatNumberForDB(item.quantity)!,
                     unitType: 'وحدة', // Placeholder unit type
                     warehouseId: targetWarehouseId,
                     expiryDate: item.expiryDate, // Pass expiry if available
                 };
                 await addProduct(newProductData); // Add the product
                 console.log(`Product ${item.productId} added to warehouse ${targetWarehouseId}.`);
            }
        }

          // 4. Add Treasury Transaction for the payment made from the correct treasury
          if (amountPaidNum > 0) {
             await addTreasuryTransaction({
                type: 'purchase_payment',
                amount: formatNumberForDB(-amountPaidNum)!, // Pass as string, ensure it's negative
                date: purchaseData.date, // Use the same date as the purchase
                description: `دفعة لمورد ${purchaseData.supplierId} - فاتورة ${newPurchaseId}`,
                relatedDocumentId: newPurchaseId,
                treasuryId: targetTreasuryId, // Associate with the paying treasury
             });
          }

        // Commit transaction... (Conceptual)
         console.log("Committing addPurchase transaction...");


        console.log("Added Purchase (DB):", newPurchaseId);
         // Return data consistent with DB (strings for numbers)
        const finalPurchaseData = await getPurchaseById(newPurchaseId);
         if (!finalPurchaseData) {
            throw new Error("Failed to fetch newly created purchase data.");
         }
         console.log("addPurchase finished successfully.");
        return finalPurchaseData; // Cast needed

   } catch (error) {
       // Rollback transaction... (Conceptual)
       console.error("Error adding purchase transaction:", error);
       console.log("Rolling back addPurchase transaction...");
       throw error;
   }
}

// --- Inventory Report (Linked to Physical Warehouses) ---
export async function getInventoryReportData(warehouseId?: string): Promise<InventoryReportItem[]> {
    if (!db) { console.error("DB not available in getInventoryReportData"); return []; }
    // Fetch warehouses to map names
    const warehouses = await getWarehouses();
    const warehouseMap = new Map(warehouses.map(w => [w.id, w.name]));

    let query = `
        SELECT
            p.id, p.nameAr, p.nameEn, p.barcode, p.quantity, p.price, p.expiryDate, p.unitType, p.lastPurchaseCost, p.warehouseId
        FROM Products p
    `;
    const params: any[] = [];
    if (warehouseId) {
        query += " WHERE p.warehouseId = ?";
        params.push(warehouseId);
    }

    try {
        const results = await (await db).select(query, params);
        return (results as any[]).map(item => {
            const quantityNum = parseFloatFromDB(item.quantity);
            const costNum = parseFloatFromDB(item.lastPurchaseCost, 0);
            const inventoryValue = quantityNum * costNum;

            return {
                ...item, // Keep original data
                expiryDate: parseDateFromDB(item.expiryDate),
                inventoryValue: inventoryValue,
                warehouseName: item.warehouseId ? warehouseMap.get(item.warehouseId) || item.warehouseId : 'غير محدد', // Add warehouse name
            };
        }) as InventoryReportItem[];
    } catch (error) {
        console.error("Error fetching inventory report data:", error);
        throw error;
    }
}


// --- Supplier Data Operations ---
export async function getSuppliers(): Promise<Supplier[]> {
    if (!db) { console.error("DB not available in getSuppliers"); return []; }
    try {
        const results = await (await db).select("SELECT * FROM Suppliers", []);
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
        await (await db).execute(query, params);
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
    const currentSupplierResult = await (await db).select("SELECT * FROM Suppliers WHERE id = ?", [id]);
    if (!currentSupplierResult || currentSupplierResult.length === 0) return null;
    const currentSupplier = currentSupplierResult[0];

    const { id: _, ...safeUpdates } = updates;

     if (Object.keys(safeUpdates).length === 0) return currentSupplier;

    const setClause = Object.keys(safeUpdates).map(key => `${key} = ?`).join(', ');
    const params = [...Object.values(safeUpdates), id];

    const query = `UPDATE Suppliers SET ${setClause} WHERE id = ?`;

    try {
        await (await db).execute(query, params);
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
    const purchasesCheck = await (await db).select("SELECT 1 FROM PurchaseTransactions WHERE supplierId = ? LIMIT 1", [id]);
    if (purchasesCheck && purchasesCheck.length > 0) {
        throw new Error(`لا يمكن حذف المورد لأنه مرتبط بفواتير شراء.`);
    }

    const query = "DELETE FROM Suppliers WHERE id = ?";
    try {
        const result = await (await db).execute(query, [id]);
        console.log(`Attempted deletion of Supplier ${id} (DB)`);
        return result.affectedRows > 0; // Assume success if execute doesn't throw
    } catch (error) {
        console.error(`Error deleting supplier ${id}:`, error);
        throw error; // Re-throw
    }
}

// --- Customer Data Operations ---
export async function getCustomers(): Promise<Customer[]> {
    if (!db) { console.error("DB not available in getCustomers"); return []; }
    try {
        const results = await (await db).select("SELECT * FROM Customers", []);
        return (results as any[]).map(mapCustomerData);
    } catch (error) {
        console.error("Error fetching customers:", error);
        throw error;
    }
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
    if (!db) { console.error("DB not available in getCustomerById"); return undefined; }
    try {
        const results = await (await db).select("SELECT * FROM Customers WHERE id = ?", [id]);
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
        formatNumberForDB(customerData.balance ?? '0'), // Format number to string for DB
        customerData.insuranceCompany,
        customerData.policyNumber,
        formatNumberForDB(customerData.insuranceDiscountRate), // Format number to string for DB
    ];
    try {
        await (await db).execute(query, params);
        const newCustomer = { ...customerData, id: newId, balance: customerData.balance ?? '0' };
        console.log("Added Customer (DB):", newCustomer);
        return newCustomer;
    } catch (error) {
        console.error("Error adding customer:", error);
        throw error;
    }
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    if (!db) { throw new Error("DB not available in updateCustomer"); }
    const currentCustomer = await getCustomerById(id);
    if (!currentCustomer) return null;

    const { id: _, ...safeUpdates } = updates;

    // Prepare updates for the database, formatting numbers as strings
    const dbUpdates: { [key: string]: any } = {};
    const changedUpdates: Partial<Customer> = {}; // Track changes with original types

    for (const key in safeUpdates) {
        const typedKey = key as keyof typeof safeUpdates;
        let dbValue = safeUpdates[typedKey];
        let originalValue = currentCustomer[typedKey];

        if (typedKey === 'balance' || typedKey === 'insuranceDiscountRate') {
            dbValue = formatNumberForDB(safeUpdates[typedKey]);
            originalValue = formatNumberForDB(currentCustomer[typedKey]); // Compare strings
        }

        if (String(dbValue) !== String(originalValue)) { // Compare as strings
            changedUpdates[typedKey] = safeUpdates[typedKey]; // Store original type change
            dbUpdates[typedKey] = dbValue; // Store DB-formatted value
        }
    }


     if (Object.keys(dbUpdates).length === 0) return currentCustomer;

    const setClause = Object.keys(dbUpdates).map(key => `${key} = ?`).join(', ');
    const params = [...Object.values(dbUpdates), id];
    const query = `UPDATE Customers SET ${setClause} WHERE id = ?`;

    try {
        await (await db).execute(query, params);
        const updatedCustomer = { ...currentCustomer, ...changedUpdates };
        console.log("Updated Customer (DB):", updatedCustomer);
        return updatedCustomer;
    } catch (error) {
        console.error(`Error updating customer ${id}:`, error);
        throw error;
    }
}

export async function deleteCustomer(id: string): Promise<boolean> {
    if (!db) { throw new Error("DB not available in deleteCustomer"); }
    const salesCheck = await (await db).select("SELECT 1 FROM SalesTransactions WHERE customerId = ? LIMIT 1", [id]);
    if (salesCheck && salesCheck.length > 0) {
        throw new Error(`لا يمكن حذف العميل لأنه مرتبط بفواتير بيع.`);
    }

    const query = "DELETE FROM Customers WHERE id = ?";
    try {
        const result = await (await db).execute(query, [id]);
        console.log(`Attempted deletion of Customer ${id} (DB)`);
        return result.affectedRows > 0; // Assume success if execute doesn't throw
    } catch (error) {
        console.error(`Error deleting customer ${id}:`, error);
        throw error; // Re-throw
    }
}

// --- Sale Transaction Operations ---
async function getSaleItems(saleId: string): Promise<SaleTransactionItem[]> {
    if (!db) { console.error("DB not available in getSaleItems"); return []; }
    try {
        const results = await (await db).select("SELECT * FROM SaleTransactionItems WHERE saleId = ?", [saleId]);
        return results as SaleTransactionItem[];
    } catch (error) {
        console.error(`Error fetching items for sale ${saleId}:`, error);
        throw error;
    }
}

export async function getSales(): Promise<SaleTransaction[]> {
    if (!db) { console.error("DB not available in getSales"); return []; }
    try {
        const salesResults = await (await db).select("SELECT * FROM SalesTransactions ORDER BY date DESC", []);
        const sales = (salesResults as any[]).map(mapSalesData);
        for (const sale of sales) {
            sale.items = await getSaleItems(sale.id);
        }
        return sales;
    } catch (error) {
        console.error("Error fetching sales:", error);
        throw error;
    }
}

export async function getSaleById(id: string): Promise<SaleTransaction | undefined> {
    if (!db) { console.error("DB not available in getSaleById"); return undefined; }
    try {
        const results = await (await db).select("SELECT * FROM SalesTransactions WHERE id = ?", [id]);
        if (results && results.length > 0) {
            const sale = mapSalesData(results[0]);
            sale.items = await getSaleItems(sale.id);
            return sale;
        }
        return undefined;
    } catch (error) {
        console.error(`Error fetching sale by id ${id}:`, error);
        throw error;
    }
}


export async function addSale(saleData: Omit<SaleTransaction, 'id'>): Promise<SaleTransaction> {
    if (!db) { throw new Error("DB not available in addSale"); }
    const newSaleId = `sale-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`;

    // Determine the source warehouse (e.g., from user session, POS setting, or default)
    const sourceWarehouseId = saleData.saleWarehouseId || await getDefaultWarehouseId(); // Use sale specific or default
    if (!sourceWarehouseId) {
        throw new Error("لا يوجد مخزن محدد لإتمام عملية البيع.");
    }

    // Determine the target Treasury for payment deposit
    const defaultTreasuryId = await getDefaultTreasuryId(); // Assume this function exists
    const targetTreasuryId = saleData.paymentTreasuryId || defaultTreasuryId;

    // Start transaction... (Conceptual)
    console.log("Starting addSale transaction...");
    try {
        // 1. Insert Sale Transaction
        console.log("Inserting Sale Transaction:", newSaleId);
        const saleQuery = `
            INSERT INTO SalesTransactions (
                id, customerId, totalAmount, originalTotalAmount, subTotalAmount,
                paymentMethod, amountPaid, date, appliedInsuranceDiscountRate,
                saleWarehouseId, paymentTreasuryId
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const saleParams = [
            newSaleId,
            saleData.customerId,
            formatNumberForDB(saleData.totalAmount),
            formatNumberForDB(saleData.originalTotalAmount),
            formatNumberForDB(saleData.subTotalAmount),
            saleData.paymentMethod,
            formatNumberForDB(saleData.amountPaid),
            formatDateTimeForDB(saleData.date), // Use DATETIME format
            formatNumberForDB(saleData.appliedInsuranceDiscountRate),
            sourceWarehouseId, // Store source warehouse
            targetTreasuryId, // Store payment treasury
        ];
        await (await db).execute(saleQuery, saleParams);
        console.log("Sale Transaction inserted.");


        // 2. Insert Items and Update Stock (from specific warehouse)
        console.log("Processing sale items...");
        for (const item of saleData.items) {
             console.log(`Processing item: Product ID ${item.productId}, Qty: ${item.quantity} from Warehouse ${sourceWarehouseId}`);
             // Fetch product details (including cost) from the correct warehouse
             const productResults = await (await db).select("SELECT * FROM Products WHERE id = ? AND warehouseId = ?", [item.productId, sourceWarehouseId]);
             const product = productResults.length > 0 ? mapProductData(productResults[0]) : undefined;

             if (!product) {
                 throw new Error(`المنتج ${item.productId} غير موجود في المخزن ${sourceWarehouseId}`);
             }

             let costAtSale = item.costAtSale;
             if (costAtSale === undefined && product.lastPurchaseCost) {
                 const lastPurchaseCostNum = parseFloatFromDB(product.lastPurchaseCost);
                 const costNum = item.soldUnitType === 'sub' && product.subUnitsPerUnit
                     ? lastPurchaseCostNum / product.subUnitsPerUnit
                     : lastPurchaseCostNum;
                 costAtSale = formatNumberForDB(costNum);
             }

            const itemQuery = `
                INSERT INTO SaleTransactionItems (saleId, productId, quantity, price, soldUnitType, costAtSale, warehouseId)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            const itemParams = [
                newSaleId,
                item.productId,
                formatNumberForDB(item.quantity), // Format number to string
                formatNumberForDB(item.price), // Format number to string
                item.soldUnitType,
                costAtSale, // Already string | undefined | null
                sourceWarehouseId, // Store the warehouse the item came from
            ];
             console.log(`Inserting Sale Item: ${JSON.stringify(itemParams)}`);
            await (await db).execute(itemQuery, itemParams);
             console.log("Sale Item inserted.");

            // Update stock in the specific warehouse
            console.log(`Updating stock for product ${item.productId} in warehouse ${sourceWarehouseId}`);
            const currentStockNum = parseFloatFromDB(product.quantity);
            const quantitySoldNum = parseFloatFromDB(item.quantity);
            let quantityToDeduct = quantitySoldNum;

            if (item.soldUnitType === 'sub' && product.subUnitsPerUnit && product.subUnitsPerUnit > 0) {
                quantityToDeduct = quantitySoldNum / product.subUnitsPerUnit;
            }
             console.log(`Current Stock: ${currentStockNum}, Sold Qty (Main Units): ${quantityToDeduct}`);

             if (currentStockNum < quantityToDeduct) {
                  console.error(`Insufficient stock for product ${item.productId} in warehouse ${sourceWarehouseId}. Available: ${currentStockNum}, Needed: ${quantityToDeduct}`);
                 throw new Error(`لا توجد كمية كافية للمنتج ${product.nameAr} في المخزن المحدد. المتوفر: ${currentStockNum}, المطلوب: ${quantityToDeduct}`);
             }

             const newStockLevel = currentStockNum - quantityToDeduct;
              console.log(`New Stock Level: ${newStockLevel}`);
             const stockUpdateQuery = "UPDATE Products SET quantity = ? WHERE id = ? AND warehouseId = ?";
             await (await db).execute(stockUpdateQuery, [formatNumberForDB(newStockLevel), item.productId, sourceWarehouseId]);
              console.log("Stock updated.");
        }
         console.log("Sale items processed.");

        // 3. Update Customer Balance
        if (saleData.customerId) {
            console.log(`Updating balance for customer ${saleData.customerId}`);
            const customer = await getCustomerById(saleData.customerId);
            if (customer && customer.balance !== undefined) {
                 const currentBalanceNum = parseFloatFromDB(customer.balance);
                 const amountDueNum = parseFloatFromDB(saleData.totalAmount);
                 const paidNum = parseFloatFromDB(saleData.amountPaid);
                 let balanceChangeNum = 0;

                 if (saleData.paymentMethod === 'debt') {
                     balanceChangeNum = -(amountDueNum - paidNum); // Debt increases negative balance
                 }
                 console.log(`Current Balance: ${currentBalanceNum}, Amount Due: ${amountDueNum}, Paid: ${paidNum}, Balance Change: ${balanceChangeNum}`);

                 if (balanceChangeNum !== 0) {
                     const newBalanceNum = currentBalanceNum + balanceChangeNum;
                      console.log(`New Balance: ${newBalanceNum}`);
                     const balanceUpdateQuery = "UPDATE Customers SET balance = ? WHERE id = ?";
                     await (await db).execute(balanceUpdateQuery, [formatNumberForDB(newBalanceNum), saleData.customerId]);
                      console.log("Customer balance updated.");
                 }
            } else {
                 console.warn(`Customer ${saleData.customerId} not found or balance is undefined.`);
            }
        }

         // 4. Add Treasury Transaction for the payment received into the target treasury
         if (parseFloatFromDB(saleData.amountPaid) > 0) {
             await addTreasuryTransaction({
                 type: 'sale_payment',
                 amount: formatNumberForDB(saleData.amountPaid)!, // Pass as string, ensure it's positive
                 date: saleData.date, // Use the same date as the sale
                 description: `دفعة من فاتورة بيع ${newSaleId}`,
                 relatedDocumentId: newSaleId,
                 treasuryId: targetTreasuryId, // Link to the receiving treasury
             });
         }

        // Commit transaction here... (Conceptual)
        console.log("Committing addSale transaction...");

        console.log("Added Sale (DB):", newSaleId);
        // Fetch the complete data again to return consistent mapped types
        const finalSaleData = await getSaleById(newSaleId); // Fetch the newly created sale
        if (!finalSaleData) {
           throw new Error("Failed to fetch newly created sale data.");
        }
         console.log("addSale finished successfully.");
        return finalSaleData;

    } catch (error) {
        // Rollback transaction here... (Conceptual)
        console.error("Error adding sale transaction:", error);
        console.log("Rolling back addSale transaction...");
        throw error;
    }
}


export async function deleteSale(saleId: string): Promise<boolean> {
    if (!db) { throw new Error("DB not available in deleteSale"); }

    // Start transaction... (Conceptual)
    console.log(`Starting deleteSale transaction for ID: ${saleId}`);
    try {
        // 1. Get the sale details first to reverse effects
        console.log("Fetching sale details...");
        const sale = await getSaleById(saleId);
        if (!sale) {
            throw new Error(`Sale with ID ${saleId} not found.`);
        }
         console.log("Sale details fetched.");

        // 2. Reverse stock updates for each item using the warehouse recorded on the item
        console.log("Reversing stock updates...");
        for (const item of sale.items) {
             const itemWarehouseId = item.warehouseId || sale.saleWarehouseId || await getDefaultWarehouseId(); // Determine warehouse from item, sale, or default
              if (!itemWarehouseId) {
                 console.error(`Could not determine warehouse for item ${item.productId} in sale ${saleId}. Skipping stock reversal for this item.`);
                 continue; // Skip if warehouse cannot be determined
             }
             console.log(`Reversing stock for product: ${item.productId}, Qty: ${item.quantity} in Warehouse ${itemWarehouseId}`);
             const productResults = await (await db).select("SELECT * FROM Products WHERE id = ? AND warehouseId = ?", [item.productId, itemWarehouseId]);
             const product = productResults.length > 0 ? mapProductData(productResults[0]) : undefined;

            if (product) {
                const currentStockNum = parseFloatFromDB(product.quantity);
                const quantitySoldNum = parseFloatFromDB(item.quantity);
                let quantityToAddBack = quantitySoldNum;

                if (item.soldUnitType === 'sub' && product.subUnitsPerUnit && product.subUnitsPerUnit > 0) {
                    quantityToAddBack = quantitySoldNum / product.subUnitsPerUnit;
                }
                 console.log(`Current Stock: ${currentStockNum}, Quantity to Add Back: ${quantityToAddBack}`);

                const newStockLevel = currentStockNum + quantityToAddBack;
                 console.log(`New Stock Level after reversal: ${newStockLevel}`);
                const stockUpdateQuery = "UPDATE Products SET quantity = ? WHERE id = ? AND warehouseId = ?";
                await (await db).execute(stockUpdateQuery, [formatNumberForDB(newStockLevel), item.productId, itemWarehouseId]);
                 console.log("Stock reversal complete for item.");
            } else {
                 // Product might have been moved or deleted since the sale
                console.warn(`Product with ID ${item.productId} not found in warehouse ${itemWarehouseId} during sale deletion stock adjustment.`);
            }
        }
         console.log("Stock updates reversed.");

        // 3. Reverse customer balance update
        if (sale.customerId) {
             console.log(`Reversing balance for customer ${sale.customerId}`);
            const customer = await getCustomerById(sale.customerId);
            if (customer && customer.balance !== undefined) {
                const currentBalanceNum = parseFloatFromDB(customer.balance);
                const amountDueNum = parseFloatFromDB(sale.totalAmount);
                const paidNum = parseFloatFromDB(sale.amountPaid);
                let balanceChangeToReverseNum = 0;

                if (sale.paymentMethod === 'debt') {
                    balanceChangeToReverseNum = -(amountDueNum - paidNum);
                }
                 console.log(`Current Balance: ${currentBalanceNum}, Change to Reverse: ${balanceChangeToReverseNum}`);

                if (balanceChangeToReverseNum !== 0) {
                    const originalBalanceNum = currentBalanceNum - balanceChangeToReverseNum;
                     console.log(`Original Balance (estimated): ${originalBalanceNum}`);
                    const balanceUpdateQuery = "UPDATE Customers SET balance = ? WHERE id = ?";
                    await (await db).execute(balanceUpdateQuery, [formatNumberForDB(originalBalanceNum), sale.customerId]);
                     console.log("Customer balance reversal complete.");
                }
            } else {
                 console.warn(`Customer ${sale.customerId} not found or balance undefined during reversal.`);
            }
        }

         // 4. Reverse Treasury Transaction (add a negative transaction in the original treasury)
         const paymentTreasuryId = sale.paymentTreasuryId || await getDefaultTreasuryId(); // Determine original treasury
         if (parseFloatFromDB(sale.amountPaid) > 0) {
             await addTreasuryTransaction({
                 type: 'sale_payment_reversal', // Specific type for reversal
                 amount: formatNumberForDB(-parseFloatFromDB(sale.amountPaid))!, // Negative amount to reverse income, as string
                 date: new Date(), // Date of reversal
                 description: `عكس دفعة فاتورة بيع محذوفة ${saleId}`,
                 relatedDocumentId: saleId,
                 treasuryId: paymentTreasuryId, // Link to the original treasury
             });
         }


        // 5. Delete sale items
        console.log("Deleting sale items...");
        await (await db).execute("DELETE FROM SaleTransactionItems WHERE saleId = ?", [saleId]);
         console.log("Sale items deleted.");

        // 6. Delete sale transaction itself
        console.log("Deleting sale transaction...");
        const result = await (await db).execute("DELETE FROM SalesTransactions WHERE id = ?", [saleId]);
         console.log("Sale transaction deleted.");


        // Commit transaction... (Conceptual)
        console.log("Committing deleteSale transaction...");
        console.log(`Deleted Sale ${saleId} and reversed effects (DB)`);
        return result.affectedRows > 0;

    } catch (error) {
        // Rollback transaction... (Conceptual)
        console.error(`Error deleting sale ${saleId}:`, error);
        console.log("Rolling back deleteSale transaction...");
        throw error;
    }
}


export async function deletePurchase(purchaseId: string): Promise<boolean> {
    if (!db) { throw new Error("DB not available in deletePurchase"); }

    // Start transaction... (Conceptual)
     console.log(`Starting deletePurchase transaction for ID: ${purchaseId}`);
    try {
        // 1. Get the purchase details first to reverse effects
         console.log("Fetching purchase details...");
        const purchase = await getPurchaseById(purchaseId);
        if (!purchase) {
            throw new Error(`Purchase with ID ${purchaseId} not found.`);
        }
         console.log("Purchase details fetched.");

         // Determine the target warehouse from the purchase record or default
         const targetWarehouseId = purchase.destinationWarehouseId || await getDefaultWarehouseId();
         if (!targetWarehouseId) {
             throw new Error("Could not determine warehouse to reverse stock from.");
         }
         // Determine the payment treasury from the purchase record or default
         const paymentTreasuryId = purchase.paymentTreasuryId || await getDefaultTreasuryId();


        // 2. Reverse stock updates for each item (in the correct warehouse)
         console.log("Reversing stock updates...");
        for (const item of purchase.items) {
             console.log(`Reversing stock for product: ${item.productId}, Qty: ${item.quantity} in Warehouse ${targetWarehouseId}`);
            const productResults = await (await db).select("SELECT * FROM Products WHERE id = ? AND warehouseId = ?", [item.productId, targetWarehouseId]);
            const product = productResults.length > 0 ? mapProductData(productResults[0]) : undefined;

            if (product) {
                const currentStockNum = parseFloatFromDB(product.quantity);
                const quantityPurchasedNum = parseFloatFromDB(item.quantity);
                const newStockLevel = currentStockNum - quantityPurchasedNum; // Subtract purchased quantity
                 console.log(`Current Stock: ${currentStockNum}, Qty Purchased: ${quantityPurchasedNum}`);

                 const finalNewStock = Math.max(0, newStockLevel); // Prevent negative stock
                  console.log(`New Stock Level after reversal: ${finalNewStock}`);

                const stockUpdateQuery = "UPDATE Products SET quantity = ? WHERE id = ? AND warehouseId = ?";
                await (await db).execute(stockUpdateQuery, [formatNumberForDB(finalNewStock), item.productId, targetWarehouseId]);
                 console.log("Stock reversal complete for item.");
            } else {
                console.warn(`Product with ID ${item.productId} not found in warehouse ${targetWarehouseId} during purchase deletion stock adjustment.`);
            }
        }
         console.log("Stock updates reversed.");


         // 3. Reverse Treasury Transaction (add a positive transaction if payment was made, in the correct treasury)
         const amountPaidNum = parseFloatFromDB(purchase.amountPaid);
         if (amountPaidNum > 0) {
            await addTreasuryTransaction({
               type: 'purchase_payment_reversal', // Specific type for reversal
               amount: formatNumberForDB(amountPaidNum)!, // Positive amount to reverse outflow, as string
               date: new Date(), // Date of reversal
               description: `عكس دفعة فاتورة شراء محذوفة ${purchaseId}`,
               relatedDocumentId: purchaseId,
               treasuryId: paymentTreasuryId, // Link to the original payment treasury
            });
         }

        // 4. Delete purchase items
         console.log("Deleting purchase items...");
        await (await db).execute("DELETE FROM PurchaseTransactionItems WHERE purchaseId = ?", [purchaseId]);
         console.log("Purchase items deleted.");


        // 5. Delete purchase transaction itself
         console.log("Deleting purchase transaction...");
        const result = await (await db).execute("DELETE FROM PurchaseTransactions WHERE id = ?", [purchaseId]);
         console.log("Purchase transaction deleted.");


        // Commit transaction... (Conceptual)
         console.log("Committing deletePurchase transaction...");
        console.log(`Deleted Purchase ${purchaseId} and attempted to reverse stock (DB)`);
        return result.affectedRows > 0;

    } catch (error) {
        // Rollback transaction... (Conceptual)
        console.error(`Error deleting purchase ${purchaseId}:`, error);
        console.log("Rolling back deletePurchase transaction...");
        throw error;
    }
}


// --- User Operations ---
export async function getUsers(): Promise<User[]> {
    if (!db) { console.error("DB not available in getUsers"); return []; }
    try {
        // Select passwordHash as well to display it in the table
        const results = await (await db).select("SELECT id, name, email, role, passwordHash FROM Users", []);
        return results as User[];
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
}


export async function getUserForLogin(email: string): Promise<User | undefined> {
    if (!db) { console.error("DB not available in getUserForLogin"); return undefined; }
    try {
         // Fetch user including password hash for verification if needed
        const results = await (await db).select("SELECT id, name, email, role, passwordHash FROM Users WHERE email = ?", [email]);
        if (results && results.length > 0) {
            return results[0] as User;
        }
        return undefined;
    } catch (error) {
        console.error(`Error fetching user by email ${email}:`, error);
        throw error;
    }
}


export async function addUser(userData: Omit<User, 'id' | 'passwordHash'> & { password?: string }): Promise<User> {
    if (!db) { throw new Error("DB not available in addUser"); }
    const newId = `user-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`;

    // --- Placeholder for Password Hashing ---
    // In a real app, replace this with a secure hashing library (e.g., bcrypt, argon2)
    // DO NOT store plain text passwords!
    let passwordHash = null;
    if (userData.password) {
        console.warn("Password hashing is not implemented! Storing plain text password (unsafe).");
        passwordHash = userData.password; // Replace with: await hashPassword(userData.password);
    } else {
         throw new Error("Password is required when adding a new user.");
    }
    // ----------------------------------------

    const query = `
        INSERT INTO Users (id, name, email, role, passwordHash)
        VALUES (?, ?, ?, ?, ?)
    `;
    const params = [newId, userData.name, userData.email, userData.role, passwordHash];
    try {
        await (await db).execute(query, params);
        // Exclude password and passwordHash from the returned object
        const { password, ...newUser } = { ...userData, id: newId };
        console.log("Added User (DB):", newUser);
        return newUser as User; // Cast to User (without passwordHash)
    } catch (error) {
        console.error("Error adding user:", error);
        throw error;
    }
}

export async function updateUser(id: string, updates: Partial<User> & { password?: string }): Promise<User | null> {
    if (!db) { throw new Error("DB not available in updateUser"); }
    const currentUserResult = await (await db).select("SELECT id, name, email, role, passwordHash FROM Users WHERE id = ?", [id]);
    if (!currentUserResult || currentUserResult.length === 0) return null;
    const currentUser = currentUserResult[0] as User;


    const { id: _, password, ...safeUpdates } = updates; // Exclude ID and password from basic updates

    const updateFields: { [key: string]: any } = { ...safeUpdates };

    // Handle password update separately if provided
    if (password) {
        console.warn("Password hashing is not implemented! Storing plain text password (unsafe).");
        updateFields.passwordHash = password; // Replace with: await hashPassword(password);
    }


    if (Object.keys(updateFields).length === 0) return currentUser;

    const setClause = Object.keys(updateFields).map(key => `${key} = ?`).join(', ');
    const params = [...Object.values(updateFields), id];
    const query = `UPDATE Users SET ${setClause} WHERE id = ?`;

    try {
        await (await db).execute(query, params);
        // Return the updated user *including* the hash for consistency if it was updated
        const updatedUser = { ...currentUser, ...updateFields };
        console.log("Updated User (DB):", updatedUser);
        return updatedUser as User;
    } catch (error) {
        console.error(`Error updating user ${id}:`, error);
        throw error;
    }
}

export async function deleteUser(id: string): Promise<boolean> {
    if (!db) { throw new Error("DB not available in deleteUser"); }
    // Add Dependency Check if needed (e.g., check if user created sales)

    const query = "DELETE FROM Users WHERE id = ?";
    try {
        const result = await (await db).execute(query, [id]);
        console.log(`Attempted deletion of User ${id} (DB)`);
        return result.affectedRows > 0; // Assume success if execute doesn't throw
    } catch (error) {
        console.error(`Error deleting user ${id}:`, error);
        throw error; // Re-throw
    }
}

// --- Treasury Operations (Financial Accounts) ---

// Get all treasuries
export async function getTreasuries(): Promise<Treasury[]> {
    if (!db) { console.error("DB not available in getTreasuries"); return []; }
    try {
        const results = await (await db).select("SELECT * FROM Treasuries", []);
        return (results as any[]).map(mapTreasuryData);
    } catch (error) {
        console.error("Error fetching treasuries:", error);
        throw error;
    }
}

// Add a new treasury
export async function addTreasury(treasuryData: Omit<Treasury, 'id'>): Promise<Treasury> {
    if (!db) { throw new Error("DB not available in addTreasury"); }
    const newId = `trs-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`;

    if (treasuryData.isDefault) {
        await (await db).execute("UPDATE Treasuries SET isDefault = 0 WHERE isDefault = 1", []);
    }

    const query = `
        INSERT INTO Treasuries (id, name, description, isDefault)
        VALUES (?, ?, ?, ?)
    `;
    const params = [
        newId,
        treasuryData.name,
        treasuryData.description,
        treasuryData.isDefault ? 1 : 0,
    ];
    try {
        await (await db).execute(query, params);
        const newTreasury = { ...treasuryData, id: newId };
        console.log("Added Treasury (DB):", newTreasury);
        return newTreasury;
    } catch (error) {
        console.error("Error adding treasury:", error);
        throw error;
    }
}

// Update a treasury
export async function updateTreasury(id: string, updates: Partial<Omit<Treasury, 'id'>>): Promise<Treasury | null> {
    if (!db) { throw new Error("DB not available in updateTreasury"); }
    const currentTreasuryResult = await (await db).select("SELECT * FROM Treasuries WHERE id = ?", [id]);
    if (!currentTreasuryResult || currentTreasuryResult.length === 0) return null;
    const currentTreasury = currentTreasuryResult[0];

    if (updates.isDefault === true && !parseBooleanFromDB(currentTreasury.isDefault)) {
        await (await db).execute("UPDATE Treasuries SET isDefault = 0 WHERE isDefault = 1", []);
    }

    const updateKeys = Object.keys(updates) as (keyof typeof updates)[];
    let setClause = [];
    let params = [];

    for (const key of updateKeys) {
        let newValue = updates[key];
        let originalValue = currentTreasury[key];
        let dbValue = newValue;

        if (key === 'isDefault') {
            dbValue = newValue ? 1 : 0;
            originalValue = parseBooleanFromDB(originalValue) ? 1 : 0;
        }

        if (dbValue !== originalValue) {
            setClause.push(`${key} = ?`);
            params.push(dbValue);
        }
    }

    if (setClause.length === 0) return mapTreasuryData(currentTreasury);

    const query = `UPDATE Treasuries SET ${setClause.join(', ')} WHERE id = ?`;
    params.push(id);

    try {
        await (await db).execute(query, params);
        const updatedTreasury = { ...mapTreasuryData(currentTreasury), ...updates };
        console.log("Updated Treasury (DB):", updatedTreasury);
        return updatedTreasury;
    } catch (error) {
        console.error(`Error updating treasury ${id}:`, error);
        throw error;
    }
}

// Delete a treasury (ensure it has no transactions)
export async function deleteTreasury(id: string): Promise<boolean> {
    if (!db) { throw new Error("DB not available in deleteTreasury"); }
    // Dependency Check
    const transactionCheck = await (await db).select("SELECT 1 FROM TreasuryTransactions WHERE treasuryId = ? LIMIT 1", [id]);
    if (transactionCheck && transactionCheck.length > 0) {
        throw new Error(`لا يمكن حذف الخزنة لأنها تحتوي على حركات مالية.`);
    }
    const treasuryResult = await (await db).select("SELECT isDefault FROM Treasuries WHERE id = ?", [id]);
    const treasury = treasuryResult?.[0];
     if (treasury && parseBooleanFromDB(treasury.isDefault)) {
         throw new Error(`لا يمكن حذف الخزنة الافتراضية.`);
     }


    const query = "DELETE FROM Treasuries WHERE id = ?";
    try {
        const result = await (await db).execute(query, [id]);
        console.log(`Attempted deletion of Treasury ${id} (DB)`);
        return result.affectedRows > 0;
    } catch (error) {
        console.error(`Error deleting treasury ${id}:`, error);
        throw error;
    }
}

// Get default treasury ID
export async function getDefaultTreasuryId(): Promise<string | undefined> {
    if (!db) { console.error("DB not available in getDefaultTreasuryId"); return undefined; }
    try {
        const results = await (await db).select("SELECT id FROM Treasuries WHERE isDefault = 1 LIMIT 1", []);
        if (results && results.length > 0) {
            return results[0].id as string;
        }
        // Fallback: If no default, return the first treasury found
        const firstTreasury = await (await db).select("SELECT id FROM Treasuries LIMIT 1", []);
        if (firstTreasury && firstTreasury.length > 0) {
            console.warn("No default treasury set, using the first available treasury.");
            return firstTreasury[0].id as string;
        }
        return undefined; // No treasuries exist
    } catch (error) {
        console.error("Error fetching default treasury ID:", error);
        throw error;
    }
}


// --- Treasury Transaction Operations (Linked to Financial Treasuries) ---

export async function getTreasuryTransactions(filters?: { startDate?: Date, endDate?: Date, type?: TreasuryTransactionType, treasuryId?: string }): Promise<TreasuryTransaction[]> {
    if (!db) {
        console.error("DB not available in getTreasuryTransactions");
        return [];
    }
    try {
        let query = "SELECT * FROM TreasuryTransactions";
        const params: any[] = [];
        const conditions: string[] = [];

        if (filters?.startDate) {
            conditions.push("date >= ?");
            params.push(formatDateTimeForDB(filters.startDate));
        }
        if (filters?.endDate) {
            conditions.push("date <= ?");
            params.push(formatDateTimeForDB(endOfDay(filters.endDate))); // Ensure end of day
        }
        if (filters?.type) {
            conditions.push("type = ?");
            params.push(filters.type);
        }
        // Filter specifically for transactions *without* a treasury ID if 'general' is selected,
        // or filter by the specific treasury ID otherwise.
        if (filters?.treasuryId === undefined) { // 'general' treasury selected (no specific ID)
             conditions.push("treasuryId IS NULL");
        } else if (filters?.treasuryId) { // Specific treasury selected
            conditions.push("treasuryId = ?");
            params.push(filters.treasuryId);
        }


        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY date DESC"; // Order by most recent first

        const results = await (await db).select(query, params);
        return (results as any[]).map(mapTreasuryTransactionData); // Use correct mapper
    } catch (error) {
        console.error("Error fetching treasury transactions:", error);
        throw error;
    }
}

export async function getTreasuryBalance(): Promise<number> {
    if (!db) {
        console.error("DB not available in getTreasuryBalance");
        return 0;
    }
    try {
        // استخدم DOUBLE بدل REAL لحل مشكلة MariaDB
        const result = await (await db).select(
            "SELECT SUM(CAST(amount AS DOUBLE)) as balance FROM TreasuryTransactions", 
            []
        );

        if (result && result.length > 0 && result[0] && result[0].balance !== null) {
            return parseFloatFromDB(result[0].balance);
        }
        return 0;
    } catch (error) {
        console.error("Error calculating treasury balance:", error);
        throw error;
    }
}


export async function addTreasuryTransaction(
    txData: Omit<TreasuryTransaction, 'id' | 'date'> & { date?: Date } // Make date optional for auto-generation
): Promise<TreasuryTransaction> {
    if (!db) { throw new Error("DB not available in addTreasuryTransaction"); }
    const newId = `trx-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`;
    const transactionDate = txData.date || new Date(); // Use provided date or now

    // Ensure amount is formatted correctly (negative for withdrawal/outflow)
    let amountNum = parseFloatFromDB(txData.amount); // Parse incoming amount (should be string)
    if (['withdrawal', 'purchase_payment', 'expense', 'transfer_out', 'sale_payment_reversal'].includes(txData.type) && amountNum > 0) {
       console.warn(`Automatically negating positive amount for outflow transaction type: ${txData.type}`);
       amountNum = -amountNum;
    }
     if (['deposit', 'sale_payment', 'transfer_in', 'purchase_payment_reversal', 'opening_balance'].includes(txData.type) && amountNum < 0) {
       console.warn(`Automatically making negative amount positive for inflow transaction type: ${txData.type}`);
       amountNum = Math.abs(amountNum);
     }


    const query = `
        INSERT INTO TreasuryTransactions (
            id, type, amount, date, description, userId, relatedDocumentId, treasuryId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        newId,
        txData.type,
        formatNumberForDB(amountNum), // Store amount as string
        formatDateTimeForDB(transactionDate), // Use DATETIME format
        txData.description,
        txData.userId,
        txData.relatedDocumentId,
        txData.treasuryId, // Add treasuryId here
    ];
    try {
        await (await db).execute(query, params);
        const newTransaction: TreasuryTransaction = {
            ...txData,
            id: newId,
            date: transactionDate,
            amount: formatNumberForDB(amountNum)!, // Ensure amount is string in return object
        };
        console.log("Added Treasury Transaction (DB):", newTransaction);
        return newTransaction;
    } catch (error) {
        console.error("Error adding treasury transaction:", error);
        throw error;
    }
}


// --- Helper Functions ---
export async function getProductNameById(id: string): Promise<string> {
    // This might need adjustment if the same product ID exists in multiple warehouses
    const product = await getProductById(id); // Fetches first matching product ID
    return product ? product.nameAr : `منتج غير معروف (${id.substring(0,6)})`;
}

export function calculateDaysUntilExpiry(expiryDate?: Date | string): number {
    if (!expiryDate) return Infinity;
    try {
        const expiry = startOfDay(new Date(expiryDate));
        if (isNaN(expiry.getTime())) {
            console.warn(`Invalid expiry date encountered: ${expiryDate}`);
            return Infinity;
        }
        const today = startOfDay(new Date());
        return differenceInDays(expiry, today);
    } catch (e) {
        console.error(`Error calculating expiry for ${expiryDate}:`, e);
        return Infinity;
    }
}

// --- Reporting Functions (Link to Physical Warehouses) ---
export async function getProductsNearingExpiry(daysThreshold: number = 60, warehouseId?: string): Promise<ProductExpiryInfo[]> {
    if (!db) { console.error("DB not available in getProductsNearingExpiry"); return []; }
    const today = new Date();
    const thresholdDate = addDays(today, daysThreshold);
    const todayStr = formatDateForDB(today); // Format for query
    const thresholdDateStr = formatDateForDB(thresholdDate); // Format for query

    if (!todayStr || !thresholdDateStr) {
        console.error("Could not format dates for expiry query.");
        return [];
    }

    let query = `
        SELECT id, nameAr, expiryDate, quantity, warehouseId
        FROM Products
        WHERE expiryDate IS NOT NULL
          AND expiryDate BETWEEN ? AND ?
    `;
    const params: any[] = [todayStr, thresholdDateStr];

    if (warehouseId) {
        query += " AND warehouseId = ?";
        params.push(warehouseId);
    }
    query += " ORDER BY expiryDate ASC";

    try {
        const results = await (await db).select(query, params);
        return (results as any[]).map(p => ({
            id: p.id,
            nameAr: p.nameAr,
            expiryDate: parseDateFromDB(p.expiryDate)!, // Parse date back
            quantity: p.quantity, // Keep as string
            daysUntilExpiry: calculateDaysUntilExpiry(p.expiryDate),
            warehouseId: p.warehouseId, // Include warehouseId
        }));
    } catch (error) {
        console.error("Error fetching nearing expiry products:", error);
        throw error;
    }
}

export async function getExpiredProducts(warehouseId?: string): Promise<ProductExpiryInfo[]> {
    if (!db) { console.error("DB not available in getExpiredProducts"); return []; }
    const todayStr = formatDateForDB(new Date());
     if (!todayStr) {
        console.error("Could not format date for expired products query.");
        return [];
    }
    let query = `
        SELECT id, nameAr, expiryDate, quantity, warehouseId
        FROM Products
        WHERE expiryDate IS NOT NULL AND expiryDate < ?
    `;
    const params: any[] = [todayStr];

    if (warehouseId) {
        query += " AND warehouseId = ?";
        params.push(warehouseId);
    }
     query += " ORDER BY expiryDate ASC";

    try {
        const results = await (await db).select(query, params);
        return (results as any[]).map(p => ({
             id: p.id,
             nameAr: p.nameAr,
             expiryDate: parseDateFromDB(p.expiryDate)!, // Parse date back
             quantity: p.quantity, // Keep as string
             daysUntilExpiry: calculateDaysUntilExpiry(p.expiryDate),
             warehouseId: p.warehouseId, // Include warehouseId
        }));
    } catch (error) {
        console.error("Error fetching expired products:", error);
        throw error;
    }
}

// --- Alternative Products (Check Physical Warehouses) ---
export async function findAlternativeProducts(productId: string, warehouseId?: string): Promise<Product[]> {
    if (!db) { console.error("DB not available in findAlternativeProducts"); return []; }
    try {
        // Get the original product to find its active ingredient
        const originalProduct = await getProductById(productId);
        if (!originalProduct || !originalProduct.activeIngredient) {
            return [];
        }

        // Find alternatives with the same active ingredient, potentially in a specific warehouse
        // Ensure we cast quantity correctly if it's stored as VARCHAR
        let query = `
            SELECT * FROM Products
            WHERE id != ? AND activeIngredient = ? AND CAST(quantity AS REAL) > 0
        `;
        const params: any[] = [productId, originalProduct.activeIngredient];

        if (warehouseId) {
            query += " AND warehouseId = ?";
            params.push(warehouseId);
        }

        const results = await (await db).select(query, params);
        return (results as any[]).map(mapProductData);
    } catch (error) {
        console.error(`Error finding alternatives for product ${productId}:`, error);
        throw error;
    }
}

// Note: The following functions related to Treasury Transactions by Warehouse ID
// have been removed as they are now redundant. Use the updated getTreasuryTransactions,
// getTreasuryBalance, and addTreasuryTransaction functions with the treasuryId filter/parameter.

// Update/Delete for TreasuryTransaction are simplified placeholders and might need adjustments based on requirements.
export async function updateTreasuryTransaction(id: string, updates: Partial<TreasuryTransaction>): Promise<TreasuryTransaction | null> {
    if (!db) { throw new Error("DB not available in updateTreasuryTransaction"); }
    // Fetch requires parsing amount back to number if you need to compare/use it
    const currentTransactionData = (await (await db).select("SELECT * FROM TreasuryTransactions WHERE id = ?", [id]))?.[0];
     if (!currentTransactionData) return null;
     const currentTransaction = mapTreasuryTransactionData(currentTransactionData); // Use correct mapper


    const { id: _, ...safeUpdates } = updates; // Exclude ID from updates

    const dbUpdates: { [key: string]: any } = {};
    const changedUpdates: Partial<TreasuryTransaction> = {}; // Track changes with original types


    for (const key in safeUpdates) {
        const typedKey = key as keyof typeof safeUpdates;
        let newValue = safeUpdates[typedKey];
        let originalValue = currentTransaction[typedKey];
        let dbValue = newValue;

        if (typedKey === 'amount') {
             dbValue = formatNumberForDB(newValue);
             originalValue = formatNumberForDB(originalValue); // Compare strings
        }
        if (typedKey === 'date') {
             dbValue = formatDateTimeForDB(newValue as Date | undefined);
             originalValue = formatDateTimeForDB(originalValue as Date | undefined);
        }
        // Handle treasuryId like any other string field

         // Compare potentially formatted DB values
        if (String(dbValue) !== String(originalValue)) {
            changedUpdates[typedKey] = safeUpdates[typedKey]; // Store original type change
            dbUpdates[typedKey] = dbValue; // Store DB-formatted value
        }
    }


    if (Object.keys(dbUpdates).length === 0) return currentTransaction;


    const setClause = Object.keys(dbUpdates).map(key => `${key} = ?`).join(', ');
    const params = [...Object.values(dbUpdates), id];
    const query = `UPDATE TreasuryTransactions SET ${setClause} WHERE id = ?`;

    try {
        await (await db).execute(query, params);
        const updatedTransaction = { ...currentTransaction, ...changedUpdates };
        console.log("Updated Treasury Transaction (DB):", updatedTransaction);
        return updatedTransaction;
    } catch (error) {
        console.error(`Error updating treasury transaction ${id}:`, error);
        throw error;
    }
}

// --- Delete Treasury Transaction (basic example) ---
export async function deleteTreasuryTransaction(id: string): Promise<boolean> {
    if (!db) { throw new Error("DB not available in deleteTreasuryTransaction"); }

    const query = "DELETE FROM TreasuryTransactions WHERE id = ?";
    try {
        const result = await (await db).execute(query, [id]);
        console.log(`Attempted deletion of Treasury Transaction ${id} (DB)`);
        return result.affectedRows > 0; // Assume success if execute doesn't throw
    } catch (error) {
        console.error(`Error deleting treasury transaction ${id}:`, error);
        throw error; // Re-throw
    }
}