import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePortalProcess } from '../../../hooks/usePortalProcess';
import { useConnectionStatus } from '../../../hooks/useConnectionStatus';
import { useApiClient } from '../../../app/providers/ApiProvider';

type WaitingState = 'waiting' | 'doctor_connecting' | 'in_call' | 'finished' | 'error';

export function PortalTeleconsulta() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const apiClient = useApiClient();
  const connection = useConnectionStatus();
  const { data, loading, error, refetch } = usePortalProcess(false);
  const [waitingState, setWaitingState] = useState<WaitingState>('waiting');
  const [videoLink, setVideoLink] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkStatus = useCallback(async () => {
    const process = await refetch();
    if (!process) return;

    const status = process.status;
    const teleconsulta = process.teleconsulta;
    const proximaAcao = process.proximaAcao?.tipo;

    if (status === 'EM_ATENDIMENTO_MEDICO' && teleconsulta?.linkSala) {
      setVideoLink(teleconsulta.linkSala);
      setWaitingState('in_call');
      if (pollRef.current) clearInterval(pollRef.current);
    } else if (proximaAcao === 'ENTRAR_TELECONSULTA' && teleconsulta?.linkSala) {
      setVideoLink(teleconsulta.linkSala);
      setWaitingState('doctor_connecting');
    } else if (status === 'CONCLUIDO' || proximaAcao === 'BAIXAR_ASO') {
      setWaitingState('finished');
      if (pollRef.current) clearInterval(pollRef.current);
      navigate(`/p/${token}/aso`);
    } else if (status === 'NA_FILA_MEDICA' || status === 'EM_COLETA') {
      setWaitingState('waiting');
    }
  }, [refetch, navigate, token]);

  useEffect(() => {
    checkStatus();
    pollRef.current = setInterval(checkStatus, 5000);

    elapsedRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [checkStatus]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleEndCall = useCallback(() => {
    setWaitingState('finished');
    navigate(`/p/${token}/aso`);
  }, [navigate, token]);

  const handleRetryConnection = useCallback(() => {
    setWaitingState('waiting');
    checkStatus();
  }, [checkStatus]);

  if (loading && !data) return <LoadingScreen />;

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '100%', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 24, fontWeight: 500, marginBottom: 8, color: 'var(--text-primary)' }}>Teleconsulta</h1>

        {/* Connection Status Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          marginBottom: 16,
          backgroundColor: connection === 'connected' ? 'rgba(34, 197, 94, 0.08)' : connection === 'reconnecting' ? 'rgba(251, 146, 60, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          borderRadius: 8,
          fontSize: 13,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: connection === 'connected' ? 'var(--accent-success)' : connection === 'reconnecting' ? '#f59e0b' : 'var(--accent-danger)',
          }} />
          <span style={{ color: connection === 'connected' ? 'var(--accent-success)' : connection === 'reconnecting' ? '#c2410c' : 'var(--accent-danger)' }}>
            {connection === 'connected' ? 'Conectado' : connection === 'reconnecting' ? 'Reconectando...' : 'Sem conexão'}
          </span>
        </div>

        {/* Waiting Room */}
        {waitingState === 'waiting' && (
          <div className="card" style={cardStyle}>
            <div style={statusCircle('var(--accent-primary)')}>
              <span style={{ fontSize: 28 }}>⏱</span>
            </div>
            <p style={{ fontSize: 18, fontWeight: 500, marginTop: 16, color: 'var(--text-primary)' }}>Aguardando médico...</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8, textAlign: 'center' }}>
              Sua teleconsulta será iniciada assim que o médico estiver disponível.
            </p>
            <div style={{ fontSize: 24, fontWeight: 500, color: 'var(--accent-primary)', marginTop: 16, fontFamily: 'monospace' }}>
              {formatTime(elapsed)}
            </div>
            {connection === 'disconnected' && (
              <p style={{ fontSize: 12, color: '#c2410c', marginTop: 12, textAlign: 'center' }}>
                Você está offline. A reconexão será automática.
              </p>
            )}
          </div>
        )}

        {/* Doctor Connecting */}
        {waitingState === 'doctor_connecting' && (
          <div className="card" style={cardStyle}>
            <div style={statusCircle('#3b82f6')}>
              <span style={{ fontSize: 28 }}>📞</span>
            </div>
            <p style={{ fontSize: 18, fontWeight: 500, marginTop: 16, color: 'var(--text-primary)' }}>Médico conectando...</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8, textAlign: 'center' }}>
              O médico está se preparando para atendê-lo.
            </p>
          </div>
        )}

        {/* In Call - Video */}
        {waitingState === 'in_call' && videoLink && (
          <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>
            <iframe
              src={videoLink}
              title="Teleconsulta"
              style={{ width: '100%', height: 400, border: 'none', borderRadius: 20 }}
              allow="camera; microphone; fullscreen; display-capture"
            />
          </div>
        )}

        {/* Finished */}
        {waitingState === 'finished' && (
          <div className="card" style={cardStyle}>
            <div style={statusCircle('var(--accent-success)')}>
              <span style={{ fontSize: 28 }}>✓</span>
            </div>
            <p style={{ fontSize: 18, fontWeight: 500, marginTop: 16, color: 'var(--text-primary)' }}>Teleconsulta finalizada</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8, textAlign: 'center' }}>
              Redirecionando para o ASO...
            </p>
          </div>
        )}

        {/* Error */}
        {waitingState === 'error' && (
          <div className="card" style={cardStyle}>
            <div style={statusCircle('var(--accent-danger)')}>
              <span style={{ fontSize: 28 }}>✕</span>
            </div>
            <p style={{ fontSize: 18, fontWeight: 500, marginTop: 16, color: 'var(--text-primary)' }}>Erro de conexão</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8, textAlign: 'center' }}>
              Não foi possível conectar à teleconsulta.
            </p>
          </div>
        )}

        {error && (
          <div role="alert" style={{ padding: 12, marginTop: 16, backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--accent-danger)', borderRadius: 12, fontSize: 14 }}>
            {error}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ paddingBottom: 'calc(24px + var(--safe-bottom))', display: 'flex', gap: 12 }}>
        {waitingState === 'in_call' && (
          <button
            onClick={handleEndCall}
            className="btn btn-danger"
            style={{
              flex: 1,
            }}
          >
            Finalizar Chamada
          </button>
        )}

        {waitingState === 'error' && (
          <button
            onClick={handleRetryConnection}
            className="btn btn-primary"
            style={{
              flex: 1,
            }}
          >
            Reconectar
          </button>
        )}

        {waitingState === 'waiting' && (
          <button
            onClick={handleEndCall}
            className="btn btn-secondary"
            style={{
              flex: 1,
            }}
          >
            Pular para ASO
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border-light)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ marginTop: 16, color: 'var(--text-secondary)', fontSize: 14 }}>Carregando...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function statusCircle(color: string): React.CSSProperties {
  return {
    width: 72,
    height: 72,
    borderRadius: '50%',
    backgroundColor: color,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  };
}

const cardStyle: React.CSSProperties = {
  padding: 32,
  textAlign: 'center',
};
