'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon, DocumentArrowDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { apiListCompanyAsos, getAuthToken } from '../../lib/api';
import { useRouter } from 'next/navigation';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

function resolveFileUrl(fileUrl: string) {
  return /^https?:\/\//i.test(fileUrl) ? fileUrl : `${BACKEND_URL}${fileUrl}`;
}

interface CompanyAso {
  id: string;
  requestId: string;
  numeroProtocolo?: string | null;
  processoAsoId?: string | null;
  collaborator: { id: string; name: string; cpf: string; functionCboCode?: string | null };
  examType: string;
  examPurpose: string;
  issuedAt: string;
  validUntil: string;
  daysUntilExpiration: number;
  decision: string;
  restrictionNotes?: string | null;
  pdfUrl?: string | null;
  doctor: { id: string; name: string; crm: string };
}

function getStoredCompanyId() {
  const token = localStorage.getItem('token');
  let companyId = localStorage.getItem('companyId');

  if (!companyId && token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
      companyId = payload?.profileId || payload?.companyId || '';
    } catch {
      companyId = '';
    }
  }

  return companyId || '';
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR');
}

function expirationTone(days: number) {
  if (days <= 7) {
    return { background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', text: `vence em ${days} dias` };
  }

  if (days <= 15) {
    return { background: 'rgba(245, 158, 11, 0.14)', color: '#b45309', text: `vence em ${days} dias` };
  }

  return { background: 'rgba(14, 165, 233, 0.12)', color: '#0369a1', text: `vence em ${days} dias` };
}

export default function EmpresaAsosPage() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState('');
  const [asos, setAsos] = useState<CompanyAso[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState<{ url: string; aso: CompanyAso } | null>(null);

  const openAso = async (aso: CompanyAso) => {
      const response = await fetch(`${BACKEND_URL}/api/company/${companyId}/asos/${aso.id}/file`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (!response.ok) return;
      setViewer({ aso, url: URL.createObjectURL(await response.blob()) });
    };

  useEffect(() => {
    setCompanyId(getStoredCompanyId());
  }, []);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    apiListCompanyAsos(companyId)
      .then((result) => {
        if (active) setAsos(Array.isArray(result.data) ? result.data : []);
      })
      .catch(() => {
        if (active) setAsos([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [companyId]);

  const summary = useMemo(() => ({
    total: asos.length,
    critical: asos.filter((aso) => aso.daysUntilExpiration <= 7).length,
    warning: asos.filter((aso) => aso.daysUntilExpiration > 7 && aso.daysUntilExpiration <= 30).length,
  }), [asos]);

  const refresh = () => {
    if (!companyId) return;
    setLoading(true);
    apiListCompanyAsos(companyId)
      .then((result) => setAsos(Array.isArray(result.data) ? result.data : []))
      .catch(() => setAsos([]))
      .finally(() => setLoading(false));
  };

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <h2>ASOs vigentes</h2>
            <p>Historico de colaboradores com ASO ativo, ordenado por vencimento</p>
          </div>
          <button className="btn btn-secondary" onClick={refresh}>
            <ArrowPathIcon className="icon" /> Atualizar
          </button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(160px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-label">ASOs ativos</div>
          <div className="stat-value">{summary.total}</div>
          <div className="stat-sub">aptos e dentro da validade</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ate 7 dias</div>
          <div className="stat-value" style={{ color: '#dc2626' }}>{summary.critical}</div>
          <div className="stat-sub">renovacao prioritaria</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ate 30 dias</div>
          <div className="stat-value" style={{ color: '#b45309' }}>{summary.warning}</div>
          <div className="stat-sub">monitorar agenda</div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Carregando ASOs...</p>
        ) : asos.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Nenhum ASO vigente encontrado.</p>
        ) : (
          <table className="queue-table">
                      <thead>
                        <tr>
                          <th>Protocolo</th>
                          <th>Colaborador</th>
                          <th>CPF</th>
                          <th>Tipo</th>
                          <th>Emissão</th>
                          <th>Validade</th>
                          <th>Vencimento</th>
                          <th>Médico</th>
                          <th>ASO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {asos.map((aso) => {
                          const tone = expirationTone(aso.daysUntilExpiration);
                          return (
                            <tr key={aso.id}>
                              <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12px' }}>
                                {aso.numeroProtocolo || aso.processoAsoId ? (
                                  <span style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }}
                                    onClick={() => router.push(`/aso/protocolos/${aso.processoAsoId}`)}>
                                    {aso.numeroProtocolo || '—'}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>—</span>
                                )}
                              </td>
                              <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{aso.collaborator.name}</td>
                              <td>{aso.collaborator.cpf}</td>
                              <td className="capitalize">{aso.examType}</td>
                              <td>{formatDate(aso.issuedAt)}</td>
                              <td>{formatDate(aso.validUntil)}</td>
                              <td>
                                <span className="badge" style={{ background: tone.background, color: tone.color }}>{tone.text}</span>
                              </td>
                              <td>{aso.doctor.name}</td>
                              <td>
                                {aso.pdfUrl ? (
                                  <button className="btn btn-secondary" onClick={() => void openAso(aso)} style={{ padding: '6px 10px', minHeight: 'unset' }}>
                                    <DocumentArrowDownIcon className="icon-sm" /> Visualizar
                                  </button>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>Sem PDF</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
        )}
      </div>
      {viewer && <div className="modal-overlay" onClick={() => { URL.revokeObjectURL(viewer.url); setViewer(null); }}><div className="modal-content" style={{ width: 'min(1100px, 94vw)', height: '88vh', borderRadius: '16px', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}><div className="modal-header"><div><h3>ASO de {viewer.aso.collaborator.name}</h3><p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Emitido em {formatDate(viewer.aso.issuedAt)} · Válido até {formatDate(viewer.aso.validUntil)}</p></div><button className="modal-close" onClick={() => { URL.revokeObjectURL(viewer.url); setViewer(null); }}><XMarkIcon className="icon" /></button></div><iframe src={viewer.url} title="Visualização do ASO" style={{ width: '100%', height: 'calc(100% - 80px)', border: 'none' }} /></div></div>}
    </>
  );
}
