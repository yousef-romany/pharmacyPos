/**
 * useAutoSync Hook
 * Manages automatic synchronization in the background
 */

import { useEffect, useRef } from 'react';
import { startAutoSync, stopAutoSync } from '@/services/syncService';

interface UseAutoSyncOptions {
  enabled?: boolean;
  intervalMinutes?: number;
}

/**
 * Custom hook to manage automatic sync
 *
 * @param options - Configuration options
 * @returns void
 *
 * @example
 * ```tsx
 * function App() {
 *   // Start auto-sync every 30 minutes
 *   useAutoSync({ enabled: true, intervalMinutes: 30 });
 *
 *   return <YourApp />;
 * }
 * ```
 */
export function useAutoSync(options: UseAutoSyncOptions = {}) {
  const { enabled = true, intervalMinutes = 30 } = options;
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      // Stop sync if disabled
      if (intervalIdRef.current) {
        stopAutoSync(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      return;
    }

    // Start auto-sync
    intervalIdRef.current = startAutoSync(intervalMinutes);

    // Cleanup on unmount
    return () => {
      if (intervalIdRef.current) {
        stopAutoSync(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [enabled, intervalMinutes]);
}
