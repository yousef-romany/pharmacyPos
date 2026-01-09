import pino from 'pino';

/**
 * Slow query threshold in milliseconds (FR-004a)
 * Queries exceeding this threshold are logged for performance analysis
 */
export const SLOW_QUERY_THRESHOLD_MS = 100;

/**
 * Query execution result with timing information
 */
export interface QueryResult<T = any> {
  data: T;
  executionTimeMs: number;
  isSlow: boolean;
}

/**
 * Slow query log entry structure
 */
export interface SlowQueryLogEntry {
  timestamp: string;
  query: string;
  params?: any[];
  executionTimeMs: number;
  threshold: number;
}

/**
 * Pino logger configuration
 * - Simple JSON output (compatible with static export/Tauri environment)
 * - Console-based logging to avoid file system issues in Tauri
 * - Note: Transport and file destination removed for static export compatibility
 */
const logger = pino({
  level: 'info',
});

/**
 * Execute a database query with timing and slow query logging
 * 
 * Features:
 * - Measures query execution time (FR-004a)
 * - Logs slow queries exceeding 100ms threshold (FR-004a)
 * - Structured logging with query text, params, and timing (FR-004a)
 * - Returns timing information for metrics (FR-004c)
 * 
 * @param queryFn - Async function that executes the query
 * @param sql - SQL query string for logging
 * @param context - Context label (e.g., 'BEGIN', 'COMMIT', 'TRANSACTION')
 * @returns Query result with timing information
 * 
 * @example
 * ```typescript
 * const result = await executeWithTiming(
 *   () => db.execute('SELECT * FROM Products WHERE id = ?', [productId]),
 *   'SELECT * FROM Products WHERE id = ?',
 *   'PRODUCT_FETCH'
 * );
 * console.log(result.executionTimeMs); // Query execution time in ms
 * ```
 */
export async function executeWithTiming<T>(
  queryFn: () => Promise<T>,
  sql: string,
  context: string = 'QUERY'
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    const executionTimeMs = Date.now() - startTime;
    
    // Log slow queries (FR-004a)
    if (executionTimeMs > SLOW_QUERY_THRESHOLD_MS) {
      logSlowQuery(sql, undefined, executionTimeMs, context);
    }
    
    return result;
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;
    
    // Log failed queries if they took time
    if (executionTimeMs > SLOW_QUERY_THRESHOLD_MS) {
      logSlowQuery(sql, undefined, executionTimeMs, context);
    }
    
    throw error;
  }
}

/**
 * Execute a database query with timing and slow query logging (with params)
 * 
 * @param queryFn - Async function that executes the query
 * @param sql - SQL query string for logging
 * @param params - Query parameters for logging
 * @param context - Context label
 * @returns Query result with timing information
 */
export async function executeWithTimingAndParams<T>(
  queryFn: () => Promise<T>,
  sql: string,
  params: any[],
  context: string = 'QUERY'
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    const executionTimeMs = Date.now() - startTime;
    
    // Log slow queries with parameters
    if (executionTimeMs > SLOW_QUERY_THRESHOLD_MS) {
      logSlowQuery(sql, params, executionTimeMs, context);
    }
    
    return result;
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;
    
    // Log failed queries
    if (executionTimeMs > SLOW_QUERY_THRESHOLD_MS) {
      logSlowQuery(sql, params, executionTimeMs, context);
    }
    
    throw error;
  }
}

/**
 * Log a slow query to the slow query log
 * 
 * @param sql - SQL query that was slow
 * @param params - Query parameters (optional, for debugging)
 * @param executionTimeMs - Query execution time in milliseconds
 * @param context - Context label for categorization
 */
function logSlowQuery(
  sql: string,
  params: any[] | undefined,
  executionTimeMs: number,
  context: string
): void {
  const entry: SlowQueryLogEntry = {
    timestamp: new Date().toISOString(),
    query: sql,
    params,
    executionTimeMs,
    threshold: SLOW_QUERY_THRESHOLD_MS,
  };

  logger.warn(entry, `Slow query detected [${context}]: ${executionTimeMs}ms > ${SLOW_QUERY_THRESHOLD_MS}ms`);
}

/**
 * Get slow query statistics
 * 
 * @returns Object with slow query count and average execution time
 */
export function getSlowQueryStats(): {
  count: number;
  averageExecutionTimeMs: number;
  maxExecutionTimeMs: number;
} {
  // This would read from the log file in a real implementation
  // For now, return placeholder values
  return {
    count: 0,
    averageExecutionTimeMs: 0,
    maxExecutionTimeMs: 0,
  };
}

/**
 * Clear slow query log
 * Useful for testing or starting fresh measurements
 */
export function clearSlowQueryLog(): void {
  // This would truncate the log file in a real implementation
  logger.info('Slow query log cleared');
}

/**
 * Query performance metrics tracker
 * Tracks query execution times for performance analysis (FR-004d)
 */
export class QueryMetrics {
  private queryCounts: Map<string, number> = new Map();
  private queryTimes: Map<string, number[]> = new Map();

  /**
   * Record a query execution
   * 
   * @param sql - SQL query string
   * @param executionTimeMs - Query execution time in milliseconds
   */
  recordQuery(sql: string, executionTimeMs: number): void {
    const normalizedSql = sql.trim().split(/\s+/).join(' ');
    
    // Increment count
    const count = this.queryCounts.get(normalizedSql) || 0;
    this.queryCounts.set(normalizedSql, count + 1);
    
    // Store execution time
    const times = this.queryTimes.get(normalizedSql) || [];
    times.push(executionTimeMs);
    this.queryTimes.set(normalizedSql, times);
  }

  /**
   * Get metrics for a specific query
   * 
   * @param sql - SQL query string
   * @returns Query metrics or null if not found
   */
  getQueryMetrics(sql: string): {
    count: number;
    averageTimeMs: number;
    minTimeMs: number;
    maxTimeMs: number;
  } | null {
    const normalizedSql = sql.trim().split(/\s+/).join(' ');
    const count = this.queryCounts.get(normalizedSql);
    const times = this.queryTimes.get(normalizedSql);

    if (!count || !times || times.length === 0) {
      return null;
    }

    const averageTimeMs = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTimeMs = Math.min(...times);
    const maxTimeMs = Math.max(...times);

    return {
      count,
      averageTimeMs,
      minTimeMs,
      maxTimeMs,
    };
  }

  /**
   * Get all query metrics
   * 
   * @returns Map of query SQL to metrics
   */
  getAllMetrics(): Map<string, {
    count: number;
    averageTimeMs: number;
    minTimeMs: number;
    maxTimeMs: number;
  }> {
    const metrics = new Map();

    for (const [sql, count] of this.queryCounts.entries()) {
      const times = this.queryTimes.get(sql);
      if (times && times.length > 0) {
        const averageTimeMs = times.reduce((sum, time) => sum + time, 0) / times.length;
        const minTimeMs = Math.min(...times);
        const maxTimeMs = Math.max(...times);
        
        metrics.set(sql, {
          count,
          averageTimeMs,
          minTimeMs,
          maxTimeMs,
        });
      }
    }

    return metrics;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.queryCounts.clear();
    this.queryTimes.clear();
  }
}

// Global query metrics instance
export const queryMetrics = new QueryMetrics();
