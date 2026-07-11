import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePortalProcess } from '../../../hooks/usePortalProcess';
import { useApiClient } from '../../../app/providers/ApiProvider';
import { useCamera } from '../../../hooks/useCamera';
import { useOfflineQueue } from '../../../hooks/useOfflineQueue';
import { useConnectionStatus } from '../../../hooks/useConnectionStatus';
import type { DocumentType } from '@/lib/vendor/api-types';

interface DocStatus {
  tipo: DocumentType;
  label: string;
  enviado: boolean;
  fileUrl: string | null;
}

const DOC_CONFIG: { tipo: DocumentType; label: string; required: boolean }[] = [
  { tipo: 'rg', label: 'RG', required: true },
  { tipo: 'foto', label: 'Foto', required: true },
  { tipo: 'cnh', label: 'CNH', required: false },
];

export function PortalDocumentos() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const apiClient = useApiClient();
  const { data, loading, error, refetch } = usePortalProcess();
  const { capture, capturing } = useCamera();
  const { enqueue, pendingCount } = useOfflineQueue();
  const connection = useConnectionStatus();

  const [docs, setDocs] = useState<DocStatus[]>([]);
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [showLgpdModal, setShowLgpdModal] = useState(false);
  const [pendingDocType, setPendingDocType] = useState<DocumentType | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (data?.documentos) {
      const mapped = DOC_CONFIG.map(cfg => {
        const found = data.documentos.find(d => d.tipo === cfg.tipo);
        return {
          tipo: cfg.tipo,
          label: cfg.label,
          enviado: found?.enviado ?? false,
          fileUrl: found?.fileUrl ?? null,
        };
      });
      setDocs(mapped);
    }
  }, [data]);

  const requiredSent = docs.filter(d => d.enviado).length >= 2;

  const handleCaptureRequest = useCallback((tipo: DocumentType) => {
    setPendingDocType(tipo);
    if (!lgpdAccepted) {
      setShowLgpdModal(true);
    } else {
      startCapture();
    }
  }, [lgpdAccepted]);

  const startCapture = useCallback(async () => {
    setShowLgpdModal(false);
    const result = await capture(`${pendingDocType || 'doc'}.jpg`);
    if (result) {
      setPreview(result.dataUrl);
    }
  }, [capture, pendingDocType]);

  const handleConfirmUpload = useCallback(async () => {
    if (!preview || !pendingDocType) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const blob = await fetch(preview).then(r => r.blob());
      const formData = new FormData();
      formData.append('file', blob, `${pendingDocType}.jpg`);

      const uploadResult = (await apiClient.fetchWithFormData('/api/upload/file', formData)) as { fileUrl: string };

      if (connection === 'disconnected') {
        await enqueue('/api/portal/documentos', 'POST', {
          tipo: pendingDocType,
          fileUrl: uploadResult.fileUrl,
        });
        setUploadSuccess('Documento salvo localmente. Será enviado quando a conexão voltar.');
      } else {
        await apiClient.fetch('/api/portal/documentos', {
          method: 'POST',
          body: JSON.stringify({ tipo: pendingDocType, fileUrl: uploadResult.fileUrl }),
        });
        setUploadSuccess('Documento enviado com sucesso!');
        await refetch();
      }

      setPreview(null);
      setPendingDocType(null);
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erro ao enviar documento');
    } finally {
      setUploading(false);
    }
  }, [preview, pendingDocType, apiClient, connection, enqueue, refetch]);

  const handleCancelCapture = useCallback(() => {
    setPreview(null);
    setPendingDocType(null);
    setUploadError(null);
  }, []);

  if (loading && !data) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} onRetry={refetch} />;

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '100%', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 24, fontWeight: 500, marginBottom: 8, color: 'var(--text-primary)' }}>Documentos</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
          Envie os documentos necessários para sua avaliação. Envie pelo menos RG e Foto.
        </p>

        {pendingCount > 0 && (
          <div style={{ padding: 12, marginBottom: 16, backgroundColor: 'rgba(251, 146, 60, 0.08)', color: '#c2410c', borderRadius: 12, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 500 }}>{pendingCount} doc(s) pendente(s) de envio</span>
          </div>
        )}

        {uploadSuccess && (
          <div role="status" style={{ padding: 12, marginBottom: 16, backgroundColor: 'rgba(34, 197, 94, 0.08)', color: 'var(--accent-success)', borderRadius: 12, fontSize: 14, display: 'flex', alignItems: 'center' }}>
            {uploadSuccess}
          </div>
        )}

        {uploadError && (
          <div role="alert" style={{ padding: 12, marginBottom: 16, backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--accent-danger)', borderRadius: 12, fontSize: 14, display: 'flex', alignItems: 'center' }}>
            {uploadError}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {docs.map(doc => (
            <div
              key={doc.tipo}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                backgroundColor: doc.enviado ? 'rgba(34, 197, 94, 0.08)' : 'var(--bg-card)',
                minHeight: 56,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: doc.enviado ? 'var(--accent-success)' : 'var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 500,
                }}>
                  {doc.enviado ? '✓' : DOC_CONFIG.find(c => c.tipo === doc.tipo)?.required ? '!' : '○'}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>{doc.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {doc.enviado ? 'Enviado' : DOC_CONFIG.find(c => c.tipo === doc.tipo)?.required ? 'Obrigatório' : 'Opcional'}
                  </div>
                </div>
              </div>
              {!doc.enviado && (
                <button
                  onClick={() => handleCaptureRequest(doc.tipo)}
                  disabled={capturing || uploading}
                  className="btn btn-primary"
                  style={{
                    padding: '8px 16px',
                    fontSize: 14,
                    cursor: capturing || uploading ? 'not-allowed' : 'pointer',
                    minHeight: 48,
                    opacity: capturing || uploading ? 0.5 : 1,
                  }}
                >
                  {capturing ? 'Capturando...' : 'Capturar'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* LGPD Consent Modal */}
      {showLgpdModal && (
        <div style={overlayStyle}>
          <div className="card" style={modalStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 12, color: 'var(--text-primary)' }}>Consentimento LGPD</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
              Para capturar sua foto ou documento, precisamos acessar sua câmera.
              A imagem será enviada exclusivamente para fins de avaliação médica ocupacional,
              conforme a Lei nº 13.709/2018 (LGPD).
            </p>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginBottom: 20 }}>
              <input
                type="checkbox"
                checked={lgpdAccepted}
                onChange={e => setLgpdAccepted(e.target.checked)}
                style={{ marginTop: 2, width: 20, height: 20, accentColor: 'var(--accent-primary)' }}
              />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Autorizo o uso da câmera para captura do documento/foto.
              </span>
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => { setShowLgpdModal(false); setPendingDocType(null); }}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button
                onClick={() => { setLgpdAccepted(true); startCapture(); }}
                disabled={!lgpdAccepted}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  opacity: lgpdAccepted ? 1 : 0.5,
                  cursor: lgpdAccepted ? 'pointer' : 'not-allowed',
                }}
              >
                Autorizar e Capturar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Preview */}
      {preview && (
        <div style={overlayStyle}>
          <div className="card" style={{ ...modalStyle, padding: 0, overflow: 'hidden' }}>
            <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain', backgroundColor: '#000' }} />
            <div style={{ padding: 16, display: 'flex', gap: 12 }}>
              <button
                onClick={handleCancelCapture}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Recapturar
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={uploading}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  opacity: uploading ? 0.6 : 1,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                }}
              >
                {uploading ? 'Enviando...' : 'Confirmar e Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Continue Button */}
      <div style={{ paddingBottom: 'calc(24px + var(--safe-bottom))' }}>
        <button
          onClick={() => navigate(`/p/${token}/teleconsulta`)}
          className={requiredSent ? 'btn btn-primary' : 'btn btn-secondary'}
          style={{
            width: '100%',
          }}
        >
          {requiredSent ? 'Continuar' : 'Envie RG e Foto para continuar'}
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

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 24,
};

const modalStyle: React.CSSProperties = {
  borderRadius: 20,
  padding: 24,
  maxWidth: 400,
  width: '100%',
};
