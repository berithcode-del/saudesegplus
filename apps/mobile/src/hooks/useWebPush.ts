import { useState, useCallback, useEffect } from 'react';
import { useApiClient } from '../app/providers/ApiProvider';
const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type PushStatus = 'idle' | 'loading' | 'subscribed' | 'denied' | 'unsupported' | 'error';

export function useWebPush() {
  const apiClient = useApiClient();
  const [status, setStatus] = useState<PushStatus>('idle');
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (!('Notification' in window)) {
      setStatus('unsupported');
      return;
    }
    setPermission(Notification.permission);
    if (Notification.permission === 'granted') {
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker?.ready;
      if (!reg) return;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        setStatus('subscribed');
      }
    } catch {
      /* ignore */
    }
  };

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported');
      return false;
    }

    setStatus('loading');

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        setStatus('denied');
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();

      if (!subscription && VAPID_KEY) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
        });
      }

      if (subscription) {
        await apiClient.fetch('/api/push/subscribe', {
          method: 'POST',
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        });
        setStatus('subscribed');
        return true;
      }

      setStatus('error');
      return false;
    } catch (err) {
      console.error('[WebPush] Subscribe error:', err);
      setStatus('error');
      return false;
    }
  }, [apiClient]);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker?.ready;
      if (!reg) return;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await apiClient.fetch('/api/push/unsubscribe', { method: 'POST' });
      }
      setStatus('idle');
    } catch {
      /* ignore */
    }
  }, [apiClient]);

  return { status, permission, subscribe, unsubscribe };
}
