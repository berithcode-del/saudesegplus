import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiClient } from '../../app/providers/ApiProvider';
import { useQueue } from '@/lib/vendor/api-client';
import { mobileStorage } from '../../lib/storage';

interface QueueEntry {
  id: string;
  examRequestId: string;
  patientName: string;
  examType: string;
  enteredQueueAt: string;
  isOnline: boolean;
  priorityScore: number;
  patient?: { nome: string; cpf: string };
}

export function MedicoFila() {
  const navigate = useNavigate();
  const apiClient = useApiClient();
  const { connected, events } = useQueue({ storage: mobileStorage });
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStart = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchQueue = useCallback(async () => {
    try {
      setError(null);
      const data = (await apiClient.fetch('/api/queue')) as QueueEntry[];
      setQueue(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar fila');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Refetch on Socket.IO events
  useEffect(() => {
    if (events.length > 0) {
      const lastEvent = events[events.length - 1];
      if (lastEvent && (lastEvent.type === 'ENQUEUED' || lastEvent.type === 'DOCTOR_STATUS')) {
        fetchQueue();
      }
    }
  }, [events, fetchQueue]);

  // Reconnect on visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchQueue();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchQueue]);

  const handleAccept = useCallback(async (entry: QueueEntry) => {
    setAccepting(entry.id);
    try {
      await apiClient.fetch(`/api/queue/${entry.id}/accept`, { method: 'POST' });
      navigate(`/medico/consulta/${entry.examRequestId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aceitar paciente');
    } finally {
      setAccepting(null);
    }
  }, [apiClient, navigate]);

  // Pull-to-refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      const firstTouch = e.touches[0];
      if (!firstTouch) return;
      touchStart.current = firstTouch.clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart.current === 0) return;
    const firstTouch = e.touches[0];
    if (!firstTouch) return;
    const diff = firstTouch.clientY - touchStart.current;
    if (diff > 0 && diff < 150) {
      setPullDistance(diff);
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      fetchQueue();
    }
    setPullDistance(0);
    touchStart.current = 0;
  };

  const formatWaitTime = (enteredAt: string) => {
    const diff = Date.now() - new Date(enteredAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}min`;
  };

  if (loading) return <LoadingScreen />;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ padding: 24, backgroundColor: 'var(--bg-app)' }}
    >
      {/* Pull to refresh indicator */}
      {pullDistance > 0 && (
        <div style={{
          textAlign: 'center',
          padding: `${Math.min(pullDistance / 2, 40)}px 0`,
          transition: pullDistance === 0 ? 'padding 0.3s' : 'none',
        }}>
          <div style={{
            width: 24,
            height: 24,
            border: '2px solid var(--border-light)',
            borderTopColor: 'var(--accent-primary)',
            borderRadius: '50%',
            animation: pullDistance > 60 ? 'spin 0.8s linear infinite' : 'none',
            margin: '0 auto',
            transform: `rotate(${pullDistance * 3}deg)`,
          }} />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {pullDistance > 60 ? 'Solte para atualizar' : 'Puxe para baixo'}
          </p>
        </div>
      )}

      <h1 style={{ fontSize: 24, fontWeight: 500, marginBottom: 4, color: 'var(--text-primary)' }}>Fila de Atendimento</h1>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
        {queue.length} paciente(s) aguardando
      </p>

      {error && (
        <div role="alert" style={{ padding: 12, marginBottom: 16, backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--accent-danger)', borderRadius: 12, fontSize: 14 }}>
          {error}
        </div>
      )}

      {queue.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📋</p>
          <p style={{ fontSize: 16 }}>Nenhum paciente na fila</p>
          <p style={{ fontSize: 13, marginTop: 4, color: 'var(--text-muted)' }}>Aguardando novos pacientes...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {queue.map(entry => (
            <div
              key={entry.id}
              className="card"
              style={{
                padding: 16,
                minHeight: 64,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {entry.patient?.nome || entry.patientName || 'Paciente'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {entry.examType || 'Exame'} • Aguardando {formatWaitTime(entry.enteredQueueAt)}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <span className={entry.isOnline ? 'badge badge-success' : 'badge badge-danger'}>
                      {entry.isOnline ? 'Online' : 'Offline'}
                    </span>
                    {entry.priorityScore > 0 && (
                      <span className="badge badge-warning">
                        Prioridade
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleAccept(entry)}
                  disabled={accepting === entry.id || !entry.isOnline}
                  className="btn btn-primary"
                  style={{
                    padding: '10px 20px',
                    fontSize: 14,
                    minHeight: 48,
                    cursor: accepting === entry.id || !entry.isOnline ? 'not-allowed' : 'pointer',
                    opacity: accepting === entry.id || !entry.isOnline ? 0.5 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {accepting === entry.id ? 'Aceitando...' : 'Aceitar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', backgroundColor: 'var(--bg-app)' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border-light)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ marginTop: 16, color: 'var(--text-secondary)', fontSize: 14 }}>Carregando fila...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
