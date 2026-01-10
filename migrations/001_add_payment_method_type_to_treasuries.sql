-- Migration 001: Add paymentMethodType to Treasuries table
--
-- This migration adds support for linking treasuries to specific payment methods
-- allowing multiple treasuries for the same payment type (e.g., multiple instapay accounts)
--
-- Migration: 001_add_payment_method_type_to_treasuries
-- Date: 2026-01-10
-- Author: System Update

USE pharmacypos;

-- Add paymentMethodType column to Treasuries table
ALTER TABLE Treasuries
ADD COLUMN IF NOT EXISTS paymentMethodType ENUM('cash', 'card', 'instapay', 'vodafone_cash', 'debt') DEFAULT NULL
AFTER description;

-- Add index for faster filtering by payment method type
CREATE INDEX IF NOT EXISTS idx_treasuries_payment_method ON Treasuries(paymentMethodType);

-- Update SalesTransactions to support new payment methods
ALTER TABLE SalesTransactions
MODIFY COLUMN paymentMethod ENUM('cash', 'card', 'debt', 'instapay', 'vodafone_cash') NOT NULL DEFAULT 'cash';

-- Log migration completion
SELECT 'Migration 001 completed: Added paymentMethodType to Treasuries and updated payment methods' AS status;
