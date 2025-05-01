import type { Product } from '@/lib/types';
import { Pill, Baby, SprayCan, Activity } from 'lucide-react';

export const sampleProducts: Product[] = [
  {
    id: 'prod-001',
    nameAr: 'بنادول اكسترا',
    nameEn: 'Panadol Extra',
    price: 15.50,
    quantity: 150,
    categoryIcon: Pill,
  },
  {
    id: 'prod-002',
    nameAr: 'فيتامين سي فوار',
    nameEn: 'Vitamin C Effervescent',
    price: 22.00,
    quantity: 80,
    categoryIcon: Activity,
  },
  {
    id: 'prod-003',
    nameAr: 'حليب أطفال المرحلة 1',
    nameEn: 'Baby Milk Stage 1',
    price: 55.75,
    quantity: 45,
    categoryIcon: Baby,
  },
  {
    id: 'prod-004',
    nameAr: 'بخاخ الأنف',
    nameEn: 'Nasal Spray',
    price: 30.00,
    quantity: 60,
    categoryIcon: SprayCan,
  },
  {
    id: 'prod-005',
    nameAr: 'أقراص مسكنة للألم',
    nameEn: 'Pain Relief Tablets',
    price: 12.25,
    quantity: 200,
    categoryIcon: Pill,
  },
  {
    id: 'prod-006',
    nameAr: 'مكمل غذائي حديد',
    nameEn: 'Iron Supplement',
    price: 40.00,
    quantity: 90,
    categoryIcon: Activity,
  },
    {
    id: 'prod-007',
    nameAr: 'كريم حفاضات للأطفال',
    nameEn: 'Baby Diaper Cream',
    price: 25.50,
    quantity: 70,
    categoryIcon: Baby,
  },
  {
    id: 'prod-008',
    nameAr: 'شراب سعال',
    nameEn: 'Cough Syrup',
    price: 18.00,
    quantity: 110,
    categoryIcon: SprayCan, // Using SprayCan as a placeholder, could be Bottle icon if available
  },
];

// Simulate fetching products (e.g., from an API or database)
export async function getProducts(): Promise<Product[]> {
  // In a real app, this would fetch data from a source
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay
  return sampleProducts;
}
