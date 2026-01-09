import { getDatabase } from '../db';
import { executeWithTiming } from './observability';

/**
 * Transaction context interface
 * Provides access to database instance within transaction
 */
export interface Transaction {
  db: any;
  execute: (sql: string, params?: any[]) => Promise<any>;
}

/**
 * Transaction options
 */
export interface TransactionOptions {
  isolationLevel?: 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
  timeout?: number;
}

/**
 * Transaction error with details for rollback logging
 */
export class TransactionError extends Error {
  constructor(
    message: string,
    public readonly sql?: string,
    public readonly params?: any[],
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'TransactionError';
  }
}

/**
 * Execute an operation within a database transaction
 * 
 * Features:
 * - READ COMMITTED isolation level by default (FR-001a)
 * - Automatic rollback on error (FR-003)
 * - Explicit BEGIN/COMMIT/ROLLBACK boundaries (FR-002)
 * - Query timing and logging (FR-004c)
 * 
 * @param operation - Async function to execute within transaction
 * @param options - Transaction configuration options
 * @returns Result of the operation
 * @throws TransactionError if transaction fails
 * 
 * @example
 * ```typescript
 * const sale = await withTransaction(async (tx) => {
 *   const saleId = await tx.execute('INSERT INTO SalesTransactions ...');
 *   await tx.execute('INSERT INTO SaleItems ...', [saleId]);
 *   await tx.execute('UPDATE Products SET quantity = quantity - ? ...');
 *   return saleId;
 * });
 * ```
 */
export async function withTransaction<T>(
  operation: (tx: Transaction) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const { isolationLevel = 'READ_COMMITTED', timeout = 30000 } = options;
  
  const db = await getDatabase();
  let transaction: Transaction | null = null;
  const startTime = Date.now();
  let operationCount = 0;

  try {
    // BEGIN TRANSACTION with isolation level
    // Set isolation level first, then start transaction
    const setIsolationSql = `SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`;
    await executeWithTiming(
      () => db.execute(setIsolationSql),
      setIsolationSql,
      'SET_ISOLATION'
    );
    
    const beginSql = 'START TRANSACTION';
    await executeWithTiming(
      () => db.execute(beginSql),
      beginSql,
      'BEGIN'
    );
    operationCount++;

    // Create transaction context
    transaction = {
      db,
      execute: async (sql: string, params: any[] = []) => {
        operationCount++;
        return executeWithTiming(
          () => db.execute(sql, params),
          sql,
          'TRANSACTION'
        );
      }
    };

    // Execute the operation
    const result = await operation(transaction);

    // COMMIT if successful
    const commitSql = 'COMMIT';
    await executeWithTiming(
      () => db.execute(commitSql),
      commitSql,
      'COMMIT'
    );
    operationCount++;

    // Log transaction completion time (FR-004c)
    const duration = Date.now() - startTime;
    console.log(`Transaction completed in ${duration}ms with ${operationCount} operations`);

    return result;

  } catch (error) {
    // ROLLBACK on error (FR-003)
    if (transaction) {
      try {
        const rollbackSql = 'ROLLBACK';
        await executeWithTiming(
          () => db.execute(rollbackSql),
          rollbackSql,
          'ROLLBACK'
        );
        console.log(`Transaction rolled back after ${operationCount} operations`);
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
    }

    // Log transaction failure with details (FR-004)
    const duration = Date.now() - startTime;
    console.error(`Transaction failed after ${duration}ms with ${operationCount} operations`, error);

    throw new TransactionError(
      `Transaction failed: ${error instanceof Error ? error.message : String(error)}`,
      undefined,
      undefined,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Execute multiple operations in a transaction with automatic retry
 * Useful for handling transient database errors
 * 
 * @param operation - Async function to execute
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param retryDelay - Delay between retries in ms (default: 1000)
 * @returns Result of the operation
 */
export async function withTransactionRetry<T>(
  operation: (tx: Transaction) => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await withTransaction(operation);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on transaction errors (non-transient)
      if (error instanceof TransactionError) {
        throw error;
      }

      // Retry on transient errors (connection issues, deadlocks)
      if (attempt < maxRetries) {
        console.warn(`Transaction attempt ${attempt} failed, retrying in ${retryDelay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError || new Error('Transaction failed after all retries');
}
