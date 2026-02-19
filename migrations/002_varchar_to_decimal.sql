-- Migration 002: Convert VARCHAR to DECIMAL for numeric fields
-- 
-- This migration converts VARCHAR columns storing numeric data to proper DECIMAL types
-- Handles invalid data by converting to zero (0) and logging to audit table (FR-008a)
--
-- Tables updated:
-- - Products: price, cost, quantity
-- - SalesTransactions: total_amount, paid_amount, discount
-- - SaleItems: quantity, unit_price, total
-- - PurchaseTransactions: total_amount, paid_amount, discount
-- - PurchaseItems: quantity, unit_price, total
-- - Customers: balance
-- - Suppliers: balance
--
-- Migration: 002_varchar_to_decimal
-- Date: 2026-01-09
-- Author: System Performance Optimization

-- Create audit table for invalid data conversions (FR-008a)
CREATE TABLE IF NOT EXISTS migration_audit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  migration_id VARCHAR(50) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  column_name VARCHAR(100) NOT NULL,
  record_id VARCHAR(100),
  original_value TEXT,
  converted_value DECIMAL(20, 4),
  conversion_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster audit queries
CREATE INDEX idx_migration_audit_table ON migration_audit(table_name);
CREATE INDEX idx_migration_audit_migration ON migration_audit(migration_id);

-- ============================================
-- Products Table
-- ============================================

-- Audit and fix invalid price values
INSERT INTO migration_audit (migration_id, table_name, column_name, record_id, original_value, converted_value, conversion_reason)
SELECT 
  '002_varchar_to_decimal' as migration_id,
  'Products' as table_name,
  'price' as column_name,
  id as record_id,
  price as original_value,
  0 as converted_value,
  'Invalid numeric value' as conversion_reason
FROM Products
WHERE price IS NULL 
   OR price = '' 
   OR price REGEXP '[^0-9.-]' 
   OR price REGEXP '^-?\\..*$';

-- Audit and fix invalid cost values
INSERT INTO migration_audit (migration_id, table_name, column_name, record_id, original_value, converted_value, conversion_reason)
SELECT 
  '002_varchar_to_decimal' as migration_id,
  'Products' as table_name,
  'cost' as column_name,
  id as record_id,
  cost as original_value,
  0 as converted_value,
  'Invalid numeric value' as conversion_reason
FROM Products
WHERE cost IS NULL 
   OR cost = '' 
   OR cost REGEXP '[^0-9.-]' 
   OR cost REGEXP '^-?\\..*$';

-- Audit and fix invalid quantity values
INSERT INTO migration_audit (migration_id, table_name, column_name, record_id, original_value, converted_value, conversion_reason)
SELECT 
  '002_varchar_to_decimal' as migration_id,
  'Products' as table_name,
  'quantity' as column_name,
  id as record_id,
  quantity as original_value,
  0 as converted_value,
  'Invalid numeric value' as conversion_reason
FROM Products
WHERE quantity IS NULL 
   OR quantity = '' 
   OR quantity REGEXP '[^0-9.-]' 
   OR quantity REGEXP '^-?\\..*$';

-- Create new columns with DECIMAL type
ALTER TABLE Products 
ADD COLUMN price_new DECIMAL(10, 2) AFTER price,
ADD COLUMN cost_new DECIMAL(10, 2) AFTER cost,
ADD COLUMN quantity_new DECIMAL(10, 3) AFTER quantity;

-- Copy valid data, convert invalid to 0
UPDATE Products SET 
  price_new = CASE 
    WHEN price IS NULL OR price = '' OR price REGEXP '[^0-9.-]' OR price REGEXP '^-?\\..*$' THEN 0
    ELSE CAST(price AS DECIMAL(10, 2))
  END,
  cost_new = CASE 
    WHEN cost IS NULL OR cost = '' OR cost REGEXP '[^0-9.-]' OR cost REGEXP '^-?\\..*$' THEN 0
    ELSE CAST(cost AS DECIMAL(10, 2))
  END,
  quantity_new = CASE 
    WHEN quantity IS NULL OR quantity = '' OR quantity REGEXP '[^0-9.-]' OR quantity REGEXP '^-?\\..*$' THEN 0
    ELSE CAST(quantity AS DECIMAL(10, 3))
  END;

