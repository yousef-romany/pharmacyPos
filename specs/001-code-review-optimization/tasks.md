# Tasks: System Performance Optimization and Code Quality Review

**Input**: Design documents from `/specs/001-code-review-optimization/`
**Prerequisites**: plan.md (✓), spec.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓)

**Tests**: Integration and performance tests are included as these are critical for validating transaction atomicity, query performance, and concurrent operations.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: TypeScript/Next.js application with Tauri desktop wrapper
- Source code: `src/` at repository root
- Tests: `tests/` at repository root
- Migrations: `migrations/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and testing framework

- [ ] T001 Install Vitest testing dependencies: `npm install -D vitest @vitest/ui @testing-library/react @testing-library/user-event testcontainers happy-dom`
- [ ] T002 [P] Create vitest.config.ts with 80% coverage thresholds and happy-dom environment
- [ ] T003 [P] Create test setup file in tests/setup.ts for global test configuration
- [ ] T004 [P] Install observability dependencies: `npm install pino pino-pretty`
- [ ] T005 [P] Install migration tooling: `npm install -D node-migrate`
- [ ] T006 Create directory structure for new architecture: src/lib/db/, src/lib/repositories/, src/lib/services/, migrations/, tests/integration/, tests/unit/
- [ ] T007 [P] Create logs/ directory for slow query logging with .gitignore entry

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Layer Infrastructure

- [ ] T008 Update src/lib/db.ts to configure connection pooling with URL parameters (pool_size=10, pool_timeout=30, idle_timeout=600, test_before_acquire=true)
- [ ] T009 [P] Create src/lib/db/transaction.ts with withTransaction() helper implementing READ COMMITTED isolation level
- [ ] T010 [P] Create src/lib/db/observability.ts with executeWithTiming() wrapper and pino slow query logger (100ms threshold)
- [ ] T011 [P] Create src/lib/db/connection.ts with ConnectionPool interface and pool statistics methods
- [ ] T012 Integrate observability wrapper into transaction helper to instrument all queries automatically

### Base Repository Pattern

- [ ] T013 Create src/lib/repositories/base.ts with Repository interface including CRUD operations and optimistic concurrency control
- [ ] T014 [P] Implement ConcurrencyError class in src/lib/repositories/base.ts for version mismatch detection
- [ ] T015 [P] Implement withRetry() helper in src/lib/repositories/base.ts with 3-retry exponential backoff (100ms, 300ms, 900ms delays)

### Database Migrations

- [ ] T016 Create migration script migrations/001_add_version_columns.sql to add version INT NOT NULL DEFAULT 0 to Products, SaleItems, PurchaseItems tables
- [ ] T017 Create migration script migrations/002_varchar_to_decimal.sql implementing blue-green table swap for Products, SalesTransactions, SaleItems, PurchaseItems, PurchaseTransactions, Customers, Suppliers tables
- [ ] T018 [P] Create migrations/migration-audit.log structure and logging functions for invalid data conversions
- [ ] T019 [P] Create migration rollback scripts for both migrations in migrations/rollback/
- [ ] T020 Create migration test script in tests/migrations/validate-migration.test.ts to verify data integrity

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Reliable Multi-Item Sales Transactions (Priority: P1) 🎯 MVP

**Goal**: Implement atomic transactions for sales operations ensuring all-or-nothing behavior (sale creation, item insertion, inventory updates, customer balance updates, treasury transactions)

**Independent Test**: Process a multi-item sale and simulate failures at different stages. Test passes if all operations commit together or rollback completely with no partial data.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T021 [P] [US1] Create integration test tests/integration/sales-transactions.test.ts with atomic transaction rollback scenarios (test fails during item 3 of 5, verify complete rollback)
- [ ] T022 [P] [US1] Create integration test tests/integration/sales-treasury-integration.test.ts to verify treasury transaction failure triggers complete sale rollback
- [ ] T023 [P] [US1] Create performance test tests/performance/sale-transaction-timing.test.ts to verify 10-item sale completes in <1 second (SC-002)

### Implementation for User Story 1

- [ ] T024 [US1] Create src/lib/repositories/sales.ts implementing SaleRepository with create(), findById(), findByIdWithItems() methods
- [ ] T025 [P] [US1] Create src/lib/repositories/sale-items.ts implementing SaleItemRepository with createBatch() for multi-item insertion
- [ ] T026 [US1] Refactor addSale() function in src/lib/data.ts to use withTransaction() wrapper wrapping all 5 operations (insert sale, insert items, update inventory, update customer balance, add treasury transaction)
- [ ] T027 [US1] Update updateProduct() function in src/lib/data.ts to use optimistic concurrency with version checking in UPDATE WHERE clause
- [ ] T028 [US1] Add transaction logging to src/lib/db/observability.ts to record BEGIN/COMMIT/ROLLBACK operations with timestamps and operation counts
- [ ] T029 [US1] Update addPurchase() function in src/lib/data.ts to use withTransaction() wrapper (mirror sales transaction pattern)
- [ ] T030 [US1] Add error handling in withTransaction() to catch connection errors and log rollback details

**Checkpoint**: At this point, User Story 1 should be fully functional - all sales/purchases are atomic, failures trigger rollback, no partial data committed

---

## Phase 4: User Story 2 - Fast Sales History Retrieval (Priority: P1)

**Goal**: Eliminate N+1 query pattern by fetching sales with all items in a single JOIN query, reducing 1000-sale load from 10+ seconds to <2 seconds

**Independent Test**: Load sales history page with 1000 transactions and measure timing. Test passes if all sales with complete item details load in under 2 seconds.

### Tests for User Story 2

- [ ] T031 [P] [US2] Create performance test tests/performance/sales-history-query.test.ts measuring load time for 1000 sales with items (target <2 seconds for SC-001)
- [ ] T032 [P] [US2] Create integration test tests/integration/sales-join-query.test.ts verifying JOIN query returns correct nested structure with all items
- [ ] T033 [P] [US2] Create benchmark test tests/performance/query-count-validation.test.ts comparing N+1 (1001 queries) vs JOIN (1 query) approaches

### Implementation for User Story 2

- [ ] T034 [US2] Implement findAllWithItems() in src/lib/repositories/sales.ts using LEFT JOIN with SaleItems and application-side grouping
- [ ] T035 [P] [US2] Create groupSalesWithItems() helper in src/lib/repositories/sales.ts to map flattened JOIN rows to nested SaleTransactionWithItems structure
- [ ] T036 [US2] Update getSales() function in src/lib/data.ts to call repository findAllWithItems() instead of separate getSaleItems() calls in loop
- [ ] T037 [US2] Add query result caching in findAllWithItems() to avoid re-fetching for filters/sorts (cache cleared on sale creation)
- [ ] T038 [US2] Implement findByDateRange() in src/lib/repositories/sales.ts with WHERE clause filter instead of filtering in JavaScript
- [ ] T039 [US2] Create similar JOIN optimization for purchases: implement findAllWithItems() in src/lib/repositories/purchases.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - sales history loads fast with JOIN queries

---

## Phase 5: User Story 3 - Accurate Financial Calculations (Priority: P1)

**Goal**: Migrate numeric VARCHAR columns to DECIMAL types and update all calculation logic to use proper decimal precision (2 decimal places for money, 3 for quantities)

**Independent Test**: Perform sale with decimal quantities and prices (e.g., 3.5 units @ 15.99 EGP with 10% discount), verify calculated totals match expected values with proper rounding.

### Tests for User Story 3

- [ ] T040 [P] [US3] Create unit test tests/unit/decimal-calculations.test.ts verifying precision for 100 transactions with various prices/quantities/discounts (SC-008: zero rounding errors)
- [ ] T041 [P] [US3] Create integration test tests/integration/financial-accuracy.test.ts comparing treasury totals with sum of sale totals (SC-006: zero discrepancy)
- [ ] T042 [P] [US3] Create migration validation test tests/migrations/decimal-conversion.test.ts to verify VARCHAR→DECIMAL conversion preserves existing data correctly

### Implementation for User Story 3

- [ ] T043 [US3] Backup production database: run `mysqldump -u root -p pharmacypos > backup_pre_migration_$(date +%Y%m%d).sql`
- [ ] T044 [US3] Execute migration 001: run `node migrations/001_add_version_columns.sql` to add version columns (dry-run on test database first)
- [ ] T045 [US3] Execute migration 002: run `node migrations/002_varchar_to_decimal.sql` implementing blue-green table swap (dry-run on test database first)
- [ ] T046 [US3] Review migrations/migration-audit.log for invalid data conversions and create manual correction script for critical records (products with 0 price)
- [ ] T047 [US3] Update TypeScript type definitions in src/lib/types.ts changing price/quantity/cost/balance from string to number
- [ ] T048 [US3] Remove formatNumberForDB() and parseFloatFromDB() conversion functions from src/lib/data.ts (no longer needed with DECIMAL types)
- [ ] T049 [US3] Update all calculation logic in src/lib/data.ts to use Number() arithmetic instead of parseFloat(string) conversions
- [ ] T050 [US3] Add input validation in src/lib/validators.ts to ensure price > 0, quantity > 0, discount >= 0 with 2-decimal precision enforcement
- [ ] T051 [US3] Update formatMoney() display function in src/lib/utils.ts to use toFixed(2) for consistent rendering

**Checkpoint**: All user stories 1-3 should now be independently functional with accurate decimal calculations throughout

---

## Phase 6: User Story 4 - Concurrent Multi-User Operations (Priority: P2)

**Goal**: Enable 5 concurrent users to perform sales operations simultaneously without timeouts, leveraging connection pool and optimistic concurrency

**Independent Test**: Simulate 5 concurrent users each processing sales transactions simultaneously. Test passes if all transactions complete successfully within reasonable time (<5 seconds each) without errors.

### Tests for User Story 4

- [ ] T052 [P] [US4] Create concurrency test tests/integration/concurrent-sales.test.ts simulating 5 parallel sale transactions and verifying all complete successfully
- [ ] T053 [P] [US4] Create load test tests/performance/connection-pool-stress.test.ts measuring connection wait times under concurrent load (validate 10-connection pool sizing)
- [ ] T054 [P] [US4] Create optimistic lock test tests/integration/inventory-concurrent-update.test.ts simulating 2 users updating same product and verifying version conflict detection with retry

### Implementation for User Story 4

- [ ] T055 [US4] Implement adjustQuantity() method in src/lib/repositories/products.ts with optimistic lock UPDATE WHERE version check
- [ ] T056 [US4] Wrap adjustQuantity() with withRetry() helper to automatically retry on ConcurrencyError (3 attempts with exponential backoff)
- [ ] T057 [US4] Update updateProduct() calls in sale/purchase flows to use adjustQuantity() instead of direct UPDATE queries
- [ ] T058 [US4] Add connection pool monitoring in src/lib/db/connection.ts tracking active/idle connections, wait times, and logging pool exhaustion events
- [ ] T059 [US4] Implement getPoolStats() method in src/lib/db/connection.ts returning ConnectionPoolStats for observability dashboard
- [ ] T060 [US4] Add query timeout configuration (30 seconds) to prevent long-running queries from holding connections indefinitely (FR-022)

**Checkpoint**: System now supports 5 concurrent users without bottlenecks, conflicts detected and retried automatically

---

## Phase 7: User Story 5 - Maintainable and Modular Codebase (Priority: P2)

**Goal**: Split monolithic 1,973-line src/lib/data.ts into domain-specific modules (products, sales, purchases, customers, suppliers, inventory, users, treasury) with <500 lines each

**Independent Test**: Ask developer to locate and modify a specific function (e.g., "change product price calculation"). Test passes if code is found in under 2 minutes in dedicated module.

### Tests for User Story 5

- [ ] T061 [P] [US5] Create unit tests for Product service in tests/unit/services/products.test.ts covering CRUD operations independently
- [ ] T062 [P] [US5] Create unit tests for Sale service in tests/unit/services/sales.test.ts covering transaction flows independently
- [ ] T063 [P] [US5] Create code metrics validation in tests/quality/module-size.test.ts verifying no file exceeds 500 lines (SC-012)

### Implementation for User Story 5

- [ ] T064 [P] [US5] Create src/lib/services/products.ts extracting getProduct(), getProducts(), createProduct(), updateProduct(), deleteProduct(), getLowStockProducts() from data.ts
- [ ] T065 [P] [US5] Create src/lib/services/sales.ts extracting createSale(), getSale(), getSales(), getSalesSummary() from data.ts with repository delegation
- [ ] T066 [P] [US5] Create src/lib/services/purchases.ts extracting createPurchase(), getPurchase(), getPurchases() from data.ts
- [ ] T067 [P] [US5] Create src/lib/services/customers.ts extracting customer CRUD and balance adjustment functions from data.ts
- [ ] T068 [P] [US5] Create src/lib/services/suppliers.ts extracting supplier CRUD functions from data.ts
- [ ] T069 [P] [US5] Create src/lib/services/inventory.ts extracting inventory adjustment and warehouse management functions from data.ts
- [ ] T070 [P] [US5] Create src/lib/services/users.ts extracting user management functions from data.ts
- [ ] T071 [P] [US5] Create src/lib/services/treasury.ts extracting treasury transaction functions from data.ts
- [ ] T072 [US5] Update src/lib/data.ts to keep only public API functions as wrappers delegating to service layer (maintain backward compatibility during transition)
- [ ] T073 [US5] Create src/lib/repositories/products.ts implementing ProductRepository with findByBarcode(), findByCategory(), findLowStock() methods
- [ ] T074 [P] [US5] Create src/lib/repositories/customers.ts implementing CustomerRepository
- [ ] T075 [P] [US5] Create src/lib/repositories/suppliers.ts implementing SupplierRepository
- [ ] T076 [US5] Update all UI components in src/app/ to import from new service layer instead of data.ts (one component at a time to avoid breaking changes)

**Checkpoint**: Codebase is now modular with clear separation - developers can locate functionality quickly, changes isolated to specific modules

---

## Phase 8: User Story 6 - Batch Data Operations (Priority: P3)

**Goal**: Implement efficient batch insert/update for bulk operations (500-product import, 100-item purchase orders) using multi-row INSERT syntax with 100-row chunks

**Independent Test**: Import 500 products with full details. Test passes if import completes in under 10 seconds with all records saved correctly.

### Tests for User Story 6

- [ ] T077 [P] [US6] Create performance test tests/performance/batch-import.test.ts measuring 500-product import time (target <10 seconds for SC-004)
- [ ] T078 [P] [US6] Create integration test tests/integration/batch-partial-failure.test.ts verifying partial failure handling logs errors and continues with valid records
- [ ] T079 [P] [US6] Create unit test tests/unit/batch-chunking.test.ts verifying 500 records chunked correctly into 5 batches of 100

### Implementation for User Story 6

- [ ] T080 [US6] Create src/lib/services/batch-operations.ts with batchInsertProducts() implementing multi-row INSERT with 100-row chunks
- [ ] T081 [P] [US6] Create src/lib/repositories/batch.ts with executeBatch() helper wrapping chunks in transactions with error logging
- [ ] T082 [US6] Implement batchUpdateProducts() in src/lib/services/batch-operations.ts for bulk price/quantity updates
- [ ] T083 [US6] Create import_errors table schema in migrations/003_import_errors.sql for logging failed batch rows
- [ ] T084 [US6] Add logBatchError() function in src/lib/services/batch-operations.ts to record failed rows to import_errors table
- [ ] T085 [US6] Update addPurchase() to use batch insertion when items > 10 instead of sequential loop
- [ ] T086 [US6] Create CSV import endpoint using batchInsertProducts() for product catalog imports

**Checkpoint**: Bulk operations now complete efficiently - 500-product import in <10 seconds, large purchases process quickly

---

## Phase 9: User Story 7 - Type Safety and Build Quality (Priority: P3)

**Goal**: Remove ignoreBuildErrors and ignoreDuringBuilds flags, fix all TypeScript errors, enable strict linting so builds fail on type/lint violations

**Independent Test**: Introduce deliberate type error and run build. Test passes if build fails with clear error message pointing to the type issue.

### Tests for User Story 7

- [ ] T087 [P] [US7] Create build validation test tests/quality/build-strictness.test.ts that introduces test type error and verifies build fails
- [ ] T088 [P] [US7] Create ESLint validation test tests/quality/lint-enforcement.test.ts verifying unused variables cause build failure

### Implementation for User Story 7

- [ ] T089 [US7] Update next.config.ts removing `typescript: { ignoreBuildErrors: true }` flag
- [ ] T090 [US7] Update next.config.ts removing `eslint: { ignoreDuringBuilds: true }` flag
- [ ] T091 [US7] Run `npm run build` to identify all TypeScript errors exposed by strict checking
- [ ] T092 [US7] Fix TypeScript errors in src/app/ components (type all useState/useEffect properly, fix any type assertions)
- [ ] T093 [US7] Fix TypeScript errors in src/lib/ services and repositories (add proper return types, fix parameter types)
- [ ] T094 [US7] Run `npm run lint` to identify all ESLint violations
- [ ] T095 [US7] Fix ESLint violations: remove unused variables, add missing dependencies to useEffect, fix console.log statements
- [ ] T096 [US7] Add pre-commit hook in .husky/pre-commit running `npm run type-check && npm run lint` to prevent commits with errors
- [ ] T097 [US7] Update tsconfig.json enabling strict mode flags: `strictNullChecks: true`, `strictFunctionTypes: true`, `noImplicitAny: true`
- [ ] T098 [US7] Verify clean build: `npm run build` completes without errors or warnings

**Checkpoint**: Build process now enforces type safety and code quality - no errors slip through to production

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

- [ ] T099 [P] Create comprehensive documentation in specs/001-code-review-optimization/implementation-notes.md documenting actual vs planned changes
- [ ] T100 [P] Add JSDoc comments to all public methods in services and repositories for API documentation
- [ ] T101 Run full test suite: `npm run test` and verify 80% coverage achieved (SC-013)
- [ ] T102 Run performance benchmark suite validating all success criteria (SC-001 through SC-005)
- [ ] T103 [P] Review slow query logs (logs/slow-queries.ndjson) and verify <5% queries exceed 100ms threshold (SC-020)
- [ ] T104 Analyze connection pool statistics and verify average utilization <70% during normal operations (SC-003a)
- [ ] T105 [P] Create migration checklist in migrations/DEPLOYMENT.md with pre-flight checks and rollback procedures
- [ ] T106 Test migration on copy of production data to validate data integrity and audit log accuracy
- [ ] T107 [P] Update README.md with new architecture overview, directory structure, and testing instructions
- [ ] T108 Run security audit: `npm audit` and address any high/critical vulnerabilities
- [ ] T109 Perform code review of all repository and service layers ensuring consistent error handling
- [ ] T110 Validate quickstart.md by running through setup steps on clean environment
- [ ] T111 Create performance dashboard logging connection pool stats, slow query counts, and transaction times
- [ ] T112 Final integration test: simulate 5 concurrent users performing mixed operations (sales, purchases, inventory) for 5 minutes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-9)**: All depend on Foundational phase completion
  - US1 (Transactions): Can start after Foundational - RECOMMENDED FIRST (MVP)
  - US2 (Query Optimization): Can start after Foundational - Independent
  - US3 (Decimal Migration): Depends on US1 (transactions protect migration) - RECOMMENDED SECOND
  - US4 (Concurrency): Depends on Foundational - Can run parallel with US1/US2
  - US5 (Modularity): Depends on US1-US4 (refactor working code) - RECOMMENDED LATER
  - US6 (Batch Ops): Can start after Foundational - Independent
  - US7 (Type Safety): Depends on US5 (clean code easier to type) - RECOMMENDED LAST
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (Transactions - P1)**: FOUNDATIONAL → US1 → ✅ MVP Ready
- **User Story 2 (Query Optimization - P1)**: FOUNDATIONAL → US2 → ✅ Independent
- **User Story 3 (Decimal Migration - P1)**: FOUNDATIONAL → US1 → US3 (transactions protect migration)
- **User Story 4 (Concurrency - P2)**: FOUNDATIONAL → US4 → ✅ Independent (but benefits from US1 transactions)
- **User Story 5 (Modularity - P2)**: FOUNDATIONAL → US1+US2+US3+US4 → US5 (refactor working implementation)
- **User Story 6 (Batch Ops - P3)**: FOUNDATIONAL → US6 → ✅ Independent
- **User Story 7 (Type Safety - P3)**: FOUNDATIONAL → US5 → US7 (clean modular code easier to type)

### Recommended Execution Order

**Critical Path (MVP)**:
1. Phase 1: Setup → Phase 2: Foundational
2. Phase 3: US1 (Transactions) ← **STOP HERE FOR MVP**
3. Validate: Run tests T021-T023, verify atomic behavior

**Full P1 Features** (Critical for production):
1. Continue: Phase 4: US2 (Query Optimization)
2. Continue: Phase 5: US3 (Decimal Migration) ← **Requires US1 transactions**
3. Validate: Run all P1 tests, verify performance targets

**P2 Features** (Important):
4. Continue: Phase 6: US4 (Concurrency)
5. Continue: Phase 7: US5 (Modularity) ← **Refactors working code**
6. Validate: Developer experience improved, code organized

**P3 Features** (Nice-to-have):
7. Continue: Phase 8: US6 (Batch Operations)
8. Continue: Phase 9: US7 (Type Safety)
9. Phase 10: Polish & Final Validation

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Repository layer before service layer
- Service layer before UI integration
- Core implementation before edge cases
- Integration tests before moving to next story

### Parallel Opportunities

**Phase 1 (Setup)**: T001-T007 can all run in parallel (different files, no dependencies)

**Phase 2 (Foundational)**:
- T009, T010, T011 can run in parallel (different database layer files)
- T014, T015 can run in parallel (repository base utilities)
- T018, T019 can run in parallel (migration support files)

**Phase 3 (US1 - Transactions)**:
- T021, T022, T023 can run in parallel (different test files)
- T025 parallel with T024 (SaleItemRepository independent from SaleRepository)

**Phase 4 (US2 - Query Optimization)**:
- T031, T032, T033 can run in parallel (different test files)
- T035 can develop alongside T034 (helper function)

**Phase 5 (US3 - Decimal Migration)**:
- T040, T041, T042 can run in parallel (different test files)
- T050, T051 can run in parallel (validation + display utilities)

**Phase 6 (US4 - Concurrency)**:
- T052, T053, T054 can run in parallel (different test scenarios)

**Phase 7 (US5 - Modularity)**:
- T061, T062, T063 can run in parallel (different test suites)
- T064-T071 can ALL run in parallel (8 service modules, different files)
- T073-T075 can run in parallel (3 repository modules)

**Phase 8 (US6 - Batch Operations)**:
- T077, T078, T079 can run in parallel (different test files)
- T081 parallel with T080 (repository helper alongside service)

**Phase 9 (US7 - Type Safety)**:
- T087, T088 can run in parallel (different validation tests)
- T092, T093 can run in parallel after identifying errors (app vs lib fixes)

**Phase 10 (Polish)**:
- T099, T100, T105, T107 can all run in parallel (documentation tasks)

---

## Parallel Example: User Story 1 (Transactions)

```bash
# STEP 1: Launch all tests for US1 together (they should fail initially):
Task T021: "Integration test for atomic transaction rollback scenarios"
Task T022: "Integration test for treasury transaction failure triggering rollback"
Task T023: "Performance test for 10-item sale timing"

