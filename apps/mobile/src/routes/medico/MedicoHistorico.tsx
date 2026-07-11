import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiClient } from '../../app/providers/ApiProvider';

interface HistoricoEntry {
  id: string;
  patientName?: string;
  patient?: { nome: string };
  examPurpose?: string;
  status: string;
  createdAt: string;
  clinic?: { nome: string };
}

export function MedicoHistorico() {
  const navigate = useNavigate();
  const apiClient = useApiClient();
  const [history, setHistory] = useState<HistoricoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchHistory = useCallback(async (pageNum: number) => {
    try {
      setError(null);
      const result = (await apiClient.fetch(`/api/solicitacoes?page=${pageNum}&limit=20`)) as {
        data: { data: HistoricoEntry[]; meta: { totalPages: number } };
      };
      const items = result.data?.data || [];
      if (pageNum === 1) {
        setHistory(items);
      } else {
        setHistory(prev => [...prev, ...items]);
      }
      setHasMore(pageNum < (result.data?.meta?.totalPages || 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      fetchHistory(page + 1);
    }
  }, [loading, hasMore, page, fetchHistory]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    CONCLUIDO: { bg: 'rgba(34, 197, 94, 0.08)', text: 'var(--accent-success)' },
    EM_ATENDIMENTO_MEDICO: { bg: 'rgba(79, 70, 229, 0.08)', text: 'var(--accent-primary)' },
    NA_FILA_MEDICA: { bg: 'rgba(245, 158, 11, 0.08)', text: 'var(--accent-warning)' },
    AGUARDANDO_EXAMES: { bg: 'rgba(139, 92, 246, 0.08)', text: '#8b5cf6' },
    CANCELADO: { bg: 'rgba(239, 68, 68, 0.08)', text: 'var(--accent-danger)' },
  };

  if (loading && history.length === 0) return <LoadingScreen />;

  return (
    <div style={{ padding: 24, backgroundColor: 'var(--bg-app)' }}>
      <h1 style={{ fontSize: 24, fontWeight: 500, marginBottom: 4, color: 'var(--text-primary)' }}>Histórico</h1>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
        Consultas anteriores
      </p>

      {error && (
        <div role="alert" style={{ padding: 12, marginBottom: 16, backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--accent-danger)', borderRadius: 12, fontSize: 14 }}>
          {error}
        </div>
      )}

      {history.length === 0 && !loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🕐</p>
          <p style={{ fontSize: 16 }}>Nenhuma consulta no histórico</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {history.map(item => (
            <div key={item.id}>
              <button
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className="card"
                style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: 16, minHeight: 64, cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {item.patient?.nome || item.patientName || 'Paciente'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {formatDate(item.createdAt)} às {formatTime(item.createdAt)}
                    {item.examPurpose && ` • ${item.examPurpose}`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className="badge"
                    style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 10,
                      backgroundColor: statusColors[item.status]?.bg || 'rgba(156, 163, 175, 0.08)',
                      color: statusColors[item.status]?.text || 'var(--text-muted)',
                    }}
                  >
                    {item.status === 'CONCLUIDO' ? 'Concluído' : item.status.replace(/_/g, ' ').toLowerCase()}
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                    {expandedId === item.id ? '▲' : '▼'}
                  </span>
                </div>
              </button>

              {expandedId === item.id && (
                <div style={{ padding: 16, backgroundColor: 'var(--bg-input)', borderRadius: '0 0 20px 20px', marginTop: -12, paddingTop: 20, borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Paciente</div>
                      <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{item.patient?.nome || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Empresa</div>
                      <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{item.clinic?.nome || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>
                      <div style={{ fontSize: 14, color: statusColors[item.status]?.text || 'var(--text-muted)', fontWeight: 500 }}>
                        {item.status.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/medico/consulta/${item.id}`); }}
                    className="btn btn-primary"
                    style={{
                      width: '100%', marginTop: 12, padding: '10px 16px', fontSize: 14, minHeight: 44,
                    }}
                  >
                    Ver detalhes
                  </button>
                </div>
              )}
            </div>
          ))}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="btn btn-secondary"
              style={{
                width: '100%', padding: '12px 16px', fontSize: 14, minHeight: 44,
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? 'Carregando...' : 'Carregar mais'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', backgroundColor: 'var(--bg-app)' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border-light)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ marginTop: 16, color: 'var(--text-secondary)', fontSize: 14 }}>Carregando histórico...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
