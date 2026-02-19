# دليل الأدوية المصرية والفواتير متعددة اللغات
# Egyptian Drugs Database & Multi-language Invoices Guide

## 📋 نظرة عامة

هذا الدليل يشرح كيفية استخدام قاعدة بيانات الأدوية المصرية الشاملة ودعم إصدار الفواتير بلغات متعددة في نظام نقطة البيع الصيدلية.

---

## 🏥 قاعدة بيانات الأدوية المصرية

### الجداول الجديدة

تم إضافة الجداول التالية إلى قاعدة البيانات:

#### 1. جدول الفئات العلاجية (`DrugCategories`)
```sql
CREATE TABLE DrugCategories (
  id VARCHAR(50) PRIMARY KEY,
  categoryAR VARCHAR(255) NOT NULL,      -- اسم الفئة بالعربية
  categoryEN VARCHAR(255) NOT NULL,      -- اسم الفئة بالإنجليزية
  description TEXT,                        -- وصف الفئة
  createdAt DATETIME
)
```

#### 2. جدول الأدوية المصرية (`EgyptianDrugs`)
```sql
CREATE TABLE EgyptianDrugs (
  id VARCHAR(50) PRIMARY KEY,
  nameAR VARCHAR(255) NOT NULL,          -- اسم الدواء بالعربية
  nameEN VARCHAR(255) NOT NULL,          -- اسم الدواء بالإنجليزية
  activeIngredient VARCHAR(500) NOT NULL,  -- المادة الفعالة
  manufacturer VARCHAR(255),              -- الشركة المصنعة
  egyptianBarcode VARCHAR(20) UNIQUE,     -- الباركود المصري
  categoryID VARCHAR(50),                -- معرف الفئة
  type VARCHAR(100),                     -- النوع (أقراص، شراب، إبرة، إلخ)
  dosage VARCHAR(100),                    -- الجرعة
  packaging VARCHAR(100),                  -- التغليف
  price DECIMAL(10, 2),                 -- السعر
  registrationNumber VARCHAR(50),           -- رقم التسجيل
  approvalDate DATE,                     -- تاريخ الموافقة
  createdAt DATETIME,
  updatedAt DATETIME,
  FOREIGN KEY (categoryID) REFERENCES DrugCategories(id)
)
```

### الفئات العلاجية (16 فئة)

| # | الفئة العربية | الفئة الإنجليزية | عدد الأدوية |
|---|---|---|---|
| 1 | مسكنات الألم والحمى | Pain Relievers & Fever Reducers | 8 |
| 2 | مضادات الالتهاب غير الستيروئيدية | NSAIDs | 19 |
| 3 | المضادات الحيوية - البنسلين | Antibiotics - Penicillins | 10 |
| 4 | المضادات الحيوية - السيفالوسبورين | Antibiotics - Cephalosporins | 8 |
| 5 | المضادات الحيوية - الماكروليدات | Antibiotics - Macrolides | 7 |
| 6 | المضادات الحيوية - الفلوروكينولونات | Antibiotics - Fluoroquinolones | 5 |
| 7 | مضادات الميكروبات | Antimicrobials | 6 |
| 8 | أدوية الجهاز التنفسي | Respiratory System Drugs | 8 |
| 9 | مضادات الحساسية | Antihistamines | 5 |
| 10 | أدوية الجهاز الهضمي | Gastrointestinal Drugs | 8 |
| 11 | أدوية السكري | Diabetes Medications | 11 |
| 12 | أدوية القلب والأوعية الدموية | Cardiovascular Drugs | 17 |
| 13 | خافضات الكوليسترول والدهون | Lipid-Lowering Drugs | 5 |
| 14 | أدوية الجهاز العصبي والنفسي | CNS Medications | 13 |
| 15 | أدوية الغدد الصماء | Endocrine System Drugs | 6 |
| 16 | الفيتامينات والمكملات | Vitamins & Supplements | 16 |

**إجمالي الأدوية: 152 دواء**

---

## 📄 دعم الفواتير متعددة اللغات

### الجداول الجديدة

#### 1. جدول اللغات المدعومة (`InvoiceLanguages`)
```sql
CREATE TABLE InvoiceLanguages (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(10) NOT NULL,      -- كود اللغة (ar, en, fr, de, es)
  name VARCHAR(100) NOT NULL,       -- اسم اللغة
  isRTL BOOLEAN DEFAULT FALSE,         -- هل اللغة من اليمين لليسار؟
  createdAt DATETIME
)
```

