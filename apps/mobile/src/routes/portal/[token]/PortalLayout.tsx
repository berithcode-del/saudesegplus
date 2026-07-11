import { Outlet } from 'react-router-dom';
import { ConnectionStatus } from '../../../components/ConnectionStatus';

export function PortalLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)' }}>
      <ConnectionStatus />
      <main style={{ flex: 1, paddingBottom: 'var(--safe-bottom)' }}>
        <Outlet />
      </main>
    </div>
  );
}
