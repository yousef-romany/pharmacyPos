import { getDatabase } from '../db';

/**
 * Connection pool statistics (FR-004b)
 * Tracks active connections, idle connections, wait times, and timeouts
 */
export interface ConnectionPoolStats {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  maxConnections: number;
  averageWaitTimeMs: number;
  connectionTimeouts: number;
  lastUpdated: string;
}

/**
 * Connection pool configuration
 */
export interface ConnectionPoolConfig {
  maxConnections: number;
  connectionTimeoutMs: number;
  idleTimeoutMs: number;
  testBeforeAcquire: boolean;
}

/**
 * Connection pool interface
 * Provides methods for monitoring and managing database connections
 */
export interface ConnectionPool {
  /**
   * Get current connection pool statistics
   * 
   * @returns Connection pool statistics
   */
  getStats(): Promise<ConnectionPoolStats>;

  /**
   * Get connection pool configuration
   * 
   * @returns Current pool configuration
   */
  getConfig(): ConnectionPoolConfig;

  /**
   * Check if pool is healthy
   * 
   * @returns true if pool is healthy, false otherwise
   */
  isHealthy(): Promise<boolean>;

  /**
   * Reset connection pool statistics
   * Useful for testing or starting fresh measurements
   */
  resetStats(): Promise<void>;
}

/**
 * MySQL connection pool implementation
 * Wraps tauri-plugin-sql-api database instance
 */
export class MySQLConnectionPool implements ConnectionPool {
  private config: ConnectionPoolConfig;
  private stats: ConnectionPoolStats;
  private startTime: number;

  constructor(config: ConnectionPoolConfig) {
    this.config = config;
    this.startTime = Date.now();
    this.stats = {
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
      maxConnections: config.maxConnections,
      averageWaitTimeMs: 0,
      connectionTimeouts: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get current connection pool statistics
   * 
   * Note: tauri-plugin-sql-api doesn't expose pool statistics directly.
   * This implementation provides a mock interface that can be enhanced
   * if the plugin adds pool monitoring capabilities.
   * 
   * @returns Connection pool statistics
   */
  async getStats(): Promise<ConnectionPoolStats> {
    // In a real implementation, this would query the database for pool stats
    // For now, return placeholder values
    try {
      // Try to get connection count from MySQL
      const db = await getDatabase();
      const result = await db.execute('SHOW STATUS LIKE "Threads_connected"');
      if (result && result.length > 0) {
        const threadsConnected = parseInt(result[0].Value) || 0;
        this.stats.activeConnections = threadsConnected;
        this.stats.totalConnections = threadsConnected;
      }
    } catch (error) {
      console.warn('Failed to get connection stats from database:', error);
    }

    this.stats.lastUpdated = new Date().toISOString();
    return { ...this.stats };
  }

  /**
   * Get connection pool configuration
   * 
   * @returns Current pool configuration
   */
  getConfig(): ConnectionPoolConfig {
    return { ...this.config };
  }

  /**
   * Check if pool is healthy
   * 
   * @returns true if pool is healthy, false otherwise
   */
  async isHealthy(): Promise<boolean> {
    try {
      // Simple health check: execute a query
      const db = await getDatabase();
      await db.execute('SELECT 1');
      return true;
    } catch (error) {
      console.error('Connection pool health check failed:', error);
      return false;
    }
  }

  /**
   * Reset connection pool statistics
   * Useful for testing or starting fresh measurements
   */
  async resetStats(): Promise<void> {
    this.stats = {
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
      maxConnections: this.config.maxConnections,
      averageWaitTimeMs: 0,
      connectionTimeouts: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Log pool exhaustion event
   * Called when all connections are in use
   */
  logPoolExhaustion(): void {
    this.stats.connectionTimeouts++;
    console.warn('Connection pool exhausted - all connections in use');
  }

  /**
   * Update average wait time
   * 
   * @param waitTimeMs - Wait time for acquiring a connection
   */
  updateWaitTime(waitTimeMs: number): void {
    const currentAvg = this.stats.averageWaitTimeMs;
    const count = this.stats.totalConnections || 1;
    this.stats.averageWaitTimeMs = (currentAvg * (count - 1) + waitTimeMs) / count;
  }
}

/**
 * Global connection pool instance
 * Initialized with configuration from db.ts
 * 
 * Configuration:
 * - maxConnections: 10 (FR-021)
 * - connectionTimeoutMs: 30000 (30 seconds, FR-021a)
 * - idleTimeoutMs: 600000 (10 minutes, FR-021b)
 * - testBeforeAcquire: true (FR-021b)
 */
export const connectionPool = new MySQLConnectionPool({
  maxConnections: 10,
  connectionTimeoutMs: 30000,
  idleTimeoutMs: 600000,
  testBeforeAcquire: true,
});

/**
 * Get connection pool statistics
 * Convenience function for quick access
 * 
 * @returns Connection pool statistics
 */
export async function getConnectionPoolStats(): Promise<ConnectionPoolStats> {
  return connectionPool.getStats();
}

/**
 * Check connection pool health
 * Convenience function for quick health check
 * 
 * @returns true if pool is healthy, false otherwise
 */
export async function isConnectionPoolHealthy(): Promise<boolean> {
  return connectionPool.isHealthy();
}

/**
 * Log connection pool statistics
 * Useful for monitoring and debugging
 * 
 * @returns Connection pool statistics
 */
export async function logConnectionPoolStats(): Promise<ConnectionPoolStats> {
  const stats = await connectionPool.getStats();
  console.log('Connection Pool Statistics:', {
    active: stats.activeConnections,
    idle: stats.idleConnections,
    total: stats.totalConnections,
    max: stats.maxConnections,
    avgWaitTime: `${stats.averageWaitTimeMs.toFixed(2)}ms`,
    timeouts: stats.connectionTimeouts,
    utilization: `${((stats.activeConnections / stats.maxConnections) * 100).toFixed(1)}%`,
  });
  return stats;
}
