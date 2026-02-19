import { SaleTransaction, Customer, Product, InvoiceLanguage, InvoiceTranslation } from './types';
import { getProducts } from './data';

/**
 * Get invoice translations for a specific language
 */
export async function getInvoiceTranslationsForLanguage(languageCode: string): Promise<Record<string, string>> {
  // In a real app, this would fetch from the database
  // For now, we'll return hardcoded translations

  const translations: Record<string, Record<string, string>> = {
    ar: {
      invoice: 'فاتورة',
      date: 'التاريخ',
      customer: 'العميل',
      total: 'الإجمالي',
      paid: 'المدفوع',
      balance: 'المتبقي',
      quantity: 'الكمية',
      price: 'السعر',
      item: 'الصنف',
      subtotal: 'المجموع الفرعي',
      discount: 'الخصم',
      thank_you: 'شكراً لتعاملكم معنا',
      payment_method: 'طريقة الدفع',
      signature: 'التوقيع',
      employee_signature: 'توقيع الموظف',
      customer_signature: 'توقيع العميل',
      phone: 'الهاتف',
      address: 'العنوان',
      insurance_company: 'شركة التأمين',
      all_prices_egp: 'جميع الأسعار بالجنيه المصري',
      for_inquiries: 'للاستفسارات',
    },
    en: {
      invoice: 'Invoice',
      date: 'Date',
      customer: 'Customer',
      total: 'Total',
      paid: 'Paid',
      balance: 'Balance',
      quantity: 'Quantity',
      price: 'Price',
      item: 'Item',
      subtotal: 'Subtotal',
      discount: 'Discount',
      thank_you: 'Thank you for your business',
      payment_method: 'Payment Method',
      signature: 'Signature',
      employee_signature: 'Employee Signature',
      customer_signature: 'Customer Signature',
      phone: 'Phone',
      address: 'Address',
      insurance_company: 'Insurance Company',
      all_prices_egp: 'All prices in Egyptian Pounds (EGP)',
      for_inquiries: 'For inquiries',
    },
  };

  return translations[languageCode as keyof typeof translations] || translations.en;
}

/**
 * Get products for invoice items
 */
export async function getProductsForInvoice(sale: SaleTransaction): Promise<Product[]> {
  try {
    const allProducts = await getProducts();
    const productIds = [...new Set(sale.items.map(item => item.productId))];
    return allProducts.filter(product => productIds.includes(product.id));
  } catch (error) {
    console.error('Error fetching products for invoice:', error);
    return [];
  }
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(saleId: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const sequence = saleId.substring(0, 6);
  return `INV-${year}${month}-${sequence}`;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, language: string = 'en'): string {
  const formatted = amount.toFixed(2);
  if (language === 'ar') {
    return `${formatted} ج.م`;
  }
  return `${formatted} EGP`;
}

/**
 * Get payment method label
 */
export function getPaymentMethodLabel(method: string, language: string = 'en'): string {
  const labels: Record<string, Record<string, string>> = {
    cash: { ar: 'نقداً', en: 'Cash' },
    card: { ar: 'بطاقة', en: 'Card' },
    instapay: { ar: 'إنستا باي', en: 'InstaPay' },
    vodafone_cash: { ar: 'فودافون كاش', en: 'Vodafone Cash' },
    debt: { ar: 'آجل', en: 'Credit/Debt' },
  };

  return labels[method]?.[language as 'ar' | 'en'] || method;
}

/**
 * Calculate invoice totals
 */
export function calculateInvoiceTotals(sale: SaleTransaction) {
  const subtotal = parseFloat(sale.subTotalAmount || sale.totalAmount);
  const discountRate = parseFloat(sale.appliedInsuranceDiscountRate || '0');
  const discountAmount = (subtotal * discountRate) / 100;
  const total = parseFloat(sale.totalAmount);
  const paid = parseFloat(sale.amountPaid || '0');
  const balance = total - paid;

  return {
    subtotal,
    discountRate,
    discountAmount,
    total,
    paid,
    balance,
  };
}

/**
 * Get invoice language based on customer preference or default
 */
export function getInvoiceLanguage(
  customerLanguage?: string,
  defaultLanguage: string = 'ar'
): string {
  return customerLanguage || defaultLanguage;
}

/**
 * Validate invoice data
 */
export function validateInvoiceData(sale: SaleTransaction): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!sale.items || sale.items.length === 0) {
    errors.push('Invoice must have at least one item');
  }

  if (!sale.date) {
    errors.push('Invoice date is required');
  }

  if (!sale.totalAmount || parseFloat(sale.totalAmount) <= 0) {
    errors.push('Total amount must be greater than 0');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
