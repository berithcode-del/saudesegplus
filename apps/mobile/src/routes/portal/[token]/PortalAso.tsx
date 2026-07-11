import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePortalProcess } from '../../../hooks/usePortalProcess';
import { useApiClient } from '../../../app/providers/ApiProvider';

type AsoState = 'loading' | 'available' | 'signing' | 'signed' | 'unavailable';

export function PortalAso() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const apiClient = useApiClient();
  const { data, loading, error, refetch } = usePortalProcess();
  const [asoState, setAsoState] = useState<AsoState>('loading');
  const [downloading, setDownloading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    if (data) {
      if (data.aso?.disponivel) {
        setAsoState('available');
      } else if (data.status === 'CONCLUIDO') {
        setAsoState('available');
      } else {
        setAsoState('unavailable');
      }
    }
  }, [data]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const token2 = apiClient.getAuthToken();
      const response = await fetch(`${apiClient.getBaseUrl()}/api/portal/aso`, {
        headers: token2 ? { Authorization: `Bearer ${token2}` } : {},
      });

      if (!response.ok) throw new Error('Erro ao baixar ASO');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ASO_${data?.paciente?.nome || 'documento'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao baixar ASO:', err);
    } finally {
      setDownloading(false);
    }
  }, [apiClient, data]);

  const handleSign = useCallback(() => {
    setAsoState('signing');
  }, []);

  const handleSignComplete = useCallback(async () => {
    setSigning(true);
    try {
      // TODO: Backend endpoint for ASO signature
      // await apiClient.fetch('/api/portal/aso/sign', { method: 'POST', body: JSON.stringify({ signed: true }) });
      await new Promise(r => setTimeout(r, 1000)); // Simulate API call
      setSigned(true);
      setAsoState('signed');
    } catch {
      // Handle error
    } finally {
      setSigning(false);
    }
  }, []);

  const handleFinish = useCallback(() => {
    navigate('/');
  }, [navigate]);

  if (loading && !data) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} onRetry={refetch} />;

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '100%', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 24, fontWeight: 500, marginBottom: 8, color: 'var(--text-primary)' }}>ASO</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
          Atestado de Saúde Ocupacional
        </p>

        {/* ASO Status Card */}
        <div className="card" style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              backgroundColor: asoState === 'signed' ? 'var(--accent-success)' : asoState === 'available' ? 'var(--accent-primary)' : '#f59e0b',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18,
            }}>
              {asoState === 'signed' ? '✓' : asoState === 'available' ? '📄' : '⏳'}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>
                {asoState === 'signed' ? 'ASO Assinado' : asoState === 'available' ? 'ASO Disponível' : 'Aguardando'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {asoState === 'signed' ? 'Documento finalizado' : asoState === 'available' ? 'Baixe e assine seu ASO' : 'O ASO será gerado após a consulta'}
              </div>
            </div>
          </div>

          {data?.aso?.validUntil && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, padding: 8, backgroundColor: 'var(--bg-input)', borderRadius: 8 }}>
              Validade: {new Date(data.aso.validUntil).toLocaleDateString('pt-BR')}
            </div>
          )}

          {data?.aso?.decision && (
            <div style={{ fontSize: 13, color: 'var(--accent-primary)', fontWeight: 500, marginTop: 8 }}>
              Resultado: {data.aso.decision}
            </div>
          )}
        </div>

        {/* Actions */}
        {asoState === 'available' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn btn-primary"
              style={{
                width: '100%',
                opacity: downloading ? 0.6 : 1,
                cursor: downloading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {downloading ? 'Baixando...' : 'Baixar ASO (PDF)'}
            </button>
            <button
              onClick={handleSign}
              className="btn btn-secondary"
              style={{
                width: '100%',
              }}
            >
              Assinar ASO
            </button>
          </div>
        )}

        {asoState === 'signed' && (
          <div style={{ marginTop: 16, padding: 16, backgroundColor: 'rgba(34, 197, 94, 0.08)', borderRadius: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--accent-success)' }}>ASO assinado com sucesso!</p>
            <p style={{ fontSize: 13, color: 'var(--accent-success)', marginTop: 4 }}>Seu fluxo foi concluído.</p>
          </div>
        )}

        {asoState === 'unavailable' && (
          <div style={{ marginTop: 16, padding: 16, backgroundColor: 'var(--bg-input)', borderRadius: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              O ASO será gerado após a conclusão da teleconsulta com o médico.
            </p>
          </div>
        )}

        {/* Signature Pad */}
        {asoState === 'signing' && (
          <div style={{ marginTop: 16 }}>
            <SignaturePad onComplete={handleSignComplete} onCancel={() => setAsoState('available')} signing={signing} />
          </div>
        )}
      </div>

      {/* Finish Button */}
      {(asoState === 'signed' || asoState === 'available') && (
        <div style={{ paddingBottom: 'calc(24px + var(--safe-bottom))' }}>
          <button
            onClick={handleFinish}
            className={asoState === 'signed' ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{
              width: '100%',
            }}
          >
            {asoState === 'signed' ? 'Finalizar' : 'Voltar ao Início'}
          </button>
        </div>
      )}
    </div>
  );
}

function SignaturePad({ onComplete, onCancel, signing }: { onComplete: () => void; onCancel: () => void; signing: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const touch = 'touches' in e ? e.touches[0] : undefined;
    const clientX = touch?.clientX ?? ('clientX' in e ? e.clientX : 0);
    const clientY = touch?.clientY ?? ('clientY' in e ? e.clientY : 0);
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    isDrawing.current = true;
    lastPoint.current = getPos(e);
    setHasDrawn(true);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    if (lastPoint.current) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
    lastPoint.current = pos;
  };

  const endDraw = () => {
    isDrawing.current = false;
    lastPoint.current = null;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  return (
    <div className="card" style={{ padding: 16 }}>
      <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, color: 'var(--text-primary)' }}>Assine abaixo</p>
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: 120, touchAction: 'none', cursor: 'crosshair' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          onClick={clear}
          className="btn btn-ghost"
          style={{ flex: 1, fontSize: 13, minHeight: 44 }}
        >
          Limpar
        </button>
        <button
          onClick={onCancel}
          className="btn btn-ghost"
          style={{ flex: 1, fontSize: 13, minHeight: 44 }}
        >
          Cancelar
        </button>
        <button
          onClick={onComplete}
          disabled={!hasDrawn || signing}
          className="btn btn-primary"
          style={{
            flex: 1, fontSize: 13, minHeight: 44,
            opacity: !hasDrawn || signing ? 0.5 : 1,
            cursor: !hasDrawn || signing ? 'not-allowed' : 'pointer',
          }}
        >
          {signing ? 'Salvando...' : 'Confirmar'}
        </button>
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

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 16 }}>
      <div style={{ fontSize: 40 }}>⚠️</div>
      <p style={{ color: 'var(--accent-danger)', fontSize: 16 }}>{message}</p>
      <button onClick={onRetry} className="btn btn-primary" style={{ padding: '12px 24px', fontSize: 14, fontWeight: 500, minHeight: 48, cursor: 'pointer' }}>
        Tentar novamente
      </button>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  padding: 20,
};