# STEP 2: Implement repositories in parallel:
Task T024: "Create SaleRepository in src/lib/repositories/sales.ts"
Task T025: "Create SaleItemRepository in src/lib/repositories/sale-items.ts"

# STEP 3: Sequential integration (T026 depends on T024, T025):
Task T026: "Refactor addSale() to use withTransaction()"
Task T027: "Update updateProduct() with optimistic concurrency"
# ... continue sequentially

# STEP 4: Verify tests now pass
npm run test -- tests/integration/sales-transactions.test.ts
```

---

## Parallel Example: User Story 5 (Modularity)

```bash
# Launch ALL service extractions in parallel (8 independent modules):
Task T064: "Extract products service to src/lib/services/products.ts"
Task T065: "Extract sales service to src/lib/services/sales.ts"
Task T066: "Extract purchases service to src/lib/services/purchases.ts"
Task T067: "Extract customers service to src/lib/services/customers.ts"
Task T068: "Extract suppliers service to src/lib/services/suppliers.ts"
Task T069: "Extract inventory service to src/lib/services/inventory.ts"
Task T070: "Extract users service to src/lib/services/users.ts"
Task T071: "Extract treasury service to src/lib/services/treasury.ts"

# Then sequentially integrate:
Task T072: "Update data.ts to delegate to services"
Task T076: "Update UI components to import from services"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T007)
2. Complete Phase 2: Foundational (T008-T020) ← **CRITICAL BLOCKER**
3. Complete Phase 3: User Story 1 (T021-T030)
4. **STOP and VALIDATE**:
   - Run tests T021-T023
   - Process test sale with 10 items
   - Simulate failure mid-transaction and verify rollback
   - Verify no partial data in database
