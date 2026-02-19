import type { Product, Supplier, Customer, SaleTransaction, PurchaseTransaction, PurchaseTransactionItem, SaleTransactionItem, User, ProductExpiryInfo, InventoryReportItem, PaymentMethod, PaymentStatus, UserRole, TreasuryTransaction, TreasuryTransactionType, Warehouse, Treasury, DrugCategory, EgyptianDrug, InvoiceLanguage, InvoiceTemplate, InvoiceTranslation, CustomerPreference } from '@/lib/types'; // Added Egyptian drugs and invoice types
import { Pill, Baby, SprayCan, Activity, LucideIcon } from 'lucide-react';
import { differenceInDays, addDays, isBefore, isSameDay, startOfDay, endOfDay, format as formatDate } from 'date-fns'; // Import format from date-fns
import { getDatabase } from '@/lib/db'; // Import potentially initialized database instance
import { withTransaction, Transaction } from './db/transaction';
import { saleRepository } from './repositories/sales';

// --- Helper Functions ---

/**
 * Get database instance with error handling
 * Helper to simplify database access throughout the file
 */
async function getDB() {
    const db = await getDatabase();
    if (!db) {
        throw new Error("Database not available in current environment");
    }
    return db;
}

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
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(date)) {
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

// SELECT queries with DECIMAL columns cast to CHAR for tauri-plugin-sql compatibility
const PRODUCTS_SELECT_FIELDS = `
    id, nameAr, nameEn, manufacturer, concentration, activeIngredient,
    CAST(price AS CHAR) as price,
    CAST(cost AS CHAR) as cost,
    CAST(lastPurchaseCost AS CHAR) as lastPurchaseCost,
    CAST(quantity AS CHAR) as quantity,
    categoryIcon, barcode, unitType, subUnitType, subUnitsPerUnit,
    CAST(discountRate AS CHAR) as discountRate,
    expiryDate, minStockLevel, warehouseId, createdAt, updatedAt, version
`;

const CUSTOMERS_SELECT_FIELDS = `
    id, name, phone, email, address,
    CAST(balance AS CHAR) as balance,
    insuranceCompany, policyNumber,
    CAST(insuranceDiscountRate AS CHAR) as insuranceDiscountRate,
    createdAt, updatedAt
`;

const SUPPLIERS_SELECT_FIELDS = `
    id, name, contactPerson, phone, email, address,
    CAST(balance AS CHAR) as balance,
    createdAt, updatedAt
`;

const WAREHOUSES_SELECT_FIELDS = `id, name, location, isDefault, createdAt, updatedAt`;

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
    paymentMethodType: treasury.paymentMethodType || undefined, // Keep payment method type
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
    const db = await getDB();
    try {
        const results = await db.select(`SELECT ${WAREHOUSES_SELECT_FIELDS} FROM Warehouses`, []);
        return (results as any[]).map(mapWarehouseData);
    } catch (error) {
        console.error("Error fetching warehouses:", error);
        throw error;
    }
}

export async function addWarehouse(warehouseData: Omit<Warehouse, 'id'>): Promise<Warehouse> {
    const db = await getDB();
    const newId = `wh-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`;

    // Ensure only one default warehouse if isDefault is true
    if (warehouseData.isDefault) {
        await db.execute("UPDATE Warehouses SET isDefault = 0 WHERE isDefault = 1", []);
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
        await db.execute(query, params);
        const newWarehouse = { ...warehouseData, id: newId };
        console.log("Added Warehouse (DB):", newWarehouse);
        return newWarehouse;
    } catch (error) {
        console.error("Error adding warehouse:", error);
        throw error;
    }
}

