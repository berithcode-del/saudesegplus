import { useEffect, useCallback } from 'react';
import { useOfflineQueue } from './useOfflineQueue';
import { useApiClient } from '../app/providers/ApiProvider';

export function useOfflineSync() {
  const { flush, pendingCount } = useOfflineQueue();
  const apiClient = useApiClient();

  const syncPendingItems = useCallback(async () => {
    if (pendingCount === 0) return;

    await flush(async (item) => {
      const response = await apiClient.fetch(item.endpoint, {
        method: item.method,
        body: item.body,
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response) throw new Error('Sync failed');
    });
  }, [flush, pendingCount, apiClient]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_OFFLINE_QUEUE') {
        syncPendingItems();
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);

    window.addEventListener('online', syncPendingItems);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
      window.removeEventListener('online', syncPendingItems);
    };
  }, [syncPendingItems]);

  useEffect(() => {
    if (pendingCount > 0 && navigator.onLine) {
      syncPendingItems();
    }
  }, [pendingCount, syncPendingItems]);

  return { syncPendingItems, pendingCount };
}
