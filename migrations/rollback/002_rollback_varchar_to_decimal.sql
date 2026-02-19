-- Rollback Script: 002_varchar_to_decimal
-- 
-- This script converts DECIMAL columns back to VARCHAR (reversing migration 002)
-- WARNING: This rollback will lose DECIMAL type precision and reintroduce string-based numeric storage
--
-- Tables affected:
-- - Products: price, cost, quantity (DECIMAL → VARCHAR)
-- - SalesTransactions: total_amount, paid_amount, discount (DECIMAL → VARCHAR)
-- - SaleItems: quantity, unit_price, total (DECIMAL → VARCHAR)
-- - PurchaseTransactions: total_amount, paid_amount, discount (DECIMAL → VARCHAR)
-- - PurchaseItems: quantity, unit_price, total (DECIMAL → VARCHAR)
-- - Customers: balance (DECIMAL → VARCHAR)
-- - Suppliers: balance (DECIMAL → VARCHAR)
--
-- Rollback for: 002_varchar_to_decimal
-- Date: 2026-01-09
-- Author: System Performance Optimization

-- ============================================
-- Products Table
-- ============================================

-- Create new VARCHAR columns
ALTER TABLE Products 
ADD COLUMN price_old VARCHAR(50) AFTER price,
ADD COLUMN cost_old VARCHAR(50) AFTER cost,
ADD COLUMN quantity_old VARCHAR(50) AFTER quantity;

-- Copy data from DECIMAL to VARCHAR
UPDATE Products SET 
  price_old = CAST(price AS CHAR),
  cost_old = CAST(cost AS CHAR),
  quantity_old = CAST(quantity AS CHAR);

-- Drop DECIMAL columns
ALTER TABLE Products DROP COLUMN price;
ALTER TABLE Products DROP COLUMN cost;
ALTER TABLE Products DROP COLUMN quantity;

-- Rename VARCHAR columns back to original names
ALTER TABLE Products CHANGE price_old price VARCHAR(50);
ALTER TABLE Products CHANGE cost_old cost VARCHAR(50);
ALTER TABLE Products CHANGE quantity_old quantity VARCHAR(50);

-- ============================================
-- SalesTransactions Table
-- ============================================

-- Create new VARCHAR columns
ALTER TABLE SalesTransactions 
ADD COLUMN total_amount_old VARCHAR(50) AFTER total_amount,
ADD COLUMN paid_amount_old VARCHAR(50) AFTER paid_amount,
ADD COLUMN discount_old VARCHAR(50) AFTER discount;

-- Copy data from DECIMAL to VARCHAR
UPDATE SalesTransactions SET 
  total_amount_old = CAST(total_amount AS CHAR),
  paid_amount_old = CAST(paid_amount AS CHAR),
  discount_old = CAST(discount AS CHAR);

-- Drop DECIMAL columns
ALTER TABLE SalesTransactions DROP COLUMN total_amount;
ALTER TABLE SalesTransactions DROP COLUMN paid_amount;
ALTER TABLE SalesTransactions DROP COLUMN discount;

-- Rename VARCHAR columns back to original names
ALTER TABLE SalesTransactions CHANGE total_amount_old total_amount VARCHAR(50);
ALTER TABLE SalesTransactions CHANGE paid_amount_old paid_amount VARCHAR(50);
ALTER TABLE SalesTransactions CHANGE discount_old discount VARCHAR(50);

-- ============================================
-- SaleItems Table
-- ============================================

-- Create new VARCHAR columns
ALTER TABLE SaleItems 
ADD COLUMN quantity_old VARCHAR(50) AFTER quantity,
ADD COLUMN unit_price_old VARCHAR(50) AFTER unit_price,
ADD COLUMN total_old VARCHAR(50) AFTER total;

-- Copy data from DECIMAL to VARCHAR
UPDATE SaleItems SET 
  quantity_old = CAST(quantity AS CHAR),
  unit_price_old = CAST(unit_price AS CHAR),
  total_old = CAST(total AS CHAR);

-- Drop DECIMAL columns
ALTER TABLE SaleItems DROP COLUMN quantity;
ALTER TABLE SaleItems DROP COLUMN unit_price;
ALTER TABLE SaleItems DROP COLUMN total;

