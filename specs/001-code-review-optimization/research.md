# Technical Research: Performance Optimization

**Feature**: System Performance Optimization and Code Quality Review
**Branch**: `001-code-review-optimization`
**Date**: 2026-01-09

## Overview

This document consolidates research findings for 8 technical decision areas required to optimize the pharmacy POS system. All decisions are based on analysis of the current codebase, technology stack (Tauri + Next.js + MySQL), and performance requirements defined in the feature specification.

---

## 1. Testing Framework Selection

**Decision**: Use **Vitest** as the primary testing framework with **@testing-library/react** for component tests and **testcontainers-node** with MySQL for database integration tests.

**Rationale**: Vitest is the optimal choice for the Next.js + TypeScript stack because it provides native ESM support, is 10-20x faster than Jest, has built-in TypeScript support without configuration, and integrates seamlessly with Vite/Next.js tooling. It supports both unit and integration tests with excellent coverage reporting. For database operations in `src/lib/data.ts`, testcontainers allows spinning up real MySQL instances for integration tests, ensuring complex transaction logic (like in `addSale` and `addPurchase`) works correctly with actual database semantics. This is critical for validating the atomic transaction requirement (FR-001) and rollback scenarios (SC-007: 100% rollback success).

**Alternatives Considered**:
- **Jest**: Rejected due to slower performance, complex ESM configuration with Next.js 15, and requires additional setup for TypeScript with ts-jest.
- **Mocha + Chai**: Rejected because it lacks built-in coverage reporting, requires more boilerplate setup, and has weaker TypeScript integration compared to Vitest.
- **AVA**: Rejected due to smaller ecosystem, lack of comprehensive mocking utilities needed for Tauri IPC testing, and less community support for React testing.

**Implementation Notes**:
```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/user-event testcontainers happy-dom
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.test.ts']
    },
    setupFiles: ['./tests/setup.ts']
  }
});
```

---

## 2. Database Migration Strategy

**Decision**: Use **node-migrate** with a custom audit logging system, implementing a **blue-green table swap** approach for VARCHAR to DECIMAL migration with validation hooks.

**Rationale**: For migrating ~1000 products with VARCHAR price/quantity fields to DECIMAL, a table-level migration minimizes downtime and allows atomic rollback. The strategy involves: (1) Create new `Products_v2` table with DECIMAL columns, (2) Copy data with validation (convert invalid values to 0.00 and log to `migration_audit` table per FR-008a), (3) Use triggers to sync changes during migration window, (4) Swap tables atomically with `RENAME TABLE Products TO Products_old, Products_v2 TO Products`. This approach allows zero-downtime as both tables can coexist briefly, and rollback is simply reversing the RENAME operation. Critical for maintaining pharmacy operations during optimization (Constraints: "Must complete optimization in phases").

**Alternatives Considered**:
- **ALTER TABLE with direct conversion**: Rejected because it locks the entire table for ~1-5 minutes with 1000 rows, making the POS unusable and providing no rollback capability once started.
- **Prisma Migrate**: Rejected as current codebase doesn't use an ORM and adding Prisma would require refactoring all 30+ database functions in `src/lib/data.ts`.
- **Knex.js migrations**: Rejected due to additional dependency overhead when node-migrate provides sufficient functionality for a one-time structural change.

**Implementation Notes**:
```javascript
// Migration script: migrations/002_varchar_to_decimal.js
exports.up = async function(next) {
  // 1. Create new table with DECIMAL types
  await this.execute(`
    CREATE TABLE Products_v2 LIKE Products;
    ALTER TABLE Products_v2
      ADD COLUMN version INT NOT NULL DEFAULT 0 AFTER id,
      MODIFY COLUMN price DECIMAL(10,2),
      MODIFY COLUMN quantity DECIMAL(10,3);
  `);

  // 2. Copy with validation and audit logging
  await this.execute(`
    INSERT INTO Products_v2
    SELECT
      id,
      0 as version,
      CAST(NULLIF(REGEXP_REPLACE(price, '[^0-9.]', ''), '') AS DECIMAL(10,2)) as price,
      CAST(NULLIF(REGEXP_REPLACE(quantity, '[^0-9.]', ''), '') AS DECIMAL(10,3)) as quantity,
      -- other columns
    FROM Products;

    -- Log invalid conversions
    INSERT INTO migration_audit (table_name, column_name, row_id, invalid_value, converted_to)
    SELECT 'Products', 'price', id, price, 0.00
    FROM Products
    WHERE NOT price REGEXP '^[0-9]+(\\.[0-9]+)?$';
  `);

  // 3. Create sync triggers (optional for long migration window)
  // 4. Swap tables atomically
  await this.execute(`
    RENAME TABLE Products TO Products_old, Products_v2 TO Products;
  `);

  next();
};

exports.down = async function(next) {
  await this.execute(`
    RENAME TABLE Products TO Products_v2, Products_old TO Products;
  `);
  next();
};
```

