import { getDatabase } from '../db';
import { executeWithTiming, executeWithTimingAndParams } from '../db/observability';

/**
 * Concurrency error raised when optimistic concurrency check fails
 * Occurs when a record has been modified by another transaction
 */
export class ConcurrencyError extends Error {
  constructor(
    message: string,
    public readonly entityType: string,
    public readonly entityId: string,
    public readonly currentVersion: number,
    public readonly expectedVersion: number
  ) {
    super(message);
    this.name = 'ConcurrencyError';
  }
}

/**
 * Repository error with details for debugging
 */
export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly entityType: string,
    public readonly operation: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

/**
 * Query options for find operations
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

/**
 * Base repository interface
 * Defines CRUD operations and optimistic concurrency support
 *
 * @template T - Entity type
 * @template CreateDTO - Data transfer object for creating entities
 * @template UpdateDTO - Data transfer object for updating entities
 */
export interface Repository<T, CreateDTO extends Record<string, any>, UpdateDTO extends Record<string, any>> {
  /**
   * Find entity by ID
   * 
   * @param id - Entity ID
   * @returns Entity or null if not found
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find all entities with optional filtering
   * 
   * @param options - Query options (limit, offset, orderBy)
   * @returns Array of entities
   */
  findAll(options?: QueryOptions): Promise<T[]>;

  /**
   * Create a new entity
   * 
   * @param data - Data for creating the entity
   * @returns Created entity
   */
  create(data: CreateDTO): Promise<T>;

  /**
   * Update an entity with optimistic concurrency control
   * 
   * @param id - Entity ID
   * @param version - Current version of the entity (for optimistic locking)
   * @param data - Data to update
   * @returns Updated entity
   * @throws ConcurrencyError if version mismatch
   */
  update(id: string, version: number, data: UpdateDTO): Promise<T>;

  /**
   * Delete an entity
   * 
   * @param id - Entity ID
   */
  delete(id: string): Promise<void>;

  /**
   * Count entities
   * 
   * @returns Number of entities
   */
  count(): Promise<number>;
}

/**
 * Base repository implementation
 * Provides common CRUD operations with optimistic concurrency support
 *
 * Features:
 * - Optimistic concurrency control with version checking (FR-025)
 * - Automatic retry on concurrency conflicts (FR-025)
 * - Query timing and logging
 * - Consistent error handling
 *
 * @template T - Entity type
 * @template CreateDTO - Data transfer object for creating entities
 * @template UpdateDTO - Data transfer object for updating entities
 */
export abstract class BaseRepository<T, CreateDTO extends Record<string, any>, UpdateDTO extends Record<string, any>> implements Repository<T, CreateDTO, UpdateDTO> {
  protected readonly tableName: string;
  protected readonly entityName: string;

  constructor(tableName: string, entityName: string) {
    this.tableName = tableName;
    this.entityName = entityName;
  }

