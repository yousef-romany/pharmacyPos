import { BaseRepository, Repository, QueryOptions } from './base';
import { withTransaction, Transaction } from '../db/transaction';
import { executeWithTimingAndParams } from '../db/observability';
import db from '../db';

/**
 * Sale transaction with items
 */
export interface SaleTransactionWithItems {
  id: string;
  customerId: string | null;
  totalAmount: number;
  originalTotalAmount: number;
  subTotalAmount: number;
  paymentMethod: string;
  amountPaid: number;
  date: Date;
  appliedInsuranceDiscountRate: number;
  saleWarehouseId: string;
  paymentTreasuryId: string;
  items: SaleTransactionItem[];
}

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
 * Sale repository interface
 * Extends base repository with sale-specific operations
 */
export interface SaleRepository extends Repository<SaleTransactionWithItems, any, any> {
  /**
   * Find sale by ID with all items
   * Uses JOIN to fetch sale and items in single query (eliminates N+1 pattern)
   */
  findByIdWithItems(id: string): Promise<SaleTransactionWithItems | null>;
  
  /**
   * Find all sales with optional filtering
   */
  findAllWithItems(options?: QueryOptions): Promise<SaleTransactionWithItems[]>;
  
  /**
   * Find sales by date range
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<SaleTransactionWithItems[]>;
}

/**
 * Sale repository implementation
 * Provides data access for sales with JOIN queries for performance
 */
export class SaleRepositoryImpl extends BaseRepository<any, any, any> implements SaleRepository {
  constructor() {
    super('SalesTransactions', 'SaleTransaction');
  }

  /**
   * Find sale by ID with all items using JOIN
   * Eliminates N+1 query pattern (FR-005)
   */
  async findByIdWithItems(id: string): Promise<SaleTransactionWithItems | null> {
    const sql = `
      SELECT 
        s.id,
        s.customerId,
        s.totalAmount,
        s.originalTotalAmount,
        s.subTotalAmount,
        s.paymentMethod,
        s.amountPaid,
        s.date,
        s.appliedInsuranceDiscountRate,
        s.saleWarehouseId,
        s.paymentTreasuryId,
        si.id as itemId,
        si.productId,
        si.quantity,
        si.price,
        si.soldUnitType,
        si.costAtSale,
        si.warehouseId
      FROM SalesTransactions s
      LEFT JOIN SaleTransactionItems si ON s.id = si.saleId
      WHERE s.id = ?
      ORDER BY si.id
    `;

    try {
      const result = await executeWithTimingAndParams(
        () => db.execute(sql, [id]),
        sql,
        [id],
        'FIND_SALE_WITH_ITEMS'
      ) as any[];

      if (!result || result.length === 0) {
        return null;
      }

      // Group items by sale
      const sale = result[0];
      const items: SaleTransactionItem[] = [];
      
      for (const row of result) {
        if (row.itemId) {
          items.push({
            id: row.itemId,
            saleId: row.id,
            productId: row.productId,
            quantity: row.quantity,
            price: row.price,
            soldUnitType: row.soldUnitType,
            costAtSale: row.costAtSale,
            warehouseId: row.warehouseId,
          });
        }
      }

      return {
        ...sale,
        items,
      };
    } catch (error) {
      throw new Error(`Failed to find sale with items: ${error}`);
    }
  }

  /**
   * Find all sales with items using JOIN
   * Eliminates N+1 query pattern (FR-005)
   */
  async findAllWithItems(options: QueryOptions = {}): Promise<SaleTransactionWithItems[]> {
    let sql = `
      SELECT 
        s.id,
        s.customerId,
        s.totalAmount,
        s.originalTotalAmount,
        s.subTotalAmount,
        s.paymentMethod,
        s.amountPaid,
        s.date,
        s.appliedInsuranceDiscountRate,
        s.saleWarehouseId,
        s.paymentTreasuryId,
        si.id as itemId,
        si.productId,
        si.quantity,
        si.price,
        si.soldUnitType,
        si.costAtSale,
        si.warehouseId
      FROM SalesTransactions s
      LEFT JOIN SaleTransactionItems si ON s.id = si.saleId
    `;

    const params: any[] = [];

    if (options.orderBy) {
      sql += ` ORDER BY s.${options.orderBy} ${options.orderDirection || 'ASC'}`;
    }

    if (options.limit) {
      sql += ` LIMIT ?`;
      params.push(options.limit);
    }

    if (options.offset) {
      sql += ` OFFSET ?`;
      params.push(options.offset);
    }

    try {
      const result = await executeWithTimingAndParams(
        () => db.execute(sql, params),
        sql,
        params,
        'FIND_ALL_SALES_WITH_ITEMS'
      ) as any[];

      // Group items by sale
      const salesMap = new Map<string, SaleTransactionWithItems>();
      
      for (const row of result) {
        if (!salesMap.has(row.id)) {
          const items: SaleTransactionItem[] = [];
          
          for (const r of result) {
            if (r.id === row.id && r.itemId) {
              items.push({
                id: r.itemId,
                saleId: r.id,
                productId: r.productId,
                quantity: r.quantity,
                price: r.price,
                soldUnitType: r.soldUnitType,
                costAtSale: r.costAtSale,
                warehouseId: r.warehouseId,
              });
            }
          }

          salesMap.set(row.id, {
            ...row,
            items,
          });
        }
      }

      return Array.from(salesMap.values());
    } catch (error) {
      throw new Error(`Failed to find all sales with items: ${error}`);
    }
  }

  /**
   * Find sales by date range with items
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<SaleTransactionWithItems[]> {
    const sql = `
      SELECT 
        s.id,
        s.customerId,
        s.totalAmount,
        s.originalTotalAmount,
        s.subTotalAmount,
        s.paymentMethod,
        s.amountPaid,
        s.date,
        s.appliedInsuranceDiscountRate,
        s.saleWarehouseId,
        s.paymentTreasuryId,
        si.id as itemId,
        si.productId,
        si.quantity,
        si.price,
        si.soldUnitType,
        si.costAtSale,
        si.warehouseId
      FROM SalesTransactions s
      LEFT JOIN SaleTransactionItems si ON s.id = si.saleId
      WHERE s.date >= ? AND s.date <= ?
      ORDER BY s.date DESC, s.id
    `;

    try {
      const result = await executeWithTimingAndParams(
        () => db.execute(sql, [startDate, endDate]),
        sql,
        [startDate, endDate],
        'FIND_SALES_BY_DATE_RANGE'
      ) as any[];

      // Group items by sale
      const salesMap = new Map<string, SaleTransactionWithItems>();
      
      for (const row of result) {
        if (!salesMap.has(row.id)) {
          const items: SaleTransactionItem[] = [];
          
          for (const r of result) {
            if (r.id === row.id && r.itemId) {
              items.push({
                id: r.itemId,
                saleId: r.id,
                productId: r.productId,
                quantity: r.quantity,
                price: r.price,
                soldUnitType: r.soldUnitType,
                costAtSale: r.costAtSale,
                warehouseId: r.warehouseId,
              });
            }
          }

          salesMap.set(row.id, {
            ...row,
            items,
          });
        }
      }

      return Array.from(salesMap.values());
    } catch (error) {
      throw new Error(`Failed to find sales by date range: ${error}`);
    }
  }
}

// Export singleton instance
export const saleRepository = new SaleRepositoryImpl();