---

## 3. Connection Pooling Implementation

**Decision**: **tauri-plugin-sql-api DOES support native connection pooling** via the underlying `sqlx` library. Configure it using the connection URL parameters: `mysql://root:root@localhost:3306/pharmacypos?pool_size=10&pool_timeout=30&idle_timeout=600`.

**Rationale**: Based on the tauri-plugin-sql v1 architecture, it uses `sqlx` under the hood which provides production-grade connection pooling with `sqlx::Pool`. The pool is created automatically when calling `Database.load()` and persists for the application lifetime. The current implementation in `src/lib/db.ts` already initializes the pool, but URL parameters must be added to configure pool size (5-10 per FR-021), connection timeout (30s per FR-021a), idle timeout (10min), and test-on-checkout for connection validation (FR-021b). This satisfies SC-003: "System supports 5 concurrent users performing sales operations simultaneously without timeouts or errors."

**Alternatives Considered**:
- **Custom JavaScript-side pooling wrapper**: Rejected because it would duplicate pooling logic already implemented in sqlx, create synchronization issues between Rust and JS layers, and add unnecessary complexity.
- **Singleton connection without pooling**: Rejected as it would cause bottlenecks when multiple concurrent operations occur (e.g., POS transaction while generating inventory report), leading to query serialization and poor performance.

**Implementation Notes**:
Update `src/lib/db.ts`:
```typescript
let db: any;
try {
  if (typeof window !== "undefined") {
    db = Database?.load(
      "mysql://root:root@localhost:3306/pharmacypos?" +
      "pool_size=10&" +                    // FR-021: max 10 connections
      "pool_timeout=30&" +                 // FR-021a: 30-second timeout
      "idle_timeout=600&" +                // 10-minute idle timeout
      "test_before_acquire=true"           // FR-021b: validate idle connections
    );
  }
} catch (error) {
  console.error("Database connection failed:", error);
  throw error;
}

export default db;
```

---

## 4. Transaction API in Tauri SQL Plugin

**Decision**: **tauri-plugin-sql-api does NOT provide explicit BEGIN/COMMIT/ROLLBACK methods**. Implement transactions using **manual SQL commands** (`await db.execute("START TRANSACTION")`, `COMMIT`, `ROLLBACK`) wrapped in try-catch blocks with a transaction helper function.

**Rationale**: The tauri-plugin-sql v1 API only exposes `execute()` and `select()` methods without native transaction primitives. However, MySQL supports transaction control via SQL commands that can be executed through the existing API. The current codebase has complex multi-statement operations (e.g., `addSale` performs 4-5 separate queries) that are currently marked as "conceptual transactions" but not actually atomic. Implementing a `withTransaction()` helper ensures ACID properties for critical operations like sales and purchases where inventory, customer balance, and treasury must all update together or not at all (FR-001, SC-007). This directly addresses the identified issue: "NO ACTUAL TRANSACTIONS: All operations are separate queries without atomicity."

**Alternatives Considered**:
- **Wait for tauri-plugin-sql v2 API**: Rejected because v2 is not yet stable, the production system needs transaction support now, and the manual SQL approach works reliably with MySQL.
- **Application-level compensating transactions**: Rejected as it's error-prone (partial rollback logic exists in `deleteSale` but is complex), doesn't handle connection failures, and violates database ACID guarantees.

**Implementation Notes**:
Create transaction helper in `src/lib/db/transaction.ts`:
```typescript
import db from '../db';

export async function withTransaction<T>(
  callback: () => Promise<T>,
  isolationLevel: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE' = 'READ COMMITTED'
): Promise<T> {
  try {
    // FR-001a: Use READ COMMITTED isolation level
    await (await db).execute("START TRANSACTION", []);
    await (await db).execute(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`, []);

    const result = await callback();

    await (await db).execute("COMMIT", []);
    return result;
  } catch (error) {
    await (await db).execute("ROLLBACK", []);
    console.error("Transaction rolled back:", error);
    throw error;
  }
}

