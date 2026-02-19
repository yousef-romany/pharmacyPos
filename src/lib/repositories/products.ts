import type { Product } from '@/lib/types';
import { BaseRepository, type Repository, withRetry } from './base';
import { executeWithTimingAndParams } from '../db/observability';
import { getDatabase } from '../db';

/**
 * Product Repository with optimistic concurrency control
 * 
 * This repository provides CRUD operations for products with automatic retry
 * logic for handling concurrent updates using version-based locking.
 * 
 * @see FR-004: Optimistic concurrency control for product updates
 */
export interface ProductCreateDTO {
    nameAr: string;
    nameEn: string;
    manufacturer?: string;
    concentration?: string;
    activeIngredient?: string;
    price: string;
    lastPurchaseCost?: string;
    quantity: string;
    categoryIcon?: string;
    barcode?: string;
    unitType: string;
    subUnitType?: string;
    subUnitsPerUnit?: number;
    discountRate?: string;
    expiryDate?: Date;
    minStockLevel?: number;
    warehouseId: string;
}

export interface ProductUpdateDTO {
    nameAr?: string;
    nameEn?: string;
    manufacturer?: string;
    concentration?: string;
    activeIngredient?: string;
    price?: string;
    lastPurchaseCost?: string;
    quantity?: string;
    categoryIcon?: string;
    barcode?: string;
    unitType?: string;
    subUnitType?: string;
    subUnitsPerUnit?: number;
    discountRate?: string;
    expiryDate?: Date;
    minStockLevel?: number;
    warehouseId?: string;
}

export interface ProductRepository extends Repository<Product, ProductCreateDTO, ProductUpdateDTO> {
    findByBarcode(barcode: string): Promise<Product | undefined>;
    findByWarehouse(warehouseId: string): Promise<Product[]>;
    findByActiveIngredient(activeIngredient: string): Promise<Product[]>;
    findNearingExpiry(daysThreshold: number): Promise<Product[]>;
    findExpired(): Promise<Product[]>;
    updateStock(id: string, quantityDelta: number): Promise<Product | null>;
}

export class ProductRepositoryImpl extends BaseRepository<Product, ProductCreateDTO, ProductUpdateDTO> implements ProductRepository {
    constructor() {
        super('Products', 'Product');
    }

    /**
     * Find a product by barcode
     */
    async findByBarcode(barcode: string): Promise<Product | undefined> {
        const db = await getDatabase();
        const sql = `SELECT * FROM ${this.tableName} WHERE barcode = ? LIMIT 1`;
        const result = await executeWithTimingAndParams(
            () => db.execute(sql, [barcode]),
            sql,
            [barcode],
            'FIND_PRODUCT_BY_BARCODE'
        ) as any[];

        if (!result || result.length === 0) {
            return undefined;
        }
        return this.mapToEntity(result[0]);
    }

    /**
     * Find all products in a specific warehouse
     */
    async findByWarehouse(warehouseId: string): Promise<Product[]> {
        const db = await getDatabase();
        const sql = `SELECT * FROM ${this.tableName} WHERE warehouseId = ?`;
        const result = await executeWithTimingAndParams(
            () => db.execute(sql, [warehouseId]),
            sql,
            [warehouseId],
            'FIND_PRODUCTS_BY_WAREHOUSE'
        ) as any[];
        return result.map(r => this.mapToEntity(r));
    }

    /**
     * Find products by active ingredient
     */
    async findByActiveIngredient(activeIngredient: string): Promise<Product[]> {
        const db = await getDatabase();
        const sql = `SELECT * FROM ${this.tableName} WHERE activeIngredient = ? AND CAST(quantity AS DOUBLE) > 0`;
        const result = await executeWithTimingAndParams(
            () => db.execute(sql, [activeIngredient]),
            sql,
            [activeIngredient],
            'FIND_PRODUCTS_BY_ACTIVE_INGREDIENT'
        ) as any[];
        return result.map(r => this.mapToEntity(r));
    }

    /**
     * Find products nearing expiry
     */
    async findNearingExpiry(daysThreshold: number): Promise<Product[]> {
        const db = await getDatabase();
        const sql = `
            SELECT * FROM ${this.tableName}
            WHERE expiryDate IS NOT NULL
              AND expiryDate BETWEEN DATE_ADD(CURDATE(), INTERVAL 0 DAY) AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
            ORDER BY expiryDate ASC
        `;
        const result = await executeWithTimingAndParams(
            () => db.execute(sql, [daysThreshold]),
            sql,
            [daysThreshold],
            'FIND_PRODUCTS_NEARING_EXPIRY'
        ) as any[];
        return result.map(r => this.mapToEntity(r));
    }

    /**
     * Find expired products
     */
    async findExpired(): Promise<Product[]> {
        const db = await getDatabase();
        const sql = `
            SELECT * FROM ${this.tableName}
            WHERE expiryDate IS NOT NULL AND expiryDate < CURDATE()
            ORDER BY expiryDate ASC
        `;
        const result = await executeWithTimingAndParams(
            () => db.execute(sql, []),
            sql,
            [],
            'FIND_EXPIRED_PRODUCTS'
        ) as any[];
        return result.map(r => this.mapToEntity(r));
    }

    /**
     * Update product stock with optimistic concurrency
     * This is used for inventory adjustments during sales/purchases
     */
    async updateStock(id: string, quantityDelta: number): Promise<Product | null> {
        return await withRetry(async () => {
            const db = await getDatabase();
            // First, get current version
            const current = await this.findById(id);
            if (!current) return null;

            // Calculate new quantity
            const currentQuantity = parseFloat(current.quantity) || 0;
            const newQuantity = Math.max(0, currentQuantity + quantityDelta);

            // Update with version check
            const sql = `
                UPDATE ${this.tableName}
                SET quantity = ?, version = version + 1
                WHERE id = ? AND version = ?
            `;
            const params = [newQuantity.toString(), id, (current as any).version || 0];
            
            const result = await executeWithTimingAndParams(
                () => db.execute(sql, params),
                sql,
                params,
                'UPDATE_PRODUCT_STOCK'
            ) as any;
            
            if (!result || result.affectedRows === 0) {
                throw new Error(`Concurrent modification detected for product ${id}`);
            }

            return await this.findById(id);
        }, 3, 100);
    }

    /**
     * Map database row to Product entity
     */
    protected mapToEntity(row: any): Product {
        return {
            ...row,
            price: row.price,
            lastPurchaseCost: row.lastPurchaseCost,
            quantity: row.quantity,
            subUnitsPerUnit: row.subUnitsPerUnit ? parseInt(row.subUnitsPerUnit) : undefined,
            discountRate: row.discountRate,
            minStockLevel: row.minStockLevel ? parseInt(row.minStockLevel) : undefined,
            expiryDate: row.expiryDate ? new Date(row.expiryDate) : undefined,
            warehouseId: row.warehouseId,
        };
    }
}

/**
 * Singleton instance of ProductRepository
 */
export const productRepository = new ProductRepositoryImpl();
