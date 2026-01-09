-- Migration 001: Add version columns for optimistic concurrency control
-- 
-- This migration adds a 'version' column to tables that support concurrent updates
-- Version column is used for optimistic locking to detect concurrent modifications (FR-025)
--
-- Tables updated:
-- - Products: Track product inventory version
-- - SaleItems: Track sale item version
-- - PurchaseItems: Track purchase item version
--
-- Migration: 001_add_version_columns
-- Date: 2026-01-09
-- Author: System Performance Optimization

-- Add version column to Products table
ALTER TABLE Products 
ADD COLUMN version INT NOT NULL DEFAULT 0 
AFTER quantity;

-- Add index on version column for faster optimistic locking queries
CREATE INDEX idx_products_version ON Products(version);

-- Add version column to SaleItems table
ALTER TABLE SaleItems 
ADD COLUMN version INT NOT NULL DEFAULT 0 
AFTER total;

-- Add index on version column for faster optimistic locking queries
CREATE INDEX idx_sale_items_version ON SaleItems(version);

-- Add version column to PurchaseItems table
ALTER TABLE PurchaseItems 
ADD COLUMN version INT NOT NULL DEFAULT 0 
AFTER total;

-- Add index on version column for faster optimistic locking queries
CREATE INDEX idx_purchase_items_version ON PurchaseItems(version);

-- Log migration completion
SELECT 'Migration 001 completed: Version columns added to Products, SaleItems, PurchaseItems' AS status;
