# Quickstart Guide: Performance Optimization Implementation

**Feature**: System Performance Optimization and Code Quality Review
**Branch**: `001-code-review-optimization`
**Date**: 2026-01-09

## Overview

This guide helps developers get started implementing the performance optimization changes to the pharmacy POS system. Follow these steps to set up your development environment, understand the codebase structure, and begin implementing improvements.

## Prerequisites

Before starting, ensure you have:

- **Node.js**: v18+ (check: `node --version`)
- **MySQL**: 8.0+ (check: `mysql --version`)
- **Rust/Cargo**: Latest stable (for Tauri, check: `cargo --version`)
- **Git**: For version control (check: `git --version`)
- **Code Editor**: VS Code recommended with TypeScript/ESLint extensions

## Initial Setup

### 1. Clone and Install Dependencies

```bash
# Navigate to project
cd /home/yousefx00/Documents/Programing Projects/pharmacyPos

# Ensure you're on the optimization branch
git checkout 001-code-review-optimization

# Install Node.js dependencies
npm install

# Install Tauri CLI (if not already installed)
npm install -D @tauri-apps/cli

# Verify installation
npm run tauri --version
```

### 2. Database Setup

```bash
# Start MySQL server
sudo systemctl start mysql  # Linux
# or
brew services start mysql   # macOS

# Create database (if not exists)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS pharmacypos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Verify connection
mysql -u root -p pharmacypos -e "SHOW TABLES;"
```

**Expected Output**: List of tables (Products, SalesTransactions, SaleItems, etc.)

### 3. Install Testing Dependencies

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/user-event testcontainers happy-dom pino pino-pretty
```

### 4. Verify Build

```bash
# Build frontend
npm run build

# Build Tauri app (development mode)
npm run tauri dev
```

**Expected**: Application window opens with login screen

## Project Structure Overview

```
src/
├── app/                    # Next.js pages (DO NOT MODIFY during refactor)
├── components/             # React UI components (DO NOT MODIFY)
├── lib/
│   ├── db.ts              # Database connection (WILL BE REFACTORED)
│   ├── data.ts            # Monolithic data layer (WILL BE SPLIT)
│   ├── types.ts           # TypeScript types (WILL BE EXTENDED)
│   └── utils.ts           # Utilities (UNCHANGED)
├── store/                 # Zustand state (UNCHANGED)
└── hooks/                 # Custom hooks (UNCHANGED)

NEW STRUCTURE (to be created):
src/lib/
├── db/                    # Database infrastructure layer
│   ├── connection.ts      # Connection pool management
│   ├── transaction.ts     # Transaction wrapper
│   └── observability.ts   # Slow query logging
├── repositories/          # Data access layer
│   ├── base.ts           # Base repository with optimistic concurrency
│   ├── products.ts       # Product data access
│   ├── sales.ts          # Sales data access
│   └── ...               # Other domain repositories
├── services/             # Business logic layer
│   ├── products.ts       # Product operations
│   ├── sales.ts          # Sales operations
│   └── ...               # Other domain services
└── validators.ts         # Input validation

migrations/               # Database schema changes
tests/                    # Test files
├── integration/
├── unit/
└── fixtures/
```

## Understanding the Current Issues

### Issue 1: No Transactions (Critical)

**Location**: `src/lib/data.ts`, line 1025-1187 (`addSale` function)

**Problem**:
```typescript
// Current code (INCORRECT)
console.log("Starting addSale transaction..."); // Just a comment!
try {
  await (await db).execute(insertSale, params);        // Step 1
  for (const item of items) {
    await (await db).execute(insertItem, params);      // Step 2
    await (await db).execute(updateStock, params);     // Step 3
  }
  await (await db).execute(updateBalance, params);     // Step 4
} catch (error) {
  console.log("Rolling back..."); // NO ACTUAL ROLLBACK
  throw error;
}
```

**Impact**: If Step 3 fails, Steps 1-2 are already committed. Database left in inconsistent state.

**Solution**: Implement actual transactions (see research.md, Area 4)

### Issue 2: N+1 Queries (Performance)

**Location**: `src/lib/data.ts`, line 993-1006 (`getSales` function)

**Problem**:
```typescript
// Current code (SLOW)
const sales = await (await db).select("SELECT * FROM SalesTransactions", []);
for (const sale of sales) {
  sale.items = await getSaleItems(sale.id); // N+1 queries!
}
// 1000 sales = 1001 queries, takes 10+ seconds
```

**Impact**: Exponential slowdown as data grows. Violates SC-001 (<2 seconds for 1000 sales).

**Solution**: Use JOIN queries (see research.md, Area 7)

### Issue 3: String-Based Numerics (Data Integrity)

**Location**: Throughout `src/lib/data.ts` and `src/lib/types.ts`

**Problem**:
```typescript
// Current types
interface Product {
  price: string;      // Should be number
  quantity: string;   // Should be number
}

