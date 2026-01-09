# Database API Contracts

**Feature**: System Performance Optimization and Code Quality Review
**Branch**: `001-code-review-optimization`
**Date**: 2026-01-09

## Overview

This document defines the internal API contracts for the database layer, repository layer, and service layer. These contracts establish clear boundaries between layers and enable independent testing.

## Layer Architecture

```
┌─────────────────────────────────────┐
│     UI Layer (React Components)     │
│  src/app/, src/components/          │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│      Service Layer (Business Logic) │
│  src/lib/services/                  │
│  - products.ts, sales.ts, etc.      │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│   Repository Layer (Data Access)    │
│  src/lib/repositories/              │
│  - base.ts, products.ts, etc.       │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│    Database Layer (Infrastructure)  │
│  src/lib/db/                        │
│  - connection.ts, transaction.ts    │
└─────────────┬───────────────────────┘
              │
              ▼
       tauri-plugin-sql-api
              │
              ▼
         MySQL 8.0+
```

## Database Layer Contracts

### Connection Pool Interface

**File**: `src/lib/db/connection.ts`

```typescript
/**
 * Database connection pool configuration
 */
export interface ConnectionPoolConfig {
  /** Database connection string */
  url: string;
  /** Minimum number of connections in pool */
  minConnections: number;  // 5
  /** Maximum number of connections in pool */
  maxConnections: number;  // 10
  /** Connection timeout in milliseconds */
  connectionTimeout: number;  // 30000 (30 seconds)
  /** Idle connection timeout in milliseconds */
  idleTimeout: number;  // 60000 (1 minute)
}

/**
 * Connection pool interface
 */
export interface ConnectionPool {
  /** Get a connection from the pool */
  getConnection(): Promise<DatabaseConnection>;

  /** Release a connection back to the pool */
  releaseConnection(connection: DatabaseConnection): Promise<void>;

  /** Get pool statistics for monitoring */
  getStats(): Promise<PoolStats>;

  /** Close all connections and shutdown pool */
  close(): Promise<void>;
}

/**
 * Connection pool statistics for observability
 */
export interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  averageWaitTime: number;  // milliseconds
}

/**
 * Database connection interface
 */
export interface DatabaseConnection {
  /** Execute a single query */
  query<T>(sql: string, params: any[]): Promise<T[]>;

  /** Execute a non-SELECT query (INSERT/UPDATE/DELETE) */
  execute(sql: string, params: any[]): Promise<ExecuteResult>;

  /** Begin a transaction */
  beginTransaction(isolationLevel?: IsolationLevel): Promise<void>;

  /** Commit current transaction */
  commit(): Promise<void>;

  /** Rollback current transaction */
  rollback(): Promise<void>;

  /** Check if connection is in a transaction */
  inTransaction(): boolean;
}

/**
 * Transaction isolation levels
 */
export enum IsolationLevel {
  READ_UNCOMMITTED = 'READ UNCOMMITTED',
  READ_COMMITTED = 'READ COMMITTED',      // DEFAULT for this project
  REPEATABLE_READ = 'REPEATABLE READ',
  SERIALIZABLE = 'SERIALIZABLE'
}

/**
 * Result of an execute operation
 */
export interface ExecuteResult {
  affectedRows: number;
  insertId?: number;
}
```

### Transaction Context Interface

**File**: `src/lib/db/transaction.ts`

```typescript
/**
 * Transaction context for executing operations atomically
 */
export interface TransactionContext {
  /**
   * Execute an operation within a transaction
   * Automatically handles BEGIN, COMMIT, ROLLBACK
   *
   * @param operation - Function to execute within transaction
   * @returns Result of the operation
   * @throws Error if operation fails (triggers rollback)
   */
  execute<T>(operation: (conn: DatabaseConnection) => Promise<T>): Promise<T>;

  /**
   * Transaction isolation level (READ_COMMITTED for this project)
   */
  readonly isolationLevel: IsolationLevel;
}

/**
 * Transaction options
 */
export interface TransactionOptions {
  isolationLevel?: IsolationLevel;
  timeout?: number;  // milliseconds
}

/**
 * Create a new transaction context
 *
 * @example
 * const result = await withTransaction(async (conn) => {
 *   await conn.execute('INSERT INTO Sales ...', params);
 *   await conn.execute('UPDATE Products ...', params);
 *   return { success: true };
 * });
 */
export function withTransaction<T>(
  operation: (conn: DatabaseConnection) => Promise<T>,
  options?: TransactionOptions
): Promise<T>;
```

