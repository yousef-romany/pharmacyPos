import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addSale, addPurchase } from '../data';
import * as dbMocks from '../db';
import * as transactionMocks from '../db/transaction';

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
        getDatabase: vi.fn().mockResolvedValue(mockTx), // Return the hoisted mockTx
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

// Mock transaction wrapper to pass the hoisted mockTx
vi.mock('../db/transaction', () => ({
    withTransaction: vi.fn(async (callback) => {
        return await callback(mockTx);
    }),
}));

describe('Sales and Purchase Logic (Windows 7/32-bit Compat)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mocks
        // No need to set getDatabase return value again if it's set in factory, but safe to keep or rely on
        // But we DO need to reset default implementations for execute/select

        mockTx.execute.mockResolvedValue({ rowsAffected: 1 });
        mockTx.select.mockResolvedValue([]);
    });

    describe('addSale', () => {
        it('should successfully add a sale and deduct stock', async () => {
            // Mock product fetch to return an array (first call)
            // Mock debug check (should not be called if product found, but added for safety)
            // mockTx.select.mockResolvedValueOnce([]); 

            // Mock customer fetch (for balance update) - This might be called earlier or later depending on logic flow
            // Based on error "Product Fetch Result Length: 0", it seems the FIRST select call is returning empty or wrong data.
            // Let's ensure ALL select calls return something useful or default to empty array if not matched.

            // Reset and setup default
            mockTx.select.mockReset();
            mockTx.select.mockImplementation(async (sql, params) => {
                if (sql && sql.includes('FROM Products')) {
                    return [{
                        id: 'prod-1',
                        nameAr: 'Test Product',
                        quantity: '10',
                        price: '50',
                        warehouseId: 'warehouse-1',
                        subUnitsPerUnit: 0,
                    }];
                }
                if (sql && sql.includes('FROM Customers')) {
                    return [{ id: 'cust-1', balance: '0' }];
                }
                return [];
            });

            // Mock fetching the created sale at the end
            const { saleRepository } = await import('../repositories/sales');
            (saleRepository.findByIdWithItems as any).mockResolvedValue({
                id: 'sale-new',
                items: [],
                totalAmount: '100',
            });

            const saleData = {
                customerId: 'cust-1',
                totalAmount: '100', // number or string depending on interface, assuming string based on earlier read
                originalTotalAmount: '100',
                subTotalAmount: '100',
                amountPaid: '100',
                paymentMethod: 'cash' as any,
                date: new Date(),
                appliedInsuranceDiscountRate: '0',
                saleWarehouseId: 'warehouse-1', // Explicitly set to bypass default fetch
                items: [
                    {
                        productId: 'prod-1',
                        quantity: '2',
                        price: '50',
                        soldUnitType: 'main' as any,
                    },
                ],
            };

            await addSale(saleData);

            // Verify Sale Insertion
            expect(mockTx.execute).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO SalesTransactions'),
                expect.any(Array)
            );

            // Verify Stock Update (The critical part for race conditions)
            // Verify atomic stock update
            expect(mockTx.execute).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE Products'),
                expect.arrayContaining(['2', 'prod-1', 'warehouse-1', '2'])
            );

            // Verify correct quantity deduction logic in SQL
            expect(mockTx.execute).toHaveBeenCalledWith(
                expect.stringContaining('SET quantity = quantity - ?'),
                expect.anything()
            );
        });

        it('should throw error if insufficient stock', async () => {
            // Smart mock implementation based on query
            mockTx.select.mockImplementation(async (sql: string) => {
                if (sql.includes('FROM Products') && (sql.includes('price') || sql.includes('subUnitsPerUnit'))) {
                    // First product fetch
                    return [{
                        id: 'prod-1',
                        nameAr: 'Low Stock Product',
                        quantity: '1',
                        price: '50',
                        warehouseId: 'warehouse-1',
                        subUnitsPerUnit: 0,
                    }];
                }
                if (sql.includes('SELECT quantity FROM Products')) {
                    // Stock check after failure
                    return [{ quantity: '1' }];
                }
                return [];
            });

            // Execute sequence:
            mockTx.execute.mockResolvedValue({ rowsAffected: 1 }); // Default success
            // Force stock update to fail (rowsAffected: 0)
            mockTx.execute.mockImplementation(async (sql: string) => {
                if (sql.includes('UPDATE Products')) {
                    return { rowsAffected: 0 };
                }
                return { rowsAffected: 1 };
            });

            const saleData = {
                saleWarehouseId: 'warehouse-1',
                items: [
                    {
                        productId: 'prod-1',
                        quantity: '2', // Request 2, available 1
                        price: '50',
                        soldUnitType: 'unit' as any,
                    }
                ],
                totalAmount: '100',
                originalTotalAmount: '100',
                subTotalAmount: '100',
                amountPaid: '0',
                paymentMethod: 'cash' as any,
                date: new Date(),
                appliedInsuranceDiscountRate: '0',
            };

            await expect(addSale(saleData)).rejects.toThrow(/لا توجد كمية كافية/);
        });
    });

    describe('addPurchase', () => {
        it('should successfully add a purchase and update stock atomically', async () => {
            // Smart mock for select
            mockTx.select.mockImplementation(async (sql: string) => {
                if (sql.includes('FROM PurchaseTransactions')) {
                    return [{
                        id: 'pur-new',
                        totalAmount: '300',
                        supplierId: 'supp-1',
                        date: new Date().toISOString(),
                        items: []
                    }];
                }
                if (sql.includes('FROM PurchaseTransactionItems')) {
                    return [];
                }
                return [];
            });

            // Execute always success (rowsAffected: 1)
            mockTx.execute.mockResolvedValue({ rowsAffected: 1 });

            // No special mock for atomic update needed as default is success (rowsAffected: 1)

            // Fix date to string format for test
            const purchaseData = {
                supplierId: 'supp-1',
                items: [
                    {
                        productId: 'prod-1',
                        quantity: '10',
                        cost: '30',
                        expiryDate: new Date('2025-12-31').toISOString().split('T')[0], // Use string if DB expects it or Date if mapper handles it
                    }
                ],
                amountPaid: '300',
                date: new Date(),
                invoiceNumber: 'INV-123',
                destinationWarehouseId: 'warehouse-1',
                paymentTreasuryId: 'treasury-1'
            } as any;

            const { addPurchase } = await import('../data');
            await addPurchase(purchaseData);

            // Verify atomic update SQL
            expect(mockTx.execute).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE Products'),
                expect.arrayContaining(['prod-1', 'warehouse-1'])
            );
            expect(mockTx.execute).toHaveBeenCalledWith(
                expect.stringContaining('SET quantity = quantity + ?'),
                expect.anything()
            );
        });
    });
});
