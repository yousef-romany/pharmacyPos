import Database from "tauri-plugin-sql-api";

/**
 * Database connection configuration with connection pooling
 *
 * Connection Pool Settings:
 * - pool_size=10: Maximum 10 concurrent connections (FR-021)
 * - pool_timeout=30: 30-second connection timeout (FR-021a)
 * - idle_timeout=600: 10-minute idle timeout to remove stale connections (FR-021b)
 * - test_before_acquire=true: Validate idle connections before use (FR-021b)
 */
const DB_URL = "mysql://root:root@localhost:3306/pharmacypos?pool_size=10&pool_timeout=30&idle_timeout=600&test_before_acquire=true";

let db: any | null = null;
let dbPromise: Promise<any> | null = null;

/**
 * Get or initialize database connection
 * Ensures the database is properly initialized and cached
 */
export async function getDatabase(): Promise<any> {
  if (db) {
    return db;
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = (async () => {
    try {
      if (typeof window !== "undefined" && Database) {
        db = await Database.load(DB_URL);
        return db;
      }
      throw new Error('Database not available: running in non-browser environment or plugin not loaded');
    } catch (error) {
      console.error("Error loading database:", error);
      throw error;
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