5. Deploy/demo if ready ← **MVP ACHIEVED: Atomic transactions work**

### Incremental Delivery (Recommended)

1. **Foundation** (Phases 1-2): Setup + Foundational infrastructure → Foundation ready
2. **MVP** (Phase 3): Add User Story 1 → Test atomic transactions → Deploy/Demo ✅
3. **P1 Critical** (Phases 4-5): Add US2 (Query Optimization) + US3 (Decimal Migration) → Test performance + accuracy → Deploy/Demo ✅
4. **P2 Important** (Phases 6-7): Add US4 (Concurrency) + US5 (Modularity) → Test concurrent users + developer experience → Deploy/Demo ✅
5. **P3 Polish** (Phases 8-9): Add US6 (Batch Ops) + US7 (Type Safety) → Test bulk operations + build quality → Deploy/Demo ✅
6. **Final Polish** (Phase 10): Cross-cutting concerns + final validation → Production ready ✅

Each increment adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. **Week 1**: Team completes Setup + Foundational together (Phases 1-2)
2. **Week 2** (after Foundational done):
   - Developer A: User Story 1 (Transactions)
   - Developer B: User Story 2 (Query Optimization)
   - Developer C: User Story 4 (Concurrency)
3. **Week 3**:
   - Developer A: User Story 3 (Decimal Migration - needs US1)
   - Developer B: User Story 6 (Batch Operations)
   - Developer C: Continues US4
