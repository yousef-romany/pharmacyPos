# Data Model: System Performance Optimization

**Feature**: System Performance Optimization and Code Quality Review
**Branch**: `001-code-review-optimization`
**Date**: 2026-01-09

## Overview

This document defines the data model changes required to support:
1. Optimistic concurrency control (version fields)
2. Accurate numeric calculations (VARCHAR → DECIMAL migration)
3. Data integrity during migration (invalid data handling)

All existing tables retain their current structure except for the specific modifications documented below. This is a **schema evolution**, not a redesign.

## Schema Modifications

### 1. Products Table

**Purpose**: Pharmacy inventory items with pricing and stock levels

**Current Schema Issues**:
- Numeric fields stored as VARCHAR (price, cost, quantity)
- No concurrency control for simultaneous inventory updates
- Potential invalid data in numeric VARCHAR fields

**Schema Changes**:
```sql
ALTER TABLE Products
  ADD COLUMN version INT NOT NULL DEFAULT 0 AFTER id,
  MODIFY COLUMN price DECIMAL(10,2) NOT NULL,
  MODIFY COLUMN cost DECIMAL(10,2) DEFAULT NULL,
  MODIFY COLUMN quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
  MODIFY COLUMN min_stock DECIMAL(10,3) DEFAULT NULL,
  MODIFY COLUMN max_stock DECIMAL(10,3) DEFAULT NULL;
```

**Migration Handling**:
- Invalid `price` values (empty, "N/A", text) → `0.00` (logged to audit)
- Invalid `cost` values → `NULL` (optional field)
- Invalid `quantity` values → `0.000` (logged to audit - requires manual review)
- Version initialized to `0` for all existing records

**Optimistic Concurrency Pattern**:
```sql
-- Update with version check
UPDATE Products
SET quantity = :newQuantity, version = version + 1
WHERE id = :productId AND version = :expectedVersion;

-- Check affected rows:
-- 0 rows = concurrent modification detected
-- 1 row = update successful
```

**Key Fields** (existing, unchanged except types):
- `id`: BIGINT PRIMARY KEY
- `version`: INT (NEW)
- `name_ar`: VARCHAR(255) (Arabic name)
- `name_en`: VARCHAR(255) (English name)
- `barcode`: VARCHAR(100)
- `price`: DECIMAL(10,2) (MODIFIED from VARCHAR)
- `cost`: DECIMAL(10,2) (MODIFIED from VARCHAR)
- `quantity`: DECIMAL(10,3) (MODIFIED from VARCHAR)
- `unit_id`: BIGINT FOREIGN KEY → Units table
- `category_id`: BIGINT FOREIGN KEY → Categories table
- `warehouse_id`: BIGINT FOREIGN KEY → Warehouses table

### 2. SalesTransactions Table

**Purpose**: Point-of-sale transaction headers

**Current Schema Issues**:
- Monetary fields stored as VARCHAR (total_amount, paid_amount, discount)
- Causes rounding errors in financial calculations

**Schema Changes**:
```sql
ALTER TABLE SalesTransactions
  MODIFY COLUMN total_amount DECIMAL(10,2) NOT NULL,
  MODIFY COLUMN paid_amount DECIMAL(10,2) DEFAULT 0,
  MODIFY COLUMN discount DECIMAL(10,2) DEFAULT 0;
```

**Migration Handling**:
- Invalid `total_amount` → `0.00` (logged - critical data issue)
- Invalid `paid_amount` → `0.00` (logged)
- Invalid `discount` → `0.00`

**Key Fields** (existing, unchanged except types):
- `id`: BIGINT PRIMARY KEY
- `transaction_date`: DATETIME
- `total_amount`: DECIMAL(10,2) (MODIFIED)
- `paid_amount`: DECIMAL(10,2) (MODIFIED)
- `discount`: DECIMAL(10,2) (MODIFIED)
- `payment_method`: ENUM
- `customer_id`: BIGINT FOREIGN KEY → Customers (nullable)
- `user_id`: BIGINT FOREIGN KEY → Users
- `treasury_id`: BIGINT FOREIGN KEY → Treasuries

### 3. SaleItems Table

**Purpose**: Individual line items for sales transactions

**Current Schema Issues**:
- Numeric fields as VARCHAR (quantity, unit_price, total)
- No concurrency control (items can be modified during sale processing)

**Schema Changes**:
```sql
ALTER TABLE SaleItems
  ADD COLUMN version INT NOT NULL DEFAULT 0 AFTER id,
  MODIFY COLUMN quantity DECIMAL(10,3) NOT NULL,
  MODIFY COLUMN unit_price DECIMAL(10,2) NOT NULL,
  MODIFY COLUMN total DECIMAL(10,2) NOT NULL;
```

