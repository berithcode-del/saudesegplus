'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircleIcon,
  DocumentTextIcon,
  BuildingOffice2Icon,
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { apiAdminGetCompaniesPendingApproval, apiAdminApproveCompany } from '../../../lib/api';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

interface CompanyDocument {
  id: string;
  type: string;
  fileUrl: string;
  originalName: string;
  uploadedAt: string;
  validUntil?: string;
}

interface Company {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  status: string;
  pcmsoValidUntil?: string;
  ppraValidUntil?: string;
  documents: CompanyDocument[];
  admins: Array<{ user: { email: string } }>;
}

export default function AdminEmpresasPendentesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await apiAdminGetCompaniesPendingApproval();
      setCompanies(Array.isArray(r.data) ? r.data : []);
    } catch {
      setError('Erro ao carregar empresas pendentes');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleApprove = async (companyId: string, razaoSocial: string) => {
    if (!window.confirm(`Aprovar documentação de "${razaoSocial}"? A empresa será liberada para operação.`)) {
      return;
    }

    setApproving(companyId);
    setError('');
    setSuccess('');

    try {
      const result = await apiAdminApproveCompany(companyId, 'admin@saudeseg.com');

      if (!result.success) {
        throw new Error((result as any).message || 'Erro ao aprovar empresa');
      }

      setSuccess((result as any).message || 'Empresa aprovada com sucesso!');
      await fetchCompanies();
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Erro ao aprovar empresa');
    } finally {
      setApproving(null);
    }
  };

  const getDocumentStatus = (doc: CompanyDocument | undefined) => {
    if (!doc) return { status: 'missing', label: 'Não enviado', color: '#dc2626' };
    
    if (!doc.validUntil) return { status: 'valid', label: 'Válido', color: '#16a34a' };
    
    const daysUntil = Math.ceil((new Date(doc.validUntil).getTime() - Date.now()) / 86400000);
    
    if (daysUntil < 0) return { status: 'expired', label: 'Vencido', color: '#dc2626' };
    if (daysUntil < 30) return { status: 'expiring', label: `Vence em ${daysUntil} dias`, color: '#f59e0b' };
    
    return { status: 'valid', label: 'Válido', color: '#16a34a' };
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getDocumentUrl = (fileUrl: string) =>
    fileUrl.startsWith('http') ? fileUrl : `${BACKEND_URL}${fileUrl}`;

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="btn btn-ghost" 
            style={{ padding: '8px' }} 
            onClick={() => router.push('/admin/empresas')}
          >
            <ArrowLeftIcon style={{ width: 20, height: 20 }} />
          </button>
          <DocumentTextIcon style={{ width: 28, height: 28, color: '#4f46e5' }} />
          <div>
            <h2 style={{ margin: 0 }}>Aprovação de Documentação</h2>
            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>
              Empresas aguardando aprovação de PCMSO e PPRA
            </p>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={fetchCompanies}>
          <ArrowPathIcon className="icon icon-sm" /> Atualizar
        </button>
      </div>

      {error && (
        <div className="card" style={{ 
          marginBottom: '20px', 
          border: '1px solid rgba(220, 38, 38, 0.3)', 
          background: 'rgba(220, 38, 38, 0.06)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontSize: '13px', fontWeight: 600 }}>
            <XMarkIcon style={{ width: 16, height: 16 }} />
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="card" style={{ 
          marginBottom: '20px', 
          border: '1px solid rgba(22, 163, 74, 0.3)', 
          background: 'rgba(22, 163, 74, 0.06)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontSize: '13px', fontWeight: 600 }}>
            <CheckCircleIcon style={{ width: 16, height: 16 }} />
            {success}
          </div>
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          Carregando empresas pendentes...
        </div>
      ) : companies.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <CheckCircleIcon style={{ width: 48, height: 48, color: '#16a34a', marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px', color: '#1e1b4b' }}>Tudo em dia!</h3>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            Não há empresas aguardando aprovação de documentação.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {companies.map((company) => {
            const pcmsoDoc = company.documents.find(d => d.type === 'PCMSO');
            const ppraDoc = company.documents.find(d => d.type === 'PPRA');
            const pcmsoStatus = getDocumentStatus(pcmsoDoc);
            const ppraStatus = getDocumentStatus(ppraDoc);
            const canApprove = pcmsoStatus.status === 'valid' && ppraStatus.status === 'valid';

            return (
              <div 
                key={company.id} 
                className="card"
                style={{ 
                  border: canApprove ? '1px solid rgba(22, 163, 74, 0.2)' : '1px solid #e5e7eb',
                  background: canApprove ? 'rgba(22, 163, 74, 0.02)' : '#ffffff'
                }}
              >
                {/* Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '20px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      padding: '10px', 
                      borderRadius: '12px', 
                      background: 'rgba(79, 70, 229, 0.12)' 
                    }}>
                      <BuildingOffice2Icon style={{ width: 24, height: 24, color: '#4f46e5' }} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e1b4b' }}>
                        {company.razaoSocial || company.nomeFantasia || 'Empresa'}
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                        CNPJ: {company.cnpj}
                      </p>
                    </div>
                  </div>
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    fontSize: '12px', 
                    fontWeight: 600,
                    background: '#f59e0b18',
                    color: '#f59e0b'
                  }}>
                    {company.status === 'EM_ANALISE' ? 'Em análise' : company.status}
                  </span>
                </div>

                {/* Documents Grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '16px', 
                  marginBottom: '20px' 
                }}>
                  {/* PCMSO */}
                  <div style={{ 
                    padding: '16px', 
                    borderRadius: '12px', 
                    background: pcmsoStatus.status === 'valid' ? 'rgba(22, 163, 74, 0.04)' : 
                               pcmsoStatus.status === 'expiring' ? 'rgba(245, 158, 11, 0.04)' : 
                               'rgba(220, 38, 38, 0.04)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DocumentTextIcon style={{ width: 18, height: 18, color: pcmsoStatus.color }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e1b4b' }}>PCMSO</span>
                      </div>
                      <span style={{ 
                        padding: '3px 10px', 
                        borderRadius: '20px', 
                        fontSize: '11px', 
                        fontWeight: 600,
                        background: `${pcmsoStatus.color}18`,
                        color: pcmsoStatus.color
                      }}>
                        {pcmsoStatus.label}
                      </span>
                    </div>
                    {pcmsoDoc ? (
                      <>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          {pcmsoDoc.originalName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          Upload: {formatDate(pcmsoDoc.uploadedAt)}
                          <br />
                          <a
                            href={getDocumentUrl(pcmsoDoc.fileUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 10px',
                              fontSize: '12px',
                              textDecoration: 'none',
                              border: '1px solid #e5e7eb',
                              background: '#ffffff',
                              marginTop: '12px',
                            }}
                          >
                            <ArrowTopRightOnSquareIcon className="icon icon-sm" />
                            Abrir documento
                          </a>
                          {pcmsoDoc.validUntil && (
                            <span> · Válido até: {formatDate(pcmsoDoc.validUntil)}</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#dc2626' }}>
                        Documento não enviado
                      </div>
                    )}
                  </div>

                  {/* PPRA */}
                  <div style={{ 
                    padding: '16px', 
                    borderRadius: '12px', 
                    background: ppraStatus.status === 'valid' ? 'rgba(22, 163, 74, 0.04)' : 
                               ppraStatus.status === 'expiring' ? 'rgba(245, 158, 11, 0.04)' : 
                               'rgba(220, 38, 38, 0.04)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DocumentTextIcon style={{ width: 18, height: 18, color: ppraStatus.color }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e1b4b' }}>PPRA / PGR</span>
                      </div>
                      <span style={{ 
                        padding: '3px 10px', 
                        borderRadius: '20px', 
                        fontSize: '11px', 
                        fontWeight: 600,
                        background: `${ppraStatus.color}18`,
                        color: ppraStatus.color
                      }}>
                        {ppraStatus.label}
                      </span>
                    </div>
                    {ppraDoc ? (
                      <>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          {ppraDoc.originalName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          Upload: {formatDate(ppraDoc.uploadedAt)}
                          <br />
                          <a
                            href={getDocumentUrl(ppraDoc.fileUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 10px',
                              fontSize: '12px',
                              textDecoration: 'none',
                              border: '1px solid #e5e7eb',
                              background: '#ffffff',
                              marginTop: '12px',
                            }}
                          >
                            <ArrowTopRightOnSquareIcon className="icon icon-sm" />
                            Abrir documento
                          </a>
                          {ppraDoc.validUntil && (
                            <span> · Válido até: {formatDate(ppraDoc.validUntil)}</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#dc2626' }}>
                        Documento não enviado
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div style={{ 
                  padding: '12px', 
                  borderRadius: '8px', 
                  background: '#f9fafb',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6b7280' }}>
                    <UserCircleIcon style={{ width: 16, height: 16 }} />
                    <span style={{ fontWeight: 600 }}>Administradores:</span>
                    <span>
                      {company.admins.map((a, i) => a.user.email).join(', ')}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  {canApprove ? (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleApprove(company.id, company.razaoSocial || company.nomeFantasia || '')}
                      disabled={approving === company.id}
                      style={{
                        background: '#16a34a',
                        cursor: approving === company.id ? 'not-allowed' : 'pointer',
                        opacity: approving === company.id ? 0.7 : 1,
                      }}
                    >
                      {approving === company.id ? (
                        <>
                          <ArrowPathIcon className="icon icon-sm" style={{ animation: 'spin 1s linear infinite' }} />
                          Aprovando...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="icon icon-sm" />
                          Aprovar e Liberar Empresa
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      className="btn"
                      disabled
                      style={{
                        background: '#e5e7eb',
                        color: '#9ca3af',
                        cursor: 'not-allowed',
                      }}
                    >
                      <XMarkIcon className="icon icon-sm" />
                      Documentação Incompleta
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