### Observability Interface

**File**: `src/lib/db/observability.ts`

```typescript
/**
 * Query execution metrics
 */
export interface QueryMetrics {
  query: string;
  params: any[];
  executionTime: number;  // milliseconds
  timestamp: Date;
  success: boolean;
  error?: string;
}

/**
 * Slow query logger
 */
export interface SlowQueryLogger {
  /**
   * Log a slow query (execution time > threshold)
   *
   * @param metrics - Query metrics
   */
  log(metrics: QueryMetrics): Promise<void>;

  /**
   * Get slow query threshold
   */
  getThreshold(): number;  // 100ms for this project

  /**
   * Get slow query statistics
   */
  getStats(): Promise<SlowQueryStats>;
}

/**
 * Slow query statistics
 */
export interface SlowQueryStats {
  totalQueries: number;
  slowQueries: number;
  slowPercentage: number;
  averageSlowQueryTime: number;
  slowestQuery: QueryMetrics | null;
}

/**
 * Query instrumentation wrapper
 * Wraps query execution with timing and logging
 *
 * @example
 * const result = await instrument(
 *   () => conn.query('SELECT * FROM Products', []),
 *   'SELECT * FROM Products',
 *   []
 * );
 */
export function instrument<T>(
  queryFn: () => Promise<T>,
  sql: string,
  params: any[]
): Promise<T>;
```

## Repository Layer Contracts

### Base Repository Interface

**File**: `src/lib/repositories/base.ts`

```typescript
/**
 * Base repository interface with CRUD operations and optimistic concurrency
 */
export interface Repository<TEntity, TCreateDTO, TUpdateDTO> {
  /**
   * Find entity by ID
   *
   * @param id - Entity ID
   * @returns Entity or null if not found
   */
  findById(id: number | string): Promise<TEntity | null>;

  /**
   * Find all entities matching options
   *
   * @param options - Query options (filters, sorting, pagination)
   * @returns Array of entities
   */
  findAll(options?: QueryOptions): Promise<TEntity[]>;

  /**
   * Create a new entity
   *
   * @param data - Entity creation data
   * @returns Created entity with generated ID
   */
  create(data: TCreateDTO): Promise<TEntity>;

  /**
   * Update an existing entity with optimistic concurrency control
   *
   * @param id - Entity ID
   * @param version - Expected version number
   * @param data - Update data
   * @returns Updated entity with incremented version
   * @throws ConcurrencyError if version mismatch (0 rows affected)
   */
  update(id: number | string, version: number, data: TUpdateDTO): Promise<TEntity>;

  /**
   * Delete an entity
   *
   * @param id - Entity ID
   * @throws Error if entity has dependencies
   */
  delete(id: number | string): Promise<void>;

  /**
   * Count entities matching options
   *
   * @param options - Query options (filters only)
   * @returns Count of matching entities
   */
  count(options?: QueryOptions): Promise<number>;
}

/**
 * Query options for repository operations
 */
export interface QueryOptions {
  /** Filters (WHERE clause) */
  where?: Record<string, any>;

  /** Sorting (ORDER BY clause) */
  orderBy?: {
    field: string;
    direction: 'ASC' | 'DESC';
  }[];

  /** Pagination */
  limit?: number;
  offset?: number;

  /** Relationships to include (for JOIN queries) */
  include?: string[];
}

/**
 * Concurrency error thrown when version mismatch detected
 */
export class ConcurrencyError extends Error {
  constructor(
    public readonly entity: string,
    public readonly id: number | string,
    public readonly expectedVersion: number
  ) {
    super(`Concurrent modification detected for ${entity}#${id} (expected version ${expectedVersion})`);
    this.name = 'ConcurrencyError';
  }
}