// Current database: VARCHAR columns for numeric data
// Current conversions: Constant string ↔ number overhead
```

**Impact**: Rounding errors in calculations, precision loss, migration complexity.

**Solution**: Migrate to DECIMAL types (see data-model.md)

## Development Workflow

### Phase 1: Setup Infrastructure (Week 1)

**Goal**: Establish foundation layers without breaking existing functionality

#### Task 1.1: Create Database Layer

```bash
# Create directory structure
mkdir -p src/lib/db
touch src/lib/db/connection.ts
touch src/lib/db/transaction.ts
touch src/lib/db/observability.ts
```

**Implement**:
1. `connection.ts`: Update existing `db.ts` to use connection pooling parameters
2. `transaction.ts`: Create `withTransaction()` helper (see research.md Area 4)
3. `observability.ts`: Create `executeWithTiming()` wrapper (see research.md Area 6)

**Test**: Write integration tests in `tests/integration/transactions.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { withTransaction } from '@/lib/db/transaction';

describe('Transaction Support', () => {
  it('should commit successful operations', async () => {
    const result = await withTransaction(async () => {
      // Test operations
      return { success: true };
    });
    expect(result.success).toBe(true);
  });

  it('should rollback failed operations', async () => {
    await expect(
      withTransaction(async () => {
        throw new Error('Test error');
      })
    ).rejects.toThrow('Test error');
    // Verify database state unchanged
  });
});
```

**Validation**: Run `npm run test:integration`

#### Task 1.2: Create Repository Base

```bash
mkdir -p src/lib/repositories
touch src/lib/repositories/base.ts
```

**Implement**: Base repository interface with optimistic concurrency (see contracts/database-api.md)

**Test**: Write unit tests for concurrency detection

### Phase 2: Refactor Data Access (Week 2)

**Goal**: Extract repositories from monolithic `data.ts` without changing function signatures

#### Task 2.1: Create Product Repository

```bash
touch src/lib/repositories/products.ts
```

**Strategy**:
1. Copy product-related functions from `data.ts` to `products.ts`
2. Refactor to use repository pattern
3. Keep original functions as wrappers (for backward compatibility)
4. Update original functions to call repository

**Example**:
```typescript
// NEW: src/lib/repositories/products.ts
export class ProductRepository {
  async findById(id: number): Promise<Product | null> {
    return withTransaction(async () => {
      const results = await select(
        'SELECT * FROM Products WHERE id = ?',
        [id]
      );
      return results[0] || null;
    });
  }
}

// KEEP (temporarily): src/lib/data.ts
export async function getProductById(id: number): Promise<Product | null> {
  const repo = new ProductRepository();
  return repo.findById(id); // Delegate to repository
}
```

**Test**: Ensure existing code still works, add repository tests

#### Task 2.2: Create Sales Repository with JOIN

```bash
touch src/lib/repositories/sales.ts
```

**Implement**: JOIN query optimization (see research.md Area 7)

**Critical**: This addresses the N+1 query problem. Measure performance before/after.

**Validation**:
```bash
# Performance test
npm run test:performance

# Expected output:
# BEFORE: getSales(1000 records) = 10.5 seconds
# AFTER:  getSales(1000 records) = 0.8 seconds ✓
```

### Phase 3: Run Migrations (Week 3)

**Goal**: Migrate schema from VARCHAR to DECIMAL safely

#### Task 3.1: Backup Database

```bash
# CRITICAL: Always backup before schema changes
mysqldump -u root -p pharmacypos > backup_pre_migration_$(date +%Y%m%d).sql
```

#### Task 3.2: Run Migration Script

```bash
# Create migration
node migrations/002_varchar_to_decimal.js up

# Verify migration
mysql -u root -p pharmacypos -e "DESC Products;"

# Check version column added
# Check price/quantity are DECIMAL(10,2)
```

#### Task 3.3: Review Audit Log

```bash
# Check for invalid data conversions
cat migrations/migration-audit.log

# Expected format:
# 2026-01-09 14:30:15 Products price 12345 "N/A" 0.00
# 2026-01-09 14:30:15 Products quantity 67890 "" 0.000
```

**Action**: Review logged records with pharmacy staff, manually correct critical data (products with 0 price).

### Phase 4: Extract Services (Week 4)

**Goal**: Move business logic from `data.ts` to service layer

```bash
mkdir -p src/lib/services
touch src/lib/services/products.ts
touch src/lib/services/sales.ts
# ... other services
```

**Pattern**:
```typescript
// src/lib/services/sales.ts
export class SaleService {
  private saleRepo: SaleRepository;
  private productRepo: ProductRepository;

  async createSale(data: CreateSaleDTO): Promise<SaleTransaction> {
    return withTransaction(async () => {
      // 1. Validate stock availability
      await this.validateStock(data.items);

      // 2. Create sale
      const sale = await this.saleRepo.create(data);

      // 3. Update inventory
      await this.productRepo.adjustQuantities(data.items);

      // 4. Update customer balance
      if (data.customerId) {
        await this.customerRepo.adjustBalance(data.customerId, data.totalAmount);
      }

      return sale;
    });
  }
}
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run specific test file
npm run test:unit -- tests/unit/services/products.test.ts