4. **Week 4**:
   - All developers: User Story 5 (Modularity - needs US1-4) - parallel on different modules
   - Developer A: User Story 7 (Type Safety - needs US5)
5. Stories complete and integrate independently

---

## Task Summary

**Total Tasks**: 112 tasks
- Phase 1 (Setup): 7 tasks
- Phase 2 (Foundational): 13 tasks
- Phase 3 (US1 - Transactions): 10 tasks (3 tests + 7 implementation)
- Phase 4 (US2 - Query Optimization): 9 tasks (3 tests + 6 implementation)
- Phase 5 (US3 - Decimal Migration): 12 tasks (3 tests + 9 implementation)
- Phase 6 (US4 - Concurrency): 9 tasks (3 tests + 6 implementation)
- Phase 7 (US5 - Modularity): 16 tasks (3 tests + 13 implementation)
- Phase 8 (US6 - Batch Operations): 10 tasks (3 tests + 7 implementation)
- Phase 9 (US7 - Type Safety): 12 tasks (2 tests + 10 implementation)
- Phase 10 (Polish): 14 tasks

**Parallel Opportunities**: 45 tasks marked [P] can run in parallel (40% parallelizable)

**Independent Test Criteria**:
- US1: Simulate transaction failure, verify complete rollback
- US2: Load 1000 sales, measure timing <2 seconds
- US3: Perform decimal calculation, verify 2-decimal precision
- US4: Run 5 concurrent sales, verify all complete successfully
- US5: Ask developer to find function, measure time <2 minutes
- US6: Import 500 products, measure timing <10 seconds
- US7: Introduce type error, verify build fails

**Suggested MVP Scope**: Phases 1-3 only (Setup + Foundational + US1 Transactions) = 30 tasks for atomic transaction support

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- [Story] label maps task to specific user story for traceability (US1-US7)
- Each user story should be independently completable and testable
- Write tests first, verify they fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Migration tasks (T043-T046) require database backup first
- Type safety tasks (T089-T098) will expose hidden errors - allocate time for fixes
- Performance validation (Phase 10) ensures all success criteria met before completion