/**
 * Retry policy for handling concurrency errors
 */
export interface RetryPolicy {
  maxRetries: number;  // 3 for this project
  retryDelay: number;  // milliseconds between retries
  onRetry?: (attempt: number, error: ConcurrencyError) => void;
}

/**
 * Execute an operation with automatic retry on concurrency errors
 *
 * @example
 * const product = await withRetry(
 *   async () => productRepo.update(id, version, { quantity: newQuantity }),
 *   { maxRetries: 3, retryDelay: 100 }
 * );
 */
export function withRetry<T>(
  operation: () => Promise<T>,
  policy: RetryPolicy
): Promise<T>;
```

### Product Repository Interface

**File**: `src/lib/repositories/products.ts`

```typescript
/**
 * Product-specific repository operations
 */
export interface ProductRepository extends Repository<Product, CreateProductDTO, UpdateProductDTO> {
  /**
   * Find product by barcode
   *
   * @param barcode - Product barcode
   * @returns Product or null if not found
   */
  findByBarcode(barcode: string): Promise<Product | null>;

  /**
   * Find products by category
   *
   * @param categoryId - Category ID
   * @returns Array of products
   */
  findByCategory(categoryId: number): Promise<Product[]>;

  /**
   * Find products with low stock
   *
   * @returns Products where quantity <= min_stock
   */
  findLowStock(): Promise<Product[]>;

  /**
   * Update product quantity with optimistic concurrency
   * Specialized method for inventory adjustments
   *
   * @param id - Product ID
   * @param version - Expected version
   * @param quantityDelta - Amount to add/subtract (can be negative)
   * @returns Updated product
   * @throws ConcurrencyError if version mismatch
   * @throws Error if resulting quantity would be negative
   */
  adjustQuantity(id: number, version: number, quantityDelta: number): Promise<Product>;
}
```

### Sale Repository Interface

**File**: `src/lib/repositories/sales.ts`

```typescript
/**
 * Sale-specific repository operations
 */
export interface SaleRepository extends Repository<SaleTransaction, CreateSaleDTO, UpdateSaleDTO> {
  /**
   * Find sale with all items in a single query (JOIN)
   * Eliminates N+1 query pattern
   *
   * @param id - Sale ID
   * @returns Sale with items array populated, or null
   */
  findByIdWithItems(id: number): Promise<SaleTransactionWithItems | null>;

  /**
   * Find all sales with items in a single query (JOIN)
   * Critical performance optimization
   *
   * @param options - Query options
   * @returns Array of sales with items arrays populated
   */
  findAllWithItems(options?: QueryOptions): Promise<SaleTransactionWithItems[]>;

  /**
   * Find sales by date range
   *
   * @param startDate - Start date (inclusive)
   * @param endDate - End date (inclusive)
   * @returns Array of sales
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<SaleTransaction[]>;

  /**
   * Find sales by customer
   *
   * @param customerId - Customer ID
   * @returns Array of sales
   */
  findByCustomer(customerId: number): Promise<SaleTransaction[]>;

  /**
   * Get sales summary statistics
   *
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Summary statistics
   */
  getSalesSummary(startDate: Date, endDate: Date): Promise<SalesSummary>;
}

/**
 * Sale with items populated (JOIN result)
 */
export interface SaleTransactionWithItems extends SaleTransaction {
  items: SaleItem[];
}

/**
 * Sales summary statistics
 */
export interface SalesSummary {
  totalSales: number;
  totalAmount: number;
  totalDiscount: number;
  averageSaleAmount: number;
}
```

## Service Layer Contracts

### Product Service Interface

**File**: `src/lib/services/products.ts`

```typescript
/**
 * Product business logic service
 */
export interface ProductService {
  /**
   * Get product by ID
   *
   * @param id - Product ID
   * @returns Product or null
   */
  getProduct(id: number): Promise<Product | null>;

  /**
   * Get product by barcode
   *
   * @param barcode - Product barcode
   * @returns Product or null
   */
  getProductByBarcode(barcode: string): Promise<Product | null>;

