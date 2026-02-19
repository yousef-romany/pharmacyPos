# Implementation Plan: System Performance Optimization and Code Quality Review

**Branch**: `001-code-review-optimization` | **Date**: 2026-01-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-code-review-optimization/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This implementation plan addresses critical performance and code quality issues in the pharmacy POS system identified through comprehensive code review. The primary goals are: (1) implement atomic database transactions to ensure data consistency, (2) eliminate N+1 query patterns through JOIN operations and query optimization, (3) migrate numeric data from VARCHAR to DECIMAL types for calculation accuracy, (4) implement connection pooling for concurrent user support, (5) refactor monolithic 1,973-line data.ts into modular domain-based services, and (6) establish observability infrastructure for performance monitoring. The technical approach follows a phased refactoring strategy that maintains backward compatibility while systematically addressing each issue category.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 15.2.3, React 18.3.1)
**Primary Dependencies**:
- Tauri v1 (desktop wrapper)
- tauri-plugin-sql-api (MySQL database access)
- Next.js 15 (static export mode)
- Zustand 4.5.5 (state management)
- React Hook Form 7.54.2 + Zod (form validation)
- TanStack Table 8.19.3 (data tables)
- Radix UI + Tailwind CSS (UI components)

**Storage**: MySQL 8.0+ (local database on desktop deployment)
**Testing**: NEEDS CLARIFICATION (no testing framework currently configured)
**Target Platform**: Linux/Windows/macOS desktop via Tauri (Electron alternative)
**Project Type**: Desktop application (Tauri-wrapped Next.js SPA with static export)

**Performance Goals**:
- Sales history with 1000 transactions: <2 seconds load time (currently 10+ seconds)
- Multi-item sale (10 items): <1 second completion (currently 2-3 seconds)
- Bulk import (500 products): <10 seconds (currently 30+ seconds)
- Support 5 concurrent users without timeouts

**Constraints**:
- Must maintain backward compatibility with existing data (migration required)
- Cannot break existing UI functionality during refactoring
- Must complete optimization in phases (system must remain operational)
- Desktop-only deployment (no cloud infrastructure)
- Connection pool: 5-10 connections max (resource-constrained local deployment)
- Transaction isolation level: READ COMMITTED (balance of consistency and performance)
- Query timeout threshold: 100ms for slow query logging

**Scale/Scope**:
- Single pharmacy operation (~5 concurrent users)
- ~1,000 products in inventory
- ~1,000 transactions per month
- 8 domain modules to refactor (products, sales, purchases, customers, suppliers, inventory, users, treasury)
- 1,973 lines of monolithic code to modularize
- 82 database query calls to optimize

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: No project constitution defined yet (template file exists but not ratified)

**Default Quality Gates Applied**:
- ✅ Maintain existing functionality (refactoring, not new features)
- ✅ Test coverage required for critical paths (sales, purchases, inventory)
- ✅ Performance metrics must be measurable and validated
- ✅ Database migrations must be reversible
- ✅ Code changes must not introduce new security vulnerabilities

**Gate Evaluation**: PASS (all default quality gates satisfied by plan approach)

## Project Structure

### Documentation (this feature)

```text
specs/001-code-review-optimization/
├── spec.md              # Feature specification (COMPLETE)
├── plan.md              # This file (IN PROGRESS)
├── research.md          # Phase 0 output (PENDING)
├── data-model.md        # Phase 1 output (PENDING)
├── quickstart.md        # Phase 1 output (PENDING)
├── contracts/           # Phase 1 output (PENDING)
│   └── database-api.md  # Database layer contract
├── checklists/          # Quality validation
│   └── requirements.md  # Spec quality checklist (COMPLETE)
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

**Current Structure** (to be refactored):
```text
src/
├── app/                 # Next.js pages (19 files)
│   ├── page.tsx        # Login page
│   ├── layout.tsx      # Root layout
│   └── (dashboard)/    # Protected routes
│       ├── layout.tsx
│       ├── pos/
│       ├── products/
│       ├── sales/
│       ├── purchases/
│       ├── customers/
│       ├── suppliers/
│       ├── inventory/
│       ├── users/
│       ├── treasury/
│       └── reports/
├── components/          # React components (43 files)
│   ├── ui/             # Reusable UI (shadcn/ui)
│   ├── pos/            # POS-specific
│   └── purchases/      # Purchase forms
├── lib/                 # Core business logic (4 files)
│   ├── db.ts           # Database connection (11 lines)
│   ├── types.ts        # TypeScript types (163 lines)
│   ├── data.ts         # MONOLITHIC data layer (1,973 lines) ⚠️
│   └── utils.ts        # Utility functions
├── store/              # Zustand stores (1 file)
│   └── auth-store.ts   # Auth state
└── hooks/              # Custom hooks (2 files)
    ├── use-cart.ts     # Cart logic
    └── use-toast.ts    # Toast notifications

