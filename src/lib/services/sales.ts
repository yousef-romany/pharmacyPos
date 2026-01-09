import type { SaleTransaction } from '@/lib/types';
import { saleRepository, type SaleTransactionWithItems, type SaleTransactionItem } from '@/lib/repositories/sales';
import { executeWithTimingAndParams } from '../db/observability';
import db from '../db';

/**
 * Sales Service
 * 
 * Business logic layer for sales operations with optimized queries.
 * Eliminates N+1 pattern by using JOIN queries for fetching sales with items.
 * 
 * @see FR-005: Eliminate N+1 query patterns
 * @see FR-006: Sales history with items loads in <2 seconds
 * @see FR-007: Batch operations for multi-item insertion
 */
export interface SaleFilters {
    customerId?: string;
    startDate?: Date;
    endDate?: Date;
    minAmount?: string;
    maxAmount?: string;
    paymentMethod?: string;
    page?: number;
    pageSize?: number;
}

export interface SalesHistoryResult {
    sales: SaleTransactionWithItems[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

export interface SalesSummary {
    totalSales: string;
    totalRevenue: string;
    averageSaleAmount: string;
    saleCount: number;
}

/**
 * Sales Service implementation
 */
export class SalesService {
    private readonly DEFAULT_PAGE_SIZE = 50;

    /**
     * Get sales with optional filtering and pagination
     * 
     * @param filters - Optional filters for sales
     * @returns Paginated sales results
     */
    async getSales(filters: SaleFilters = {}): Promise<SalesHistoryResult> {
        const page = filters.page || 1;
        const pageSize = filters.pageSize || this.DEFAULT_PAGE_SIZE;
        const offset = (page - 1) * pageSize;

        // Build WHERE clause for filters
        const conditions: string[] = [];
        const params: any[] = [];

        if (filters.customerId) {
            conditions.push('customerId = ?');
            params.push(filters.customerId);
        }

        if (filters.startDate) {
            conditions.push('date >= ?');
            params.push(filters.startDate.toISOString().split('T')[0].substring(0, 10));
        }

        if (filters.endDate) {
            conditions.push('date <= ?');
            params.push(filters.endDate.toISOString().split('T')[0].substring(0, 10));
        }

        if (filters.minAmount) {
            conditions.push('totalAmount >= ?');
            params.push(filters.minAmount);
        }

        if (filters.maxAmount) {
            conditions.push('totalAmount <= ?');
            params.push(filters.maxAmount);
        }

        if (filters.paymentMethod) {
            conditions.push('paymentMethod = ?');
            params.push(filters.paymentMethod);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const whereParams = params.length > 0 ? params : [];

        // Count total sales matching filters
        const countSql = `
            SELECT COUNT(*) as total
            FROM SalesTransactions
            ${whereClause}
        `;
        const countResult = await executeWithTimingAndParams(
            () => db.execute(countSql, whereParams),
            'COUNT_SALES',
            whereParams
        ) as any[];
        const total = countResult[0]?.total || 0;

        // Fetch sales with items using JOIN query (FR-005)
        const salesSql = `
            SELECT
                st.id,
                st.customerId,
                st.totalAmount,
                st.subTotalAmount,
                st.amountPaid,
                st.paymentMethod,
                st.date,
                st.appliedInsuranceDiscountRate,
                st.saleWarehouseId,
                st.paymentTreasuryId,
                si.id as itemId,
                si.productId,
                si.quantity,
                si.price,
                si.soldUnitType,
                si.costAtSale,
                si.warehouseId
            FROM SalesTransactions st
            LEFT JOIN SaleTransactionItems si ON st.id = si.saleId
            ${whereClause}
            ORDER BY st.date DESC, st.id
            LIMIT ? OFFSET ?
        `;

        const salesResult = await executeWithTimingAndParams(
            () => db.execute(salesSql, [...whereParams, pageSize, offset]),
            'GET_SALES_WITH_ITEMS',
            [...whereParams, pageSize, offset]
        ) as any[];

        // Map results to proper format, grouping items by sale
        const salesMap = new Map<string, SaleTransactionWithItems>();
        
        for (const row of salesResult) {
            if (!salesMap.has(row.id)) {
                salesMap.set(row.id, {
                    id: row.id,
                    customerId: row.customerId,
                    totalAmount: row.totalAmount,
                    originalTotalAmount: row.originalTotalAmount,
                    subTotalAmount: row.subTotalAmount,
                    amountPaid: row.amountPaid,
                    paymentMethod: row.paymentMethod,
                    date: new Date(row.date),
                    appliedInsuranceDiscountRate: row.appliedInsuranceDiscountRate,
                    saleWarehouseId: row.saleWarehouseId,
                    paymentTreasuryId: row.paymentTreasuryId,
                    items: [],
                });
            }
            
            // Add item if it exists
            if (row.itemId) {
                const sale = salesMap.get(row.id)!;
                sale.items.push({
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
        
        const sales = Array.from(salesMap.values());

        // Check if there are more results
        const hasMore = sales.length === pageSize;

        return {
            sales,
            total,
            page,
            pageSize,
            hasMore,
        };
    }

    /**
     * Get sales summary statistics
     * 
     * @param filters - Optional filters for summary
     * @returns Sales summary with totals and averages
     */
    async getSalesSummary(filters: SaleFilters = {}): Promise<SalesSummary> {
        const whereClause = this.buildWhereClause(filters);
        const whereParams = this.buildWhereParams(filters);

        const summarySql = `
            SELECT 
                COUNT(*) as saleCount,
                COALESCE(SUM(CAST(totalAmount AS DECIMAL(10,2))), 0) as totalSales,
                COALESCE(SUM(CAST(totalAmount AS DECIMAL(10,2))), 0) as totalRevenue,
                COALESCE(AVG(CAST(totalAmount AS DECIMAL(10,2))), 0) as averageSaleAmount
            FROM SalesTransactions
            ${whereClause}
        `;

        const result = await executeWithTimingAndParams(
            () => db.execute(summarySql, whereParams),
            'GET_SALES_SUMMARY',
            whereParams
        ) as any[];

        const row = result[0];
        const saleCount = parseInt(row.saleCount) || 0;
        const totalSales = row.totalSales || '0';
        const totalRevenue = row.totalRevenue || '0';
        const averageSaleAmount = row.averageSaleAmount || '0';

        return {
            totalSales,
            totalRevenue,
            averageSaleAmount,
            saleCount,
        };
    }

    /**
     * Get sale by ID with items
     * 
     * @param id - Sale ID
     * @returns Sale with items or null
     */
    async getSaleById(id: string): Promise<SaleTransactionWithItems | null> {
        const sale = await saleRepository.findByIdWithItems(id);
        return sale;
    }

    /**
     * Build WHERE clause from filters
     */
    private buildWhereClause(filters: SaleFilters): string {
        const conditions: string[] = [];

        if (filters.customerId) {
            conditions.push('customerId = ?');
        }

        if (filters.startDate) {
            conditions.push('date >= ?');
        }

        if (filters.endDate) {
            conditions.push('date <= ?');
        }

        if (filters.minAmount) {
            conditions.push('totalAmount >= ?');
        }

        if (filters.maxAmount) {
            conditions.push('totalAmount <= ?');
        }

        if (filters.paymentMethod) {
            conditions.push('paymentMethod = ?');
        }

        return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    }

    /**
     * Build WHERE parameters from filters
     */
    private buildWhereParams(filters: SaleFilters): any[] {
        const params: any[] = [];

        if (filters.startDate) {
            params.push(filters.startDate.toISOString().split('T')[0].substring(0, 10));
        }

        if (filters.endDate) {
            params.push(filters.endDate.toISOString().split('T')[0].substring(0, 10));
        }

        if (filters.minAmount) {
            params.push(filters.minAmount);
        }

        if (filters.maxAmount) {
            params.push(filters.maxAmount);
        }

        if (filters.paymentMethod) {
            params.push(filters.paymentMethod);
        }

        return params;
    }
}