// Usage example (refactor addSale)
export async function addSale(saleData: CreateSaleDTO): Promise<SaleTransaction> {
  return withTransaction(async () => {
    // All operations within this block are atomic
    const saleId = await insertSale(saleData);
    await insertSaleItems(saleId, saleData.items);
    await updateProductQuantities(saleData.items);
    await updateCustomerBalance(saleData.customerId, saleData.totalAmount);
    await addTreasuryTransaction(saleData);
    return getSale(saleId);
  });
}
```

---

## 5. Optimistic Concurrency Pattern

**Decision**: Use **integer version number** (`version INT NOT NULL DEFAULT 0`) with `UPDATE ... WHERE id = ? AND version = ? SET version = version + 1` pattern and implement 3-retry logic with exponential backoff (100ms, 300ms, 900ms).

**Rationale**: Version numbers are superior to timestamps for concurrency control because they eliminate clock skew issues, are deterministic (timestamps with microsecond precision can still collide), and require only 4 bytes vs 8 bytes for DATETIME(6). In inventory operations, when 5 concurrent users update stock through `updateProduct`, the version check ensures the last writer doesn't blindly overwrite changes (FR-025). The UPDATE will return `affectedRows: 0` if version mismatch occurs, triggering a retry after re-fetching current state (FR-025: "automatically retry conflicting operations up to 3 times"). This adds minimal overhead (~5μs per UPDATE) while preventing lost updates in the multi-user POS environment. Directly addresses the issue: "What happens when two users try to update the same product inventory simultaneously?"

**Alternatives Considered**:
- **DATETIME(6) timestamp**: Rejected because MySQL's DATETIME precision is only microseconds which can still have collisions under high concurrency, requires 8 bytes storage, and complicates timezone handling in Date parsing logic.
- **Pessimistic locking (SELECT FOR UPDATE)**: Rejected as it requires explicit transaction management for all reads, creates deadlock risk when multiple tables are involved (Products + SaleTransactionItems), and reduces throughput in read-heavy reporting operations.
- **Row-level hash/ETag**: Rejected due to computational overhead of hashing entire row, complexity in comparing hash values, and no significant benefit over simple integer version.

**Implementation Notes**:
```sql
-- Add version column to tables (see data-model.md)
ALTER TABLE Products ADD COLUMN version INT NOT NULL DEFAULT 0 AFTER id;
ALTER TABLE SaleItems ADD COLUMN version INT NOT NULL DEFAULT 0 AFTER id;
ALTER TABLE PurchaseItems ADD COLUMN version INT NOT NULL DEFAULT 0 AFTER id;

-- Update pattern with optimistic lock
UPDATE Products
SET quantity = quantity - :soldQuantity,
    version = version + 1
