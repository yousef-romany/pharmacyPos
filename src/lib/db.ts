import Database from "tauri-plugin-sql-api";

/**
 * Database connection configuration with connection pooling
 *
 * Connection Pool Settings:
 * - pool_size=1: Set to 1 to ensure transaction safety (serialize operations) until connection pinning is supported
 * - pool_timeout=30: 30-second connection timeout (FR-021a)
 * - idle_timeout=600: 10-minute idle timeout to remove stale connections (FR-021b)
 * - test_before_acquire=true: Validate idle connections before use (FR-021b)
 */
const DB_URL = "mysql://root:root@localhost:3306/pharmacypos?pool_size=1&pool_timeout=30&idle_timeout=600&test_before_acquire=true";

let db: any | null = null;
let dbPromise: Promise<any> | null = null;

/**
 * Check if we're in a Tauri environment with database available
 */
export function isDatabaseAvailable(): boolean {
  return typeof window !== "undefined" && typeof Database !== "undefined";
}

/**
 * Get or initialize database connection
 * Ensures that database is properly initialized and cached
 * Returns null if database is not available (e.g., during SSR)
 */
export async function getDatabase(): Promise<any | null> {
  // Early return if not in browser environment
  if (typeof window === "undefined") {
    return null;
  }

  if (db) {
    return db;
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = (async () => {
    try {
      if (isDatabaseAvailable()) {
        db = await Database.load(DB_URL);
        return db;
      }
      console.warn('Database not available: running in non-browser environment or plugin not loaded');
      return null;
    } catch (error) {
      console.error("Error loading database:", error);
      return null;
    }
  })();

  return dbPromise;
}

/**
 * Default export for backward compatibility
 * Note: This is a Promise that resolves to the database instance
 * For new code, use `getDatabase()` instead
 */
export default getDatabase();
