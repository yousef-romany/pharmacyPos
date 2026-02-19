/**
 * Sync Queue Service
 * Handles offline queueing and automatic retry when internet is back
 * User never feels interruption - everything works transparently
 */

import { getDatabase } from '../lib/db';
import { logger } from '../lib/logger';

interface QueuedSyncData {
  id: string;
  data: any;
  created_at: string;
  retry_count: number;
  status: 'pending' | 'syncing' | 'failed';
}

const MAX_RETRY_ATTEMPTS = 5;
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api/v1';

/**
 * Initialize sync queue table in local database
 */
export async function initializeSyncQueue() {
  try {
    const db = await getDatabase();
    if (!db) return;
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        last_error TEXT
      )
    `);
    logger.info('✅ Sync queue initialized');
  } catch (error) {
    logger.error('Failed to initialize sync queue:', error);
  }
}

/**
 * Check if online (has internet connection)
 */
function isOnline(): boolean {
  if (typeof window === 'undefined') return false;
  return navigator.onLine;
}

/**
 * Add data to sync queue (saves locally, will sync when online)
 */
export async function addToSyncQueue(syncData: any): Promise<void> {
  try {
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const db = await getDatabase();
    if (!db) return;
    
    await db.execute(
      `INSERT INTO sync_queue (id, data, created_at, status)
       VALUES (?, ?, ?, 'pending')`,
      [id, JSON.stringify(syncData), new Date().toISOString()]
    );

    logger.info(`📥 Data queued for sync (ID: ${id})`);

    // If online, try to process queue immediately (in background)
    if (isOnline()) {
      // Don't await - process in background
      processQueue().catch(err => console.error('Background queue processing failed:', err));
    }
  } catch (error) {
    console.error('Failed to add to sync queue:', error);
  }
}

/**
 * Process the sync queue - send all pending items to backend
 */
export async function processQueue(): Promise<void> {
  if (!isOnline()) {
    logger.warn('⚠️ Offline - queue processing skipped');
    return;
  }

  try {
    // Get all pending items from queue
    const db = await getDatabase();
    if (!db) return;
    
    const result = await db.execute(
      `SELECT * FROM sync_queue
       WHERE status = 'pending' AND retry_count < ?
        ORDER BY created_at ASC
        LIMIT 50`,
      [MAX_RETRY_ATTEMPTS]
    );

    const queueItems: QueuedSyncData[] = result.rows.map((row: any) => ({
      id: row.id,
      data: JSON.parse(row.data),
      created_at: row.created_at,
      retry_count: row.retry_count || 0,
      status: row.status,
    }));

    if (queueItems.length === 0) {
      return; // Nothing to process
    }

    logger.info(`🔄 Processing ${queueItems.length} queued items...`);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    // Process each item
    for (const item of queueItems) {
      try {
        // Mark as syncing
        const db = await getDatabase();
        if (!db) return;
        
        await db.execute(
          `UPDATE sync_queue SET status = 'syncing' WHERE id = ?`,
          [item.id]
        );

        // Send to backend
        const response = await fetch(`${BACKEND_URL}/sync/pos-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(item.data),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        // Success - remove from queue
        await db.execute(`DELETE FROM sync_queue WHERE id = ?`, [item.id]);
        logger.info(`✅ Synced queued item: ${item.id}`);

      } catch (error) {
        // Failed - increment retry count
        const newRetryCount = item.retry_count + 1;

        const db = await getDatabase();
        if (!db) return;
        
        await db.execute(
          `UPDATE sync_queue
             SET status = 'failed',
                retry_count = ?,
                last_error = ?
            WHERE id = ?`,
          [newRetryCount, error instanceof Error ? error.message : 'Unknown error', item.id]
        );

        logger.error(`❌ Failed to sync item ${item.id} (attempt ${newRetryCount}/${MAX_RETRY_ATTEMPTS}):`, error);

        // If max retries reached, we keep it in the queue with status 'failed'
        // Admin can review failed items later
      }
    }

    // Update last queue process time
    if (typeof window !== 'undefined') {
      localStorage.setItem('last_queue_process', new Date().toISOString());
    }

  } catch (error) {
    logger.error('Queue processing error:', error);
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  pending: number;
  failed: number;
  total: number;
}> {
  try {
    const db = await getDatabase();
    if (!db) return { pending: 0, failed: 0, total: 0 };
    
    const result = await db.execute(`
      SELECT
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(*) as total
      FROM sync_queue
    `);

    const row = result.rows[0];
    return {
      pending: row?.pending || 0,
      failed: row?.failed || 0,
      total: row?.total || 0,
    };
  } catch (error) {
    logger.error('Failed to get queue stats:', error);
    return { pending: 0, failed: 0, total: 0 };
  }
}

/**
 * Clear successfully synced items older than X days
 */
export async function cleanupOldQueue(daysToKeep: number = 7): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const db = await getDatabase();
    if (!db) return;

    await db.execute(
      `DELETE FROM sync_queue
       WHERE created_at < ? AND status NOT IN ('pending', 'syncing')`,
      [cutoffDate.toISOString()]
    );

    logger.info(`🧹 Cleaned up old queue items (older than ${daysToKeep} days)`);
  } catch (error) {
    logger.error('Failed to cleanup queue:', error);
  }
}

/**
 * Retry all failed items
 */
export async function retryFailedItems(): Promise<void> {
  try {
    const db = await getDatabase();
    if (!db) return;
    
    await db.execute(
      `UPDATE sync_queue
       SET status = 'pending', retry_count = 0
       WHERE status = 'failed'`
    );

    logger.info('🔄 Retrying all failed items...');
    await processQueue();
  } catch (error) {
    logger.error('Failed to retry failed items:', error);
  }
}

/**
 * Setup online/offline listeners
 * Automatically process queue when connection is restored
 */
export function setupNetworkListeners(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    logger.info('🌐 Connection restored - processing queue...');
    processQueue().catch(err => logger.error('Failed to process queue on reconnect:', err));
  });

  window.addEventListener('offline', () => {
    logger.warn('📡 Connection lost - data will be queued');
  });

  // Process queue on page load if online
  if (isOnline()) {
    (async () => {
      const db = await getDatabase();
      if (!db) return;
      
      processQueue().catch(err => logger.error('Initial queue processing failed:', err));
    })();
  }
}