-- Drop old columns
ALTER TABLE Products DROP COLUMN price;
ALTER TABLE Products DROP COLUMN cost;
ALTER TABLE Products DROP COLUMN quantity;

-- Rename new columns
ALTER TABLE Products CHANGE price_new price DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE Products CHANGE cost_new cost DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE Products CHANGE quantity_new quantity DECIMAL(10, 3) NOT NULL DEFAULT 0;

-- ============================================
-- SalesTransactions Table
-- ============================================

-- Audit and fix invalid total_amount values
INSERT INTO migration_audit (migration_id, table_name, column_name, record_id, original_value, converted_value, conversion_reason)
SELECT 
  '002_varchar_to_decimal' as migration_id,
  'SalesTransactions' as table_name,
  'total_amount' as column_name,
  id as record_id,
  total_amount as original_value,
  0 as converted_value,
  'Invalid numeric value' as conversion_reason
FROM SalesTransactions
WHERE total_amount IS NULL 
   OR total_amount = '' 
   OR total_amount REGEXP '[^0-9.-]' 
   OR total_amount REGEXP '^-?\\..*$';

-- Audit and fix invalid paid_amount values
INSERT INTO migration_audit (migration_id, table_name, column_name, record_id, original_value, converted_value, conversion_reason)
SELECT 
  '002_varchar_to_decimal' as migration_id,
  'SalesTransactions' as table_name,
  'paid_amount' as column_name,
  id as record_id,
  paid_amount as original_value,
  0 as converted_value,
  'Invalid numeric value' as conversion_reason
FROM SalesTransactions
WHERE paid_amount IS NULL 
   OR paid_amount = '' 
   OR paid_amount REGEXP '[^0-9.-]' 
   OR paid_amount REGEXP '^-?\\..*$';

-- Audit and fix invalid discount values
INSERT INTO migration_audit (migration_id, table_name, column_name, record_id, original_value, converted_value, conversion_reason)
SELECT 
  '002_varchar_to_decimal' as migration_id,
  'SalesTransactions' as table_name,
  'discount' as column_name,
  id as record_id,
  discount as original_value,
  0 as converted_value,
  'Invalid numeric value' as conversion_reason
FROM SalesTransactions
WHERE discount IS NULL 
   OR discount = '' 
   OR discount REGEXP '[^0-9.-]' 
   OR discount REGEXP '^-?\\..*$';

-- Create new columns
ALTER TABLE SalesTransactions 
ADD COLUMN total_amount_new DECIMAL(10, 2) AFTER total_amount,
ADD COLUMN paid_amount_new DECIMAL(10, 2) AFTER paid_amount,
ADD COLUMN discount_new DECIMAL(10, 2) AFTER discount;

-- Copy and convert data
UPDATE SalesTransactions SET 
  total_amount_new = CASE 
    WHEN total_amount IS NULL OR total_amount = '' OR total_amount REGEXP '[^0-9.-]' OR total_amount REGEXP '^-?\\..*$' THEN 0
    ELSE CAST(total_amount AS DECIMAL(10, 2))
  END,
  paid_amount_new = CASE 
    WHEN paid_amount IS NULL OR paid_amount = '' OR paid_amount REGEXP '[^0-9.-]' OR paid_amount REGEXP '^-?\\..*$' THEN 0
    ELSE CAST(paid_amount AS DECIMAL(10, 2))
  END,
  discount_new = CASE 
    WHEN discount IS NULL OR discount = '' OR discount REGEXP '[^0-9.-]' OR discount REGEXP '^-?\\..*$' THEN 0
    ELSE CAST(discount AS DECIMAL(10, 2))
  END;

-- Drop and rename
ALTER TABLE SalesTransactions DROP COLUMN total_amount;
ALTER TABLE SalesTransactions DROP COLUMN paid_amount;
ALTER TABLE SalesTransactions DROP COLUMN discount;
ALTER TABLE SalesTransactions CHANGE total_amount_new total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE SalesTransactions CHANGE paid_amount_new paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE SalesTransactions CHANGE discount_new discount DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- ============================================
-- SaleItems Table
-- ============================================

