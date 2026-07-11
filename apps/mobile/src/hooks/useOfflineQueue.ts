import { useState, useCallback, useEffect } from 'react';
import localforage from 'localforage';

interface OfflineItem {
  id: string;
  endpoint: string;
  method: string;
  body: string;
  createdAt: string;
  retries: number;
}

const QUEUE_KEY = 'saudeseg_offline_queue';
const store = localforage.createInstance({ name: 'saudeseg', storeName: 'offline_queue' });

export function useOfflineQueue() {
  const [pendingCount, setPendingCount] = useState(0);

  const refreshCount = useCallback(async () => {
    const items = (await store.getItem<OfflineItem[]>(QUEUE_KEY)) ?? [];
    setPendingCount(items.length);
  }, []);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  const enqueue = useCallback(
    async (endpoint: string, method: string, body: unknown) => {
      const item: OfflineItem = {
        id: crypto.randomUUID(),
        endpoint,
        method,
        body: JSON.stringify(body),
        createdAt: new Date().toISOString(),
        retries: 0,
      };
      const items = (await store.getItem<OfflineItem[]>(QUEUE_KEY)) ?? [];
      items.push(item);
      await store.setItem(QUEUE_KEY, items);
      setPendingCount(items.length);
    },
    [],
  );

  const flush = useCallback(
    async (sendFn: (item: OfflineItem) => Promise<void>) => {
      const items = (await store.getItem<OfflineItem[]>(QUEUE_KEY)) ?? [];
      const remaining: OfflineItem[] = [];

      for (const item of items) {
        try {
          await sendFn(item);
        } catch {
          remaining.push({ ...item, retries: item.retries + 1 });
        }
      }

      await store.setItem(QUEUE_KEY, remaining);
      setPendingCount(remaining.length);
    },
    [],
  );

  const clear = useCallback(async () => {
    await store.removeItem(QUEUE_KEY);
    setPendingCount(0);
  }, []);

  return { pendingCount, enqueue, flush, clear, refreshCount };
}