**Migration Handling**:
- Invalid `quantity` → `0.000` (logged - indicates data corruption)
- Invalid `unit_price` → `0.00` (logged)
- Invalid `total` → `0.00` (logged)
- Version initialized to `0`

**Key Fields**:
- `id`: BIGINT PRIMARY KEY
- `version`: INT (NEW)
- `sale_id`: BIGINT FOREIGN KEY → SalesTransactions
- `product_id`: BIGINT FOREIGN KEY → Products
- `quantity`: DECIMAL(10,3) (MODIFIED)
- `unit_price`: DECIMAL(10,2) (MODIFIED)
- `total`: DECIMAL(10,2) (MODIFIED)

### 4. PurchaseTransactions Table

**Purpose**: Supplier purchase order headers

**Current Schema Issues**:
- Same as SalesTransactions (VARCHAR monetary fields)

**Schema Changes**:
```sql
ALTER TABLE PurchaseTransactions
  MODIFY COLUMN total_amount DECIMAL(10,2) NOT NULL,
  MODIFY COLUMN paid_amount DECIMAL(10,2) DEFAULT 0,
  MODIFY COLUMN discount DECIMAL(10,2) DEFAULT 0;
```

**Migration Handling**: Same as SalesTransactions

**Key Fields**: Similar structure to SalesTransactions but references Suppliers instead of Customers

### 5. PurchaseItems Table

**Purpose**: Individual line items for purchase orders

**Current Schema Issues**:
- Same as SaleItems (VARCHAR numeric fields, no concurrency control)

**Schema Changes**:
```sql
ALTER TABLE PurchaseItems
  ADD COLUMN version INT NOT NULL DEFAULT 0 AFTER id,
  MODIFY COLUMN quantity DECIMAL(10,3) NOT NULL,
  MODIFY COLUMN unit_cost DECIMAL(10,2) NOT NULL,
  MODIFY COLUMN total DECIMAL(10,2) NOT NULL;
```

**Migration Handling**: Same as SaleItems

**Key Fields**: Similar to SaleItems but with `unit_cost` instead of `unit_price`

### 6. Customers Table

**Purpose**: Customer accounts with balance tracking

**Current Schema Issues**:
- Balance stored as VARCHAR

**Schema Changes**:
```sql
ALTER TABLE Customers
  MODIFY COLUMN balance DECIMAL(10,2) DEFAULT 0;
```

**Migration Handling**:
- Invalid `balance` → `0.00` (logged - affects accounts receivable)

**Key Fields**:
- `id`: BIGINT PRIMARY KEY
- `name_ar`: VARCHAR(255)
- `name_en`: VARCHAR(255)
- `phone`: VARCHAR(20)
- `address`: TEXT
- `balance`: DECIMAL(10,2) (MODIFIED)

### 7. Suppliers Table

**Purpose**: Supplier accounts with balance tracking

**Current Schema Issues**:
- Balance stored as VARCHAR

**Schema Changes**:
```sql
ALTER TABLE Suppliers
  MODIFY COLUMN balance DECIMAL(10,2) DEFAULT 0;
```

**Migration Handling**: Same as Customers

**Key Fields**: Similar structure to Customers

## Entity Relationships

```
Products ──┬─> Units (unit of measure)
           ├─> Categories
           └─> Warehouses

SalesTransactions ──┬─> Customers (optional)
                    ├─> Users (cashier)
                    ├─> Treasuries (payment destination)
                    └─> SaleItems ──> Products

PurchaseTransactions ──┬─> Suppliers
                       ├─> Users (entered by)
                       ├─> Treasuries (payment source)
                       └─> PurchaseItems ──> Products

TreasuryTransactions ──┬─> Treasuries
                       ├─> Users
                       └─> SalesTransactions OR PurchaseTransactions (nullable FKs)
```

## Migration Audit Log

The migration process will generate an audit log file: `migrations/migration-audit.log`

**Log Format**:
```
[TIMESTAMP] [TABLE] [COLUMN] [ROW_ID] [INVALID_VALUE] [CONVERTED_TO]

Examples:
2026-01-09 14:30:15 Products price 12345 "N/A" 0.00
2026-01-09 14:30:15 Products quantity 67890 "" 0.000
2026-01-09 14:30:16 SalesTransactions total_amount 54321 "invalid" 0.00
```

**Post-Migration Actions Required**:
1. Review audit log for critical issues (Products with 0 price/quantity, Sales with 0 total)
2. Pharmacy staff manually correct affected records
3. Verify financial reports match pre-migration totals
4. Archive audit log for compliance

## Data Validation Rules

**After migration, all numeric inputs must be validated**:

