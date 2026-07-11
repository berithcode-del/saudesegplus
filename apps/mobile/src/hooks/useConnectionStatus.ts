import { useState, useEffect } from 'react';

type ConnectionStatusType = 'connected' | 'reconnecting' | 'disconnected';

export function useConnectionStatus(): ConnectionStatusType {
  const [status, setStatus] = useState<ConnectionStatusType>(
    typeof navigator !== 'undefined' && navigator.onLine ? 'connected' : 'disconnected'
  );

  useEffect(() => {
    const handleOnline = () => setStatus('connected');
    const handleOffline = () => setStatus('disconnected');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return status;
}
