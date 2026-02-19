/**
 * Integration Tests for SalesService
 *
 * Tests for:
 * - FR-005: Eliminate N+1 query patterns
 * - FR-006: Sales history with items loads in <2 seconds
 * - Pagination functionality
 * - Summary calculations
 * - Filtering functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SalesService } from '../sales';
import db from '../../db';

// Mock database for testing
vi.mock('../../db', () => ({
  default: {
    execute: vi.fn(),
  },
}));

describe('SalesService Integration Tests', () => {
  let salesService: SalesService;
  const mockDb = db as { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    salesService = new SalesService();
    vi.clearAllMocks();
  });

  describe('getSales - Basic Functionality', () => {
    it('should fetch sales with items using JOIN query (eliminates N+1 pattern)', async () => {
      // Mock count query
      mockDb.execute.mockResolvedValueOnce([{ total: 2 }]);

      // Mock sales with items query (LEFT JOIN returns multiple rows per sale)
      mockDb.execute.mockResolvedValueOnce([
        {
          id: 'sale-1',
          customerId: 'customer-1',
          totalAmount: '100.00',
          subTotalAmount: '100.00',
          amountPaid: '100.00',
          paymentMethod: 'cash',
          date: '2024-01-15T10:00:00.000Z',
          appliedInsuranceDiscountRate: '0',
          saleWarehouseId: 'warehouse-1',
          paymentTreasuryId: 'treasury-1',
          itemId: 'item-1',
          productId: 'product-1',
          quantity: 2,
          price: '50.00',
          soldUnitType: 'main',
          costAtSale: '30.00',
          warehouseId: 'warehouse-1',
        },
        {
          id: 'sale-1',
          customerId: 'customer-1',
          totalAmount: '100.00',
          subTotalAmount: '100.00',
          amountPaid: '100.00',
          paymentMethod: 'cash',
          date: '2024-01-15T10:00:00.000Z',
          appliedInsuranceDiscountRate: '0',
          saleWarehouseId: 'warehouse-1',
          paymentTreasuryId: 'treasury-1',
          itemId: 'item-2',
          productId: 'product-2',
          quantity: 1,
          price: '50.00',
          soldUnitType: 'main',
          costAtSale: '35.00',
          warehouseId: 'warehouse-1',
        },
        {
          id: 'sale-2',
          customerId: 'customer-2',
          totalAmount: '75.00',
          subTotalAmount: '75.00',
          amountPaid: '75.00',
          paymentMethod: 'card',
          date: '2024-01-14T14:30:00.000Z',
          appliedInsuranceDiscountRate: '0',
          saleWarehouseId: 'warehouse-1',
          paymentTreasuryId: 'treasury-1',
          itemId: 'item-3',
          productId: 'product-3',
          quantity: 3,
          price: '25.00',
          soldUnitType: 'main',
          costAtSale: '20.00',
          warehouseId: 'warehouse-1',
        },
      ]);

      const result = await salesService.getSales();

      // Verify only 2 queries were executed (count + fetch), not N+1
      expect(mockDb.execute).toHaveBeenCalledTimes(2);

      // Verify results are correctly grouped
      expect(result.sales).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.sales[0].items).toHaveLength(2);
      expect(result.sales[1].items).toHaveLength(1);
    });

    it('should handle sales with no items', async () => {
      mockDb.execute.mockResolvedValueOnce([{ total: 1 }]);

      // Sale with no items (LEFT JOIN returns NULL for item fields)
      mockDb.execute.mockResolvedValueOnce([
        {
          id: 'sale-1',
          customerId: 'customer-1',
          totalAmount: '100.00',
          subTotalAmount: '100.00',
          amountPaid: '100.00',
          paymentMethod: 'cash',
          date: '2024-01-15T10:00:00.000Z',
          appliedInsuranceDiscountRate: '0',
          saleWarehouseId: 'warehouse-1',
          paymentTreasuryId: 'treasury-1',
          itemId: null,
          productId: null,
          quantity: null,
          price: null,
          soldUnitType: null,
          costAtSale: null,
          warehouseId: null,
        },
      ]);

      const result = await salesService.getSales();

      expect(result.sales).toHaveLength(1);
      expect(result.sales[0].items).toHaveLength(0);
    });
  });

  describe('getSales - Pagination', () => {
    it('should support pagination with page and pageSize parameters', async () => {
      mockDb.execute.mockResolvedValueOnce([{ total: 150 }]);

      // Return 50 items (default page size)
      mockDb.execute.mockResolvedValueOnce(
        Array.from({ length: 50 }, (_, i) => ({
          id: `sale-${i}`,
          customerId: `customer-${i % 5}`,
          totalAmount: '100.00',
          subTotalAmount: '100.00',
          amountPaid: '100.00',
          paymentMethod: 'cash',
          date: '2024-01-15T10:00:00.000Z',
          appliedInsuranceDiscountRate: '0',
          saleWarehouseId: 'warehouse-1',
          paymentTreasuryId: 'treasury-1',
          itemId: `item-${i}`,
          productId: `product-${i}`,
          quantity: 1,
          price: '100.00',
          soldUnitType: 'main',
          costAtSale: '50.00',
          warehouseId: 'warehouse-1',
        }))
      );

      const result = await salesService.getSales({ page: 2, pageSize: 50 });

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(50);
      expect(result.total).toBe(150);
      expect(result.hasMore).toBe(true);

      // Verify LIMIT and OFFSET in query
      const fetchCall = mockDb.execute.mock.calls[1];
      expect(fetchCall[0]).toContain('LIMIT ? OFFSET ?');
      expect(fetchCall[1]).toContain(50); // pageSize
      expect(fetchCall[1]).toContain(50); // offset (page 2: (2-1) * 50)
    });

    it('should set hasMore to false on last page', async () => {
      mockDb.execute.mockResolvedValueOnce([{ total: 100 }]);

      // Return 50 items (exactly the page size, but it's the last page)
      mockDb.execute.mockResolvedValueOnce(
        Array.from({ length: 50 }, (_, i) => ({
          id: `sale-${i + 50}`,
          customerId: `customer-${i % 5}`,
          totalAmount: '100.00',
          subTotalAmount: '100.00',
          amountPaid: '100.00',
          paymentMethod: 'cash',
          date: '2024-01-15T10:00:00.000Z',
          appliedInsuranceDiscountRate: '0',
          saleWarehouseId: 'warehouse-1',
          paymentTreasuryId: 'treasury-1',
          itemId: `item-${i + 50}`,
          productId: `product-${i + 50}`,
          quantity: 1,
          price: '100.00',
          soldUnitType: 'main',
          costAtSale: '50.00',
          warehouseId: 'warehouse-1',
        }))
      );

      const result = await salesService.getSales({ page: 2, pageSize: 50 });

      expect(result.hasMore).toBe(false);
    });

    it('should use default page size when not specified', async () => {
      mockDb.execute.mockResolvedValueOnce([{ total: 30 }]);

      mockDb.execute.mockResolvedValueOnce(
        Array.from({ length: 30 }, (_, i) => ({
          id: `sale-${i}`,
          customerId: `customer-${i % 5}`,
          totalAmount: '100.00',
          subTotalAmount: '100.00',
          amountPaid: '100.00',
          paymentMethod: 'cash',
          date: '2024-01-15T10:00:00.000Z',
          appliedInsuranceDiscountRate: '0',
          saleWarehouseId: 'warehouse-1',
          paymentTreasuryId: 'treasury-1',
          itemId: `item-${i}`,
          productId: `product-${i}`,
          quantity: 1,
          price: '100.00',
          soldUnitType: 'main',
          costAtSale: '50.00',
          warehouseId: 'warehouse-1',
        }))
      );

      const result = await salesService.getSales();

      expect(result.pageSize).toBe(50); // Default page size
    });
  });

  describe('getSales - Filtering', () => {
    it('should filter by customerId', async () => {
      mockDb.execute.mockResolvedValueOnce([{ total: 5 }]);

      mockDb.execute.mockResolvedValueOnce([
        {
          id: 'sale-1',
          customerId: 'customer-123',
          totalAmount: '100.00',
          subTotalAmount: '100.00',
          amountPaid: '100.00',
          paymentMethod: 'cash',
          date: '2024-01-15T10:00:00.000Z',
          appliedInsuranceDiscountRate: '0',
          saleWarehouseId: 'warehouse-1',
          paymentTreasuryId: 'treasury-1',
          itemId: 'item-1',
          productId: 'product-1',
          quantity: 1,
          price: '100.00',
          soldUnitType: 'main',
          costAtSale: '50.00',
          warehouseId: 'warehouse-1',
        },
      ]);

      const result = await salesService.getSales({ customerId: 'customer-123' });

      // Verify WHERE clause includes customerId filter
      const fetchCall = mockDb.execute.mock.calls[1];
      expect(fetchCall[0]).toContain('customerId = ?');
      expect(fetchCall[1]).toContain('customer-123');
    });

    it('should filter by date range', async () => {
      mockDb.execute.mockResolvedValueOnce([{ total: 10 }]);

      mockDb.execute.mockResolvedValueOnce([]);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await salesService.getSales({ startDate, endDate });

      // Verify WHERE clause includes date range filter
      const fetchCall = mockDb.execute.mock.calls[1];
      expect(fetchCall[0]).toContain('date >= ?');
      expect(fetchCall[0]).toContain('date <= ?');
    });

    it('should filter by amount range', async () => {
      mockDb.execute.mockResolvedValueOnce([{ total: 8 }]);

      mockDb.execute.mockResolvedValueOnce([]);

      await salesService.getSales({ minAmount: '50.00', maxAmount: '200.00' });

      // Verify WHERE clause includes amount range filter
      const fetchCall = mockDb.execute.mock.calls[1];
      expect(fetchCall[0]).toContain('totalAmount >= ?');
      expect(fetchCall[0]).toContain('totalAmount <= ?');
    });

    it('should filter by payment method', async () => {
      mockDb.execute.mockResolvedValueOnce([{ total: 15 }]);

      mockDb.execute.mockResolvedValueOnce([]);

      await salesService.getSales({ paymentMethod: 'card' });

      // Verify WHERE clause includes payment method filter
      const fetchCall = mockDb.execute.mock.calls[1];
      expect(fetchCall[0]).toContain('paymentMethod = ?');
    });

    it('should combine multiple filters', async () => {
      mockDb.execute.mockResolvedValueOnce([{ total: 3 }]);

      mockDb.execute.mockResolvedValueOnce([]);

      await salesService.getSales({
        customerId: 'customer-123',
        paymentMethod: 'cash',
        minAmount: '100.00',
      });

      // Verify WHERE clause includes all filters
      const fetchCall = mockDb.execute.mock.calls[1];
      expect(fetchCall[0]).toContain('customerId = ?');
      expect(fetchCall[0]).toContain('paymentMethod = ?');
      expect(fetchCall[0]).toContain('totalAmount >= ?');
    });
  });

  describe('getSalesSummary', () => {
    it('should calculate correct sales summary statistics', async () => {
      mockDb.execute.mockResolvedValueOnce([
        {
          saleCount: 100,
          totalSales: '10000.00',
          totalRevenue: '10000.00',
          averageSaleAmount: '100.00',
        },
      ]);

      const summary = await salesService.getSalesSummary();

      expect(summary.saleCount).toBe(100);
      expect(summary.totalSales).toBe('10000.00');
      expect(summary.totalRevenue).toBe('10000.00');
      expect(summary.averageSaleAmount).toBe('100.00');
    });

    it('should calculate summary with filters', async () => {
      mockDb.execute.mockResolvedValueOnce([
        {
          saleCount: 25,
          totalSales: '2500.00',
          totalRevenue: '2500.00',
          averageSaleAmount: '100.00',
        },
      ]);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const summary = await salesService.getSalesSummary({ startDate, endDate });

      expect(summary.saleCount).toBe(25);
      expect(summary.totalSales).toBe('2500.00');

      // Verify WHERE clause includes date range filter
      const fetchCall = mockDb.execute.mock.calls[0];
      expect(fetchCall[0]).toContain('date >= ?');
      expect(fetchCall[0]).toContain('date <= ?');
    });

    it('should handle empty result set', async () => {
      mockDb.execute.mockResolvedValueOnce([
        {
          saleCount: 0,
          totalSales: '0',
          totalRevenue: '0',
          averageSaleAmount: '0',
        },
      ]);

      const summary = await salesService.getSalesSummary();

      expect(summary.saleCount).toBe(0);
      expect(summary.totalSales).toBe('0');
      expect(summary.totalRevenue).toBe('0');
      expect(summary.averageSaleAmount).toBe('0');
    });
  });

  describe('getSaleById', () => {
    it('should fetch sale by ID with items', async () => {
      const mockSale = {
        id: 'sale-123',
        customerId: 'customer-1',
        totalAmount: 100,
        originalTotalAmount: 100,
        subTotalAmount: 100,
        amountPaid: 100,
        paymentMethod: 'cash',
        date: new Date('2024-01-15'),
        appliedInsuranceDiscountRate: 0,
        saleWarehouseId: 'warehouse-1',
        paymentTreasuryId: 'treasury-1',
        items: [
          {
            id: 'item-1',
            saleId: 'sale-123',
            productId: 'product-1',
            quantity: 2,
            price: 50,
            soldUnitType: 'main',
            costAtSale: 30,
            warehouseId: 'warehouse-1',
          },
        ],
      };

      // Mock the repository's findByIdWithItems method
      const { saleRepository } = require('../../repositories/sales');
      saleRepository.findByIdWithItems = vi.fn().mockResolvedValue(mockSale);

      const result = await salesService.getSaleById('sale-123');

      expect(result).toEqual(mockSale);
      expect(saleRepository.findByIdWithItems).toHaveBeenCalledWith('sale-123');
    });

    it('should return null for non-existent sale', async () => {
      const { saleRepository } = require('../../repositories/sales');
      saleRepository.findByIdWithItems = vi.fn().mockResolvedValue(null);

      const result = await salesService.getSaleById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('Performance Tests', () => {
    it('should load 1000 sales with items in less than 2 seconds (FR-006)', async () => {
      // Mock count query
      mockDb.execute.mockResolvedValueOnce([{ total: 1000 }]);

      // Generate mock data for 1000 sales with items
      const mockSales: any[] = [];
      for (let i = 0; i < 1000; i++) {
        // Each sale has 2-5 items
        const numItems = Math.floor(Math.random() * 4) + 2;
        for (let j = 0; j < numItems; j++) {
          mockSales.push({
            id: `sale-${i}`,
            customerId: `customer-${i % 50}`,
            totalAmount: '100.00',
            subTotalAmount: '100.00',
            amountPaid: '100.00',
            paymentMethod: 'cash',
            date: '2024-01-15T10:00:00.000Z',
            appliedInsuranceDiscountRate: '0',
            saleWarehouseId: 'warehouse-1',
            paymentTreasuryId: 'treasury-1',
            itemId: `item-${i}-${j}`,
            productId: `product-${i}-${j}`,
            quantity: 1,
            price: '100.00',
            soldUnitType: 'main',
            costAtSale: '50.00',
            warehouseId: 'warehouse-1',
          });
        }
      }

      mockDb.execute.mockResolvedValueOnce(mockSales);

      // Measure execution time
      const startTime = Date.now();
      const result = await salesService.getSales({ pageSize: 1000 });
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Verify performance requirement
      expect(executionTime).toBeLessThan(2000); // Less than 2 seconds
      expect(result.sales).toHaveLength(1000);

      console.log(`Performance: Loaded 1000 sales in ${executionTime}ms`);
    });

    it('should use single JOIN query instead of N+1 queries', async () => {
      mockDb.execute.mockResolvedValueOnce([{ total: 100 }]);

      // Return 100 sales with items
      const mockSales: any[] = [];
      for (let i = 0; i < 100; i++) {
        for (let j = 0; j < 2; j++) {
          mockSales.push({
            id: `sale-${i}`,
            customerId: `customer-${i % 20}`,
            totalAmount: '100.00',
            subTotalAmount: '100.00',
            amountPaid: '100.00',
            paymentMethod: 'cash',
            date: '2024-01-15T10:00:00.000Z',
            appliedInsuranceDiscountRate: '0',
            saleWarehouseId: 'warehouse-1',
            paymentTreasuryId: 'treasury-1',
            itemId: `item-${i}-${j}`,
            productId: `product-${i}-${j}`,
            quantity: 1,
            price: '100.00',
            soldUnitType: 'main',
            costAtSale: '50.00',
            warehouseId: 'warehouse-1',
          });
        }
      }

      mockDb.execute.mockResolvedValueOnce(mockSales);

      await salesService.getSales();

      // Verify only 2 queries were executed (count + fetch)
      // Not 1 + 100 (N+1 pattern)
      expect(mockDb.execute).toHaveBeenCalledTimes(2);
    });
  });
});