# Watch mode (during development)
npm run test:unit -- --watch
```

### Integration Tests

```bash
# Setup test database (uses testcontainers)
npm run test:setup

# Run integration tests
npm run test:integration

# Teardown
npm run test:teardown
```

### Coverage Report

```bash
npm run test:coverage

# Opens coverage report in browser
# Target: 80% coverage for src/lib/services/ and src/lib/repositories/
```

## Performance Validation

### Measure Query Performance

```bash
# Start application with slow query logging enabled
npm run dev

# Perform operations
# Open logs/slow-queries.ndjson

# Analyze slow queries
cat logs/slow-queries.ndjson | jq -r 'select(.duration > 100) | "\(.duration)ms: \(.query)"' | sort -rn
```

**Expected After Optimization**:
- Fewer than 5% of queries logged (SC-020)
- No queries >2 seconds for 1000 records (SC-001)

### Benchmark Critical Operations

```typescript
// tests/performance/benchmarks.test.ts
import { describe, it, expect } from 'vitest';
import { SaleService } from '@/lib/services/sales';

describe('Performance Benchmarks', () => {
  it('should load 1000 sales in <2 seconds', async () => {
    const start = performance.now();
    const sales = await saleService.getSales({ limit: 1000 });
    const duration = performance.now() - start;

    expect(sales.length).toBe(1000);
    expect(duration).toBeLessThan(2000); // SC-001
  });

  it('should process 10-item sale in <1 second', async () => {
    const saleData = createMockSale(10); // 10 items
    const start = performance.now();
    await saleService.createSale(saleData);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(1000); // SC-002
  });
});
```

## Troubleshooting

### Issue: Tests fail with database connection errors

**Solution**:
```bash
# Check MySQL is running
sudo systemctl status mysql

# Check credentials in src/lib/db/connection.ts
# Verify database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'pharmacypos';"
```

### Issue: Migration fails with "invalid decimal value"

**Solution**:
```bash
# Check migration audit log for problematic records
cat migrations/migration-audit.log | grep "INVALID"

# Manually fix data before re-running migration
mysql -u root -p pharmacypos

# Fix example:
UPDATE Products SET price = '0.00' WHERE price = '' OR price IS NULL;
```

### Issue: Performance tests still failing after optimization

**Solution**:
1. Check slow query log: `cat logs/slow-queries.ndjson | jq .`
2. Verify indexes exist: `SHOW INDEX FROM SalesTransactions;`
3. Analyze query execution: `EXPLAIN SELECT ...;`
4. Check connection pool stats in observability logs

## Next Steps

After completing the quickstart setup:

1. **Review**: Read all Phase 0 artifacts (plan.md, research.md, data-model.md, contracts/)
2. **Plan Tasks**: Run `/speckit.tasks` to generate detailed task breakdown
3. **Implement**: Follow task order, commit frequently, validate with tests
4. **Validate**: Run full test suite and performance benchmarks before merging

## Useful Commands

```bash
# Development
npm run dev              # Start Tauri dev mode
npm run build            # Build production bundle
npm run tauri build      # Build desktop installer

# Testing
npm run test            # Run all tests
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests only
npm run test:coverage   # Generate coverage report
npm run test:watch      # Watch mode

# Database
npm run db:migrate      # Run migrations
npm run db:rollback     # Rollback last migration
npm run db:seed         # Load test fixtures

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # TypeScript check
npm run format          # Prettier format

# Logs
tail -f logs/slow-queries.ndjson  # Monitor slow queries
grep "duration" logs/slow-queries.ndjson | jq -r '.duration' | sort -rn | head -10  # Top 10 slowest
```

## Getting Help

- **Spec Questions**: Review `/specs/001-code-review-optimization/spec.md`
- **Technical Decisions**: Review `/specs/001-code-review-optimization/research.md`
- **API Contracts**: Review `/specs/001-code-review-optimization/contracts/database-api.md`
- **Data Model**: Review `/specs/001-code-review-optimization/data-model.md`

## Success Checklist

Before marking this feature as complete, verify:

- [ ] All tests pass (`npm run test`)
- [ ] Coverage ≥80% for critical paths (`npm run test:coverage`)
- [ ] Performance benchmarks meet targets (SC-001 through SC-005)
- [ ] Slow query log shows <5% slow queries (SC-020)
- [ ] Build succeeds without ignoring errors (`npm run build`)
- [ ] TypeScript strict mode enabled, no type errors
- [ ] ESLint passes with no violations
- [ ] Database migrations tested on copy of production data
- [ ] Audit log reviewed and critical issues resolved
- [ ] Documentation updated

**Estimated Time**: 3-4 weeks for complete implementation following this guide.
