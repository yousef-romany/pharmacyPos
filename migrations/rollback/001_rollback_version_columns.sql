-- Rollback Script: 001_add_version_columns
-- 
-- This script removes version columns and indexes added by migration 001
-- WARNING: This rollback will lose optimistic concurrency control
--
-- Tables affected:
-- - Products: Remove version column and index
-- - SaleItems: Remove version column and index
-- - PurchaseItems: Remove version column and index
--
-- Rollback for: 001_add_version_columns
-- Date: 2026-01-09
-- Author: System Performance Optimization

-- ============================================
-- Products Table
-- ============================================

-- Drop version index
DROP INDEX IF EXISTS idx_products_version ON Products;

-- Drop version column
ALTER TABLE Products DROP COLUMN version;

-- ============================================
-- SaleItems Table
-- ============================================

-- Drop version index
DROP INDEX IF EXISTS idx_sale_items_version ON SaleItems;

-- Drop version column
ALTER TABLE SaleItems DROP COLUMN version;

-- ============================================
-- PurchaseItems Table
-- ============================================

-- Drop version index
DROP INDEX IF EXISTS idx_purchase_items_version ON PurchaseItems;

-- Drop version column
ALTER TABLE PurchaseItems DROP COLUMN version;

-- ============================================
-- Rollback Summary
-- ============================================

-- Log rollback completion
SELECT 'Rollback 001 completed: Version columns removed from Products, SaleItems, PurchaseItems' AS status;
