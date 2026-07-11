import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useQueue } from '@/lib/vendor/api-client';
import { useApiClient } from '../../app/providers/ApiProvider';
import { MobileBottomNav } from '../../components/MobileBottomNav';
import { mobileStorage } from '../../lib/storage';

function useAuthCheck() {
  const token = mobileStorage.getItem('token');
  const role = mobileStorage.getItem('userRole');
  return { isAuthenticated: !!token && role === 'DOCTOR' };
}

const tabs = [
  { to: '/medico', label: 'Dashboard', icon: 'chart' as const, end: true },
  { to: '/medico/fila', label: 'Fila', icon: 'heart' as const, end: false },
  { to: '/medico/historico', label: 'Historico', icon: 'clock' as const, end: false },
  { to: '/medico/configuracao', label: 'Config', icon: 'cog' as const, end: false },
];

export function MedicoLayout() {
  const { isAuthenticated } = useAuthCheck();
  const apiClient = useApiClient();
  const { connected } = useQueue({ storage: mobileStorage });
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchQueue = async () => {
      try {
        const data = (await apiClient.fetch('/api/queue')) as { length?: number }[];
        setQueueCount(Array.isArray(data) ? data.length : 0);
      } catch {
        // Keep the shell usable if queue polling fails.
      }
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, apiClient]);

  if (!isAuthenticated) {
    return <Navigate to="/medico/login" replace />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 16px',
          paddingTop: 'calc(6px + var(--safe-top))',
          backgroundColor: connected ? 'var(--accent-success)' : 'var(--accent-danger)',
          color: 'white',
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'white' }} />
        {connected ? 'Conectado a fila' : 'Desconectado'}
      </div>

      <main style={{ flex: 1, paddingBottom: 72 }}>
        <Outlet context={{ queueCount }} />
      </main>

      <MobileBottomNav items={tabs.map((tab) => (tab.to === '/medico/fila' ? { ...tab, badge: queueCount } : tab))} />
    </div>
  );
}
