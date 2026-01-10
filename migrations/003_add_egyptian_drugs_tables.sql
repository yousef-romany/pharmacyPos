-- ====================================================================
-- Migration 003: Add Egyptian Drugs Tables
-- إضافة جداول الأدوية المصرية الشاملة
-- ====================================================================

-- Create drug categories table
CREATE TABLE IF NOT EXISTS DrugCategories (
  id VARCHAR(50) PRIMARY KEY,
  categoryAR VARCHAR(255) NOT NULL UNIQUE,
  categoryEN VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Egyptian drugs table
CREATE TABLE IF NOT EXISTS EgyptianDrugs (
  id VARCHAR(50) PRIMARY KEY,
  nameAR VARCHAR(255) NOT NULL,
  nameEN VARCHAR(255) NOT NULL,
  activeIngredient VARCHAR(500) NOT NULL,
  manufacturer VARCHAR(255),
  egyptianBarcode VARCHAR(20) UNIQUE NOT NULL,
  categoryID VARCHAR(50),
  type VARCHAR(100),
  dosage VARCHAR(100),
  packaging VARCHAR(100),
  price DECIMAL(10, 2),
  registrationNumber VARCHAR(50),
  approvalDate DATE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categoryID) REFERENCES DrugCategories(id) ON DELETE SET NULL
);

-- Create indexes for fast search
CREATE INDEX idx_egyptian_drugs_name_ar ON EgyptianDrugs(nameAR);
CREATE INDEX idx_egyptian_drugs_name_en ON EgyptianDrugs(nameEN);
CREATE INDEX idx_egyptian_drugs_active_ingredient ON EgyptianDrugs(activeIngredient);
CREATE INDEX idx_egyptian_drugs_barcode ON EgyptianDrugs(egyptianBarcode);
CREATE INDEX idx_egyptian_drugs_category ON EgyptianDrugs(categoryID);
CREATE INDEX idx_egyptian_drugs_manufacturer ON EgyptianDrugs(manufacturer);