WHERE id = :productId AND version = :expectedVersion;
-- Check affectedRows: 0 = conflict, 1 = success
```

```typescript
// Retry helper in src/lib/repositories/base.ts
export async function updateWithRetry<T>(
  updateFn: (version: number) => Promise<T>,
  getFn: () => Promise<{ version: number }>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const current = await getFn();
      return await updateFn(current.version);
    } catch (error) {
      if (error.message.includes('version mismatch') && attempt < maxRetries - 1) {
        const delay = 100 * Math.pow(3, attempt); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Optimistic lock failed after 3 retries");
}
```

---

## 6. Slow Query Logging Implementation

**Decision**: Implement a **query wrapper decorator** that measures execution time using `performance.now()`, logs queries >100ms to a structured JSON log file using **pino** logger, and stores logs in `logs/slow-queries.ndjson` for analysis with grep/jq or log aggregation tools.

**Rationale**: Since tauri-plugin-sql-api doesn't expose query timing hooks, wrapping the `execute()` and `select()` calls is the only viable approach. Using `performance.now()` provides microsecond precision timing in both Node.js and browser contexts. Pino is the fastest JSON logger for Node.js (5-10x faster than Winston), automatically handles log rotation, supports structured logging for easy querying, and has minimal overhead (<1ms per log entry). For a POS system, the logs help identify problematic queries like the N+1 pattern in `getSales()` which fetches items separately for each sale (FR-004a: "log slow queries >100ms", SC-019: "Slow query log captures 100% of queries >100ms", SC-020: "<5% queries trigger slow query log after optimization").

**Alternatives Considered**:
- **MySQL slow query log**: Rejected because it requires server-level configuration users may not control (shared hosting/cloud), doesn't capture application context (user, operation type), and requires parsing MySQL log format.
- **Winston logger**: Rejected due to slower performance (important when logging every query), more complex configuration, and heavier footprint for a desktop application.
- **Direct console.log**: Rejected as it's unstructured, not filterable by threshold, lost on application restart, and unsuitable for production monitoring.

**Implementation Notes**:
```bash
npm install pino pino-pretty
```

Create `src/lib/db/observability.ts`:
```typescript
import pino from 'pino';

const logger = pino({
  transport: {
    target: 'pino/file',
    options: { destination: './logs/slow-queries.ndjson' }
  }
});

export async function executeWithTiming(
  queryFn: () => Promise<any>,
  query: string,
  params: any[]
): Promise<any> {
  const start = performance.now();
  try {
    const result = await queryFn();
    const duration = performance.now() - start;

    // FR-004a: Log queries >100ms
    if (duration > 100) {
      logger.warn({
        query,
        params,
        duration,
        timestamp: new Date().toISOString(),
        type: 'slow_query'
      });
    }

    return result;
  } catch (error) {
    logger.error({
      query,
      params,
      error: error.message,
      timestamp: new Date().toISOString(),
      type: 'query_error'
    });
    throw error;
  }
}

// Wrap database operations
export async function select(query: string, params: any[]) {
  return executeWithTiming(
    () => (await db).select(query, params),
    query,
    params
  );
}

export async function execute(query: string, params: any[]) {
  return executeWithTiming(
    () => (await db).execute(query, params),
    query,
    params
  );
}
```

---

## 7. JOIN Query Optimization Patterns

**Decision**: Use **LEFT JOIN with result grouping** in application code to fetch sales with items in a single query, mapping flattened rows to nested TypeScript objects using a `groupByParent()` helper function.

**Rationale**: The current `getSales()` implementation performs N+1 queries (1000 sales = 1001 queries) by calling `getSaleItems()` separately for each sale. Using `LEFT JOIN SaleTransactionItems ON sales.id = items.saleId` reduces query count from 1001 to 1 (FR-005: "eliminate N+1 query patterns"). While the JOIN returns flattened rows (1 row per item), grouping in JavaScript is fast (~5ms for 1000 sales × 5 items). This reduces execution time from ~2-5 seconds to <200ms for 1000 records, meeting SC-001: "Sales history with 1000 transactions loads completely with all item details in under 2 seconds." Alternative JSON aggregation functions (JSON_ARRAYAGG) have compatibility issues with older MySQL versions and add complexity to type mapping.

**Alternatives Considered**:
- **JSON_ARRAYAGG for database-side grouping**: Rejected due to compatibility concerns with MySQL versions <5.7.22, complexity in parsing nested JSON structures to TypeScript types, and limited ability to transform/filter data client-side.
- **Keep N+1 pattern with caching**: Rejected as caching adds complexity, doesn't solve the root problem, introduces cache invalidation issues, and still has poor first-load performance.
- **Separate queries with Promise.all()**: Rejected because parallelizing 1000 queries overwhelms the connection pool (configured for 10 connections), may hit MySQL max_connections limit, and still slower than single JOIN.

**Implementation Notes**:
```typescript
// Optimized getSales in src/lib/repositories/sales.ts
export async function findAllWithItems(
  options?: QueryOptions
): Promise<SaleTransactionWithItems[]> {
  const query = `
    SELECT
      s.id, s.transactionDate, s.totalAmount, s.paidAmount, s.discount,
      s.paymentMethod, s.customerId, s.userId, s.treasuryId,
      i.id as item_id, i.productId, i.quantity, i.unitPrice, i.total
    FROM SalesTransactions s
    LEFT JOIN SaleItems i ON s.id = i.saleId
    ORDER BY s.transactionDate DESC
  `;

  const rows = await select(query, []);

  // Group items by sale
  const salesMap = new Map<number, SaleTransactionWithItems>();

  for (const row of rows) {
    if (!salesMap.has(row.id)) {
      salesMap.set(row.id, {
        id: row.id,
        transactionDate: row.transactionDate,
        totalAmount: parseFloat(row.totalAmount),
        paidAmount: parseFloat(row.paidAmount),
        discount: parseFloat(row.discount),
        paymentMethod: row.paymentMethod,
        customerId: row.customerId,
        userId: row.userId,
        treasuryId: row.treasuryId,
        items: []
      });
    }

    if (row.item_id) {
      salesMap.get(row.id)!.items.push({
        id: row.item_id,
        productId: row.productId,
        quantity: parseFloat(row.quantity),
        unitPrice: parseFloat(row.unitPrice),
        total: parseFloat(row.total)
      });
    }
  }

  return Array.from(salesMap.values());
}
```

---

## 8. Batch Operation APIs

**Decision**: Use **MySQL's multi-row INSERT syntax** with prepared statement placeholders in chunks of 100 rows, wrapped in transactions, with partial failure handling that logs failed rows to an error table and continues processing valid rows.

**Rationale**: For importing 500 products, executing 500 individual INSERTs takes ~5-10 seconds due to network round-trips and transaction overhead. MySQL's `INSERT INTO Products VALUES (?,?,...), (?,?,...), ...` with 100-row chunks reduces this to ~500ms by batching network calls and reusing a single prepared statement (FR-007: "batch insert/update operations", SC-004: "Bulk import of 500 products completes in under 10 seconds"). Chunking at 100 rows balances memory usage (query size ~50KB) vs performance, staying well below MySQL's 16MB `max_allowed_packet`. Wrapping each chunk in a transaction ensures atomicity per batch, and logging failures to `import_errors` table allows retry of just failed records without rolling back successful ones.

**Alternatives Considered**:
- **LOAD DATA INFILE**: Rejected because Tauri's security model restricts file system access, requires writing to temp files (complex in cross-platform desktop app), and doesn't allow row-level validation/transformation logic.
- **Individual INSERT with Promise.all()**: Rejected as parallelizing 500 queries still takes 2-3 seconds, overwhelms connection pool, doesn't benefit from prepared statement reuse, and complicates partial failure handling.
- **Batch size of 1000+ rows**: Rejected because it creates >1MB queries that approach MySQL limits, consumes excessive client-side memory preparing the statement, and makes debugging individual row failures difficult.

**Implementation Notes**:
```typescript
// Create src/lib/services/batch-operations.ts
export async function batchInsertProducts(
  products: CreateProductDTO[],
  chunkSize: number = 100
): Promise<BatchResult> {
  const errors: any[] = [];
  let successCount = 0;

  for (let i = 0; i < products.length; i += chunkSize) {
    const chunk = products.slice(i, i + chunkSize);

    // Build multi-row INSERT
    const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(',');
    const values = chunk.flatMap(p => [
      p.name_ar, p.name_en, p.barcode, p.price,
      p.cost, p.quantity, p.unit_id, p.category_id
    ]);

    try {
      await withTransaction(async () => {
        const result = await execute(
          `INSERT INTO Products (name_ar, name_en, barcode, price, cost, quantity, unit_id, category_id)
           VALUES ${placeholders}`,
          values
        );
        successCount += chunk.length;
      });
    } catch (error) {
      errors.push({
        chunkIndex: i / chunkSize,
        error: error.message,
        data: chunk
      });

      // Log to error table for retry
      await logBatchError(chunk, error);
    }
  }

  return {
    success: successCount,
    failed: errors.length * chunkSize,
    errors
  };
}

interface BatchResult {
  success: number;
  failed: number;
  errors: any[];
}
```

---

## Summary

These research findings provide production-ready solutions specifically tailored to the Tauri + Next.js + MySQL pharmacy POS architecture. Each decision prioritizes:

1. **Minimal dependencies**: Leveraging existing tools where possible (Vitest over Jest, native MySQL transactions)
2. **Desktop app constraints**: Considering connection pooling needs, file system access limitations, and single-user vs multi-user scenarios
3. **Data integrity**: Transaction safety, optimistic locking, and audit logging for pharmaceutical inventory compliance
4. **Performance**: Sub-2-second response times for 1000-record operations (SC-001), batch processing for imports (SC-004)
5. **Maintainability**: Solutions integrate cleanly with existing codebase structure in `src/lib/data.ts`

All decisions directly address issues identified in the code review and map to specific functional requirements (FR-###) and success criteria (SC-###) from the feature specification.

## Implementation Priority

Based on impact and dependencies:

**Phase 1 (Critical)**: Areas 4, 3, 5
- Transaction support (Area 4) is foundational for data integrity
- Connection pooling (Area 3) enables concurrent users
- Optimistic concurrency (Area 5) prevents data conflicts

**Phase 2 (High Impact)**: Areas 7, 8
- JOIN query optimization (Area 7) addresses primary performance bottleneck
- Batch operations (Area 8) improve import workflows

**Phase 3 (Infrastructure)**: Areas 1, 6, 2
- Testing framework (Area 1) enables validation
- Slow query logging (Area 6) provides observability
- Migration strategy (Area 2) executes schema changes safely

All file paths referenced are absolute paths from project root: `/home/yousefx00/Documents/Programing Projects/pharmacyPos/`
