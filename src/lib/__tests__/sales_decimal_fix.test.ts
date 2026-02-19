
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addSale } from '../data';

// Define mockTx using vi.hoisted
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

vi.mock('../db/transaction', () => ({
    withTransaction: vi.fn(async (callback) => {
        return await callback(mockTx);
    }),
}));

describe('Sales Decimal Fix Regression Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockTx.execute.mockResolvedValue({ rowsAffected: 1 });
        mockTx.select.mockResolvedValue([]);
    });

    it('should use CAST(... AS CHAR) in SQL queries to prevent DECIMAL type errors', async () => {
        // Mock product fetch to return valid data
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
            totalAmount: '100',
            originalTotalAmount: '100',
            subTotalAmount: '100',
            amountPaid: '100',
            paymentMethod: 'cash' as any,
            date: new Date(),
            appliedInsuranceDiscountRate: '0',
            saleWarehouseId: 'warehouse-1',
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

        // Verify that the Product Fetch query contains CAST clause
        // We use stringContaining to match the SQL fragment regardless of formatting
        expect(mockTx.select).toHaveBeenCalledWith(
            expect.stringContaining('CAST(quantity AS CHAR)'),
            expect.arrayContaining(['prod-1'])
        );

        // Verify that the Customer customerResults query contains CAST clause
        expect(mockTx.select).toHaveBeenCalledWith(
            expect.stringContaining('CAST(balance AS CHAR)'),
            expect.arrayContaining(['cust-1'])
        );
    });

    it('should use CAST(quantity AS CHAR) when checking stock after insufficient stock error', async () => {
        // Mock product fetch
        mockTx.select.mockImplementation(async (sql: string) => {
            if (sql.includes('FROM Products') && sql.includes('CAST(price AS CHAR)')) {
                return [{
                    id: 'prod-1',
                    nameAr: 'Low Stock Product',
                    quantity: '1',
                    price: '50',
                    warehouseId: 'warehouse-1',
                    subUnitsPerUnit: 0,
                }];
            }
            if (sql.includes('SELECT CAST(quantity AS CHAR) as quantity FROM Products')) {
                // Stock check after failure
                return [{ quantity: '1' }];
            }
            return [];
        });

        // Fail the update to trigger the stock check
        mockTx.execute.mockImplementation(async (sql: string) => {
            if (sql.includes('UPDATE Products')) {
                return { rowsAffected: 0 };
            }
            return { rowsAffected: 1 };
        });

        const saleData = {
            saleWarehouseId: 'warehouse-1',
            items: [{ productId: 'prod-1', quantity: '2', price: '50', soldUnitType: 'main' as any }],
            totalAmount: '100',
            originalTotalAmount: '100',
            subTotalAmount: '100',
            amountPaid: '0',
            paymentMethod: 'cash' as any,
            date: new Date(),
            appliedInsuranceDiscountRate: '0',
        };

        await expect(addSale(saleData)).rejects.toThrow();

        // Verify the specific CAST query was used for the fallback stock check
        expect(mockTx.select).toHaveBeenCalledWith(
            expect.stringContaining('SELECT CAST(quantity AS CHAR) as quantity FROM Products'),
            expect.anything()
        );
    });
});
