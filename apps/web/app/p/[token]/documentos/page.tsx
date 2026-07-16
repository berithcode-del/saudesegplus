'use client';
import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

interface DocumentoStatus {
  tipo: string;
  enviado: boolean;
  nomeArquivo?: string;
  fileUrl?: string | null;
}

const documentosConfig: { tipo: string; label: string; Icon: typeof DocumentTextIcon }[] = [
  { tipo: 'rg', label: 'RG / Documento de Identidade', Icon: DocumentTextIcon },
  { tipo: 'foto', label: 'Selfie', Icon: PhotoIcon },
];

const normalizeDocumentos = (items: DocumentoStatus[] = []) =>
  documentosConfig.map(({ tipo }) => {
    const item = items.find(documento => documento.tipo === tipo);
    return item ?? { tipo, enviado: false, fileUrl: null };
  });

export default function DocumentosPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = React.use(params);
  const router = useRouter();
  const [documentos, setDocumentos] = useState<DocumentoStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Record<string, string>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const fetchDocumentos = async () => {
      const portalToken = sessionStorage.getItem('portalToken');
      if (!portalToken) {
        router.replace(`/p/${token}`);
        return;
      }
      try {
        const res = await fetch(`${BACKEND_URL}/api/portal/documentos`, {
          headers: { Authorization: `Bearer ${portalToken}` },
        });
        const json = await res.json();
        const data = Array.isArray(json) ? json : json.data;
        setDocumentos(normalizeDocumentos(data ?? []));
      } catch {
        setDocumentos(normalizeDocumentos());
        setError('Erro ao carregar documentos.');
      } finally {
        setLoading(false);
      }
    };
    fetchDocumentos();
  }, [token, router]);

  const handleUpload = async (tipo: string) => {
    const file = fileRefs.current[tipo]?.files?.[0];
    if (!file) {
      setError('Escolha um arquivo antes de enviar.');
      return;
    }

    setUploading(tipo);
    setError('');

    try {
      const portalToken = sessionStorage.getItem('portalToken');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tipo', tipo);

      const res = await fetch(`${BACKEND_URL}/api/upload/file`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${portalToken}` },
        body: formData,
      });
      const uploadData = await res.json();
      if (!res.ok || !uploadData.success) {
        throw new Error(uploadData.message ?? uploadData.error ?? 'Erro ao fazer upload do arquivo.');
      }

      // Segundo passo: registrar no processo
      const resRegistro = await fetch(`${BACKEND_URL}/api/portal/documentos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${portalToken}`,
        },
        body: JSON.stringify({ tipo, fileUrl: uploadData.fileUrl }),
      });

      const registroData = await resRegistro.json().catch(() => null);
      if (!resRegistro.ok) {
        const message = Array.isArray(registroData?.message)
          ? registroData.message.join(', ')
          : registroData?.message;
        throw new Error(message ?? 'Erro ao registrar documento no sistema.');
      }

      setDocumentos(prev =>
        normalizeDocumentos(prev).map(d => d.tipo === tipo
          ? { ...d, enviado: true, nomeArquivo: file.name, fileUrl: uploadData.fileUrl }
          : d,
        )
      );

      if (fileRefs.current[tipo]) {
        fileRefs.current[tipo]!.value = '';
      }
      setSelectedFiles(prev => ({ ...prev, [tipo]: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar arquivo.');
    } finally {
      setUploading(null);
    }
  };

  const allOk = documentos.length > 0 && documentos.every(d => d.enviado);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>Carregando...</div>;
  }

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e1b4b', marginBottom: '4px' }}>Documentos</h2>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
        Envie os documentos necessários para o exame
      </p>

      {error && (
        <div style={{
          padding: '12px 14px', borderRadius: '12px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          color: '#dc2626', fontSize: '13px',
          marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {documentosConfig.map(({ tipo, label, Icon }) => {
          const doc = documentos.find(d => d.tipo === tipo);
          const enviado = doc?.enviado ?? false;
          return (
            <div key={tipo} style={{
              background: 'white',
              borderRadius: '16px',
              padding: '18px 20px',
              boxShadow: '0 2px 12px rgba(31,38,135,0.08)',
              border: `1px solid ${enviado ? 'rgba(34,197,94,0.3)' : '#e5e7eb'}`,
              overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: enviado ? 'rgba(34,197,94,0.12)' : 'rgba(79,70,229,0.08)',
                }}>
                  {enviado ? (
                    <CheckCircleIcon style={{ width: '22px', height: '22px', color: '#22c55e' }} />
                  ) : (
                    <Icon style={{ width: '22px', height: '22px', color: '#4f46e5' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e1b4b' }}>{label}</div>
                  {enviado && doc?.nomeArquivo && (
                    <div style={{ fontSize: '12px', color: '#22c55e' }}>
                      ✓ {doc.nomeArquivo}
                    </div>
                  )}
                </div>
                {enviado ? (
                  <CheckCircleIcon style={{ width: '20px', height: '20px', color: '#22c55e' }} />
                ) : (
                  <XCircleIcon style={{ width: '20px', height: '20px', color: '#d1d5db' }} />
                )}
              </div>

              {!enviado && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    ref={(el) => { fileRefs.current[tipo] = el; }}
                    type="file"
                    accept={tipo === 'foto' ? 'image/*' : '.pdf,.png,.jpg,.jpeg'}
                    capture={tipo === 'foto' ? 'user' : undefined}
                    onChange={(event) => {
                      const fileName = event.target.files?.[0]?.name ?? '';
                      setSelectedFiles(prev => ({ ...prev, [tipo]: fileName }));
                    }}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileRefs.current[tipo]?.click()}
                    style={{
                      width: '100%',
                      minHeight: '46px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      background: '#f4f5fb',
                      color: '#1e1b4b',
                      fontWeight: 600,
                      fontSize: '13px',
                      textAlign: 'left',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {selectedFiles[tipo] || (tipo === 'foto' ? 'Tirar ou escolher selfie' : 'Escolher arquivo')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px 16px', fontSize: '13px', justifyContent: 'center' }}
                    onClick={() => handleUpload(tipo)}
                    disabled={uploading === tipo}
                  >
                    {uploading === tipo ? '...' : <><ArrowUpTrayIcon style={{ width: '14px', height: '14px' }} /> Upload</>}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => router.push(`/p/${token}/processo`)}
        >
          <ArrowLeftIcon style={{ width: '16px', height: '16px' }} />
          Voltar
        </button>
        <button
          type="button"
          className="btn btn-primary"
          style={{ flex: 1, justifyContent: 'center' }}
          disabled={!allOk}
          onClick={() => router.push(`/p/${token}/processo`)}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
