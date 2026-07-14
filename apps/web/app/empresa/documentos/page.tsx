'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircleIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { apiGetDocumentos, apiUploadDocumento, apiGetCompanyStatusCheck } from '../../lib/api';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

interface CompanyDocument {
  id: string;
  companyId: string;
  type: string;
  fileUrl: string;
  originalName: string;
  uploadedAt: string;
  validUntil?: string;
  isValid?: boolean;
}

function getDocumentStatus(doc: CompanyDocument | null): 'valid' | 'expiring' | 'expired' | 'missing' {
  if (!doc) return 'missing';
  if (!doc.validUntil) return 'valid';
  const days = Math.ceil((new Date(doc.validUntil).getTime() - Date.now()) / 86400000);
  if (days < 0) return 'expired';
  if (days < 30) return 'expiring';
  return 'valid';
}

export default function DocumentosPage() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<'PCMSO' | 'PPRA'>('PCMSO');
  const [showForm, setShowForm] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [validUntil, setValidUntil] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [sessionError, setSessionError] = useState('');

  const fetchDocs = useCallback(async (cid: string) => {
    try {
      const result = await apiGetDocumentos(cid);
      setDocuments(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error('Erro ao buscar documentos:', err);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    let cid: string | null = null;

    if (token) {
      try {
        const parts = token.split('.');
        const payload = JSON.parse(atob(parts[1] ?? ''));
        cid = payload?.profileId || payload?.companyId;
      } catch (err) {
        console.error('Erro ao decodificar token:', err);
      }
    }

    if (!cid) {
      cid = localStorage.getItem('companyId');
    }
    
    if (!cid) {
      setSessionError('Nao foi possivel identificar a empresa da sessao. Entre novamente para enviar documentos.');
      setLoading(false);
      return;
    }

    setSessionError('');
    localStorage.setItem('companyId', cid);
    setCompanyId(cid);
    fetchDocs(cid);
  }, [fetchDocs]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !companyId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('companyId', companyId);
      formData.append('type', selectedType);
      formData.append('validUntil', validUntil);

      const result = await apiUploadDocumento(companyId, formData);
      if (result.success) {
        setShowForm(false);
        setUploadFile(null);
        setValidUntil('');
        await fetchDocs(companyId);
        try {
          const statusData = await apiGetCompanyStatusCheck(companyId);
          if (statusData.data?.isComplete) {
            setStatusMessage('Documentação completa — aguardando aprovação do administrador.');
          } else {
            setStatusMessage('Documento enviado com sucesso!');
          }
          setTimeout(() => setStatusMessage(''), 5000);
        } catch {}
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar documento';
      setStatusMessage('❌ ' + msg);
      setTimeout(() => setStatusMessage(''), 6000);
    } finally {
      setUploading(false);
    }
  };

  const docsByType = (type: string) =>
    documents.filter((d) => d.type === type);

  const latestDoc = (type: string) => {
    const filtered = docsByType(type);
    return filtered.length > 0
      ? filtered.reduce((a, b) =>
          new Date(a.uploadedAt) > new Date(b.uploadedAt) ? a : b,
        )
      : null;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR');

  const docTypes = [
    { type: 'PCMSO' as const, label: 'PCMSO', description: 'Programa de Controle Médico de Saúde Ocupacional' },
    { type: 'PPRA' as const, label: 'PPRA/PGR', description: 'Programa de Prevenção de Riscos Ambientais' },
  ];

  const allValid = docTypes.every((dt) => latestDoc(dt.type) !== null);

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Documentos</h2>
            <p>Gerencie a documentação obrigatória da empresa</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <PaperAirplaneIcon className="icon" />
            Novo Documento
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="card" style={{ marginBottom: '20px', border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontSize: '13px', fontWeight: 600 }}>
            <CheckCircleIcon style={{ width: '16px', height: '16px' }} />
            {statusMessage}
          </div>
        </div>
      )}

      {sessionError && (
        <div className="card" style={{ marginBottom: '20px', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)', color: '#b91c1c' }}>
          {sessionError}
        </div>
      )}

      {/* Status Geral */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className={`icon-circle ${allValid ? 'icon-circle-success' : 'icon-circle-warning'}`}>
            <CheckCircleIcon className="icon" />
          </div>
          <div>
            <div style={{ fontWeight: '600', color: '#1e1b4b' }}>
              {allValid ? 'Documentação em Dia' : 'Documentação Pendente'}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>
              {allValid
                ? 'Todos os documentos obrigatórios foram enviados'
                : 'Envie os documentos pendentes abaixo'}
            </div>
          </div>
        </div>
      </div>

      {(() => {
        const pcmso = getDocumentStatus(latestDoc('PCMSO'));
        const ppra = getDocumentStatus(latestDoc('PPRA'));
        const warnings = [];
        if (pcmso === 'expiring') warnings.push('PCMSO próximo do vencimento');
        if (pcmso === 'expired') warnings.push('PCMSO vencido');
        if (ppra === 'expiring') warnings.push('PPRA/PGR próximo do vencimento');
        if (ppra === 'expired') warnings.push('PPRA/PGR vencido');
        if (warnings.length > 0) return (
          <div className="card" style={{ marginBottom: '20px', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d97706', fontSize: '13px', fontWeight: 600 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
              {warnings.join(' · ')}
            </div>
          </div>
        );
        return null;
      })()}

      {/* Modal de Upload */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Enviar Documento</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>
                <XMarkIcon className="icon" />
              </button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Tipo de Documento</label>
                  <select
                    className="form-select"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as 'PCMSO' | 'PPRA')}
                  >
                    <option value="PCMSO">PCMSO</option>
                    <option value="PPRA">PPRA / PGR</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Arquivo (PDF)</label>
                  <input
                    type="file"
                    className="form-input"
                    accept=".pdf"
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Data de Validade</label>
                  <input
                    type="date"
                    className="form-input"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading || !uploadFile || !companyId}>
                  {uploading ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cards de Documentos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
        {docTypes.map((docType) => {
          const doc = latestDoc(docType.type);
          return (
            <div key={docType.type} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e1b4b', marginBottom: '4px' }}>
                    {docType.label}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>{docType.description}</p>
                </div>
                {doc && (
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: doc.isValid !== false ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    color: doc.isValid !== false ? '#16a34a' : '#dc2626',
                  }}>
                    {doc.isValid !== false ? 'Válido' : 'Expirado'}
                  </span>
                )}
              </div>

              {doc ? (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#1e1b4b', marginBottom: '4px' }}>
                    <DocumentTextIcon className="icon icon-sm" />
                    {doc.originalName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    Upload: {formatDate(doc.uploadedAt)}
                    {doc.validUntil && (
                      <span> · Válido até: {formatDate(doc.validUntil)}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '24px',
                  border: '2px dashed #e5e7eb',
                  borderRadius: '12px',
                  textAlign: 'center',
                  marginBottom: '16px',
                  color: '#6b7280',
                  fontSize: '13px',
                }}>
                  Nenhum documento enviado
                </div>
              )}

              <button
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  setSelectedType(docType.type);
                  setShowForm(true);
                }}
              >
                {doc ? <><ArrowPathIcon className="icon" /> Atualizar Documento</> : <><PaperAirplaneIcon className="icon" /> Enviar Documento</>}
              </button>
            </div>
          );
        })}
      </div>

      {/* Histórico de Uploads */}
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e1b4b', marginBottom: '20px' }}>
          Histórico de Documentos
        </h3>
        {loading ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>Carregando...</p>
        ) : documents.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>Nenhum documento encontrado</p>
        ) : (
          <table className="queue-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Arquivo</th>
                <th>Data de Upload</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td style={{ fontWeight: '600' }}>{doc.type}</td>
                  <td>{doc.originalName}</td>
                  <td>{formatDate(doc.uploadedAt)}</td>
                  <td>
                    <a
                      href={`${BACKEND_URL}${doc.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost"
                      style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none' }}
                    >
                      <DocumentTextIcon className="icon icon-sm" />
                      Visualizar
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