-- Audit invalid values for SaleItems
INSERT INTO migration_audit (migration_id, table_name, column_name, record_id, original_value, converted_value, conversion_reason)
SELECT 
  '002_varchar_to_decimal' as migration_id,
  'SaleItems' as table_name,
  'quantity' as column_name,
  id as record_id,
  quantity as original_value,
  0 as converted_value,
  'Invalid numeric value' as conversion_reason
FROM SaleItems
WHERE quantity IS NULL OR quantity = '' OR quantity REGEXP '[^0-9.-]' OR quantity REGEXP '^-?\\..*$';

INSERT INTO migration_audit (migration_id, table_name, column_name, record_id, original_value, converted_value, conversion_reason)
SELECT 
  '002_varchar_to_decimal' as migration_id,
  'SaleItems' as table_name,
  'unit_price' as column_name,
  id as record_id,
  unit_price as original_value,
  0 as converted_value,
  'Invalid numeric value' as conversion_reason
FROM SaleItems
WHERE unit_price IS NULL OR unit_price = '' OR unit_price REGEXP '[^0-9.-]' OR unit_price REGEXP '^-?\\..*$';

INSERT INTO migration_audit (migration_id, table_name, column_name, record_id, original_value, converted_value, conversion_reason)
SELECT 
  '002_varchar_to_decimal' as migration_id,
  'SaleItems' as table_name,
  'total' as column_name,
  id as record_id,
  total as original_value,
  0 as converted_value,
  'Invalid numeric value' as conversion_reason
FROM SaleItems
WHERE total IS NULL OR total = '' OR total REGEXP '[^0-9.-]' OR total REGEXP '^-?\\..*$';

-- Create new columns
ALTER TABLE SaleItems 
ADD COLUMN quantity_new DECIMAL(10, 3) AFTER quantity,
ADD COLUMN unit_price_new DECIMAL(10, 2) AFTER unit_price,
ADD COLUMN total_new DECIMAL(10, 2) AFTER total;

-- Copy and convert data
UPDATE SaleItems SET 
  quantity_new = CASE 
    WHEN quantity IS NULL OR quantity = '' OR quantity REGEXP '[^0-9.-]' OR quantity REGEXP '^-?\\..*$' THEN 0
    ELSE CAST(quantity AS DECIMAL(10, 3))
  END,
  unit_price_new = CASE 
    WHEN unit_price IS NULL OR unit_price = '' OR unit_price REGEXP '[^0-9.-]' OR unit_price REGEXP '^-?\\..*$' THEN 0
    ELSE CAST(unit_price AS DECIMAL(10, 2))
  END,
  total_new = CASE 
    WHEN total IS NULL OR total = '' OR total REGEXP '[^0-9.-]' OR total REGEXP '^-?\\..*$' THEN 0
    ELSE CAST(total AS DECIMAL(10, 2))
  END;

-- Drop and rename
ALTER TABLE SaleItems DROP COLUMN quantity;
ALTER TABLE SaleItems DROP COLUMN unit_price;
ALTER TABLE SaleItems DROP COLUMN total;
ALTER TABLE SaleItems CHANGE quantity_new quantity DECIMAL(10, 3) NOT NULL DEFAULT 0;
ALTER TABLE SaleItems CHANGE unit_price_new unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE SaleItems CHANGE total_new total DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- ============================================
-- PurchaseTransactions Table
-- ============================================

-- Audit invalid values for PurchaseTransactions
INSERT INTO migration_audit (migration_id, table_name, column_name, record_id, original_value, converted_value, conversion_reason)
SELECT 
  '002_varchar_to_decimal' as migration_id,
  'PurchaseTransactions' as table_name,
  'total_amount' as column_name,
  id as record_id,
  total_amount as original_value,
  0 as converted_value,
  'Invalid numeric value' as conversion_reason
FROM PurchaseTransactions
WHERE total_amount IS NULL OR total_amount = '' OR total_amount REGEXP '[^0-9.-]' OR total_amount REGEXP '^-?\\..*$';

INSERT INTO migration_audit (migration_id, table_name, column_name, record_id, original_value, converted_value, conversion_reason)
SELECT 
  '002_varchar_to_decimal' as migration_id,
  'PurchaseTransactions' as table_name,
  'paid_amount' as column_name,
  id as record_id,
  paid_amount as original_value,
  0 as converted_value,
  'Invalid numeric value' as conversion_reason