-- Rename VARCHAR columns back to original names
ALTER TABLE SaleItems CHANGE quantity_old quantity VARCHAR(50);
ALTER TABLE SaleItems CHANGE unit_price_old unit_price VARCHAR(50);
ALTER TABLE SaleItems CHANGE total_old total VARCHAR(50);

-- ============================================
-- PurchaseTransactions Table
-- ============================================

-- Create new VARCHAR columns
ALTER TABLE PurchaseTransactions 
ADD COLUMN total_amount_old VARCHAR(50) AFTER total_amount,
ADD COLUMN paid_amount_old VARCHAR(50) AFTER paid_amount,
ADD COLUMN discount_old VARCHAR(50) AFTER discount;

-- Copy data from DECIMAL to VARCHAR
UPDATE PurchaseTransactions SET 
  total_amount_old = CAST(total_amount AS CHAR),
  paid_amount_old = CAST(paid_amount AS CHAR),
  discount_old = CAST(discount AS CHAR);

-- Drop DECIMAL columns
ALTER TABLE PurchaseTransactions DROP COLUMN total_amount;
ALTER TABLE PurchaseTransactions DROP COLUMN paid_amount;
ALTER TABLE PurchaseTransactions DROP COLUMN discount;

-- Rename VARCHAR columns back to original names
ALTER TABLE PurchaseTransactions CHANGE total_amount_old total_amount VARCHAR(50);
ALTER TABLE PurchaseTransactions CHANGE paid_amount_old paid_amount VARCHAR(50);
ALTER TABLE PurchaseTransactions CHANGE discount_old discount VARCHAR(50);

-- ============================================
-- PurchaseItems Table
-- ============================================

-- Create new VARCHAR columns
ALTER TABLE PurchaseItems 
ADD COLUMN quantity_old VARCHAR(50) AFTER quantity,
ADD COLUMN unit_price_old VARCHAR(50) AFTER unit_price,
ADD COLUMN total_old VARCHAR(50) AFTER total;

-- Copy data from DECIMAL to VARCHAR
UPDATE PurchaseItems SET 
  quantity_old = CAST(quantity AS CHAR),
  unit_price_old = CAST(unit_price AS CHAR),
  total_old = CAST(total AS CHAR);

-- Drop DECIMAL columns
ALTER TABLE PurchaseItems DROP COLUMN quantity;
ALTER TABLE PurchaseItems DROP COLUMN unit_price;
ALTER TABLE PurchaseItems DROP COLUMN total;

-- Rename VARCHAR columns back to original names
ALTER TABLE PurchaseItems CHANGE quantity_old quantity VARCHAR(50);
ALTER TABLE PurchaseItems CHANGE unit_price_old unit_price VARCHAR(50);
ALTER TABLE PurchaseItems CHANGE total_old total VARCHAR(50);

-- ============================================
-- Customers Table
-- ============================================

-- Create new VARCHAR column
ALTER TABLE Customers 
ADD COLUMN balance_old VARCHAR(50) AFTER balance;

-- Copy data from DECIMAL to VARCHAR
UPDATE Customers SET 
  balance_old = CAST(balance AS CHAR);

-- Drop DECIMAL column
ALTER TABLE Customers DROP COLUMN balance;

-- Rename VARCHAR column back to original name
ALTER TABLE Customers CHANGE balance_old balance VARCHAR(50);

-- ============================================
-- Suppliers Table
-- ============================================

-- Create new VARCHAR column
ALTER TABLE Suppliers 
ADD COLUMN balance_old VARCHAR(50) AFTER balance;

-- Copy data from DECIMAL to VARCHAR
UPDATE Suppliers SET 
  balance_old = CAST(balance AS CHAR);

-- Drop DECIMAL column
ALTER TABLE Suppliers DROP COLUMN balance;

-- Rename VARCHAR column back to original name
ALTER TABLE Suppliers CHANGE balance_old balance VARCHAR(50);

-- ============================================
-- Optional: Drop Migration Audit Table
-- ============================================

-- Uncomment the following line to remove the audit table if desired
-- DROP TABLE IF EXISTS migration_audit;

-- ============================================
-- Rollback Summary
-- ============================================

-- Log rollback completion
SELECT 
  'Rollback 002 completed' AS status,
  'All DECIMAL columns converted back to VARCHAR' AS details,
  NOW() AS completed_at;
