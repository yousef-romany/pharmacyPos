/**
 * Sync Status Component
 * Displays sync status and provides manual sync button
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Cloud, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { getLastSyncTime, triggerManualSync } from '@/services/syncService';
import { toast } from 'sonner';

export function SyncStatus() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    // Load last sync time on mount
    setLastSync(getLastSyncTime());

    // Update last sync time every minute
    const interval = setInterval(() => {
      setLastSync(getLastSyncTime());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const result = await triggerManualSync();
      if (result.success) {
        toast.success('Sync successful', {
          description: 'Data has been synced to the central server',
        });
        setLastSync(new Date());
      } else {
        toast.error('Sync failed', {
          description: result.message,
        });
      }
    } catch (error) {
      toast.error('Sync failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (date: Date | null): string => {
    if (!date) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getSyncStatus = () => {
    if (!lastSync) {
      return { icon: AlertCircle, color: 'text-yellow-500', label: 'Not synced', variant: 'outline' as const };
    }

    const diffMs = new Date().getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 30) {
      return { icon: CheckCircle2, color: 'text-green-500', label: 'Up to date', variant: 'default' as const };
    } else if (diffMins < 120) {
      return { icon: Clock, color: 'text-blue-500', label: 'Synced recently', variant: 'secondary' as const };
    } else {
      return { icon: AlertCircle, color: 'text-yellow-500', label: 'Needs sync', variant: 'outline' as const };
    }
  };

  const status = getSyncStatus();
  const StatusIcon = status.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Sync Status</CardTitle>
            <CardDescription>Data synchronization to central server</CardDescription>
          </div>
          <Cloud className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 ${status.color}`} />
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <Button
              onClick={handleManualSync}
              disabled={isSyncing}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Last sync:</span>
              <span className="font-medium">{formatLastSync(lastSync)}</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            <p className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Auto-sync runs every 30 minutes
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