src-tauri/              # Tauri desktop wrapper
└── tauri.conf.json     # Desktop app config
```

**Target Structure** (after refactoring):
```text
src/
├── app/                 # Next.js pages (UNCHANGED)
├── components/          # React components (UNCHANGED)
├── lib/
│   ├── db/             # Database layer (NEW)
│   │   ├── connection.ts       # Connection pool management
│   │   ├── transaction.ts      # Transaction wrapper with isolation level
│   │   └── observability.ts    # Slow query logging, metrics
│   ├── services/       # Domain services (NEW - split from data.ts)
│   │   ├── products.ts         # Product operations (~200 lines)
│   │   ├── sales.ts            # Sale transaction operations (~300 lines)
│   │   ├── purchases.ts        # Purchase operations (~250 lines)
│   │   ├── customers.ts        # Customer operations (~150 lines)
│   │   ├── suppliers.ts        # Supplier operations (~150 lines)
│   │   ├── inventory.ts        # Inventory operations (~200 lines)
│   │   ├── users.ts            # User management (~100 lines)
│   │   └── treasury.ts         # Treasury operations (~150 lines)
│   ├── repositories/   # Data access layer (NEW)
│   │   ├── base.ts             # Base repository with optimistic concurrency
│   │   ├── products.ts         # Product data access
│   │   ├── sales.ts            # Sale data access with JOIN queries
│   │   └── [other domains]
│   ├── types.ts        # TypeScript types (EXPANDED)
│   ├── utils.ts        # Utility functions (UNCHANGED)
│   └── validators.ts   # Input validation (NEW)
├── migrations/         # Database migrations (NEW)
│   ├── 001_add_version_columns.sql
│   ├── 002_varchar_to_decimal.sql
│   └── migration-audit.log
├── store/              # Zustand stores (UNCHANGED)
└── hooks/              # Custom hooks (UNCHANGED)

tests/                  # Testing infrastructure (NEW)
├── integration/
│   ├── sales.test.ts
│   ├── purchases.test.ts
│   └── concurrency.test.ts
├── unit/
│   └── services/
└── fixtures/
    └── test-data.sql
