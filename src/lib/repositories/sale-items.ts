import { BaseRepository, Repository } from './base';
import { executeWithTimingAndParams } from '../db/observability';
import db from '../db';

/**
 * Sale transaction item
 */
export interface SaleTransactionItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  price: number;
  soldUnitType: string;
  costAtSale: number;
  warehouseId: string;
}

/**
 * Create DTO for sale items
 */
export interface CreateSaleItemDTO {
  saleId: string;
  productId: string;
  quantity: number;
  price: number;
  soldUnitType: string;
  costAtSale: number;
  warehouseId: string;
}

/**
 * Update DTO for sale items
 */
export interface UpdateSaleItemDTO {
  quantity?: number;
  price?: number;
  costAtSale?: number;
}

/**
 * Sale item repository interface
 * Extends base repository with sale item-specific operations
 */
export interface SaleItemRepository extends Repository<SaleTransactionItem, CreateSaleItemDTO, UpdateSaleItemDTO> {
  /**
   * Create multiple items in batch
   * Uses multi-row INSERT for performance (FR-007)
   */
  createBatch(items: CreateSaleItemDTO[]): Promise<SaleTransactionItem[]>;
}

/**
 * Sale item repository implementation
 * Provides data access for sale items with batch operations
 */
export class SaleItemRepositoryImpl extends BaseRepository<SaleTransactionItem, CreateSaleItemDTO, UpdateSaleItemDTO> implements SaleItemRepository {
  constructor() {
    super('SaleTransactionItems', 'SaleItem');
  }

  /**
   * Create multiple items in batch using multi-row INSERT
   * Improves performance for multi-item sales (FR-007)
   */
  async createBatch(items: CreateSaleItemDTO[]): Promise<SaleTransactionItem[]> {
    if (items.length === 0) {
      return [];
    }

    const newId = `si-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`;

    // Build multi-row INSERT query
    const valuePlaceholders = items.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
    const allValues = items.flatMap(item => [
      newId,
      item.saleId,
      item.productId,
      item.quantity,
      item.price,
      item.soldUnitType,
      item.costAtSale,
      item.warehouseId,
    ]);

    const sql = `
      INSERT INTO SaleTransactionItems (
        id, saleId, productId, quantity, price, soldUnitType, costAtSale, warehouseId
      ) VALUES ${valuePlaceholders}
    `;

    try {
      await executeWithTimingAndParams(
        () => db.execute(sql, allValues),
        sql,
        allValues,
        'CREATE_BATCH_SALE_ITEMS'
      );

      // Fetch all created items
      const result = await executeWithTimingAndParams(
        () => db.execute('SELECT * FROM SaleTransactionItems WHERE saleId = ?', [items[0].saleId]),
        'SELECT * FROM SaleTransactionItems WHERE saleId = ?',
        [items[0].saleId],
        'FETCH_CREATED_SALE_ITEMS'
      ) as any[];

      return result as SaleTransactionItem[];
    } catch (error) {
      throw new Error(`Failed to create batch sale items: ${error}`);
    }
  }
}

// Export singleton instance
export const saleItemRepository = new SaleItemRepositoryImpl();