FROM PurchaseTransactions
WHERE paid_amount IS NULL OR paid_amount = '' OR paid_amount REGEXP '[^0-9.-]' OR paid_amount REGEXP '^-?\\..*$';

INSERT INTO migration_audit (migration_id, table_name, column_name, record_id, original_value, converted_value, conversion_reason)
SELECT 
  '002_varchar_to_decimal' as migration_id,
  'PurchaseTransactions' as table_name,
  'discount' as column_name,
  id as record_id,
  discount as original_value,
  0 as converted_value,
  'Invalid numeric value' as conversion_reason
FROM PurchaseTransactions
WHERE discount IS NULL OR discount = '' OR discount REGEXP '[^0-9.-]' OR discount REGEXP '^-?\\..*$';

-- Create new columns
ALTER TABLE PurchaseTransactions 
ADD COLUMN total_amount_new DECIMAL(10, 2) AFTER total_amount,
ADD COLUMN paid_amount_new DECIMAL(10, 2) AFTER paid_amount,
ADD COLUMN discount_new DECIMAL(10, 2) AFTER discount;

-- Copy and convert data
UPDATE PurchaseTransactions SET 
  total_amount_new = CASE 
    WHEN total_amount IS NULL OR total_amount = '' OR total_amount REGEXP '[^0-9.-]' OR total_amount REGEXP '^-?\\..*$' THEN 0
    ELSE CAST(total_amount AS DECIMAL(10, 2))
  END,
  paid_amount_new = CASE 
    WHEN paid_amount IS NULL OR paid_amount = '' OR paid_amount REGEXP '[^0-9.-]' OR paid_amount REGEXP '^-?\\..*$' THEN 0
    ELSE CAST(paid_amount AS DECIMAL(10, 2))
  END,
  discount_new = CASE 
    WHEN discount IS NULL OR discount = '' OR discount REGEXP '[^0-9.-]' OR discount REGEXP '^-?\\..*$' THEN 0
    ELSE CAST(discount AS DECIMAL(10, 2))
  END;

-- Drop and rename
ALTER TABLE PurchaseTransactions DROP COLUMN total_amount;
ALTER TABLE PurchaseTransactions DROP COLUMN paid_amount;
ALTER TABLE PurchaseTransactions DROP COLUMN discount;
ALTER TABLE PurchaseTransactions CHANGE total_amount_new total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE PurchaseTransactions CHANGE paid_amount_new paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE PurchaseTransactions CHANGE discount_new discount DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- ============================================
-- PurchaseItems Table
-- ============================================

-- Audit invalid values for PurchaseItems
INSERT INTO migration_audit (migration_id, table_name, column_name, record_id, original_value, converted_value, conversion_reason)
SELECT 
  '002_varchar_to_decimal' as migration_id,
  'PurchaseItems' as table_name,
  'quantity' as column_name,
  id as record_id,
  quantity as original_value,
  0 as converted_value,
  'Invalid numeric value' as conversion_reason
FROM PurchaseItems
WHERE quantity IS NULL OR quantity = '' OR quantity REGEXP '[^0-9.-]' OR quantity REGEXP '^-?\\..*$';

INSERT INTO migration_audit (migration_id, table_name, column_name, record_id, original_value, converted_value, conversion_reason)
SELECT 
  '002_varchar_to_decimal' as migration_id,
  'PurchaseItems' as table_name,
  'unit_price' as column_name,
  id as record_id,
  unit_price as original_value,
  0 as converted_value,
  'Invalid numeric value' as conversion_reason
FROM PurchaseItems
WHERE unit_price IS NULL OR unit_price = '' OR unit_price REGEXP '[^0-9.-]' OR unit_price REGEXP '^-?\\..*$';

INSERT INTO migration_audit (migration_id, table_name, column_name, record_id, original_value, converted_value, conversion_reason)
SELECT 
  '002_varchar_to_decimal' as migration_id,
  'PurchaseItems' as table_name,
  'total' as column_name,
  id as record_id,
  total as original_value,
  0 as converted_value,
  'Invalid numeric value' as conversion_reason
FROM PurchaseItems
WHERE total IS NULL OR total = '' OR total REGEXP '[^0-9.-]' OR total REGEXP '^-?\\..*$';

