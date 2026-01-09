import db from '../db';

/**
 * Database connection error types
 * 
 * These errors represent various failure modes when connecting
 * to or interacting with the database.
 */

/**
 * Connection pool exhausted error
 * Occurs when all connections in the pool are in use
 */
export class ConnectionPoolExhaustedError extends Error {
    constructor(message: string = 'Connection pool exhausted') {
        super(message);
        this.name = 'ConnectionPoolExhaustedError';
    }
}

/**
 * Connection timeout error
 * Occurs when connection cannot be established within timeout period
 */
export class ConnectionTimeoutError extends Error {
    constructor(message: string = 'Connection timeout') {
        super(message);
        this.name = 'ConnectionTimeoutError';
    }
}

/**
 * Connection lost error
 * Occurs when connection is lost after being established
 */
export class ConnectionLostError extends Error {
    constructor(message: string = 'Connection lost') {
        super(message);
        this.name = 'ConnectionLostError';
    }
}

/**
 * Query execution error
 * Occurs when a query fails to execute
 */
export class QueryExecutionError extends Error {
    constructor(
        message: string,
        public readonly sql?: string,
        public readonly params?: any[]
    ) {
        super(message);
        this.name = 'QueryExecutionError';
    }
}

/**
 * Check if database is available
 * Returns true if database connection exists and is ready
 */
export function isDatabaseAvailable(): boolean {
    try {
        return !!db;
    } catch (error) {
        console.error('Error checking database availability:', error);
        return false;
    }
}

/**
 * Ensure database is available, throw error if not
 * 
 * @throws ConnectionLostError if database is not available
 */
export function ensureDatabaseAvailable(): void {
    if (!isDatabaseAvailable()) {
        throw new ConnectionLostError('Database connection is not available');
    }
}

/**
 * Execute query with connection error handling
 * Wraps database execution with proper error handling
 * 
 * @param sql - SQL query to execute
 * @param params - Query parameters
 * @returns Query result
 * @throws QueryExecutionError if query fails
 */
export async function executeQuery(sql: string, params: any[] = []): Promise<any> {
    try {
        ensureDatabaseAvailable();
        const result = await (await db).execute(sql, params);
        return result;
    } catch (error) {
        if (error instanceof Error) {
            throw new QueryExecutionError(
                `Query execution failed: ${error.message}`,
                sql,
                params
            );
        }
        throw new QueryExecutionError(
            'Unknown query execution error',
            sql,
            params
        );
    }
}

/**
 * Execute select query with connection error handling
 * 
 * @param sql - SQL query to execute
 * @param params - Query parameters
 * @returns Query result array
 * @throws QueryExecutionError if query fails
 */
export async function executeSelect(sql: string, params: any[] = []): Promise<any[]> {
    try {
        ensureDatabaseAvailable();
        const result = await (await db).select(sql, params);
        return result as any[];
    } catch (error) {
        if (error instanceof Error) {
            throw new QueryExecutionError(
                `Select query failed: ${error.message}`,
                sql,
                params
            );
        }
        throw new QueryExecutionError(
            'Unknown select query error',
            sql,
            params
        );
    }
}

/**
 * Retry helper for transient connection errors
 * Implements exponential backoff for connection issues
 * 
 * @param operation - Async function to execute
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 100)
 * @returns Result of operation
 * @throws Error if all retries fail
 */
export async function withConnectionRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 100
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Check database availability before attempt
            if (!isDatabaseAvailable()) {
                throw new ConnectionLostError('Database connection is not available');
            }

            return await operation();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Don't retry on non-transient errors
            if (error instanceof QueryExecutionError) {
                throw error;
            }

            // Don't retry if this was the last attempt
            if (attempt === maxRetries) {
                throw lastError;
            }

            // Calculate exponential backoff delay: 100ms, 300ms, 900ms
            const delay = baseDelay * Math.pow(3, attempt - 1);
            console.warn(
                `Connection retry attempt ${attempt}/${maxRetries} after ${delay}ms due to connection issue:`,
                lastError.message
            );

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError || new Error('Operation failed after all retries');
}

/**
 * Health check for database connection
 * 
 * @returns Promise resolving to health status object
 */
export async function checkConnectionHealth(): Promise<{
    available: boolean;
    latency?: number;
    error?: string;
}> {
    const startTime = Date.now();

    try {
        if (!isDatabaseAvailable()) {
            return {
                available: false,
                error: 'Database connection not available'
            };
        }

        // Execute simple query to test connection
        await (await db).select('SELECT 1', []);

        const latency = Date.now() - startTime;

        return {
            available: true,
            latency
        };
    } catch (error) {
        const latency = Date.now() - startTime;
        return {
            available: false,
            latency,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

/**
 * Get connection pool statistics
 * Provides information about current connection pool state
 */
export async function getConnectionPoolStats(): Promise<{
    available: boolean;
    poolSize?: number;
    activeConnections?: number;
    error?: string;
}> {
    try {
        if (!isDatabaseAvailable()) {
            return {
                available: false
            };
        }

        // This is a placeholder - actual implementation would depend on
        // the database driver's connection pool API
        // For now, we just check availability
        return {
            available: true,
            poolSize: 10, // Default pool size from db.ts
            activeConnections: 0 // Would need actual pool monitoring
        };
    } catch (error) {
        return {
            available: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