```typescript
// Product validation
interface ProductValidation {
  price: number    // Must be > 0 (required)
  cost: number     // Must be >= 0 or null (optional)
  quantity: number // Must be >= 0 (zero allowed for out-of-stock)
}

// Transaction validation
interface TransactionValidation {
  total_amount: number  // Must be > 0
  paid_amount: number   // Must be >= 0, <= total_amount
  discount: number      // Must be >= 0, < total_amount
}

// Item validation
interface ItemValidation {
  quantity: number    // Must be > 0
  unit_price: number  // Must be > 0
  total: number       // Must equal quantity * unit_price (within 0.01 tolerance)
}
```

## Precision and Rounding Rules

**Decimal Precision**:
- **Monetary values** (prices, costs, totals, balances): `DECIMAL(10,2)` = 2 decimal places
  - Max value: 99,999,999.99 EGP
  - Rounding: HALF_UP (standard accounting)

- **Quantities**: `DECIMAL(10,3)` = 3 decimal places
  - Supports fractional units (e.g., 1.5 kg, 2.25 liters)
  - Max value: 9,999,999.999 units

**Calculation Rules**:
```typescript
// Example: 3.5 units @ 15.99 EGP with 10% discount
const quantity = 3.5;
const unitPrice = 15.99;
const discountPercent = 10;

const subtotal = quantity * unitPrice;           // 55.965
const discountAmount = subtotal * (discountPercent / 100);  // 5.5965 → 5.60 (HALF_UP)
const total = subtotal - discountAmount;         // 50.365 → 50.37 (HALF_UP)
```

## Version Control Strategy

**Version field behavior**:
- Initialized to `0` for all existing records during migration
- Incremented by `1` on every UPDATE
- Never decremented or reset
- Used for optimistic concurrency detection

**Concurrent Update Scenario**:
```
User A reads Product(id=123, version=5, quantity=100)
User B reads Product(id=123, version=5, quantity=100)

User A sells 10 units:
  UPDATE Products SET quantity=90, version=6 WHERE id=123 AND version=5
  ✅ Success (1 row affected)

User B sells 5 units:
  UPDATE Products SET quantity=95, version=6 WHERE id=123 AND version=5
  ❌ Conflict (0 rows affected, version mismatch)
  → Retry: Re-read Product(id=123, version=6, quantity=90)
  → Retry: UPDATE Products SET quantity=85, version=7 WHERE id=123 AND version=6
  ✅ Success (1 row affected)
```

## Indexes and Performance

**Existing indexes assumed** (verify and add if missing):
```sql
-- Performance-critical indexes for JOIN queries
CREATE INDEX idx_sale_items_sale_id ON SaleItems(sale_id);
CREATE INDEX idx_sale_items_product_id ON SaleItems(product_id);
CREATE INDEX idx_purchase_items_purchase_id ON PurchaseItems(purchase_id);
CREATE INDEX idx_purchase_items_product_id ON PurchaseItems(product_id);

-- Lookup indexes
CREATE INDEX idx_products_barcode ON Products(barcode);
CREATE INDEX idx_customers_phone ON Customers(phone);
CREATE INDEX idx_sales_date ON SalesTransactions(transaction_date);
CREATE INDEX idx_purchases_date ON PurchaseTransactions(transaction_date);
```

**Version field does NOT need indexing** (always used with PRIMARY KEY in WHERE clause).

## Rollback Strategy

If migration fails or causes critical issues:

```sql
-- Rollback script (backup before migration required!)
ALTER TABLE Products
  DROP COLUMN version,
  MODIFY COLUMN price VARCHAR(255),
  MODIFY COLUMN cost VARCHAR(255),
  MODIFY COLUMN quantity VARCHAR(255);

-- Restore from backup: mysqldump file created before migration
mysql -u root -p pharmacypos < backup_pre_migration_2026-01-09.sql
```

**Rollback decision criteria**:
- More than 10% of products have invalid price/quantity data
- Financial report totals don't match pre-migration (indicates calculation errors)
- Critical data corruption detected during validation

## Summary of Changes

| Table | Columns Added | Columns Modified | Migration Risk |
|-------|---------------|------------------|----------------|
| Products | version (INT) | price, cost, quantity (DECIMAL) | MEDIUM - inventory critical |
| SalesTransactions | None | total_amount, paid_amount, discount (DECIMAL) | HIGH - financial data |
| SaleItems | version (INT) | quantity, unit_price, total (DECIMAL) | HIGH - financial data |
| PurchaseTransactions | None | total_amount, paid_amount, discount (DECIMAL) | HIGH - financial data |
| PurchaseItems | version (INT) | quantity, unit_cost, total (DECIMAL) | HIGH - financial data |
| Customers | None | balance (DECIMAL) | MEDIUM - accounts receivable |
| Suppliers | None | balance (DECIMAL) | MEDIUM - accounts payable |

**Total Impact**: 7 tables, 7 version columns added, 21 VARCHAR→DECIMAL conversions

**Estimated Migration Time**: 5-10 minutes for ~1000 products, ~1000 transactions
**Recommended Execution**: After business hours, with database backup