#### 2. جدول الترجمات (`InvoiceTranslations`)
```sql
CREATE TABLE InvoiceTranslations (
  id VARCHAR(50) PRIMARY KEY,
  languageId VARCHAR(50) NOT NULL,
  keyName VARCHAR(100) NOT NULL,    -- مفتاح الترجمة
  translation TEXT NOT NULL,            -- النص المترجم
  createdAt DATETIME,
  updatedAt DATETIME,
  FOREIGN KEY (languageId) REFERENCES InvoiceLanguages(id),
  UNIQUE KEY unique_translation (languageId, keyName)
)
```

#### 3. جدول القوالب (`InvoiceTemplates`)
```sql
CREATE TABLE InvoiceTemplates (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  languageId VARCHAR(50) NOT NULL,
  templateContent TEXT NOT NULL,       -- محتوى القالب
  headerContent TEXT,                 -- رأس الفاتورة
  footerContent TEXT,                 -- تذييل الفاتورة
  isDefault BOOLEAN DEFAULT FALSE,       -- هل هو القالب الافتراضي؟
  createdAt DATETIME,
  updatedAt DATETIME,
  FOREIGN KEY (languageId) REFERENCES InvoiceLanguages(id)
)
```

#### 4. جدول تفضيلات العملاء (`CustomerPreferences`)
```sql
CREATE TABLE CustomerPreferences (
  id VARCHAR(50) PRIMARY KEY,
  customerId VARCHAR(50) NOT NULL,
  preferredLanguageId VARCHAR(50) NOT NULL,   -- اللغة المفضلة للعميل
  preferredCurrency VARCHAR(10) DEFAULT 'EGP', -- العملة المفضلة
  createdAt DATETIME,
  updatedAt DATETIME,
  FOREIGN KEY (customerId) REFERENCES Customers(id),
  FOREIGN KEY (preferredLanguageId) REFERENCES InvoiceLanguages(id),
  UNIQUE KEY unique_customer_pref (customerId)
)
```

### اللغات المدعومة

| كود | اللغة | RTL | أمثلة |
|---|---|---|---|
| `ar` | العربية | ✅ | فاتورة، التاريخ، العميل |
| `en` | English | ❌ | Invoice, Date, Customer |
| `fr` | Français | ❌ | Facture, Date, Client |
| `de` | Deutsch | ❌ | Rechnung, Datum, Kunde |
| `es` | Español | ❌ | Factura, Fecha, Cliente |

### المفاتيح المدعومة للترجمة

| المفتاح | العربية | English | Français | Deutsch | Español |
|---|---|---|---|---|
| `invoice` | فاتورة | Invoice | Facture | Rechnung | Factura |
| `date` | التاريخ | Date | Date | Datum | Fecha |
| `customer` | العميل | Customer | Client | Kunde | Cliente |
| `total` | الإجمالي | Total | Total | Gesamt | Total |
| `paid` | المدفوع | Paid | Payé | Bezahlt | Pagado |
| `balance` | المتبقي | Balance | Solde | Restbetrag | Saldo |
| `quantity` | الكمية | Quantity | Quantité | Menge | Cantidad |
| `price` | السعر | Price | Prix | Preis | Precio |
| `item` | الصنف | Item | Article | Artikel | Artículo |
| `subtotal` | المجموع الفرعي | Subtotal | Sous-total | Zwischensumme | Subtotal |
| `tax` | الضريبة | Tax | Taxe | Steuer | Impuesto |
| `discount` | الخصم | Discount | Remise | Rabatt | Descuento |
| `thank_you` | شكراً لتعاملكم معنا | Thank you for your business | Merci de votre confiance | Vielen Dank für Ihren Einkauf | Gracias por su compra |

---

## 💻 استخدام الدوال البرمجية

### أنواع TypeScript الجديدة

تم إضافة الأنواع التالية في [`src/lib/types.ts`](../src/lib/types.ts):

```typescript
// أنواع الأدوية المصرية
export interface DrugCategory {
  id: string;
  categoryAR: string;
  categoryEN: string;
  description?: string;
  createdAt?: Date;
}

export interface EgyptianDrug {
  id: string;
  nameAR: string;
  nameEN: string;
  activeIngredient: string;
  manufacturer?: string;
  egyptianBarcode: string;
  categoryID?: string;
  categoryAR?: string;
  categoryEN?: string;
  type: string;
  dosage?: string;
  packaging?: string;
  price?: number;
  registrationNumber?: string;
  approvalDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// أنواع الفواتير متعددة اللغات
export interface InvoiceLanguage {
  id: string;
  code: string;
  name: string;
  isRTL: boolean;
  createdAt?: Date;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  languageId: string;
  templateContent: string;
  headerContent?: string;
  footerContent?: string;
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InvoiceTranslation {
  id: string;
  languageId: string;
  keyName: string;
  translation: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CustomerPreference {
  id: string;
  customerId: string;
  preferredLanguageId: string;
  preferredCurrency?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### دوال البيانات الجديدة

تم إضافة الدوال التالية في [`src/lib/data.ts`](../src/lib/data.ts):

#### دوال الأدوية المصرية

```typescript
// الحصول على جميع الفئات العلاجية
export async function getDrugCategories(): Promise<DrugCategory[]>