  /**
   * Get all products
   *
   * @param filters - Optional filters
   * @returns Array of products
   */
  getProducts(filters?: ProductFilters): Promise<Product[]>;

  /**
   * Create a new product
   *
   * @param data - Product data
   * @returns Created product
   * @throws ValidationError if data invalid
   */
  createProduct(data: CreateProductDTO): Promise<Product>;

  /**
   * Update product
   *
   * @param id - Product ID
   * @param version - Expected version (optimistic concurrency)
   * @param data - Update data
   * @returns Updated product
   * @throws ConcurrencyError if version mismatch
   * @throws ValidationError if data invalid
   */
  updateProduct(id: number, version: number, data: UpdateProductDTO): Promise<Product>;

  /**
   * Delete product
   *
   * @param id - Product ID
   * @throws Error if product has sales/purchase history
   */
  deleteProduct(id: number): Promise<void>;

  /**
   * Get products with low stock
   *
   * @returns Products where quantity <= min_stock
   */
  getLowStockProducts(): Promise<Product[]>;
}
```

### Sale Service Interface

**File**: `src/lib/services/sales.ts`

```typescript
/**
 * Sale transaction business logic service
 */
export interface SaleService {
  /**
   * Create a new sale transaction
   * Atomic operation that:
   * 1. Creates sale record
   * 2. Creates sale items
   * 3. Updates product quantities
   * 4. Updates customer balance
   * 5. Creates treasury transaction
   *
   * All within a single database transaction with READ_COMMITTED isolation
   *
   * @param data - Sale data with items
   * @returns Created sale with items
   * @throws ValidationError if data invalid
   * @throws InsufficientStockError if product quantity insufficient
   * @throws ConcurrencyError if product quantity changed during transaction
   */
  createSale(data: CreateSaleDTO): Promise<SaleTransactionWithItems>;

  /**
   * Get sale by ID with all items (single JOIN query)
   *
   * @param id - Sale ID
   * @returns Sale with items or null
   */
  getSale(id: number): Promise<SaleTransactionWithItems | null>;

  /**
   * Get all sales with items (single JOIN query per result)
   * Critical performance: must load 1000 sales in <2 seconds
   *
   * @param filters - Optional filters
   * @returns Array of sales with items
   */
  getSales(filters?: SaleFilters): Promise<SaleTransactionWithItems[]>;

  /**
   * Get sales summary for reporting
   *
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Sales summary statistics
   */
  getSalesSummary(startDate: Date, endDate: Date): Promise<SalesSummary>;
}

/**
 * Sale filters
 */
export interface SaleFilters {
  startDate?: Date;
  endDate?: Date;
  customerId?: number;
  userId?: number;
  paymentMethod?: string;
}

/**
 * Insufficient stock error
 */
export class InsufficientStockError extends Error {
  constructor(
    public readonly productId: number,
    public readonly productName: string,
    public readonly available: number,
    public readonly requested: number
  ) {
    super(`Insufficient stock for product ${productName}: requested ${requested}, available ${available}`);
    this.name = 'InsufficientStockError';
  }
}
```

## Data Transfer Objects (DTOs)

### Product DTOs

```typescript
/**
 * DTO for creating a product
 */
export interface CreateProductDTO {
  name_ar: string;
  name_en: string;
  barcode: string;
  price: number;
  cost?: number;
  quantity: number;
  min_stock?: number;
  max_stock?: number;
  unit_id: number;
  category_id: number;
  warehouse_id: number;
}

/**
 * DTO for updating a product
 */
export interface UpdateProductDTO {
  name_ar?: string;
  name_en?: string;
  barcode?: string;
  price?: number;
  cost?: number;
  quantity?: number;
  min_stock?: number;
  max_stock?: number;
  unit_id?: number;
  category_id?: number;
  warehouse_id?: number;
}
```

### Sale DTOs

```typescript
/**
 * DTO for creating a sale
 */
export interface CreateSaleDTO {
  transaction_date: Date;
  total_amount: number;
  paid_amount: number;
  discount: number;
  payment_method: string;
  customer_id?: number;
  user_id: number;
  treasury_id: number;
  items: CreateSaleItemDTO[];
}