-- Create invoice languages table for multi-language invoice support
CREATE TABLE IF NOT EXISTS InvoiceLanguages (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  isRTL BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create invoice templates table
CREATE TABLE IF NOT EXISTS InvoiceTemplates (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  languageId VARCHAR(50) NOT NULL,
  templateContent TEXT NOT NULL,
  headerContent TEXT,
  footerContent TEXT,
  isDefault BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (languageId) REFERENCES InvoiceLanguages(id) ON DELETE CASCADE
);

-- Insert default invoice languages
INSERT INTO InvoiceLanguages (id, code, name, isRTL) VALUES
('lang-ar', 'ar', 'العربية', TRUE),
('lang-en', 'en', 'English', FALSE),
('lang-fr', 'fr', 'Français', FALSE),
('lang-de', 'de', 'Deutsch', FALSE),
('lang-es', 'es', 'Español', FALSE);

-- Create invoice translations table for dynamic text
CREATE TABLE IF NOT EXISTS InvoiceTranslations (
  id VARCHAR(50) PRIMARY KEY,
  languageId VARCHAR(50) NOT NULL,
  keyName VARCHAR(100) NOT NULL,
  translation TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (languageId) REFERENCES InvoiceLanguages(id) ON DELETE CASCADE,
  UNIQUE KEY unique_translation (languageId, keyName)
);

-- Insert common invoice translations for Arabic
INSERT INTO InvoiceTranslations (id, languageId, keyName, translation) VALUES
('trans-ar-invoice', 'lang-ar', 'invoice', 'فاتورة'),
('trans-ar-date', 'lang-ar', 'date', 'التاريخ'),
('trans-ar-customer', 'lang-ar', 'customer', 'العميل'),
('trans-ar-total', 'lang-ar', 'total', 'الإجمالي'),
('trans-ar-paid', 'lang-ar', 'paid', 'المدفوع'),
('trans-ar-balance', 'lang-ar', 'balance', 'المتبقي'),
('trans-ar-quantity', 'lang-ar', 'quantity', 'الكمية'),
('trans-ar-price', 'lang-ar', 'price', 'السعر'),
('trans-ar-item', 'lang-ar', 'item', 'الصنف'),
('trans-ar-subtotal', 'lang-ar', 'subtotal', 'المجموع الفرعي'),
('trans-ar-tax', 'lang-ar', 'tax', 'الضريبة'),
('trans-ar-discount', 'lang-ar', 'discount', 'الخصم'),
('trans-ar-thank-you', 'lang-ar', 'thank_you', 'شكراً لتعاملكم معنا');

-- Insert common invoice translations for English
INSERT INTO InvoiceTranslations (id, languageId, keyName, translation) VALUES
('trans-en-invoice', 'lang-en', 'invoice', 'Invoice'),
('trans-en-date', 'lang-en', 'date', 'Date'),
('trans-en-customer', 'lang-en', 'customer', 'Customer'),
('trans-en-total', 'lang-en', 'total', 'Total'),
('trans-en-paid', 'lang-en', 'paid', 'Paid'),
('trans-en-balance', 'lang-en', 'balance', 'Balance'),
('trans-en-quantity', 'lang-en', 'quantity', 'Quantity'),
('trans-en-price', 'lang-en', 'price', 'Price'),
('trans-en-item', 'lang-en', 'item', 'Item'),
('trans-en-subtotal', 'lang-en', 'subtotal', 'Subtotal'),
('trans-en-tax', 'lang-en', 'tax', 'Tax'),
('trans-en-discount', 'lang-en', 'discount', 'Discount'),
('trans-en-thank-you', 'lang-en', 'thank_you', 'Thank you for your business');

-- Insert common invoice translations for French
INSERT INTO InvoiceTranslations (id, languageId, keyName, translation) VALUES
('trans-fr-invoice', 'lang-fr', 'invoice', 'Facture'),
('trans-fr-date', 'lang-fr', 'date', 'Date'),
('trans-fr-customer', 'lang-fr', 'customer', 'Client'),
('trans-fr-total', 'lang-fr', 'total', 'Total'),
('trans-fr-paid', 'lang-fr', 'paid', 'Payé'),
('trans-fr-balance', 'lang-fr', 'balance', 'Solde'),
('trans-fr-quantity', 'lang-fr', 'quantity', 'Quantité'),
('trans-fr-price', 'lang-fr', 'price', 'Prix'),
('trans-fr-item', 'lang-fr', 'item', 'Article'),
('trans-fr-subtotal', 'lang-fr', 'subtotal', 'Sous-total'),
('trans-fr-tax', 'lang-fr', 'tax', 'Taxe'),
('trans-fr-discount', 'lang-fr', 'discount', 'Remise'),
('trans-fr-thank-you', 'lang-fr', 'thank_you', 'Merci de votre confiance');

-- Insert common invoice translations for German
INSERT INTO InvoiceTranslations (id, languageId, keyName, translation) VALUES
('trans-de-invoice', 'lang-de', 'invoice', 'Rechnung'),
('trans-de-date', 'lang-de', 'date', 'Datum'),
('trans-de-customer', 'lang-de', 'customer', 'Kunde'),
('trans-de-total', 'lang-de', 'total', 'Gesamt'),
('trans-de-paid', 'lang-de', 'paid', 'Bezahlt'),
('trans-de-balance', 'lang-de', 'balance', 'Restbetrag'),
('trans-de-quantity', 'lang-de', 'quantity', 'Menge'),
('trans-de-price', 'lang-de', 'price', 'Preis'),
('trans-de-item', 'lang-de', 'item', 'Artikel'),
('trans-de-subtotal', 'lang-de', 'subtotal', 'Zwischensumme'),
('trans-de-tax', 'lang-de', 'tax', 'Steuer'),
('trans-de-discount', 'lang-de', 'discount', 'Rabatt'),
('trans-de-thank-you', 'lang-de', 'thank_you', 'Vielen Dank für Ihren Einkauf');

-- Insert common invoice translations for Spanish
INSERT INTO InvoiceTranslations (id, languageId, keyName, translation) VALUES
('trans-es-invoice', 'lang-es', 'invoice', 'Factura'),
('trans-es-date', 'lang-es', 'date', 'Fecha'),
('trans-es-customer', 'lang-es', 'customer', 'Cliente'),
('trans-es-total', 'lang-es', 'total', 'Total'),
('trans-es-paid', 'lang-es', 'paid', 'Pagado'),
('trans-es-balance', 'lang-es', 'balance', 'Saldo'),
('trans-es-quantity', 'lang-es', 'quantity', 'Cantidad'),
('trans-es-price', 'lang-es', 'price', 'Precio'),
('trans-es-item', 'lang-es', 'item', 'Artículo'),
('trans-es-subtotal', 'lang-es', 'subtotal', 'Subtotal'),
('trans-es-tax', 'lang-es', 'tax', 'Impuesto'),
('trans-es-discount', 'lang-es', 'discount', 'Descuento'),
('trans-es-thank-you', 'lang-es', 'thank_you', 'Gracias por su compra');

-- Create customer preferences table for language selection
CREATE TABLE IF NOT EXISTS CustomerPreferences (
  id VARCHAR(50) PRIMARY KEY,
  customerId VARCHAR(36) NOT NULL,
  preferredLanguageId VARCHAR(50) NOT NULL,
  preferredCurrency VARCHAR(10) DEFAULT 'EGP',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customerId) REFERENCES Customers(id) ON DELETE CASCADE,
  UNIQUE KEY unique_customer_pref (customerId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