export async function updateWarehouse(id: string, updates: Partial<Omit<Warehouse, 'id'>>): Promise<Warehouse | null> {
    const db = await getDB();
    const currentWarehouseResult = await db.select("SELECT * FROM Warehouses WHERE id = ?", [id]);
    if (!currentWarehouseResult || currentWarehouseResult.length === 0) return null;
    const currentWarehouse = currentWarehouseResult[0];

    // Ensure only one default warehouse if isDefault is being set to true
    if (updates.isDefault === true && !parseBooleanFromDB(currentWarehouse.isDefault)) {
        await db.execute("UPDATE Warehouses SET isDefault = 0 WHERE isDefault = 1", []);
    }

    const updateKeys = Object.keys(updates) as (keyof typeof updates)[];
    let setClause = [];
    let params = [];

    for (const key of updateKeys) {
        let newValue = updates[key];
        let originalValue = currentWarehouse[key];
        let dbValue = newValue;

        if (key === 'isDefault') {
            dbValue = newValue ? 1 : 0 as any;
            originalValue = parseBooleanFromDB(originalValue) ? 1 : 0 as any;
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
        await db.execute(query, params);
        const updatedWarehouse = { ...mapWarehouseData(currentWarehouse), ...updates };
        console.log("Updated Warehouse (DB):", updatedWarehouse);
        return updatedWarehouse;
    } catch (error) {
        console.error(`Error updating warehouse ${id}:`, error);
        throw error;
    }
}

export async function deleteWarehouse(id: string): Promise<boolean> {
    const db = await getDB();
    // Dependency Check: Ensure warehouse is empty before deleting
    const productCheck = await db.select("SELECT 1 FROM Products WHERE warehouseId = ? LIMIT 1", [id]);
    if (productCheck && productCheck.length > 0) {
        throw new Error(`لا يمكن حذف المخزن لأنه يحتوي على منتجات.`);
    }
    // Check if it's default warehouse (prevent deletion?)
    const warehouseResult = await db.select("SELECT isDefault FROM Warehouses WHERE id = ?", [id]);
    const warehouse = warehouseResult?.[0];
    if (warehouse && parseBooleanFromDB(warehouse.isDefault)) {
        throw new Error(`لا يمكن حذف المخزن الافتراضي.`);
    }


    const query = "DELETE FROM Warehouses WHERE id = ?";
    try {
        const result = await db.execute(query, [id]);
        console.log(`Attempted deletion of Warehouse ${id} (DB)`);
        // Assume success if no error
        return result.affectedRows > 0; // Check affected rows for confirmation
    } catch (error) {
        console.error(`Error deleting warehouse ${id}:`, error);
        throw error;
    }
}

export async function getDefaultWarehouseId(): Promise<string | undefined> {
    const db = await getDB();
    try {
        const results = await db.select("SELECT id FROM Warehouses WHERE isDefault = 1 LIMIT 1", []);
        if (results && results.length > 0) {
            return results[0].id as string;
        }
        // Fallback: If no default, return first warehouse found
        const firstWarehouse = await db.select("SELECT id FROM Warehouses LIMIT 1", []);
        if (firstWarehouse && firstWarehouse.length > 0) {
            console.warn("No default warehouse set, using first available warehouse.");
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
    const db = await getDB();
    try {
        let query = `SELECT ${PRODUCTS_SELECT_FIELDS} FROM Products`;
        const params: any[] = [];
        if (warehouseId) {
            query += " WHERE warehouseId = ?";
            params.push(warehouseId);
        }
        const results = await db.select(query, params);
        return (results as any[]).map(mapProductData);
    } catch (error) {
        console.error("Error fetching products:", error);
        throw error;
    }
}

export async function getProductById(id: string, warehouseId?: string): Promise<Product | undefined> {
    const db = await getDB();
    try {
        let query = `SELECT ${PRODUCTS_SELECT_FIELDS} FROM Products WHERE id = ?`;
        const params: any[] = [id];
        if (warehouseId) {
            query += " AND warehouseId = ?";
            params.push(warehouseId);
        }
        query += " LIMIT 1"; // Ensure only one result

        const results = await db.select(query, params);
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
    const db = await getDB();
    try {
        const results = await db.select(`SELECT ${PRODUCTS_SELECT_FIELDS} FROM Products WHERE barcode = ?`, [barcode]);
        if (results && results.length > 0) {
            // Consider how to handle multiple products with same barcode across different warehouses
            return mapProductData(results[0]);
        }
        return undefined;
    } catch (error) {
        console.error(`Error fetching product by barcode ${barcode}:`, error);
        throw error;
    }
}

export async function addProduct(productData: Omit<Product, 'id'>, tx?: Transaction): Promise<Product> {
    const executor = tx || await getDB();
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        await executor.execute(query, params);
        const newProduct = { ...productData, id: newId, warehouseId: targetWarehouseId };
        console.log("Added Product (DB):", newProduct);
        // Return mapped product (data might still be stringified number)
        return mapProductData(newProduct);
    } catch (error) {
        console.error("Error adding product:", error);
        throw error;
    }
}

export async function updateProduct(id: string, updates: Partial<Omit<Product, 'id'>>): Promise<Product | null> {
    const db = await getDB();
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
        let dbValue: any = newValue; // Value to be sent to DB

        // Convert numbers to strings for DB update if key requires it
        if (key === 'quantity' || key === 'price' || key === 'lastPurchaseCost' || key === 'discountRate') {
            const formattedNewValue = formatNumberForDB(newValue as string | number | undefined);
            const formattedOriginalValue = formatNumberForDB(originalValue as string | number | undefined);

            // Skip update if formatting fails (returns null)
            if (formattedNewValue === null) {
                continue;
            }

            dbValue = formattedNewValue;
            originalValue = formattedOriginalValue || originalValue; // Compare strings
        }
        // Handle INT types (no conversion needed for DB)
        if (key === 'subUnitsPerUnit') dbValue = newValue !== undefined && Number(newValue) > 0 ? Number(newValue) : null;
        if (key === 'minStockLevel') dbValue = newValue !== undefined ? Math.max(0, Number(newValue)) : null;

        // Handle special types
        if (key === 'expiryDate') {
            const formattedDate = formatDateForDB(newValue as Date | undefined);
            const formattedOriginalDate = formatDateForDB(originalValue as Date | undefined);
            dbValue = formattedDate;
            originalValue = formattedOriginalDate || originalValue;
        }
        if (key === 'categoryIcon') dbValue = getIconName(newValue as LucideIcon);
        // Note: warehouseId updates are handled like other fields if included in `updates`

        // Only add to update if DB value has actually changed
        if (String(dbValue) !== String(originalValue)) { // Robust comparison
            (updatedFields as any)[key] = updates[key]; // Keep original type from updates object
            setClause.push(`${key} = ?`);
            params.push(dbValue); // Use potentially formatted value for DB query
        }
    }

    if (setClause.length === 0) {
        // No changes detected for DB update
        return currentProduct;
    }

    // Construct WHERE clause - Update only the specific product instance
    // If warehouseId is part of update, it will be in the SET clause
    // The WHERE clause should ideally target the specific product ID.
    // If you need to update across warehouses, logic needs adjustment.
    const query = `UPDATE Products SET ${setClause.join(', ')} WHERE id = ?`;
    params.push(id);

    try {
        await db.execute(query, params);
        // Fetch product again after update to get the latest state
        const resultProduct = await getProductById(id, updates.warehouseId || currentProduct.warehouseId);
        console.log("Updated Product (DB):", resultProduct);
        return resultProduct || null; // Return fetched product or null if not found after update
    } catch (error) {
        console.error(`Error updating product ${id}:`, error);
        throw error;
    }
}

export async function deleteProduct(id: string): Promise<boolean> {
    const db = await getDB();
    // Dependency Check
    const salesCheck = await db.select("SELECT 1 FROM SaleTransactionItems WHERE productId = ? LIMIT 1", [id]);
    if (salesCheck && salesCheck.length > 0) {
        throw new Error(`لا يمكن حذف المنتج لأنه مرتبط بفواتير بيع.`);
    }
    const purchasesCheck = await db.select("SELECT 1 FROM PurchaseTransactionItems WHERE productId = ? LIMIT 1", [id]);
    if (purchasesCheck && purchasesCheck.length > 0) {
        throw new Error(`لا يمكن حذف المنتج لأنه مرتبط بفواتير شراء.`);
    }

    const query = "DELETE FROM Products WHERE id = ?";
    try {
        const result = await db.execute(query, [id]);
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
    const db = await getDB();
    try {
        const results = await db.select("SELECT purchaseId, productId, CAST(quantity AS CHAR) as quantity, CAST(cost AS CHAR) as cost, expiryDate FROM PurchaseTransactionItems WHERE purchaseId = ?", [purchaseId]);
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
    const db = await getDB();
    try {
        const purchaseResults = await db.select("SELECT id, supplierId, CAST(totalAmount AS CHAR) as totalAmount, paymentStatus, CAST(amountPaid AS CHAR) as amountPaid, date, invoiceNumber, destinationWarehouseId, paymentTreasuryId FROM PurchaseTransactions ORDER BY date DESC", []);
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
    const db = await getDB();
    try {
        const results = await db.select("SELECT id, supplierId, CAST(totalAmount AS CHAR) as totalAmount, paymentStatus, CAST(amountPaid AS CHAR) as amountPaid, date, invoiceNumber, destinationWarehouseId, paymentTreasuryId FROM PurchaseTransactions WHERE id = ?", [id]);

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

export async function addPurchase(purchaseData: Omit<PurchaseTransaction, 'id' | 'totalAmount' | 'paymentStatus'>, existingId?: string): Promise<PurchaseTransaction> {
    const newPurchaseId = existingId || `pur-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`;

    // Determine target warehouse for purchase
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

    // Determine target Treasury for payment
    const defaultTreasuryId = await getDefaultTreasuryId(); // Assume this function exists or create it
    const targetTreasuryId = purchaseData.paymentTreasuryId || defaultTreasuryId; // Allow specifying payment source

    // Use transaction wrapper for atomic transaction (FR-001, FR-002, FR-003)
    return await withTransaction(async (tx) => {
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
        await tx.execute(purchaseQuery, purchaseParams);
        console.log("Purchase Transaction inserted.");


        console.log("Processing purchase items...");
        for (const item of purchaseData.items) {
            console.log(`Processing item: Product ID ${item.productId}, Qty: ${item.quantity}, Cost: ${item.cost}, Expiry: ${item.expiryDate}`);
            const itemQuery = `
                INSERT INTO PurchaseTransactionItems (id, purchaseId, productId, quantity, cost, expiryDate)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const formattedExpiry = formatDateForDB(item.expiryDate); // Use DATE format for expiry
            const itemId = `pi-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`;
            const itemParams = [
                itemId,
                newPurchaseId,
                item.productId,
                formatNumberForDB(item.quantity), // Format number to string
                formatNumberForDB(item.cost), // Format number to string
                formattedExpiry
            ];
            console.log(`Inserting Purchase Item: ${JSON.stringify(itemParams)}`);
            await tx.execute(itemQuery, itemParams);
            console.log("Purchase Item inserted.");

            // Update product stock, last cost, expiry (Requires parsing)
            console.log(`Updating stock/cost/expiry for product ${item.productId} in warehouse ${targetWarehouseId}`);

            // Atomic Update for existing product
            // UPDATE Products SET quantity = quantity + ?, lastPurchaseCost = ?, expiryDate = ? WHERE id = ? AND warehouseId = ?

            const quantityAddedNum = parseFloatFromDB(item.quantity);
            const purchaseCostNum = parseFloatFromDB(item.cost);

            let expiryUpdateClause = "";
            let expiryParams = [];
            if (formattedExpiry) {
                expiryUpdateClause = ", expiryDate = ?";
                expiryParams.push(formattedExpiry);
            }

            const stockUpdateQuery = `
                 UPDATE Products
                 SET quantity = quantity + ?, lastPurchaseCost = ? ${expiryUpdateClause}
                 WHERE id = ? AND warehouseId = ?
            `;

            const updateParams = [
                formatNumberForDB(quantityAddedNum),
                formatNumberForDB(purchaseCostNum),
                ...expiryParams,
                item.productId,
                targetWarehouseId
            ];

            console.log(`Executing atomic stock update: ${JSON.stringify(updateParams)}`);
            const updateResult = await tx.execute(stockUpdateQuery, updateParams);

            if (updateResult.rowsAffected > 0) {
                console.log("Stock/cost/expiry updated (Atomic).");
            } else {
                // Product doesn't exist in this warehouse, add it automatically
                console.warn(`Product ${item.productId} not found in warehouse ${targetWarehouseId} (Atomic Update failed). Automatically adding...`);

                // Fetch product details from ANY warehouse to copy name/info
                const productInfo = await tx.select<any[]>(`SELECT nameAr, nameEn, manufacturer, categoryIcon, barcode, unitType FROM Products WHERE id = ? LIMIT 1`, [item.productId]);
                const baseInfo = productInfo.length > 0 ? productInfo[0] : { nameAr: 'منتج جديد', nameEn: 'New Product' };

                // Create a basic product entry in the target warehouse
                const newProductData: Omit<Product, 'id'> = {
                    nameAr: baseInfo.nameAr,
                    nameEn: baseInfo.nameEn || '',
                    manufacturer: baseInfo.manufacturer,
                    categoryIcon: baseInfo.categoryIcon,
                    barcode: baseInfo.barcode,
                    unitType: baseInfo.unitType || 'وحدة',
                    price: '0', // Placeholder price
                    lastPurchaseCost: formatNumberForDB(item.cost) || undefined,
                    quantity: formatNumberForDB(item.quantity) || '0',
                    warehouseId: targetWarehouseId,
                    expiryDate: item.expiryDate, // Pass expiry if available
                    // Copy other fields if necessary
                };

                // We use addProduct BUT we need to ensure it uses the SAME ID if it's the same logical product just new to this warehouse? 
                // The current schema uses UUIDs for ID. If 'id' is unique per row, then 'id' + 'warehouseId' is not a composite key, 'id' IS the key.
                // Wait, if Products table has 'id' as primary key, then a product in Warehouse A and Warehouse B must have DIFFERENT IDs?
                // OR 'id' is shared and (id, warehouseId) is unique?
                // Looking at `addPurchase` logic: `WHERE id = ? AND warehouseId = ?` implies we look for THAT specific row.
                // If the product creation logic generates a NEW ID for every `addProduct` call, then the same "Product" (e.g. Panadol) in different warehouses has different IDs.
                // This means `item.productId` refers to a specific row. 
                // IF so, we can't "add it to warehouse" with the SAME ID. 
                // BUT `addPurchase` receives `item.productId`. This ID comes from the UI selection.
                // If the user selected a product that exists in Warehouse A, but buys it into Warehouse B...
                // The system likely expects to find/create a product entry in Warehouse B.

                // Let's assume for now we just `addProduct` which generates a NEW ID. 
                // BUT `addPurchase` linked `PurchaseTransactionItems` to `item.productId`. 
                // If we create a NEW product ID for Warehouse B, the transaction item still points to the OLD ID (in Warehouse A).
                // This might be intended (tracing back to the catalog definition), or a flaw in the multi-warehouse design if products are not normalized.
                // Given I shouldn't redesign the schema now, I will stick to the existing fallback logic but make it robust.

                // Existing logic called `addProduct(newProductData, tx)`. `addProduct` generates a NEW ID.
                // This means the `PurchaseTransactionItem.productId` will point to the *source* product selected in UI, 
                // while the *stock* is added to a *new* product ID in the target warehouse.
                // This seems like a potential "split" in data, but consistent with "adding a new product instance".

                await addProduct(newProductData, tx);
                console.log(`Product added to warehouse ${targetWarehouseId} as new entry.`);
            }
        }

        // 4. Add Treasury Transactions for the payments (split payment support)
        if (purchaseData.payments && purchaseData.payments.length > 0) {
            console.log(`Processing ${purchaseData.payments.length} payments...`);
            for (const payment of purchaseData.payments) {
                const paymentAmount = parseFloatFromDB(payment.amount);
                if (paymentAmount > 0) {
                    await addTreasuryTransaction({
                        type: 'purchase_payment',
                        amount: formatNumberForDB(-paymentAmount)!, // Pass as string, ensure it's negative (outgoing)
                        date: purchaseData.date, // Use the same date as the purchase
                        description: `دفعة لمورد ${purchaseData.supplierId} - فاتورة ${newPurchaseId}`,
                        relatedDocumentId: newPurchaseId,
                        treasuryId: payment.treasuryId, // Link to the specific treasury
                    }, tx);
                    console.log(`Added treasury transaction for ${paymentAmount} from treasury ${payment.treasuryId}`);
                }
            }
        }
        // Legacy support: single payment method (backward compatibility)
        else if (purchaseData.amountPaid && amountPaidNum > 0) {
            // Map payment method to Arabic
            const paymentMethodMap: Record<string, string> = {
                'cash': 'نقداً',
                'card': 'بطاقة',
                'instapay': 'إنستا باي',
                'vodafone_cash': 'فودافون كاش',
                'debt': 'آجل'
            };
            const paymentMethodLabel = purchaseData.paymentMethod ? paymentMethodMap[purchaseData.paymentMethod] || purchaseData.paymentMethod : 'نقداً';

            await addTreasuryTransaction({
                type: 'purchase_payment',
                amount: formatNumberForDB(-amountPaidNum)!, // Pass as string, ensure it's negative
                date: purchaseData.date, // Use the same date as the purchase
                description: `دفعة لمورد ${purchaseData.supplierId} - فاتورة ${newPurchaseId} - ${paymentMethodLabel}`,
                relatedDocumentId: newPurchaseId,
                treasuryId: targetTreasuryId, // Associate with the paying treasury
            }, tx);
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
    });
}

export async function updatePurchase(
    purchaseId: string,
    updatedData: Omit<PurchaseTransaction, 'id' | 'totalAmount' | 'paymentStatus'>
): Promise<PurchaseTransaction> {
    return await withTransaction(async (tx) => {
        console.log(`Starting updatePurchase transaction for ID: ${purchaseId}`);

        // 1. Fetch the original purchase to reverse its effects
        const originalPurchase = await getPurchaseById(purchaseId);
        if (!originalPurchase) {
            throw new Error(`Original purchase ${purchaseId} not found for update.`);
        }

        // 2. Reverse effects of original purchase (stock and treasury)
        console.log(`Reversing effects of original purchase ${purchaseId}...`);
        const executor = tx; // Ensure we use the transaction client
        const targetWarehouseIdOriginal = originalPurchase.destinationWarehouseId || await getDefaultWarehouseId();
        if (!targetWarehouseIdOriginal) {
            throw new Error("Could not determine warehouse to reverse stock from for original purchase.");
        }
        const paymentTreasuryIdOriginal = originalPurchase.paymentTreasuryId || await getDefaultTreasuryId();

        // 2a. Reverse stock updates for each item in the original purchase
        for (const item of originalPurchase.items) {
            console.log(`Reversing stock for product: ${item.productId}, Qty: ${item.quantity} in Warehouse ${targetWarehouseIdOriginal} (Atomic)`);

            const quantityPurchasedNum = parseFloatFromDB(item.quantity);
            const quantityToDeductVal = formatNumberForDB(quantityPurchasedNum);

            // Atomic Reversal
            const atomicStockReversal = `
                UPDATE Products 
                SET quantity = MAX(0, quantity - ?) 
                WHERE id = ? AND warehouseId = ?
            `;
            await executor.execute(atomicStockReversal, [quantityToDeductVal, item.productId, targetWarehouseIdOriginal]);
        }

        // 2b. Reverse Treasury Transaction for original payments
        const amountPaidOriginalNum = parseFloatFromDB(originalPurchase.amountPaid);
        if (amountPaidOriginalNum > 0) {
            await addTreasuryTransaction({
                type: 'purchase_payment_reversal',
                amount: formatNumberForDB(amountPaidOriginalNum)!,
                date: new Date(), // Date of reversal
                description: `عكس دفعة فاتورة شراء (تحديث) ${purchaseId}`,
                relatedDocumentId: purchaseId,
                treasuryId: paymentTreasuryIdOriginal,
            }, executor);
        }
        console.log(`Effects of original purchase ${purchaseId} reversed.`);

        // 3. Delete old PurchaseTransactionItems and TreasuryTransactions
        console.log("Deleting old purchase items and treasury transactions...");
        await executor.execute("DELETE FROM PurchaseTransactionItems WHERE purchaseId = ?", [purchaseId]);
        await executor.execute("DELETE FROM TreasuryTransactions WHERE relatedDocumentId = ? AND type LIKE 'purchase_payment%'", [purchaseId]);
        console.log("Old purchase items and treasury transactions deleted.");

        // 4. Update the main PurchaseTransactions record
        console.log(`Updating main purchase record ${purchaseId}...`);
        const totalAmountNum = updatedData.items.reduce((sum, item) => {
            const quantityNum = parseFloatFromDB(item.quantity);
            const costNum = parseFloatFromDB(item.cost);
            return sum + quantityNum * costNum;
        }, 0);
        const amountPaidNum = updatedData.payments?.reduce((sum, payment) => sum + parseFloatFromDB(payment.amount), 0) || 0;

        let paymentStatus: PaymentStatus = 'unpaid';
        if (totalAmountNum > 0 && amountPaidNum >= totalAmountNum) {
            paymentStatus = 'paid';
        } else if (amountPaidNum > 0) {
            paymentStatus = 'partial';
        }

        const targetWarehouseIdNew = updatedData.destinationWarehouseId || await getDefaultWarehouseId();
        if (!targetWarehouseIdNew) {
            throw new Error("لا يوجد مخزن افتراضي أو محدد لاستلام المشتريات.");
        }
        const paymentTreasuryIdNew = updatedData.paymentTreasuryId || await getDefaultTreasuryId();


        const updatePurchaseQuery = `
            UPDATE PurchaseTransactions
            SET supplierId = ?, totalAmount = ?, paymentStatus = ?, amountPaid = ?, date = ?,
                invoiceNumber = ?, destinationWarehouseId = ?, paymentTreasuryId = ?
            WHERE id = ?
        `;
        const updatePurchaseParams = [
            updatedData.supplierId,
            formatNumberForDB(totalAmountNum),
            paymentStatus,
            formatNumberForDB(amountPaidNum),
            formatDateTimeForDB(updatedData.date),
            updatedData.invoiceNumber,
            targetWarehouseIdNew,
            paymentTreasuryIdNew,
            purchaseId,
        ];
        await executor.execute(updatePurchaseQuery, updatePurchaseParams);
        console.log(`Main purchase record ${purchaseId} updated.`);

        // 5. Apply effects of updated data (add new items and payments)
        console.log("Processing updated purchase items...");
        for (const item of updatedData.items) {
            const itemQuery = `
                INSERT INTO PurchaseTransactionItems (id, purchaseId, productId, quantity, cost, expiryDate)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const formattedExpiry = formatDateForDB(item.expiryDate);
            const itemId = `pi-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`;
            const itemParams = [
                itemId,
                purchaseId, // Use the existing purchase ID
                item.productId,
                formatNumberForDB(item.quantity),
                formatNumberForDB(item.cost),
                formattedExpiry
            ];
            await executor.execute(itemQuery, itemParams);

            // Update product stock, last cost, expiry (add stock) - Atomic
            // Same logic as addPurchase
            const quantityAddedNum = parseFloatFromDB(item.quantity);
            const purchaseCostNum = parseFloatFromDB(item.cost);

            let expiryUpdateClause = "";
            let expiryParams = [];
            if (formattedExpiry) {
                expiryUpdateClause = ", expiryDate = ?";
                expiryParams.push(formattedExpiry);
            }

            const stockUpdateQuery = `
                 UPDATE Products
                 SET quantity = quantity + ?, lastPurchaseCost = ? ${expiryUpdateClause}
                 WHERE id = ? AND warehouseId = ?
            `;

            const updateParams = [
                formatNumberForDB(quantityAddedNum),
                formatNumberForDB(purchaseCostNum),
                ...expiryParams,
                item.productId,
                targetWarehouseIdNew
            ];

            const updateResult = await executor.execute(stockUpdateQuery, updateParams);

            if (updateResult.rowsAffected === 0) {
                // If product doesn't exist, create it (same logic as addPurchase)
                const newProductData: Omit<Product, 'id'> = {
                    nameAr: 'منتج جديد تلقائي (تحديث)',
                    nameEn: 'Auto-added product (update)',
                    price: '0',
                    lastPurchaseCost: formatNumberForDB(item.cost) || undefined,
                    quantity: formatNumberForDB(item.quantity) || '0',
                    unitType: 'وحدة',
                    warehouseId: targetWarehouseIdNew,
                    expiryDate: item.expiryDate,
                };
                await addProduct(newProductData, executor);
            }
        }

        // 5. Add Treasury Transactions for the new payments
        if (updatedData.payments && updatedData.payments.length > 0) {
            for (const payment of updatedData.payments) {
                const paymentAmount = parseFloatFromDB(payment.amount);
                if (paymentAmount > 0) {
                    await addTreasuryTransaction({
                        type: 'purchase_payment',
                        amount: formatNumberForDB(-paymentAmount)!,
                        date: updatedData.date,
                        description: `دفعة لمورد (تحديث) ${updatedData.supplierId} - فاتورة ${purchaseId}`,
                        relatedDocumentId: purchaseId,
                        treasuryId: payment.treasuryId,
                    }, executor);
                }
            }
        }
        // Legacy support: single payment method
        else if (updatedData.amountPaid && amountPaidNum > 0) {
            const paymentMethodMap: Record<string, string> = {
                'cash': 'نقداً', 'card': 'بطاقة', 'instapay': 'إنستا باي', 'vodafone_cash': 'فودافون كاش', 'debt': 'آجل'
            };
            const paymentMethodLabel = updatedData.paymentMethod ? paymentMethodMap[updatedData.paymentMethod] || updatedData.paymentMethod : 'نقداً';

            await addTreasuryTransaction({
                type: 'purchase_payment',
                amount: formatNumberForDB(-amountPaidNum)!,
                date: updatedData.date,
                description: `دفعة لمورد (تحديث) ${updatedData.supplierId} - فاتورة ${purchaseId} - ${paymentMethodLabel}`,
                relatedDocumentId: purchaseId,
                treasuryId: paymentTreasuryIdNew,
            }, executor);
        }

        console.log(`Updated Purchase ${purchaseId} finished successfully.`);
        const finalPurchaseData = await getPurchaseById(purchaseId);
        if (!finalPurchaseData) {
            throw new Error("Failed to fetch updated purchase data.");
        }
        return finalPurchaseData;
    });
}

// --- Inventory Report (Linked to Physical Warehouses) ---
export async function getInventoryReportData(warehouseId?: string): Promise<InventoryReportItem[]> {
    const db = await getDB();
    // Fetch warehouses to map names
    const warehouses = await getWarehouses();
    const warehouseMap = new Map(warehouses.map(w => [w.id, w.name]));

    let query = `
        SELECT
            p.id, p.nameAr, p.nameEn, p.barcode,
            CAST(p.quantity AS CHAR) as quantity,
            CAST(p.price AS CHAR) as price,
            p.expiryDate, p.unitType,
            CAST(p.lastPurchaseCost AS CHAR) as lastPurchaseCost,
            p.warehouseId
        FROM Products p
    `;
    const params: any[] = [];
    if (warehouseId) {
        query += " WHERE p.warehouseId = ?";
        params.push(warehouseId);
    }

    try {
        const results = await db.select(query, params);
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
    const db = await getDB();
    try {
        const results = await db.select(`SELECT ${SUPPLIERS_SELECT_FIELDS} FROM Suppliers`, []);
        return results as Supplier[];
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        throw error;
    }
}

export async function addSupplier(supplierData: Omit<Supplier, 'id'>): Promise<Supplier> {
    const db = await getDB();
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
    const db = await getDB();
    const currentSupplierResult = await db.select("SELECT * FROM Suppliers WHERE id = ?", [id]);
    if (!currentSupplierResult || currentSupplierResult.length === 0) return null;
    const currentSupplier = currentSupplierResult[0];

    const { id: _, ...safeUpdates } = updates;

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
    const db = await getDB();
    const purchasesCheck = await db.select("SELECT 1 FROM PurchaseTransactions WHERE supplierId = ? LIMIT 1", [id]);
    if (purchasesCheck && purchasesCheck.length > 0) {
        throw new Error(`لا يمكن حذف المورد لأنه مرتبط بفواتير شراء.`);
    }

    const query = "DELETE FROM Suppliers WHERE id = ?";
    try {
        const result = await db.execute(query, [id]);
        console.log(`Attempted deletion of Supplier ${id} (DB)`);
        return result.affectedRows > 0; // Assume success if execute doesn't throw
    } catch (error) {
        console.error(`Error deleting supplier ${id}:`, error);
        throw error; // Re-throw
    }
}

// --- Customer Data Operations ---
export async function getCustomers(): Promise<Customer[]> {
    const db = await getDB();
    try {
        const results = await db.select(`SELECT ${CUSTOMERS_SELECT_FIELDS} FROM Customers`, []);
        return (results as any[]).map(mapCustomerData);
    } catch (error) {
        console.error("Error fetching customers:", error);
        throw error;
    }
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
    const db = await getDB();
    try {
        const results = await db.select(`SELECT ${CUSTOMERS_SELECT_FIELDS} FROM Customers WHERE id = ?`, [id]);
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
    const db = await getDB();
    const newId = `cust-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`;
    const query = `
        INSERT INTO Customers (id, name, phone, email, address, balance, insuranceCompany, policyNumber, insuranceDiscountRate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
        await db.execute(query, params);
        const newCustomer = { ...customerData, id: newId, balance: customerData.balance ?? '0' };
        console.log("Added Customer (DB):", newCustomer);
        return newCustomer;
    } catch (error) {
        console.error("Error adding customer:", error);
        throw error;
    }
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    const db = await getDB();
    const currentCustomer = await getCustomerById(id);
    if (!currentCustomer) return null;

    const { id: _, ...safeUpdates } = updates;

    // Prepare updates for database, formatting numbers as strings
    const dbUpdates: { [key: string]: any } = {};
    const changedUpdates: Partial<Customer> = {}; // Track changes with original types

    for (const key in safeUpdates) {
        const typedKey = key as keyof typeof safeUpdates;
        let dbValue = safeUpdates[typedKey];
        let originalValue = currentCustomer[typedKey];

        if (typedKey === 'balance' || typedKey === 'insuranceDiscountRate') {
            dbValue = formatNumberForDB(safeUpdates[typedKey]) as any;
            originalValue = formatNumberForDB(currentCustomer[typedKey] as string | undefined) as any; // Compare strings
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
        await db.execute(query, params);
        const updatedCustomer = { ...currentCustomer, ...changedUpdates };
        console.log("Updated Customer (DB):", updatedCustomer);
        return updatedCustomer;
    } catch (error) {
        console.error(`Error updating customer ${id}:`, error);
        throw error;
    }
}

export async function deleteCustomer(id: string): Promise<boolean> {
    const db = await getDB();
    const salesCheck = await db.select("SELECT 1 FROM SalesTransactions WHERE customerId = ? LIMIT 1", [id]);
    if (salesCheck && salesCheck.length > 0) {
        throw new Error(`لا يمكن حذف العميل لأنه مرتبط بفواتير بيع.`);
    }

    const query = "DELETE FROM Customers WHERE id = ?";
    try {
        const result = await db.execute(query, [id]);
        console.log(`Attempted deletion of Customer ${id} (DB)`);
        return result.affectedRows > 0; // Assume success if execute doesn't throw
    } catch (error) {
        console.error(`Error deleting customer ${id}:`, error);
        throw error; // Re-throw
    }
}

// --- Sale Transaction Operations ---
async function getSaleItems(saleId: string): Promise<SaleTransactionItem[]> {
    const db = await getDB();
    try {
        const results = await db.select("SELECT saleId, productId, CAST(quantity AS CHAR) as quantity, CAST(price AS CHAR) as price, soldUnitType, CAST(costAtSale AS CHAR) as costAtSale, warehouseId FROM SaleTransactionItems WHERE saleId = ?", [saleId]);
        return results as SaleTransactionItem[];
    } catch (error) {
        console.error(`Error fetching items for sale ${saleId}:`, error);
        throw error;
    }
}

export async function getSales(): Promise<SaleTransaction[]> {
    const db = await getDB();
    try {
        const salesResults = await db.select("SELECT id, customerId, CAST(totalAmount AS CHAR) as totalAmount, CAST(originalTotalAmount AS CHAR) as originalTotalAmount, CAST(subTotalAmount AS CHAR) as subTotalAmount, paymentMethod, CAST(amountPaid AS CHAR) as amountPaid, date, CAST(appliedInsuranceDiscountRate AS CHAR) as appliedInsuranceDiscountRate, saleWarehouseId, paymentTreasuryId FROM SalesTransactions ORDER BY date DESC", []);
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
    const db = await getDB();
    try {
        const results = await db.select("SELECT id, customerId, CAST(totalAmount AS CHAR) as totalAmount, CAST(originalTotalAmount AS CHAR) as originalTotalAmount, CAST(subTotalAmount AS CHAR) as subTotalAmount, paymentMethod, CAST(amountPaid AS CHAR) as amountPaid, date, CAST(appliedInsuranceDiscountRate AS CHAR) as appliedInsuranceDiscountRate, saleWarehouseId, paymentTreasuryId FROM SalesTransactions WHERE id = ?", [id]);
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
    const newSaleId = `sale-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`;

    // Determine source warehouse (e.g., from user session, POS setting, or default)
    const sourceWarehouseId = saleData.saleWarehouseId || await getDefaultWarehouseId(); // Use sale specific or default
    if (!sourceWarehouseId) {
        throw new Error("لا يوجد مخزن محدد لإتمام عملية البيع.");
    }

    // Determine target Treasury for payment deposit
    const defaultTreasuryId = await getDefaultTreasuryId(); // Assume this function exists
    const targetTreasuryId = saleData.paymentTreasuryId || defaultTreasuryId;

    // Use transaction wrapper for atomic transaction (FR-001, FR-002, FR-003)
    return await withTransaction(async (tx) => {
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
            saleData.paymentMethod || 'cash', // Use paymentMethod from saleData or default to 'cash'
            formatNumberForDB(saleData.amountPaid),
            formatDateTimeForDB(saleData.date), // Use DATETIME format
            formatNumberForDB(saleData.appliedInsuranceDiscountRate),
            sourceWarehouseId, // Store source warehouse
            targetTreasuryId, // Store payment treasury
        ];
        await tx.execute(saleQuery, saleParams);
        console.log("Sale Transaction inserted.");


        // 2. Insert Items and Update Stock (from specific warehouse)
        // 2. Insert Items and Update Stock (Atomic Update)
        for (const item of saleData.items) {
            // Fetch product cost and basic info for history/logging, but NOT for stock calculation (to avoid race)
            // We still need to know unitType to convert quantity if needed. 
            // Assumption: item.quantity is already in main units or handled.
            // Looking at existing code: item.soldUnitType is used.

            // Fetch product details for cost/validity chcek
            // Fetch product details for cost/validity chcek
            const productQuery = `SELECT 
                id, 
                CAST(price AS CHAR) as price, 
                CAST(cost AS CHAR) as cost, 
                CAST(lastPurchaseCost AS CHAR) as lastPurchaseCost, 
                CAST(quantity AS CHAR) as quantity, 
                unitType,
                subUnitType, 
                subUnitsPerUnit
             FROM Products WHERE id = ?`;

            // console.log(`Executing Product Fetch: ${productQuery} with params: [${item.productId}]`);
            const productResults = await tx.select<any[]>(productQuery, [item.productId]);
            // console.log(`Product Fetch Result Length: ${productResults.length}`);

            const product = productResults.length > 0 ? productResults[0] : undefined;
            // console.log(`Debug Check for ${item.productId}:`, product);

            if (!product) {
                throw new Error(`المنتج ${item.productId} غير موجود في الدليل`);
            }

            const itemWarehouseId = product.warehouseId || sourceWarehouseId;

            // Calculate quantities
            let quantityToDeduct = parseFloatFromDB(item.quantity);
            if (item.soldUnitType === 'sub' && product.subUnitsPerUnit) {
                quantityToDeduct = quantityToDeduct / parseFloatFromDB(product.subUnitsPerUnit);
            }

            // Determine Cost
            let costAtSale = parseFloatFromDB(item.costAtSale || '0');
            if (costAtSale === 0 && product.lastPurchaseCost) {
                costAtSale = parseFloatFromDB(product.lastPurchaseCost);
            }

            const itemQuery = `
               INSERT INTO SaleTransactionItems (id, saleId, productId, quantity, price, soldUnitType, costAtSale, warehouseId)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           `;
            const itemId = `si-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`;
            const itemParams = [
                itemId,
                newSaleId,
                item.productId,
                formatNumberForDB(item.quantity),
                formatNumberForDB(item.price),
                item.soldUnitType,
                formatNumberForDB(costAtSale),
                itemWarehouseId
            ];
            // console.log(`Inserting Sale Item: ${JSON.stringify(itemParams)}`);
            await tx.execute(itemQuery, itemParams);
            // console.log(`Sale Item inserted.`);

            // Atomic Stock Update
            // UPDATE Products SET quantity = quantity - ? WHERE id = ? AND warehouseId = ? AND quantity >= ?
            const stockUpdateSQL = `
                UPDATE Products 
                SET quantity = quantity - ? 
                WHERE id = ? 
                  AND warehouseId = ? 
                  AND quantity >= ?
            `;

            const quantityToDeductVal = formatNumberForDB(quantityToDeduct);
            const updateParams = [quantityToDeductVal, item.productId, itemWarehouseId, quantityToDeductVal];

            console.log(`Updating stock for product ${item.productId} in warehouse ${itemWarehouseId} (Atomic)`);
            const updateResult = await tx.execute(stockUpdateSQL, updateParams);


            if (updateResult.rowsAffected === 0) {
                // Check if it was due to missing product/warehouse OR insufficient stock
                // Since we checked existence above, it's likely insufficient stock (or concurrent deletion)
                const currentStockCheck = await tx.select<any[]>('SELECT CAST(quantity AS CHAR) as quantity FROM Products WHERE id = ? AND warehouseId = ?', [item.productId, itemWarehouseId]);
                if (currentStockCheck.length === 0) {
                    throw new Error(`المنتج ${item.productId} غير موجود في المخزن المحدد.`);
                }
                const available = currentStockCheck[0].quantity;
                throw new Error(`لا توجد كمية كافية للمنتج ${item.productId} في المخزن. المتوفر: ${available}, المطلوب: ${quantityToDeduct}`);
            }
            console.log(`Stock updated.`);
        }

        // 3. Update Customer Balance
        if (saleData.customerId) {
            console.log(`Updating balance for customer ${saleData.customerId}`);
            const customerResults = await tx.select<any[]>(`SELECT ${CUSTOMERS_SELECT_FIELDS} FROM Customers WHERE id = ?`, [saleData.customerId]);
            const customer = customerResults.length > 0 ? mapCustomerData(customerResults[0]) : undefined;
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
                    await tx.execute(balanceUpdateQuery, [formatNumberForDB(newBalanceNum), saleData.customerId]);
                    console.log("Customer balance updated.");
                }
            } else {
                console.warn(`Customer ${saleData.customerId} not found or balance is undefined.`);
            }
        }

        // 4. Add Treasury Transactions for the payments (split payment support)
        if (saleData.payments && saleData.payments.length > 0) {
            console.log(`Processing ${saleData.payments.length} payments...`);
            for (const payment of saleData.payments) {
                const paymentAmount = parseFloatFromDB(payment.amount);
                if (paymentAmount > 0) {
                    await addTreasuryTransaction({
                        type: 'sale_payment',
                        amount: formatNumberForDB(paymentAmount)!, // Pass as string, ensure it's positive
                        date: saleData.date, // Use the same date as the sale
                        description: `دفعة من فاتورة بيع ${newSaleId}`,
                        relatedDocumentId: newSaleId,
                        treasuryId: payment.treasuryId, // Link to the specific treasury
                    }, tx);
                    console.log(`Added treasury transaction for ${paymentAmount} to treasury ${payment.treasuryId}`);
                }
            }
        }
        // Legacy support: single payment method (backward compatibility)
        else if (saleData.amountPaid && parseFloatFromDB(saleData.amountPaid) > 0) {
            const paymentMethodMap: Record<string, string> = {
                'cash': 'نقداً',
                'card': 'بطاقة',
                'instapay': 'إنستا باي',
                'vodafone_cash': 'فودافون كاش',
                'debt': 'آجل'
            };
            const paymentMethodLabel = saleData.paymentMethod ? paymentMethodMap[saleData.paymentMethod] || saleData.paymentMethod : '';

            await addTreasuryTransaction({
                type: 'sale_payment',
                amount: formatNumberForDB(saleData.amountPaid)!, // Pass as string, ensure it's positive
                date: saleData.date, // Use the same date as the sale
                description: `دفعة من فاتورة بيع ${newSaleId} - ${paymentMethodLabel}`,
                relatedDocumentId: newSaleId,
                treasuryId: targetTreasuryId, // Link to the receiving treasury
            }, tx);
        }

        // Commit transaction here... (Conceptual)
        console.log("Committing addSale transaction...");

        console.log("Added Sale (DB):", newSaleId);
        // Fetch the complete data again to return consistent mapped types
        const finalSaleData = await saleRepository.findByIdWithItems(newSaleId, tx); // Fetch the newly created sale using the SAME transaction
        if (!finalSaleData) {
            throw new Error("Failed to fetch newly created sale data.");
        }
        // Handle customerId type conversion (null to undefined) and items type conversion
        const saleResult: SaleTransaction = {
            id: finalSaleData.id,
            customerId: finalSaleData.customerId || undefined,
            totalAmount: formatNumberForDB(finalSaleData.totalAmount) || '0',
            originalTotalAmount: formatNumberForDB(finalSaleData.originalTotalAmount) || '0',
            subTotalAmount: formatNumberForDB(finalSaleData.subTotalAmount) || '0',
            amountPaid: formatNumberForDB(finalSaleData.amountPaid) || '0',
            paymentMethod: finalSaleData.paymentMethod as PaymentMethod, // Cast to PaymentMethod type
            date: finalSaleData.date,
            appliedInsuranceDiscountRate: formatNumberForDB(finalSaleData.appliedInsuranceDiscountRate) || '0',
            saleWarehouseId: finalSaleData.saleWarehouseId,
            paymentTreasuryId: finalSaleData.paymentTreasuryId,
            items: finalSaleData.items.map(item => ({
                ...item,
                quantity: formatNumberForDB(item.quantity) || '0', // Convert number to string
                price: formatNumberForDB(item.price) || '0', // Convert number to string
                costAtSale: item.costAtSale !== undefined ? formatNumberForDB(item.costAtSale) || '0' : undefined,
                soldUnitType: item.soldUnitType as 'main' | 'sub', // Cast to proper union type
            })),
        };
        console.log("addSale finished successfully.");
        return saleResult;
    });
}

export async function deleteSale(saleId: string): Promise<boolean> {
    const db = await getDB();

    // Start transaction... (Conceptual)
    console.log(`Starting deleteSale transaction for ID: ${saleId}`);
    try {
        // 1. Get sale details first to reverse effects
        console.log("Fetching sale details...");
        const sale = await getSaleById(saleId);
        if (!sale) {
            throw new Error(`Sale with ID ${saleId} not found.`);
        }
        console.log("Sale details fetched.");

        // 2. Reverse stock updates for each item using the warehouse recorded on the item
        console.log("Reversing stock updates...");
        for (const item of sale.items) {
            const itemWarehouseId = item.warehouseId || sale.saleWarehouseId || await getDefaultWarehouseId();
            if (!itemWarehouseId) {
                console.error(`Could not determine warehouse for item ${item.productId} in sale ${saleId}. Skipping stock reversal for this item.`);
                continue;
            }
            console.log(`Reversing stock for product: ${item.productId}, Qty: ${item.quantity} in Warehouse ${itemWarehouseId}`);

            // Fetch product metadata only (for sub-unit conversion) - Safe from stock race
            // We need subUnitsPerUnit if soldUnitType is 'sub'
            let conversionFactor = 1;
            if (item.soldUnitType === 'sub') {
                const productMeta = await db.select('SELECT subUnitsPerUnit FROM Products WHERE id = ?', [item.productId]) as any[];
                if (productMeta.length > 0 && productMeta[0].subUnitsPerUnit) {
                    conversionFactor = parseFloatFromDB(productMeta[0].subUnitsPerUnit) || 1;
                    // Avoid division by zero
                    if (conversionFactor === 0) conversionFactor = 1;
                }
            }

            const quantitySoldNum = parseFloatFromDB(item.quantity);
            let quantityToAddBack = quantitySoldNum;
            if (item.soldUnitType === 'sub') {
                quantityToAddBack = quantitySoldNum / conversionFactor;
            }

            // Atomic Stock Restoration
            const atomicStockQuery = `
                UPDATE Products 
                SET quantity = quantity + ? 
                WHERE id = ? AND warehouseId = ?
            `;
            await db.execute(atomicStockQuery, [
                formatNumberForDB(quantityToAddBack),
                item.productId,
                itemWarehouseId
            ]);
            console.log("Stock reversal complete for item (Atomic).");
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
                    await db.execute(balanceUpdateQuery, [formatNumberForDB(originalBalanceNum), sale.customerId]);
                    console.log("Customer balance reversal complete.");
                }
            } else {
                console.warn(`Customer ${sale.customerId} not found or balance undefined during reversal.`);
            }
        }

        // 4. Reverse Treasury Transaction (add a negative transaction in the original treasury)
        const paymentTreasuryId = sale.paymentTreasuryId || await getDefaultTreasuryId(); // Determine the original treasury
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
        await db.execute("DELETE FROM SaleTransactionItems WHERE saleId = ?", [saleId]);
        console.log("Sale items deleted.");

        // 6. Delete sale transaction itself
        console.log("Deleting sale transaction...");
        const result = await db.execute("DELETE FROM SalesTransactions WHERE id = ?", [saleId]);
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

export async function deletePurchase(purchaseId: string, tx?: Transaction): Promise<boolean> {
    const executor = tx || await getDB();

    // Start transaction... (Conceptual)
    console.log(`Starting deletePurchase transaction for ID: ${purchaseId}`);
    try {
        // 1. Get purchase details first to reverse effects
        console.log("Fetching purchase details...");
        const purchase = await getPurchaseById(purchaseId);
        if (!purchase) {
            throw new Error(`Purchase with ID ${purchaseId} not found.`);
        }
        console.log("Purchase details fetched.");

        // Determine target warehouse from the purchase record or default
        const targetWarehouseId = purchase.destinationWarehouseId || await getDefaultWarehouseId();
        if (!targetWarehouseId) {
            throw new Error("Could not determine warehouse to reverse stock from.");
        }
        // Determine payment treasury from the purchase record or default
        const paymentTreasuryId = purchase.paymentTreasuryId || await getDefaultTreasuryId();

        // 2. Reverse stock updates for each item (in the correct warehouse)
        console.log("Reversing stock updates...");
        for (const item of purchase.items) {
            console.log(`Reversing stock for product: ${item.productId}, Qty: ${item.quantity} in Warehouse ${targetWarehouseId} (Atomic)`);

            // Atomic Reversal: Deduct from stock directly
            // Using MAX(0, quantity - ?) is problematic in SQLite if we want strict consistency, 
            // but typically we just subtract. If it goes below zero, it goes below zero (audit issue) 
            // OR we clamp it. Read-modify-write clamped it. 
            // Let's use standard atomic subtraction. If it goes negative, it reflects reality (we returned items we didn't have?).
            // However, to match previous logic "Math.max(0, ...)", we can use:
            // UPDATE Products SET quantity = MAX(0, quantity - ?) ...

            const quantityPurchasedNum = parseFloatFromDB(item.quantity);
            const quantityToDeductVal = formatNumberForDB(quantityPurchasedNum);

            const stockUpdateQuery = `
                 UPDATE Products 
                 SET quantity = CASE WHEN (quantity - ?) < 0 THEN 0 ELSE (quantity - ?) END 
                 WHERE id = ? AND warehouseId = ?
            `;
            // Simplified for standard SQL/SQLite: MAX(0, quantity - ?)
            // SQLite supports MAX().
            const atomicStockUpdate = `
                UPDATE Products 
                SET quantity = MAX(0, quantity - ?) 
                WHERE id = ? AND warehouseId = ?
            `;

            await executor.execute(atomicStockUpdate, [
                quantityToDeductVal,
                item.productId,
                targetWarehouseId
            ]);
            console.log("Stock reversal complete for item (Atomic).");
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
            }, executor); // Pass executor (which is tx if provided)
        }

        // 4. Delete purchase items
        console.log("Deleting purchase items...");
        await executor.execute("DELETE FROM PurchaseTransactionItems WHERE purchaseId = ?", [purchaseId]);
        console.log("Purchase items deleted.");

        // 5. Delete purchase transaction itself
        console.log("Deleting purchase transaction...");
        const result = await executor.execute("DELETE FROM PurchaseTransactions WHERE id = ?", [purchaseId]);
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
    const db = await getDB();
    try {
        // Select passwordHash as well to display it in the table
        const results = await db.select("SELECT id, username, name, email, role, passwordHash FROM Users", []);
        return results as User[];
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
}

export async function getUserForLogin(username: string): Promise<User | undefined> {
    const db = await getDB();
    try {
        // Fetch user including password hash for verification if needed
        const results = await db.select("SELECT id, username, name, email, role, passwordHash FROM Users WHERE username = ?", [username]);
        if (results && results.length > 0) {
            return results[0] as User;
        }
        return undefined;
    } catch (error) {
        console.error(`Error fetching user by username ${username}:`, error);
        throw error;
    }
}

export async function addUser(userData: Omit<User, 'id' | 'passwordHash'> & { password?: string }): Promise<User> {
    const db = await getDB();
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
        INSERT INTO Users (id, username, name, email, role, passwordHash)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [newId, userData.username, userData.name, userData.email, userData.role, passwordHash];
    try {
        await db.execute(query, params);
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
    const db = await getDB();
    const currentUserResult = await db.select("SELECT id, username, name, email, role, passwordHash FROM Users WHERE id = ?", [id]);
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
        await db.execute(query, params);
        // Return updated user *including* hash for consistency if it was updated
        const updatedUser = { ...currentUser, ...updateFields };
        console.log("Updated User (DB):", updatedUser);
        return updatedUser as User;
    } catch (error) {
        console.error(`Error updating user ${id}:`, error);
        throw error;
    }
}

export async function deleteUser(id: string): Promise<boolean> {
    const db = await getDB();
    // Add Dependency Check if needed (e.g., check if user created sales)

    const query = "DELETE FROM Users WHERE id = ?";
    try {
        const result = await db.execute(query, [id]);
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
    const db = await getDB();
    try {
        const results = await db.select("SELECT * FROM Treasuries", []);
        return (results as any[]).map(mapTreasuryData);
    } catch (error) {
        console.error("Error fetching treasuries:", error);
        throw error;
    }
}

// Add a new treasury
export async function addTreasury(treasuryData: Omit<Treasury, 'id'>): Promise<Treasury> {
    const db = await getDB();
    const newId = `trs-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`;

    if (treasuryData.isDefault) {
        await db.execute("UPDATE Treasuries SET isDefault = 0 WHERE isDefault = 1", []);
    }

    const query = `
        INSERT INTO Treasuries (id, name, description, paymentMethodType, isDefault)
        VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
        newId,
        treasuryData.name,
        treasuryData.description,
        treasuryData.paymentMethodType || null,
        treasuryData.isDefault ? 1 : 0,
    ];
    try {
        await db.execute(query, params);
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
    const db = await getDB();
    const currentTreasuryResult = await db.select("SELECT * FROM Treasuries WHERE id = ?", [id]);
    if (!currentTreasuryResult || currentTreasuryResult.length === 0) return null;
    const currentTreasury = currentTreasuryResult[0];

    if (updates.isDefault === true && !parseBooleanFromDB(currentTreasury.isDefault)) {
        await db.execute("UPDATE Treasuries SET isDefault = 0 WHERE isDefault = 1", []);
    }

    const updateKeys = Object.keys(updates) as (keyof typeof updates)[];
    let setClause = [];
    let params = [];

    for (const key of updateKeys) {
        let newValue = updates[key];
        let originalValue = currentTreasury[key];
        let dbValue = newValue;

        if (key === 'isDefault') {
            dbValue = newValue ? 1 : 0 as any;
            originalValue = parseBooleanFromDB(originalValue) ? 1 : 0 as any;
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
        await db.execute(query, params);
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
    const db = await getDB();
    // Dependency Check
    const transactionCheck = await db.select("SELECT 1 FROM TreasuryTransactions WHERE treasuryId = ? LIMIT 1", [id]);
    if (transactionCheck && transactionCheck.length > 0) {
        throw new Error(`لا يمكن حذف الخزنة لأنها تحتوي على حركات مالية.`);
    }
    const treasuryResult = await db.select("SELECT isDefault FROM Treasuries WHERE id = ?", [id]);
    const treasury = treasuryResult?.[0];
    if (treasury && parseBooleanFromDB(treasury.isDefault)) {
        throw new Error(`لا يمكن حذف الخزنة الافتراضية.`);
    }

    const query = "DELETE FROM Treasuries WHERE id = ?";
    try {
        const result = await db.execute(query, [id]);
        console.log(`Attempted deletion of Treasury ${id} (DB)`);
        return result.affectedRows > 0;
    } catch (error) {
        console.error(`Error deleting treasury ${id}:`, error);
        throw error;
    }
}

// Get default treasury ID
export async function getDefaultTreasuryId(): Promise<string | undefined> {
    const db = await getDB();
    try {
        const results = await db.select("SELECT id FROM Treasuries WHERE isDefault = 1 LIMIT 1", []);
        if (results && results.length > 0) {
            return results[0].id as string;
        }
        // Fallback: If no default, return first treasury found
        const firstTreasury = await db.select("SELECT id FROM Treasuries LIMIT 1", []);
        if (firstTreasury && firstTreasury.length > 0) {
            console.warn("No default treasury set, using first available treasury.");
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
    const db = await getDB();
    try {
        let query = "SELECT id, type, CAST(amount AS CHAR) as amount, date, description, userId, relatedDocumentId, treasuryId FROM TreasuryTransactions";
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
        // or filter by specific treasury ID otherwise.
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

        const results = await db.select(query, params);
        return (results as any[]).map(mapTreasuryTransactionData); // Use correct mapper
    } catch (error) {
        console.error("Error fetching treasury transactions:", error);
        throw error;
    }
}

export async function getTreasuryBalance(): Promise<number> {
    const db = await getDB();
    try {
        // استخدم DOUBLE بدل REAL لحل مشكلة MariaDB
        const result = await db.select(
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
    txData: Omit<TreasuryTransaction, 'id' | 'date'> & { date?: Date }, // Make date optional for auto-generation
    tx?: Transaction // Optional transaction context
): Promise<TreasuryTransaction> {
    const db = await getDB();
    const executor = tx || db; // Use transaction if provided, otherwise db connection
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
        await executor.execute(query, params);
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
    // This might need adjustment if same product ID exists in multiple warehouses
    const product = await getProductById(id); // Fetches first matching product ID
    return product ? product.nameAr : `منتج غير معروف (${id.substring(0, 6)})`;
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
    const db = await getDB();
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
        const results = await db.select(query, params);
        return (results as any[]).map(p => ({
            id: p.id,
            nameAr: p.nameAr,
            expiryDate: parseDateFromDB(p.expiryDate)!, // Parse date back
            quantity: p.quantity, // Keep as string
            daysUntilExpiry: calculateDaysUntilExpiry(p.expiryDate),
            warehouseId: p.warehouseId, // Include warehouseId
        })) as ProductExpiryInfo[];
    } catch (error) {
        console.error("Error fetching nearing expiry products:", error);
        throw error;
    }
}

export async function getExpiredProducts(warehouseId?: string): Promise<ProductExpiryInfo[]> {
    const db = await getDB();
    const todayStr = formatDateForDB(new Date()); // Format for query

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
        const results = await db.select(query, params);
        return (results as any[]).map(p => ({
            id: p.id,
            nameAr: p.nameAr,
            expiryDate: parseDateFromDB(p.expiryDate)!, // Parse date back
            quantity: p.quantity, // Keep as string
            daysUntilExpiry: calculateDaysUntilExpiry(p.expiryDate),
            warehouseId: p.warehouseId, // Include warehouseId
        })) as ProductExpiryInfo[];
    } catch (error) {
        console.error("Error fetching expired products:", error);
        throw error;
    }
}

// --- Alternative Products (Check Physical Warehouses) ---
export async function findAlternativeProducts(productId: string, warehouseId?: string): Promise<Product[]> {
    const db = await getDB();
    try {
        // Get the original product to find its active ingredient
        const originalProduct = await getProductById(productId);
        if (!originalProduct || !originalProduct.activeIngredient) {
            return [];
        }

        // Find alternatives with the same active ingredient, potentially in a specific warehouse
        // Ensure we cast quantity correctly if it's stored as VARCHAR
        let query = `
            SELECT ${PRODUCTS_SELECT_FIELDS} FROM Products
            WHERE id != ? AND activeIngredient = ? AND CAST(quantity AS DOUBLE) > 0
        `;
        const params: any[] = [productId, originalProduct.activeIngredient];

        if (warehouseId) {
            query += " AND warehouseId = ?";
            params.push(warehouseId);
        }

        const results = await db.select(query, params);
        return (results as any[]).map(mapProductData);
    } catch (error) {
        console.error(`Error finding alternatives for product ${productId}:`, error);
        throw error;
    }
}

// Note: The following functions related to Treasury Transactions by Warehouse ID
// have been removed as they are now redundant. Use the updated getTreasuryTransactions,
// getTreasuryBalance, and addTreasuryTransaction functions with treasuryId filter/parameter.
export async function updateTreasuryTransaction(id: string, updates: Partial<TreasuryTransaction>): Promise<TreasuryTransaction | null> {
    const db = await getDB();
    // Fetch requires parsing amount back to number if you need to compare/use it
    const currentTransactionData = (await db.select("SELECT id, type, CAST(amount AS CHAR) as amount, date, description, userId, relatedDocumentId, treasuryId FROM TreasuryTransactions WHERE id = ?", [id]))?.[0];
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
            // Only format if it's a string or number, not Date
            if (typeof newValue === 'string' || typeof newValue === 'number') {
                const formatted = formatNumberForDB(newValue);
                dbValue = formatted !== null ? formatted : newValue;
                const originalFormatted = formatNumberForDB(originalValue as string | undefined);
                originalValue = originalFormatted !== null ? originalFormatted : originalValue;
            } else {
                dbValue = newValue;
                originalValue = originalValue;
            }
        }
        if (typedKey === 'date') {
            const formatted = formatDateTimeForDB(newValue as Date | undefined);
            dbValue = formatted !== null ? formatted : newValue;
            const originalFormatted = formatDateTimeForDB(originalValue as Date | undefined);
            originalValue = originalFormatted !== null ? originalFormatted : originalValue;
        }
        // Handle treasuryId like any other string field
        if (typedKey === 'treasuryId') {
            dbValue = newValue;
            originalValue = originalValue;
        }

        // Compare potentially formatted DB values
        if (String(dbValue) !== String(originalValue)) {
            // Store original type change - cast to avoid type errors
            (changedUpdates as any)[typedKey] = safeUpdates[typedKey];
            dbUpdates[typedKey] = dbValue; // Store DB-formatted value
        }
    }

    if (Object.keys(dbUpdates).length === 0) return currentTransaction;

    const setClause = Object.keys(dbUpdates).map(key => `${key} = ?`).join(', ');
    const params = [...Object.values(dbUpdates), id];
    const query = `UPDATE TreasuryTransactions SET ${setClause} WHERE id = ?`;

    try {
        await db.execute(query, params);
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
    const db = await getDB();

    const query = "DELETE FROM TreasuryTransactions WHERE id = ?";
    try {
        const result = await db.execute(query, [id]);
        console.log(`Attempted deletion of Treasury Transaction ${id} (DB)`);
        return result.affectedRows > 0; // Assume success if execute doesn't throw
    } catch (error) {
        console.error(`Error deleting treasury transaction ${id}:`, error);
        throw error; // Re-throw
    }
}

// ====================================================================
// Egyptian Drugs Database Operations
// عمليات قاعدة بيانات الأدوية المصرية
// ====================================================================

// Get all drug categories
export async function getDrugCategories(): Promise<DrugCategory[]> {
    const db = await getDB();
    try {
        const results = await db.select("SELECT * FROM DrugCategories ORDER BY categoryAR", []);
        return results as DrugCategory[];
    } catch (error) {
        console.error("Error fetching drug categories:", error);
        throw error;
    }
}

// Add a new drug category
export async function addDrugCategory(categoryData: Omit<DrugCategory, 'id'>): Promise<DrugCategory> {
    const db = await getDB();
    const newId = `cat-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`;
    const query = `
        INSERT INTO DrugCategories (id, categoryAR, categoryEN, description)
        VALUES (?, ?, ?, ?)
    `;
    const params = [newId, categoryData.categoryAR, categoryData.categoryEN, categoryData.description];
    try {
        await db.execute(query, params);
        const newCategory = { ...categoryData, id: newId };
        console.log("Added Drug Category (DB):", newCategory);
        return newCategory;
    } catch (error) {
        console.error("Error adding drug category:", error);
        throw error;
    }
}

// Get all Egyptian drugs
export async function getEgyptianDrugs(filters?: {
    categoryId?: string;
    search?: string;
    manufacturer?: string;
}): Promise<EgyptianDrug[]> {
    const db = await getDB();
    try {
        let query = `
            SELECT d.*, c.categoryAR, c.categoryEN
            FROM EgyptianDrugs d
            LEFT JOIN DrugCategories c ON d.categoryID = c.id
        `;
        const params: any[] = [];
        const conditions: string[] = [];

        if (filters?.categoryId) {
            conditions.push("d.categoryID = ?");
            params.push(filters.categoryId);
        }

        if (filters?.search) {
            conditions.push("(d.nameAR LIKE ? OR d.nameEN LIKE ? OR d.activeIngredient LIKE ? OR d.egyptianBarcode LIKE ?)");
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (filters?.manufacturer) {
            conditions.push("d.manufacturer = ?");
            params.push(filters.manufacturer);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY d.nameAR";
        const results = await db.select(query, params);
        return results as EgyptianDrug[];
    } catch (error) {
        console.error("Error fetching Egyptian drugs:", error);
        throw error;
    }
}

// Get Egyptian drug by barcode
export async function getEgyptianDrugByBarcode(barcode: string): Promise<EgyptianDrug | undefined> {
    const db = await getDB();
    try {
        const results = await db.select(`
            SELECT d.*, c.categoryAR, c.categoryEN
            FROM EgyptianDrugs d
            LEFT JOIN DrugCategories c ON d.categoryID = c.id
            WHERE d.egyptianBarcode = ?
        `, [barcode]);
        if (results && results.length > 0) {
            return results[0] as EgyptianDrug;
        }
        return undefined;
    } catch (error) {
        console.error(`Error fetching Egyptian drug by barcode ${barcode}:`, error);
        throw error;
    }
}

// Add Egyptian drug
export async function addEgyptianDrug(drugData: Omit<EgyptianDrug, 'id' | 'categoryAR' | 'categoryEN' | 'createdAt' | 'updatedAt'>): Promise<EgyptianDrug> {
    const db = await getDB();
    const newId = `drug-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`;
    const query = `
        INSERT INTO EgyptianDrugs (
            id, nameAR, nameEN, activeIngredient, manufacturer, egyptianBarcode,
            categoryID, type, dosage, packaging, price, registrationNumber, approvalDate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        newId,
        drugData.nameAR,
        drugData.nameEN,
        drugData.activeIngredient,
        drugData.manufacturer,
        drugData.egyptianBarcode,
        drugData.categoryID,
        drugData.type,
        drugData.dosage,
        drugData.packaging,
        drugData.price,
        drugData.registrationNumber,
        drugData.approvalDate ? formatDateForDB(drugData.approvalDate) : null,
    ];
    try {
        await db.execute(query, params);
        const newDrug = await getEgyptianDrugByBarcode(drugData.egyptianBarcode);
        console.log("Added Egyptian Drug (DB):", newDrug);
        return newDrug!;
    } catch (error) {
        console.error("Error adding Egyptian drug:", error);
        throw error;
    }
}

// ====================================================================
// Invoice & Multi-language Operations
// عمليات الفواتير ودعم اللغات المتعددة
// ====================================================================

// Get all supported invoice languages
export async function getInvoiceLanguages(): Promise<InvoiceLanguage[]> {
    const db = await getDB();
    try {
        const results = await db.select("SELECT * FROM InvoiceLanguages ORDER BY isRTL DESC, name", []);
        return results as InvoiceLanguage[];
    } catch (error) {
        console.error("Error fetching invoice languages:", error);
        throw error;
    }
}

// Get invoice translations for a specific language
export async function getInvoiceTranslations(languageId: string): Promise<Record<string, string>> {
    const db = await getDB();
    try {
        const results = await db.select("SELECT keyName, translation FROM InvoiceTranslations WHERE languageId = ?", [languageId]);
        const translations: Record<string, string> = {};
        for (const item of results as any[]) {
            translations[item.keyName] = item.translation;
        }
        return translations;
    } catch (error) {
        console.error(`Error fetching invoice translations for language ${languageId}:`, error);
        throw error;
    }
}

// Get customer preference
export async function getCustomerPreference(customerId: string): Promise<CustomerPreference | undefined> {
    const db = await getDB();
    try {
        const results = await db.select("SELECT * FROM CustomerPreferences WHERE customerId = ?", [customerId]);
        if (results && results.length > 0) {
            return results[0] as CustomerPreference;
        }
        return undefined;
    } catch (error) {
        console.error(`Error fetching customer preference for ${customerId}:`, error);
        throw error;
    }
}

// Set customer preference (language, currency)
export async function setCustomerPreference(customerId: string, preference: Omit<CustomerPreference, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>): Promise<CustomerPreference> {
    const db = await getDB();
    const newId = `pref-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`;
    const query = `
        INSERT INTO CustomerPreferences (id, customerId, preferredLanguageId, preferredCurrency)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        preferredLanguageId = VALUES(preferredLanguageId),
        preferredCurrency = VALUES(preferredCurrency),
        updatedAt = CURRENT_TIMESTAMP
    `;
    const params = [newId, customerId, preference.preferredLanguageId, preference.preferredCurrency || 'EGP'];
    try {
        await db.execute(query, params);
        const updatedPref = await getCustomerPreference(customerId);
        console.log("Set Customer Preference (DB):", updatedPref);
        return updatedPref!;
    } catch (error) {
        console.error("Error setting customer preference:", error);
        throw error;
    }
}

// Get invoice templates
export async function getInvoiceTemplates(languageId?: string): Promise<InvoiceTemplate[]> {
    const db = await getDB();
    try {
        let query = "SELECT * FROM InvoiceTemplates";
        const params: any[] = [];
        if (languageId) {
            query += " WHERE languageId = ?";
            params.push(languageId);
        }
        query += " ORDER BY isDefault DESC, name";
        const results = await db.select(query, params);
        return results as InvoiceTemplate[];
    } catch (error) {
        console.error("Error fetching invoice templates:", error);
        throw error;
    }
}

// Generate invoice number
export async function generateInvoiceNumber(): Promise<string> {
    const db = await getDB();
    try {
        const result = await db.select("SELECT COUNT(*) as count FROM SalesTransactions", []);
        const count = result[0]?.count || 0;
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const sequence = String(count + 1).padStart(4, '0');
        return `INV-${year}${month}-${sequence}`;
    } catch (error) {
        console.error("Error generating invoice number:", error);
        throw error;
    }
}

// Get products for invoice items
export async function getProductsForInvoice(sale: SaleTransaction): Promise<Product[]> {
    const db = await getDB();
    try {
        // Get all product IDs from sale items
        const productIds = [...new Set(sale.items.map(item => item.productId))];

        // Fetch all products
        const results = await db.select(`SELECT ${PRODUCTS_SELECT_FIELDS} FROM Products`, []);
        const allProducts = (results as any[]).map(mapProductData);

        // Filter products that are in the sale
        return allProducts.filter(product => productIds.includes(product.id));
    } catch (error) {
        console.error("Error fetching products for invoice:", error);
        throw error;
    }
}