  /**
   * Find entity by ID
   * 
   * @param id - Entity ID
   * @returns Entity or null if not found
   */
  async findById(id: string): Promise<T | null> {
    const db = await getDatabase();
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    
    try {
      const result = await executeWithTimingAndParams(
        () => db.execute(sql, [id]),
        sql,
        [id],
        `FIND_${this.entityName.toUpperCase()}_BY_ID`
      ) as any[];

      if (!result || result.length === 0) {
        return null;
      }

      return result[0] as T;
    } catch (error) {
      throw new RepositoryError(
        `Failed to find ${this.entityName} with id ${id}`,
        this.entityName,
        'findById',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Find all entities with optional filtering
   * 
   * @param options - Query options (limit, offset, orderBy)
   * @returns Array of entities
   */
  async findAll(options: QueryOptions = {}): Promise<T[]> {
    const db = await getDatabase();
    const { limit, offset, orderBy, orderDirection = 'ASC' } = options;
    
    let sql = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];

    if (orderBy) {
      sql += ` ORDER BY ${orderBy} ${orderDirection}`;
    }

    if (limit !== undefined) {
      sql += ` LIMIT ?`;
      params.push(limit);
    }

    if (offset !== undefined) {
      sql += ` OFFSET ?`;
      params.push(offset);
    }

    try {
      const result = await executeWithTimingAndParams(
        () => db.execute(sql, params),
        sql,
        params,
        `FIND_ALL_${this.entityName.toUpperCase()}`
      ) as any[];

      return result as T[];
    } catch (error) {
      throw new RepositoryError(
        `Failed to find all ${this.entityName}`,
        this.entityName,
        'findAll',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Create a new entity
   * 
   * @param data - Data for creating the entity
   * @returns Created entity
   */
  async create(data: CreateDTO): Promise<T> {
    const db = await getDatabase();
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;

    try {
      await executeWithTimingAndParams(
        () => db.execute(sql, values),
        sql,
        values,
        `CREATE_${this.entityName.toUpperCase()}`
      );

      // Fetch the created entity
      const lastInsertId = await db.execute('SELECT LAST_INSERT_ID() as id') as any[];
      const createdId = lastInsertId[0].id;

      return this.findById(String(createdId)) as Promise<T>;
    } catch (error) {
      throw new RepositoryError(
        `Failed to create ${this.entityName}`,
        this.entityName,
        'create',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Update an entity with optimistic concurrency control
   * 
   * @param id - Entity ID
   * @param version - Current version of the entity (for optimistic locking)
   * @param data - Data to update
   * @returns Updated entity
   * @throws ConcurrencyError if version mismatch
   */
  async update(id: string, version: number, data: UpdateDTO): Promise<T> {
    const db = await getDatabase();
    const updates = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), version, id];
    const sql = `UPDATE ${this.tableName} SET ${updates}, version = version + 1 WHERE id = ? AND version = ?`;

    try {
      const result = await executeWithTimingAndParams(
        () => db.execute(sql, values),
        sql,
        values,
        `UPDATE_${this.entityName.toUpperCase()}`
      ) as any;

      // Check if update was successful (version matched)
      if (!result || result.affectedRows === 0) {
        // Fetch current version for error message
        const current = await this.findById(id);
        const currentVersion = current ? (current as any).version : 0;

        throw new ConcurrencyError(
          `${this.entityName} with id ${id} was modified by another transaction`,
          this.entityName,
          id,
          currentVersion,
          version
        );
      }

      // Fetch and return updated entity
      return this.findById(id) as Promise<T>;
    } catch (error) {
      if (error instanceof ConcurrencyError) {
        throw error;
      }

      throw new RepositoryError(
        `Failed to update ${this.entityName} with id ${id}`,
        this.entityName,
        'update',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Delete an entity
   * 
   * @param id - Entity ID
   */
  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;

    try {
      await executeWithTimingAndParams(
        () => db.execute(sql, [id]),
        sql,
        [id],
        `DELETE_${this.entityName.toUpperCase()}`
      );
    } catch (error) {
      throw new RepositoryError(
        `Failed to delete ${this.entityName} with id ${id}`,
        this.entityName,
        'delete',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Count entities
   *
   * @returns Number of entities
   */
  async count(): Promise<number> {
    const db = await getDatabase();
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;

    try {
      const result = await executeWithTiming(
        () => db.execute(sql),
        sql,
        `COUNT_${this.entityName.toUpperCase()}`
      ) as any[];

      return result[0].count as number;
    } catch (error) {
      throw new RepositoryError(
        `Failed to count ${this.entityName}`,
        this.entityName,
        'count',
        error instanceof Error ? error : undefined
      );
    }
  }
}

/**
 * Retry helper for operations that may fail due to concurrency conflicts
 * Implements exponential backoff with 3 retry attempts (FR-025)
 * 
 * @param operation - Async function to execute
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 100)
 * @returns Result of operation
 * @throws Error if all retries fail
 * 
 * @example
 * ```typescript
 * const result = await withRetry(async () => {
 *   return await repository.update(id, version, data);
 * }, 3, 100);
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Only retry on ConcurrencyError
      if (!(error instanceof ConcurrencyError)) {
        throw error;
      }

      // Don't retry if this was the last attempt
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Calculate exponential backoff delay: 100ms, 300ms, 900ms
      const delay = baseDelay * Math.pow(3, attempt - 1);
      console.warn(
        `Retry attempt ${attempt}/${maxRetries} after ${delay}ms due to concurrency conflict:`,
        lastError.message
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Operation failed after all retries');
}
