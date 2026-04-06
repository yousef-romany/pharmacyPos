import { saleRepository } from '@/lib/repositories/sales';
import { productRepository } from '@/lib/repositories/products';
import type { SaleTransactionWithItems, SaleTransactionItem } from '@/lib/repositories/sales';
import type { Product } from '@/lib/types';
import { logger } from '../lib/logger';

const SYNC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
const SHOP_ID = process.env.NEXT_PUBLIC_SHOP_ID || 'shop_001';
const SHOP_NAME = process.env.NEXT_PUBLIC_SHOP_NAME || 'Main Pharmacy';
const SHOP_LOCATION = process.env.NEXT_PUBLIC_SHOP_LOCATION || 'Cairo, Egypt';
const WAREHOUSE_ID = process.env.NEXT_PUBLIC_WAREHOUSE_ID || '1';
const SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

interface SyncSaleData {
  product_id: string;
  product_name: string; // We might need to fetch this from product repo if not in sale item
  quantity: number;
  total_amount: number;
  sale_date: string; // ISO string
}

interface SyncInventoryData {
  product_id: string;
  product_name: string;
  quantity: number;
  reorder_level: number;
}

interface SyncBestSellerData {
  product_id: string;
  product_name: string;
  total_sold: number;
  revenue: number;
}

interface SyncPayload {
  shop_id: string;
  shop_name: string;
  location: string;
  sync_date: string; // ISO string
  sales: SyncSaleData[];
  inventory: SyncInventoryData[];
  best_sellers: SyncBestSellerData[];
}

class SyncService {
  private lastSyncKey = 'pharma_pos_last_sync';
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing = false;

  constructor() {
    // Initialize last sync time if not present
    if (typeof window !== 'undefined' && !localStorage.getItem(this.lastSyncKey)) {
      // Default to 24 hours ago if never synced
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      localStorage.setItem(this.lastSyncKey, yesterday.toISOString());
    }
  }

  public startSyncScheduler() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    // Run immediately on start
    this.syncToBackend();

    // Schedule periodic sync
    this.syncTimer = setInterval(() => {
      this.syncToBackend();
    }, SYNC_INTERVAL_MS);
    
    logger.info(`Sync scheduler started. Interval: ${SYNC_INTERVAL_MS}ms`);
  }

  public stopSyncScheduler() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  public async syncToBackend() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      logger.info('Starting data sync to backend...');
      const token = localStorage.getItem('access_token'); // Assuming standard auth
      if (!token) {
        console.warn('No access token found. Skipping sync.');
        return;
      }

      const lastSyncStr = localStorage.getItem(this.lastSyncKey);
      const lastSyncDate = lastSyncStr ? new Date(lastSyncStr) : new Date(0);
      const now = new Date();

      // 1. Fetch Sales since last sync
      const salesTransactions = await saleRepository.findByDateRange(lastSyncDate, now);
      const salesData: SyncSaleData[] = [];
      
      // We need a map of product names because sale items might not have them directly
      // (depending on the repository implementation, checking saleRepository again...)
      // The SaleTransactionItem interface has productId but not productName.
      // We'll need to fetch product details or rely on cache.
      // For efficiency, let's fetch all active products or fetch as needed.
      // Actually, let's get inventory first, which gives us products.
      
      // 2. Fetch Inventory (All Products)
      // Uses WAREHOUSE_ID from environment variable (NEXT_PUBLIC_WAREHOUSE_ID)
      const products = await productRepository.findByWarehouse(WAREHOUSE_ID);
      const productMap = new Map<string, Product>();
      products.forEach(p => productMap.set(p.id, p));

      const inventoryData: SyncInventoryData[] = products.map(p => ({
        product_id: p.id,
        product_name: p.nameEn || p.nameAr || 'Unknown Product',
        quantity: parseInt(p.quantity) || 0,
        reorder_level: p.minStockLevel || 0,
      }));

      // Process Sales Data
      salesTransactions.forEach(t => {
        t.items.forEach(item => {
          const product = productMap.get(item.productId);
          salesData.push({
            product_id: item.productId,
            product_name: product?.nameEn || product?.nameAr || 'Unknown Product',
            quantity: item.quantity,
            total_amount: item.price * item.quantity,
            sale_date: t.date.toISOString(),
          });
        });
      });

      // 3. Calculate Best Sellers (from the current batch + potentially historical? 
      // The prompt says "best_sellers", usually this implies a calculation. 
      // For sync, we might just send the calculated stats for this period, 
      // but the backend handler defines it as a list.
      // Let's calculate best sellers from the *synced* data for now.
      const bestSellersMap = new Map<string, SyncBestSellerData>();

      salesData.forEach(sale => {
        const existing = bestSellersMap.get(sale.product_id) || {
          product_id: sale.product_id,
          product_name: sale.product_name,
          total_sold: 0,
          revenue: 0,
        };

        existing.total_sold += sale.quantity;
        existing.revenue += sale.total_amount;
        bestSellersMap.set(sale.product_id, existing);
      });

      const bestSellers = Array.from(bestSellersMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10); // Top 10

      // 4. Send Payload
      const payload: SyncPayload = {
        shop_id: SHOP_ID,
        shop_name: SHOP_NAME,
        location: SHOP_LOCATION,
        sync_date: now.toISOString(),
        sales: salesData,
        inventory: inventoryData,
        best_sellers: bestSellers,
      };

      const response = await fetch(`${SYNC_API_URL}/sync/pos-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Sync failed with status: ${response.status}`);
      }

      logger.info('Sync completed successfully.');
      localStorage.setItem(this.lastSyncKey, now.toISOString());

    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncService = new SyncService();