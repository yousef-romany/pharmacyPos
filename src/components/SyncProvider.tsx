'use client';

import { useEffect } from 'react';
import { syncService } from '@/services/syncService';

/**
 * SyncProvider - Client component that starts the background sync scheduler.
 * Mounts once at the root layout and keeps syncing to the Go backend every 30 min.
 */
export default function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only run in browser and if an access token exists (user is logged in)
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('access_token');
    if (token) {
      syncService.startSyncScheduler();
    }

    // Listen for auth changes (login/logout)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        if (e.newValue) {
          syncService.startSyncScheduler();
        } else {
          syncService.stopSyncScheduler();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      syncService.stopSyncScheduler();
    };
  }, []);

  return <>{children}</>;
}
