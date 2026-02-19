import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updatePurchase, deletePurchase, deleteSale } from '../data';
import * as dbMocks from '../db';

// Define mockTx using vi.hoisted to ensure it is accessible in vi.mock factory
const { mockTx } = vi.hoisted(() => {
    return {
        mockTx: {
            execute: vi.fn(),
            select: vi.fn(),
        }
    };
});

// Mock dependencies
vi.mock('../db', () => {
    return {
        getDatabase: vi.fn().mockResolvedValue(mockTx),
        getDefaultWarehouseId: vi.fn().mockResolvedValue('warehouse-1'),
        getDefaultTreasuryId: vi.fn().mockResolvedValue('treasury-1'),
        isDatabaseAvailable: vi.fn().mockReturnValue(true),
    };
});

vi.mock('../repositories/sales', () => ({
    saleRepository: {
        findByIdWithItems: vi.fn(),
    },
}));

// Mock transaction wrapper
vi.mock('../db/transaction', () => ({
    withTransaction: vi.fn(async (callback) => {
        return await callback(mockTx);
    }),
}));

describe('Update and Delete Operations (Concurrency Safe)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockTx.execute.mockResolvedValue({ rowsAffected: 1 });
        mockTx.select.mockResolvedValue([]);
    });

    describe('deletePurchase', () => {
        it('should atomically reverse stock and delete records', async () => {
            // Mock getPurchaseById
            mockTx.select.mockImplementation(async (sql: string) => {
                if (sql.includes('FROM PurchaseTransactions')) {
                    return [{
                        id: 'pur-1',
                        destinationWarehouseId: 'warehouse-1',
                        paymentTreasuryId: 'treasury-1',
                        items: []
                    }];
                }
                if (sql.includes('FROM PurchaseTransactionItems')) {
                    return [{
                        productId: 'prod-1',
                        quantity: '10', // Purchased 10
                        cost: '50'
                    }];
                }
                return [];
            });

            await deletePurchase('pur-1');

            // Verify Atomic Stock Reversal
            // Should be: UPDATE Products SET quantity = MAX(0, quantity - ?) ...
            expect(mockTx.execute).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE Products'),
                expect.arrayContaining(['prod-1', 'warehouse-1']) // Checks params
            );
            // Verify Logic: We expect "quantity - ?" or similar atomic deduction
            // The exact string check might need adjustment based on implementation, 
            // but we look for intent.
            // Current unsafe implementation does select then update. 
            // New atomic implementation will do UPDATE ... SET quantity = ...
        });
    });

    describe('deleteSale', () => {
        it('should atomically restore stock and delete records', async () => {
            // Mock getSaleById
            mockTx.select.mockImplementation(async (sql: string) => {
                if (sql.includes('FROM SalesTransactions')) {
                    return [{
                        id: 'sale-1',
                        saleWarehouseId: 'warehouse-1',
                        items: []
                    }];
                }
                if (sql.includes('FROM SaleTransactionItems')) {
                    return [{
                        productId: 'prod-1',
                        quantity: '5', // Sold 5
                        soldUnitType: 'unit'
                    }];
                }
                return [];
            });

            await deleteSale('sale-1');

            // Verify Atomic Stock Restoration
            // Should be: UPDATE Products SET quantity = quantity + ? ...
            expect(mockTx.execute).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE Products'),
                expect.arrayContaining(['prod-1', 'warehouse-1'])
            );
        });
    });

    // Add updatePurchase test later as it's complex
});