/**
 * DTO for sale item
 */
export interface CreateSaleItemDTO {
  product_id: number;
  quantity: number;
  unit_price: number;
  total: number;
}
```

## Error Handling Contracts

```typescript
/**
 * Base application error
 */
export class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends ApplicationError {
  constructor(message: string, public readonly fields?: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends ApplicationError {
  constructor(entity: string, id: number | string) {
    super(`${entity} with ID ${id} not found`, 'NOT_FOUND', 404);
  }
}

/**
 * Concurrency error (409)
 * Already defined in base repository
 */
export class ConcurrencyError extends ApplicationError {
  constructor(entity: string, id: number | string, expectedVersion: number) {
    super(
      `Concurrent modification detected for ${entity}#${id} (expected version ${expectedVersion})`,
      'CONCURRENCY_ERROR',
      409
    );
  }
}
```

## Testing Contracts

```typescript
/**
 * Test database connection for integration tests
 * Uses separate test database
 */
export interface TestDatabase {
  /**
   * Setup test database (create tables, load fixtures)
   */
  setup(): Promise<void>;

  /**
   * Teardown test database (drop tables, close connections)
   */
  teardown(): Promise<void>;

  /**
   * Reset test data between tests
   */
  reset(): Promise<void>;

  /**
   * Load fixtures from file
   */
  loadFixtures(file: string): Promise<void>;
}

/**
 * Mock repository for unit tests
 * Implements Repository interface without database
 */
export interface MockRepository<T> extends Repository<T, any, any> {
  /**
   * Set mock data to return from findById/findAll
   */
  setMockData(data: T[]): void;

  /**
   * Get call history for verification
   */
  getCallHistory(): RepositoryCall[];

  /**
   * Reset mock state
   */
  reset(): void;
}
```

## Performance SLAs

These contracts must meet the following performance requirements:

| Operation | Target | Success Criterion |
|-----------|--------|-------------------|
| `findByIdWithItems()` | <50ms | Single JOIN query |
| `findAllWithItems()` 1000 records | <2 seconds | SC-001 |
| `createSale()` with 10 items | <1 second | SC-002 |
| `adjustQuantity()` with retry | <200ms | Optimistic concurrency overhead |
| Connection pool `getConnection()` | <10ms | When connections available |
| Transaction `execute()` overhead | <5ms | BEGIN/COMMIT cost |

## Migration Path

**Phase 1: Add Database Layer** (Week 1)
- Implement connection pool
- Implement transaction wrapper
- Add observability (slow query logging)
- Tests: Connection pool behavior, transaction rollback

**Phase 2: Add Repository Layer** (Week 2)
- Implement base repository with optimistic concurrency
- Implement product repository
- Implement sale repository with JOIN queries
- Tests: CRUD operations, concurrency conflicts, JOIN performance

**Phase 3: Refactor Service Layer** (Week 3)
- Extract services from data.ts
- Replace direct DB access with repositories
- Wrap multi-step operations in transactions
- Tests: Business logic, transaction atomicity

**Phase 4: Update UI Layer** (Week 4)
- Update components to use new services
- Remove old data.ts imports
- Tests: Integration tests, E2E tests

## Contract Validation

All implementations must:
1. ✅ Implement the interface completely (no partial implementations)
2. ✅ Include TypeScript JSDoc comments on all public methods
3. ✅ Throw documented error types (no generic Error)
4. ✅ Handle edge cases (null checks, empty arrays, etc.)
5. ✅ Meet performance SLAs for their layer
6. ✅ Have corresponding test coverage (80% minimum)

## Summary

These contracts define clear boundaries between layers:
- **Database Layer**: Infrastructure (connections, transactions, logging)
- **Repository Layer**: Data access (CRUD, queries, concurrency)
- **Service Layer**: Business logic (validation, workflows, transactions)
- **UI Layer**: User interaction (React components, hooks)

Each layer depends only on the layer below, enabling independent testing and refactoring.
