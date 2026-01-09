-- Migration 000: Create base database schema
--
-- This migration creates all the initial tables for the pharmacy POS system
--
-- Tables created:
-- - Users: System users with roles
-- - Warehouses: Physical product storage locations
-- - Treasuries: Financial accounts for money management
-- - Customers: Customer information with insurance details
-- - Suppliers: Supplier/vendor information
-- - Products: Inventory items with pricing and stock info
-- - SalesTransactions: Sales records
-- - SaleTransactionItems: Line items for each sale
-- - PurchaseTransactions: Purchase records
-- - PurchaseTransactionItems: Line items for each purchase
-- - TreasuryTransactions: Financial transaction log
--
-- Migration: 000_create_base_schema
-- Date: 2026-01-09
-- Author: System Setup

USE pharmacypos;

-- Users Table
CREATE TABLE IF NOT EXISTS Users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    role ENUM('admin', 'manager', 'seller', 'accountant') NOT NULL DEFAULT 'seller',
    passwordHash VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_username (username),
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Warehouses Table (Physical Storage Locations)
CREATE TABLE IF NOT EXISTS Warehouses (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location TEXT,
    isDefault TINYINT(1) DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_warehouses_name (name),
    INDEX idx_warehouses_default (isDefault)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Treasuries Table (Financial Accounts)
CREATE TABLE IF NOT EXISTS Treasuries (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    isDefault TINYINT(1) DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_treasuries_name (name),
    INDEX idx_treasuries_default (isDefault)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customers Table
CREATE TABLE IF NOT EXISTS Customers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    balance DECIMAL(20, 4) DEFAULT 0.0000,
    insuranceCompany VARCHAR(255),
    policyNumber VARCHAR(100),
    insuranceDiscountRate DECIMAL(10, 2) DEFAULT 0.00,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customers_name (name),
    INDEX idx_customers_phone (phone),
    INDEX idx_customers_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Suppliers Table
CREATE TABLE IF NOT EXISTS Suppliers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contactPerson VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    balance DECIMAL(20, 4) DEFAULT 0.0000,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_suppliers_name (name),
    INDEX idx_suppliers_phone (phone),
    INDEX idx_suppliers_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products Table
CREATE TABLE IF NOT EXISTS Products (
    id VARCHAR(36) PRIMARY KEY,
    nameAr VARCHAR(255) NOT NULL,
    nameEn VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(255),
    concentration VARCHAR(100),
    activeIngredient VARCHAR(255),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    cost DECIMAL(10, 2) DEFAULT 0.00,
    lastPurchaseCost DECIMAL(10, 2) DEFAULT 0.00,
    quantity DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
    categoryIcon VARCHAR(100),
    barcode VARCHAR(100) UNIQUE,
    unitType VARCHAR(50) NOT NULL DEFAULT 'unit',
    subUnitType VARCHAR(50),
    subUnitsPerUnit INT DEFAULT 1,
    discountRate DECIMAL(10, 2) DEFAULT 0.00,
    expiryDate DATE,
    minStockLevel INT DEFAULT 0,
    warehouseId VARCHAR(36),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_products_name_ar (nameAr),
    INDEX idx_products_name_en (nameEn),
    INDEX idx_products_barcode (barcode),
    INDEX idx_products_warehouse (warehouseId),
    INDEX idx_products_expiry (expiryDate),
    FOREIGN KEY (warehouseId) REFERENCES Warehouses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SalesTransactions Table
CREATE TABLE IF NOT EXISTS SalesTransactions (
    id VARCHAR(36) PRIMARY KEY,
    customerId VARCHAR(36),
    totalAmount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    originalTotalAmount DECIMAL(10, 2),
    subTotalAmount DECIMAL(10, 2),
    paymentMethod ENUM('cash', 'card', 'debt') NOT NULL DEFAULT 'cash',
    amountPaid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    date DATETIME NOT NULL,
    appliedInsuranceDiscountRate DECIMAL(10, 2),
    saleWarehouseId VARCHAR(36),
    paymentTreasuryId VARCHAR(36),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sales_date (date),
    INDEX idx_sales_customer (customerId),
    INDEX idx_sales_payment_method (paymentMethod),
    INDEX idx_sales_warehouse (saleWarehouseId),
    INDEX idx_sales_treasury (paymentTreasuryId),
    FOREIGN KEY (customerId) REFERENCES Customers(id) ON DELETE SET NULL,
    FOREIGN KEY (saleWarehouseId) REFERENCES Warehouses(id) ON DELETE SET NULL,
    FOREIGN KEY (paymentTreasuryId) REFERENCES Treasuries(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SaleTransactionItems Table
CREATE TABLE IF NOT EXISTS SaleTransactionItems (
    id VARCHAR(36) PRIMARY KEY,
    saleId VARCHAR(36) NOT NULL,
    productId VARCHAR(36) NOT NULL,
    quantity DECIMAL(10, 3) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * price) STORED,
    soldUnitType ENUM('main', 'sub') NOT NULL DEFAULT 'main',
    costAtSale DECIMAL(10, 2),
    warehouseId VARCHAR(36),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sale_items_sale (saleId),
    INDEX idx_sale_items_product (productId),
    INDEX idx_sale_items_warehouse (warehouseId),
    FOREIGN KEY (saleId) REFERENCES SalesTransactions(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES Products(id) ON DELETE RESTRICT,
    FOREIGN KEY (warehouseId) REFERENCES Warehouses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PurchaseTransactions Table
CREATE TABLE IF NOT EXISTS PurchaseTransactions (
    id VARCHAR(36) PRIMARY KEY,
    supplierId VARCHAR(36) NOT NULL,
    totalAmount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    paymentStatus ENUM('paid', 'unpaid', 'partial') NOT NULL DEFAULT 'unpaid',
    amountPaid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    date DATETIME NOT NULL,
    invoiceNumber VARCHAR(100),
    destinationWarehouseId VARCHAR(36),
    paymentTreasuryId VARCHAR(36),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_purchases_date (date),
    INDEX idx_purchases_supplier (supplierId),
    INDEX idx_purchases_status (paymentStatus),
    INDEX idx_purchases_warehouse (destinationWarehouseId),
    INDEX idx_purchases_treasury (paymentTreasuryId),
    INDEX idx_purchases_invoice (invoiceNumber),
    FOREIGN KEY (supplierId) REFERENCES Suppliers(id) ON DELETE RESTRICT,
    FOREIGN KEY (destinationWarehouseId) REFERENCES Warehouses(id) ON DELETE SET NULL,
    FOREIGN KEY (paymentTreasuryId) REFERENCES Treasuries(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PurchaseTransactionItems Table
CREATE TABLE IF NOT EXISTS PurchaseTransactionItems (
    id VARCHAR(36) PRIMARY KEY,
    purchaseId VARCHAR(36) NOT NULL,
    productId VARCHAR(36) NOT NULL,
    quantity DECIMAL(10, 3) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * cost) STORED,
    expiryDate DATE,
    destinationWarehouseId VARCHAR(36),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_purchase_items_purchase (purchaseId),
    INDEX idx_purchase_items_product (productId),
    INDEX idx_purchase_items_warehouse (destinationWarehouseId),
    INDEX idx_purchase_items_expiry (expiryDate),
    FOREIGN KEY (purchaseId) REFERENCES PurchaseTransactions(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES Products(id) ON DELETE RESTRICT,
    FOREIGN KEY (destinationWarehouseId) REFERENCES Warehouses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TreasuryTransactions Table
CREATE TABLE IF NOT EXISTS TreasuryTransactions (
    id VARCHAR(36) PRIMARY KEY,
    type ENUM(
        'deposit',
        'withdrawal',
        'sale_payment',
        'purchase_payment',
        'expense',
        'transfer_in',
        'transfer_out',
        'opening_balance',
        'sale_payment_reversal',
        'purchase_payment_reversal'
    ) NOT NULL,
    amount DECIMAL(20, 4) NOT NULL,
    date DATETIME NOT NULL,
    description TEXT,
    userId VARCHAR(36),
    relatedDocumentId VARCHAR(36),
    treasuryId VARCHAR(36),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_treasury_trans_date (date),
    INDEX idx_treasury_trans_type (type),
    INDEX idx_treasury_trans_treasury (treasuryId),
    INDEX idx_treasury_trans_user (userId),
    INDEX idx_treasury_trans_related (relatedDocumentId),
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE SET NULL,
    FOREIGN KEY (treasuryId) REFERENCES Treasuries(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Log migration completion
SELECT 'Migration 000 completed: Base schema created successfully' AS status;
