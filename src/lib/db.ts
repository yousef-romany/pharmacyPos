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

let db: any;

try {
  if (typeof window !== "undefined") {
    db = Database?.load(DB_URL);
  }
} catch (error) {
  console.error("Error loading database:", error);
  throw error;
}

export default db;