-- Create new columns
ALTER TABLE PurchaseItems 
ADD COLUMN quantity_new DECIMAL(10, 3) AFTER quantity,
ADD COLUMN unit_price_new DECIMAL(10, 2) AFTER unit_price,
ADD COLUMN total_new DECIMAL(10, 2) AFTER total;

-- Copy and convert data
UPDATE PurchaseItems SET 
  quantity_new = CASE 
    WHEN quantity IS NULL OR quantity = '' OR quantity REGEXP '[^0-9.-]' OR quantity REGEXP '^-?\\..*$' THEN 0
    ELSE CAST(quantity AS DECIMAL(10, 3))
  END,
  unit_price_new = CASE 
    WHEN unit_price IS NULL OR unit_price = '' OR unit_price REGEXP '[^0-9.-]' OR unit_price REGEXP '^-?\\..*$' THEN 0
    ELSE CAST(unit_price AS DECIMAL(10, 2))
  END,
  total_new = CASE 
    WHEN total IS NULL OR total = '' OR total REGEXP '[^0-9.-]' OR total REGEXP '^-?\\..*$' THEN 0
    ELSE CAST(total AS DECIMAL(10, 2))
  END;

-- Drop and rename
ALTER TABLE PurchaseItems DROP COLUMN quantity;
ALTER TABLE PurchaseItems DROP COLUMN unit_price;
ALTER TABLE PurchaseItems DROP COLUMN total;
ALTER TABLE PurchaseItems CHANGE quantity_new quantity DECIMAL(10, 3) NOT NULL DEFAULT 0;
ALTER TABLE PurchaseItems CHANGE unit_price_new unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE PurchaseItems CHANGE total_new total DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- ============================================
-- Customers Table
-- ============================================

-- Audit invalid balance values
INSERT INTO migration_audit (migration_id, table_name, column_name, record_id, original_value, converted_value, conversion_reason)
SELECT 
  '002_varchar_to_decimal' as migration_id,
  'Customers' as table_name,
  'balance' as column_name,
  id as record_id,
  balance as original_value,
  0 as converted_value,
  'Invalid numeric value' as conversion_reason
FROM Customers
WHERE balance IS NULL OR balance = '' OR balance REGEXP '[^0-9.-]' OR balance REGEXP '^-?\\..*$';

-- Create new column
ALTER TABLE Customers 
ADD COLUMN balance_new DECIMAL(10, 2) AFTER balance;

-- Copy and convert data
UPDATE Customers SET 
  balance_new = CASE 
    WHEN balance IS NULL OR balance = '' OR balance REGEXP '[^0-9.-]' OR balance REGEXP '^-?\\..*$' THEN 0
    ELSE CAST(balance AS DECIMAL(10, 2))
  END;

-- Drop and rename
ALTER TABLE Customers DROP COLUMN balance;
ALTER TABLE Customers CHANGE balance_new balance DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- ============================================
-- Suppliers Table
-- ============================================

-- Audit invalid balance values
INSERT INTO migration_audit (migration_id, table_name, column_name, record_id, original_value, converted_value, conversion_reason)
SELECT 
  '002_varchar_to_decimal' as migration_id,
  'Suppliers' as table_name,
  'balance' as column_name,
  id as record_id,
  balance as original_value,
  0 as converted_value,
  'Invalid numeric value' as conversion_reason
FROM Suppliers
WHERE balance IS NULL OR balance = '' OR balance REGEXP '[^0-9.-]' OR balance REGEXP '^-?\\..*$';

-- Create new column
ALTER TABLE Suppliers 
ADD COLUMN balance_new DECIMAL(10, 2) AFTER balance;

-- Copy and convert data
UPDATE Suppliers SET 
  balance_new = CASE 
    WHEN balance IS NULL OR balance = '' OR balance REGEXP '[^0-9.-]' OR balance REGEXP '^-?\\..*$' THEN 0
    ELSE CAST(balance AS DECIMAL(10, 2))
  END;

-- Drop and rename
ALTER TABLE Suppliers DROP COLUMN balance;
ALTER TABLE Suppliers CHANGE balance_new balance DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- ============================================
-- Migration Summary
-- ============================================

-- Log migration completion with summary
SELECT 
  'Migration 002 completed' AS status,
  (SELECT COUNT(*) FROM migration_audit WHERE migration_id = '002_varchar_to_decimal') AS invalid_records_converted,
  NOW() AS completed_at;