// إضافة فئة علاجية جديدة
export async function addDrugCategory(categoryData: Omit<DrugCategory, 'id'>): Promise<DrugCategory>

// البحث عن الأدوية المصرية
export async function getEgyptianDrugs(filters?: {
  categoryId?: string;
  search?: string;
  manufacturer?: string;
}): Promise<EgyptianDrug[]>

// البحث عن دواء بالباركود
export async function getEgyptianDrugByBarcode(barcode: string): Promise<EgyptianDrug | undefined>

// إضافة دواء مصري جديد
export async function addEgyptianDrug(drugData: Omit<EgyptianDrug, 'id' | 'categoryAR' | 'categoryEN' | 'createdAt' | 'updatedAt'>): Promise<EgyptianDrug>
```

#### دوال الفواتير متعددة اللغات

```typescript
// الحصول على اللغات المدعومة
export async function getInvoiceLanguages(): Promise<InvoiceLanguage[]>

// الحصول على الترجمات للغة محددة
export async function getInvoiceTranslations(languageId: string): Promise<Record<string, string>>

// الحصول على تفضيلات العميل
export async function getCustomerPreference(customerId: string): Promise<CustomerPreference | undefined>

// تعيين تفضيلات العميل
export async function setCustomerPreference(customerId: string, preference: Omit<CustomerPreference, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>): Promise<CustomerPreference>

// الحصول على قوالب الفواتير
export async function getInvoiceTemplates(languageId?: string): Promise<InvoiceTemplate[]>

// توليد رقم فاتورة تلقائي
export async function generateInvoiceNumber(): Promise<string>
```

### بيانات الأدوية الأولية

تم إنشاء ملف [`src/lib/egyptian-drugs-data.ts`](../src/lib/egyptian-drugs-data.ts) يحتوي على:

- **16 فئة علاجية** مع أسماء عربية وإنجليزية
- **152 دواء مصري** مع تفاصيل كاملة:
  - اسم الدواء (عربي وإنجليزي)
  - المادة الفعالة
  - الشركة المصنعة
  - الباركود المصري (6221XXXXXXXXX)
  - الفئة العلاجية
  - النوع والجرعة والتغليف
  - السعر (اختياري)

#### دوال مساعدة للبحث

```typescript
// البحث في قاعدة بيانات الأدوية
export function searchEgyptianDrugs(
  query: string, 
  searchField: 'nameAR' | 'nameEN' | 'activeIngredient' | 'egyptianBarcode' = 'nameAR'
): EgyptianDrugData[]

// الحصول على الأدوية حسب الفئة
export function getEgyptianDrugsByCategory(categoryId: string): EgyptianDrugData[]

// الحصول على دواء بالباركود
export function getEgyptianDrugByBarcode(barcode: string): EgyptianDrugData | undefined
```

---

## 🚀 أمثلة الاستخدام

### مثال 1: البحث عن دواء بالاسم العربي

```typescript
import { getEgyptianDrugs } from '@/lib/data';

// البحث عن أدوية تحتوي على "باناسول"
const results = await getEgyptianDrugs({ search: 'باناسول' });

// النتائج ستشمل:
// - باناسول (Panadol)
// - باناسول إكسترا (Panadol Extra)
```

### مثال 2: البحث عن دواء بالباركود

```typescript
import { getEgyptianDrugByBarcode } from '@/lib/data';

const barcode = '6221100001001';
const drug = await getEgyptianDrugByBarcode(barcode);

if (drug) {
  console.log(`الدواء: ${drug.nameAR} / ${drug.nameEN}`);
  console.log(`المادة الفعالة: ${drug.activeIngredient}`);
  console.log(`الشركة: ${drug.manufacturer}`);
}
```

### مثال 3: إصدار فاتورة بلغة مخصصة

```typescript
import { 
  getInvoiceTranslations, 
  getCustomerPreference,
  generateInvoiceNumber 
} from '@/lib/data';

