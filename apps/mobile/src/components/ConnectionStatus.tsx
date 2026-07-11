import { useConnectionStatus } from '../hooks/useConnectionStatus';

const statusConfig = {
  connected: { bg: 'rgba(34, 197, 94, 0.12)', color: '#22c55e', label: 'Conectado' },
  reconnecting: { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', label: 'Reconectando...' },
  disconnected: { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', label: 'Sem conexão' },
};

export function ConnectionStatus() {
  const status = useConnectionStatus();
  const config = statusConfig[status];

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 16px',
        paddingTop: 'calc(6px + var(--safe-top))',
        backgroundColor: config.bg,
        color: config.color,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: config.color,
      }} />
      {config.label}
    </div>
  );
}