```

**Structure Decision**: The project follows a **single desktop application** pattern (Tauri + Next.js). The refactoring maintains this structure but introduces clear layering: `db/` for infrastructure, `repositories/` for data access, `services/` for business logic, and `migrations/` for schema evolution. This separation aligns with the maintainability goal (FR-016 through FR-020) while preserving the existing UI layer entirely.

## Complexity Tracking

> This section documents violations of simplicity principles that require justification.

| Complexity | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Repository pattern (new abstraction layer) | Separates data access from business logic to enable independent testing, provide transaction boundary enforcement, and implement optimistic concurrency control consistently across all entities | Direct database access from services would duplicate transaction handling, optimistic concurrency logic, and query construction across 8 domain modules, increasing maintenance burden and error risk |
| Three-layer architecture (db/repositories/services) | Database layer handles connection pooling and observability; repositories handle data access and concurrency; services handle business logic and validation. This separation is required to meet FR-018 (separate business from data access) and SC-010 (reduce time to locate functionality from 5+ min to <2 min) | Two-layer (services + db) would mix data access and business logic within services, making it difficult to test business logic without database, and would not address the maintainability issues that drove the 1,973-line monolith |
| Migration scripts instead of schema recreation | Existing production data must be preserved (Constraints section); pharmacy cannot afford downtime to re-enter data; migration includes audit trail for invalid data (FR-008a) | Clean slate schema would require manual data re-entry for all products, sales, purchases, customers, and suppliers - unacceptable for operational pharmacy |
| Optimistic concurrency with retry logic | Five concurrent users require high-throughput concurrent access without bottlenecks (FR-025); pessimistic locking would create contention on popular products during busy periods | Pessimistic locking (SELECT FOR UPDATE) would reduce throughput and increase deadlock risk; last-write-wins would risk inventory accuracy; serialization would eliminate concurrency benefits |

## Phase 0: Research & Technical Decisions

### Research Areas

The following unknowns from Technical Context and feature requirements need resolution before design:

1. **Testing Framework Selection**
   - **Unknown**: No testing framework currently configured
   - **Research Need**: Evaluate testing frameworks compatible with Tauri + Next.js + MySQL
   - **Requirements**: Integration testing for transactions (FR-001 validation), unit testing for services (SC-013: 80% coverage), support for database fixtures

2. **Database Migration Strategy**
   - **Unknown**: Best approach for VARCHAR→DECIMAL migration with live system
   - **Research Need**: Safe migration patterns for production data, rollback strategies, zero-downtime approaches
   - **Requirements**: Handle invalid data gracefully (FR-008a), maintain audit trail, allow phased rollout (Constraints)

3. **Connection Pooling Implementation**
   - **Unknown**: How to implement connection pooling with tauri-plugin-sql-api
   - **Research Need**: Investigate if tauri-plugin-sql-api supports pooling natively or if wrapper needed
   - **Requirements**: 5-10 connection pool (FR-021), 30-second timeout (FR-021a), idle connection validation (FR-021b)

4. **Transaction API in Tauri SQL Plugin**
   - **Unknown**: Does tauri-plugin-sql-api support explicit transaction boundaries and isolation levels
   - **Research Need**: Verify transaction support, isolation level configuration, rollback mechanisms
   - **Requirements**: BEGIN/COMMIT/ROLLBACK (FR-002), READ COMMITTED isolation (FR-001a)

5. **Optimistic Concurrency Pattern**
   - **Unknown**: Best practice for version/timestamp implementation in MySQL
   - **Research Need**: Evaluate version number vs timestamp approaches, UPDATE query patterns, race condition handling
   - **Requirements**: Detect concurrent modifications (FR-025), retry up to 3 times, minimal overhead

6. **Slow Query Logging Implementation**
   - **Unknown**: How to capture query execution times in tauri-plugin-sql-api
   - **Research Need**: Query timing instrumentation, structured logging approach, log storage/rotation
   - **Requirements**: 100ms threshold (FR-004a), log query text and timing (FR-004a), queryable format (FR-004d)

7. **JOIN Query Optimization Patterns**
   - **Unknown**: Optimal JOIN patterns for sales/purchases with items
   - **Research Need**: One-to-many JOIN strategies, result set mapping, query performance tuning
   - **Requirements**: Eliminate N+1 queries (FR-005), maintain <2sec load time for 1000 records (SC-001)

8. **Batch Operation APIs**
   - **Unknown**: Best approach for batch inserts/updates in MySQL via Tauri
   - **Research Need**: Prepared statement batching, transaction batching, error handling in batch operations
   - **Requirements**: Batch processing for multiple records (FR-007), <10sec for 500 products (SC-004)

### Research Dispatch

Research tasks will be consolidated in `research.md` following Phase 0 execution.

## Phase 1: Design Artifacts

### Data Model Changes

Key entities require schema modifications (documented in `data-model.md`):

**Product Entity** (schema changes):
- Add `version` INT NOT NULL DEFAULT 0 (optimistic concurrency)
- Modify `price` VARCHAR → DECIMAL(10,2)
- Modify `cost` VARCHAR → DECIMAL(10,2)
- Modify `quantity` VARCHAR → DECIMAL(10,3)
- Migration audit: Log products with invalid numeric data

**Sale/Purchase Transaction Entities** (schema changes):
- Modify `total_amount` VARCHAR → DECIMAL(10,2)
- Modify `paid_amount` VARCHAR → DECIMAL(10,2)
- Modify `discount` VARCHAR → DECIMAL(10,2)

**Sale/Purchase Item Entities** (schema changes):
- Add `version` INT NOT NULL DEFAULT 0
- Modify `quantity` VARCHAR → DECIMAL(10,3)
- Modify `unit_price` VARCHAR → DECIMAL(10,2)
- Modify `total` VARCHAR → DECIMAL(10,2)

**Customer/Supplier Entities** (schema changes):
- Modify `balance` VARCHAR → DECIMAL(10,2)

### API Contracts

Internal service contracts (documented in `contracts/database-api.md`):

**Transaction API**:
```typescript
interface TransactionContext {
  execute<T>(operation: (tx: Transaction) => Promise<T>): Promise<T>
  isolationLevel: 'READ_COMMITTED'
}
```

**Repository Contract**:
```typescript
interface Repository<T> {
  findById(id: string): Promise<T | null>
  findAll(options?: QueryOptions): Promise<T[]>
  create(data: CreateDTO): Promise<T>
  update(id: string, version: number, data: UpdateDTO): Promise<T> // Optimistic concurrency
  delete(id: string): Promise<void>
}
```

**Service Contract**:
```typescript
interface SaleService {
  createSale(saleData: CreateSaleDTO): Promise<SaleTransaction>
  getSales(filters?: SaleFilters): Promise<SaleTransaction[]>
  getSaleById(id: string): Promise<SaleTransaction | null>
  // All operations wrapped in transactions
}
```

### Quickstart Guide

Developer onboarding documentation (in `quickstart.md`):
- Environment setup (MySQL, Node.js, Tauri prerequisites)
- Running migrations
- Development workflow
- Testing approach
- Performance validation

## Phase 2: Implementation Tasks

**Note**: Detailed task breakdown will be generated by `/speckit.tasks` command. High-level task categories:

1. **Infrastructure** (P1):
   - Setup testing framework
   - Implement connection pooling
   - Implement transaction wrapper with READ COMMITTED isolation
   - Setup observability (slow query logging, metrics)

2. **Database Migration** (P1):
   - Add version columns to all tables
   - Create VARCHAR→DECIMAL migration script
   - Create migration audit logging
   - Test migration on copy of production data

3. **Repository Layer** (P1):
   - Implement base repository with optimistic concurrency
   - Implement product repository with JOIN queries
   - Implement sales repository with item JOIN
   - Implement purchase repository with item JOIN
   - Implement remaining domain repositories

4. **Service Layer Refactoring** (P2):
   - Extract product service from data.ts
   - Extract sales service with transaction boundaries
   - Extract purchase service with transaction boundaries
   - Extract inventory service
   - Extract customer/supplier/user/treasury services

5. **Query Optimization** (P1):
   - Replace N+1 queries in sales history with JOIN
   - Replace N+1 queries in purchase history with JOIN
   - Implement batch operations for multi-item inserts
   - Add query timeout configuration

6. **Testing** (P2):
   - Integration tests for transaction rollback scenarios
   - Integration tests for concurrent updates
   - Unit tests for service layer (80% coverage target)
   - Performance tests validating success criteria

7. **Build Quality** (P3):
   - Remove ignoreBuildErrors and ignoreDuringBuilds flags
   - Fix TypeScript errors exposed by strict checking
   - Fix ESLint violations

## Success Validation

Post-implementation validation against success criteria:

**Performance** (automated tests):
- SC-001: Load 1000 sales with items in <2 seconds
- SC-002: Complete 10-item sale in <1 second
- SC-003: 5 concurrent users without timeouts
- SC-004: Import 500 products in <10 seconds

**Data Integrity** (automated + manual audit):
- SC-006: Zero discrepancies in financial reports
- SC-007: Transaction rollback tests pass 100%
- SC-008: Numeric precision tests pass across 10,000 transactions

**Code Quality** (static analysis + developer survey):
- SC-010: Developer time-to-find <2 minutes (measured)
- SC-011: Build fails on type/lint errors
- SC-012: No files >500 lines
- SC-013: 80% code coverage on critical paths

**Observability** (monitoring validation):
- SC-019: Slow query log captures 100% of queries >100ms
- SC-020: <5% queries trigger slow query log after optimization

## Risk Mitigation

| Risk | Impact | Mitigation Strategy |
|------|--------|-------------------|
| Data loss during VARCHAR→DECIMAL migration | CRITICAL | (1) Full database backup before migration, (2) Run migration on test copy first, (3) Audit log of affected records (FR-008a), (4) Rollback script prepared |
| Breaking changes during service refactoring | HIGH | (1) Maintain exact same function signatures in new services, (2) Feature flags for gradual rollout, (3) Integration tests verify behavior parity |
| Performance degradation from new abstractions | MEDIUM | (1) Performance tests validate success criteria before merge, (2) Repository layer kept thin (no business logic), (3) Query optimization applied systematically |
| tauri-plugin-sql-api doesn't support required features | HIGH | (1) Research phase validates API capabilities before design, (2) Fallback: wrapper layer around plugin if needed, (3) Worst case: migrate to different Tauri SQL plugin |
| Concurrent update conflicts more frequent than expected | MEDIUM | (1) Retry logic handles transient conflicts (FR-025), (2) Monitoring tracks conflict rate, (3) If >10% conflicts: increase retry count or use pessimistic locking for high-contention items |

## Timeline & Dependencies

**Phase 0 (Research)**: 1-2 days
- Research all 8 technical unknowns
- Document decisions in research.md
- **Blocker**: Must complete before Phase 1 design

**Phase 1 (Design)**: 2-3 days
- Create data-model.md with complete schema
- Document contracts in contracts/
- Write quickstart.md for developer onboarding
- Update agent context
- **Blocker**: Must complete before Phase 2 tasks

**Phase 2 (Implementation)**: Handled by `/speckit.tasks` command
- NOT part of this `/speckit.plan` command output
- Tasks generated based on this plan
- Execution order determined by task dependencies

## Next Steps

1. **Review this plan**: Validate technical approach, identify gaps
2. **Execute Phase 0**: Run research tasks, resolve all NEEDS CLARIFICATION items
3. **Execute Phase 1**: Generate data-model.md, contracts/, quickstart.md
4. **Run `/speckit.tasks`**: Generate detailed implementation task breakdown
5. **Begin implementation**: Follow task order, validate against success criteria

**Command completion**: This `/speckit.plan` command stops here. Use `/speckit.tasks` to proceed to Phase 2.