// الحصول على تفضيلات العميل
const customerPref = await getCustomerPreference('cust-123');

// استخدام لغة العميل المفضلة أو العربية كافتراضي
const languageId = customerPref?.preferredLanguageId || 'lang-ar';

// الحصول على الترجمات
const translations = await getInvoiceTranslations(languageId);

// توليد رقم الفاتورة
const invoiceNumber = await generateInvoiceNumber();

// طباعة الفاتورة باللغة المحددة
console.log(`${translations.invoice}: ${invoiceNumber}`);
console.log(`${translations.date}: ${new Date().toLocaleDateString()}`);
console.log(`${translations.customer}: ${customerName}`);
```

### مثال 4: إضافة دواء مصري جديد

```typescript
import { addEgyptianDrug } from '@/lib/data';

const newDrug = await addEgyptianDrug({
  nameAR: 'دواء جديد',
  nameEN: 'New Drug',
  activeIngredient: 'Active Ingredient 100mg',
  manufacturer: 'Egyptian Pharma',
  egyptianBarcode: '6221100090001',
  categoryID: 'cat-001',
  type: 'Tablet',
  dosage: '100mg',
  packaging: '20 tablets',
  price: 25.50
});
```

---

## 🔄 ترحيل قاعدة البيانات

### تنفيذ ملف الترحيل

```bash
# تنفيذ ملف الترحيل الجديد
mysql -u root -p pharmacypos < migrations/003_add_egyptian_drugs_tables.sql
```

### التحقق من الترحيل

```sql
-- التحقق من إنشاء الجداول
SHOW TABLES LIKE 'Drug%';
SHOW TABLES LIKE 'Invoice%';
SHOW TABLES LIKE 'Customer%';

-- التحقق من البيانات الأولية
SELECT COUNT(*) as categories_count FROM DrugCategories;
SELECT COUNT(*) as drugs_count FROM EgyptianDrugs;
SELECT COUNT(*) as languages_count FROM InvoiceLanguages;
SELECT COUNT(*) as translations_count FROM InvoiceTranslations;
```

---

## 📊 إحصائيات قاعدة البيانات

| الجدول | عدد السجلات المتوقعة | ملاحظات |
|---|---|---|
| `DrugCategories` | 16 فئة | فئات علاجية شاملة |
| `EgyptianDrugs` | 152 دواء | أدوية مصرية مشهورة |
| `InvoiceLanguages` | 5 لغات | عربي، إنجليزي، فرنسي، ألماني، إسباني |
| `InvoiceTranslations` | 55 ترجمة | 11 مفتاح × 5 لغات |
| `InvoiceTemplates` | 0 قالب | يمكن إضافة قوالب مخصصة |
| `CustomerPreferences` | 0 تفضيل | سيتم إنشاؤها عند استخدام الميزة |

---

## 🎨 تخصيص الفواتير

### إنشاء قالب فاتورة مخصص

```typescript
import { addInvoiceTemplate } from '@/lib/data';

// قالب فاتورة عربي
const arabicTemplate = await addInvoiceTemplate({
  name: 'قالب عربي بسيط',
  languageId: 'lang-ar',
  templateContent: `
    <div class="invoice" dir="rtl">
      <h1>{{invoice}}</h1>
      <p>{{date}}: {{invoiceDate}}</p>
      <p>{{customer}}: {{customerName}}</p>
      <table>
        <thead>
          <tr>
            <th>{{item}}</th>
            <th>{{quantity}}</th>
            <th>{{price}}</th>
            <th>{{total}}</th>
          </tr>
        </thead>
        <tbody>
          {{items}}
        </tbody>
      </table>
      <p>{{subtotal}}: {{subtotalAmount}}</p>
      <p>{{total}}: {{totalAmount}}</p>
      <p>{{thank_you}}</p>
    </div>
  `,
  isDefault: true
});
```

### استخدام القالب

```typescript
import { getInvoiceTemplates } from '@/lib/data';

// الحصول على قالب الفاتورة للغة العربية
const templates = await getInvoiceTemplates('lang-ar');
const defaultTemplate = templates.find(t => t.isDefault);

// استبدال المتغيرات بالقيم الفعلية
const renderedInvoice = defaultTemplate.templateContent
  .replace('{{invoice}}', translations.invoice)
  .replace('{{invoiceDate}}', new Date().toLocaleDateString('ar-EG'))
  .replace('{{customerName}}', customer.name)
  .replace('{{items}}', itemsHtml)
  .replace('{{subtotalAmount}}', subtotal)
  .replace('{{totalAmount}}', total);
```

---

## 🌐 دعم العملاء الأجانب

### تعيين تفضيلات العميل

```typescript
import { setCustomerPreference } from '@/lib/data';

// عميل فرنسي يفضل الفواتير بالفرنسية
await setCustomerPreference('cust-fr-001', {
  preferredLanguageId: 'lang-fr',
  preferredCurrency: 'EUR'
});

// عميل ألماني يفضل الفواتير بالألمانية
await setCustomerPreference('cust-de-001', {
  preferredLanguageId: 'lang-de',
  preferredCurrency: 'EUR'
});
```

### الحصول على فاتورة بلغة العميل

```typescript
import { 
  getCustomerPreference,
  getInvoiceTranslations 
} from '@/lib/data';

const customerId = 'cust-fr-001';

// الحصول على تفضيلات العميل
const pref = await getCustomerPreference(customerId);
const languageId = pref?.preferredLanguageId || 'lang-ar';

// الحصول على الترجمات المناسبة
const translations = await getInvoiceTranslations(languageId);

// استخدام الترجمات في الفاتورة
const invoice = {
  title: translations.invoice,
  dateLabel: translations.date,
  customerLabel: translations.customer,
  // ... بقية الحقول
};
```

---

## 📝 ملاحظات مهمة

### الباركود المصري

- **البادئة**: `6221` (كود مصر في GS1)
- **الطول**: 13 رقم (GTIN-13)
- **البنية**:
  ```
  6221 100001 001
  │││  │└─── رقم المنتج
  ││└───── كود الشركة
  └─────── كود الدولة (مصر)
  ```

### التخزين

- جميع الأدوية المصرية مخزنة في جدول منفصل `EgyptianDrugs`
- يمكن ربط الأدوية المصرية بالمنتجات الموجودة في المخزن عبر الباركود
- البحث السريع مدعوم عبر فهارس (Indexes) على:
  - الاسم العربي
  - الاسم الإنجليزي
  - المادة الفعالة
  - الباركود
  - الفئة
  - الشركة المصنعة

### الأمان

- جميع البيانات الأولية للفواتير والترجمات مخزنة في قاعدة البيانات
- يمكن إضافة لغات جديدة بسهولة عن طريق إضافة سجلات إلى `InvoiceLanguages` و `InvoiceTranslations`
- تفضيلات العملاء مخزنة بشكل منفصل لسهولة الإدارة

---

## 🔧 الصيانة

### إضافة دواء جديد

```sql
INSERT INTO EgyptianDrugs (
  id, nameAR, nameEN, activeIngredient, manufacturer, egyptianBarcode,
  categoryID, type, dosage, packaging, price
) VALUES (
  'drug-153',
  'دواء جديد',
  'New Drug',
  'Active Ingredient 100mg',
  'Egyptian Pharma',
  '6221100090002',
  'cat-001',
  'Tablet',
  '100mg',
  '20 tablets',
  30.00
);
```

### إضافة لغة جديدة

```sql
-- إضافة لغة إيطالية
INSERT INTO InvoiceLanguages (id, code, name, isRTL) VALUES
('lang-it', 'it', 'Italiano', FALSE);

-- إضافة ترجمات إيطالية
INSERT INTO InvoiceTranslations (id, languageId, keyName, translation) VALUES
('trans-it-invoice', 'lang-it', 'invoice', 'Fattura'),
('trans-it-date', 'lang-it', 'date', 'Data'),
('trans-it-customer', 'lang-it', 'customer', 'Cliente');
```

### تحديث ترجمة موجودة

```sql
UPDATE InvoiceTranslations 
SET translation = 'مترجم جديد' 
WHERE languageId = 'lang-ar' AND keyName = 'invoice';
```

---

## 📚 المراجع

- [دليل الأدوية المصرية](../src/lib/egyptian-drugs-data.ts)
- [أنواع TypeScript](../src/lib/types.ts)
- [دوال البيانات](../src/lib/data.ts)
- [ملف الترحيل](../migrations/003_add_egyptian_drugs_tables.sql)

---

## 🆘 الدعم الفني

للحصول على الدعم الفني أو الإبلاغ عن مشاكل:

1. راجع ملفات التعليمات في مجلد `docs/`
2. تحقق من ملفات الترحيل في `migrations/`
3. راجع أنواع TypeScript في `src/lib/types.ts`
4. راجع دوال البيانات في `src/lib/data.ts`

---

**آخر تحديث**: 10 يناير 2026  
**الإصدار**: 1.0.0
