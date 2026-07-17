'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { asoProtocoloApi } from '@/lib/api/aso-protocolo';
import type { ProtocoloASO, StatusProtocolo } from '@/lib/types/aso-protocolo';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

const statusColors: Record<StatusProtocolo, { bg: string; color: string }> = {
  AGUARDANDO_COLETA: { bg: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' },
  EM_COLETA: { bg: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' },
  NA_FILA_MEDICA: { bg: 'rgba(249, 115, 22, 0.12)', color: '#ea580c' },
  EM_ATENDIMENTO: { bg: 'rgba(6, 182, 212, 0.12)', color: '#0891b2' },
  DOCUMENTOS_PENDENTES: { bg: 'rgba(234, 179, 8, 0.12)', color: '#ca8a04' },
  CONCLUIDO: { bg: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' },
  CANCELADO: { bg: 'rgba(239, 68, 68, 0.12)', color: '#dc2626' },
};

const statusLabels: Record<StatusProtocolo, string> = {
  AGUARDANDO_COLETA: 'Aguardando Coleta',
  EM_COLETA: 'Em Coleta',
  NA_FILA_MEDICA: 'Na Fila Médica',
  EM_ATENDIMENTO: 'Em Atendimento',
  DOCUMENTOS_PENDENTES: 'Documentos Pendentes',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

export default function BuscaProtocoloPage() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [protocolo, setProtocolo] = useState<ProtocoloASO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ url: string; protocolo: ProtocoloASO } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setLoading(true);
    setError(null);
    setProtocolo(null);
    try {
      const result = await asoProtocoloApi.getByNumero(searchValue.trim());
      setProtocolo(result);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Protocolo não encontrado');
      setProtocolo(null);
    } finally {
      setLoading(false);
    }
  };

  const openPDF = async (aso: ProtocoloASO) => {
    if (!aso.pdfUrl) return;
    const response = await fetch(`${BACKEND_URL}${aso.pdfUrl}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    if (!response.ok) return;
    setViewer({ aso, url: URL.createObjectURL(await response.blob()) });
  };

  if (!protocolo) {
    return (
      <div className="page-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="page-header" style={{ marginBottom: '24px' }}>
          <h2>Buscar Protocolo ASO</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Digite o número do protocolo para visualizar todos os detalhes do processo</p>
        </div>

        <form onSubmit={handleSearch} className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              className="input"
              placeholder="Ex: ASO-2026-0001"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={{ flex: 1 }}
              autoFocus
            />
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MagnifyingGlassIcon className="icon" /> Buscar
            </button>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              {error}
            </div>
          )}
        </form>
      </div>
    );
  }

  const p = protocolo;
  const statusInfo = statusColors[p.status];

  return (
    <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2>Protocolo: {p.numeroProtocolo}</h2>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: 500,
              background: statusInfo.bg,
              color: statusInfo.color,
              marginTop: '8px',
            }}
          >
            {statusLabels[p.status]}
          </span>
        </div>
        <a href="/aso/protocolos">
          <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowPathIcon className="icon" /> Voltar à Lista
          </button>
        </a>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
        <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>Informações Principais</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div><strong>Empresa:</strong> {p.empresa?.nomeFantasia || p.empresa?.razaoSocial || p.empresa?.name || p.empresaId}</div>
          <div><strong>Clínica:</strong> {p.clinica?.name || p.clinicaId || '-'}</div>
          <div><strong>Paciente:</strong> {p.paciente?.name || p.pacienteId}</div>
          <div><strong>CPF:</strong> {p.paciente?.cpf || '-'}</div>
          <div><strong>Médico:</strong> {p.medico?.name || p.medicoId || 'Não atribuído'}</div>
          <div><strong>CRM:</strong> {p.medico ? `${p.medico.crmNumber}/${p.medico.crmState}` : '-'}</div>
          <div><strong>Tipo Exame:</strong> {p.tipoExame}</div>
          <div><strong>Data Abertura:</strong> {new Date(p.dataAbertura).toLocaleString('pt-BR')}</div>
          <div><strong>Data Conclusão:</strong> {p.dataConclusao ? new Date(p.dataConclusao).toLocaleString('pt-BR') : 'Pendente'}</div>
        </div>

        {p.observacoes && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <strong>Observações:</strong>
            <p style={{ whiteSpace: 'pre-wrap', margin: '8px 0 0' }}>{p.observacoes}</p>
          </div>
        )}
      </div>

      {p.documentos.length > 0 && (
        <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
          <h3 style={{ marginBottom: '16px' }}>Documentos Anexados</h3>
          <table className="queue-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Data</th>
                <th>Descrição</th>
                <th style={{ width: '100px' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {p.documentos.map((doc: any) => (
                <tr key={doc.id}>
                  <td>{doc.tipo}</td>
                  <td>{new Date(doc.data).toLocaleDateString('pt-BR')}</td>
                  <td>{doc.descricao || '-'}</td>
                  <td>
                    {doc.url && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => window.open(`${BACKEND_URL}${doc.url}`, '_blank')}
                        style={{ padding: '6px 10px', minHeight: 'unset' }}
                      >
                        <DocumentArrowDownIcon className="icon-sm" /> Visualizar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Histórico do Processo</h3>
        {p.historico.length > 0 ? (
          <table className="queue-table">
            <thead>
              <tr>
                <th>Ação</th>
                <th>De</th>
                <th>Para</th>
                <th>Usuário</th>
                <th>Data/Hora</th>
              </tr>
            </thead>
            <tbody>
              {p.historico.slice().reverse().map((h: any, idx: number) => (
                <tr key={idx}>
                  <td>{h.acao}</td>
                  <td>{h.de ? JSON.stringify(h.de) : '-'}</td>
                  <td>{h.para ? JSON.stringify(h.para) : '-'}</td>
                  <td>{h.userId}</td>
                  <td>{new Date(h.timestamp).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Sem histórico disponível</p>
        )}
      </div>

      {viewer && (
        <div
          className="modal-overlay"
          onClick={() => {
            URL.revokeObjectURL(viewer.url);
            setViewer(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            style={{
              width: 'min(1100px, 94vw)',
              height: '88vh',
              borderRadius: '16px',
              overflow: 'hidden',
              background: 'white',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3>Protocolo {viewer.protocolo.numeroProtocolo}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Paciente: {viewer.protocolo.paciente?.name || 'N/A'}</p>
              </div>
              <button className="modal-close" onClick={() => { URL.revokeObjectURL(viewer.url); setViewer(null); }}>
                <XMarkIcon className="icon" />
              </button>
            </div>
            <iframe src={viewer.url} title="Visualização do Protocolo" style={{ width: '100%', height: 'calc(100% - 80px)', border: 'none' }} />
          </div>
        </div>
      )}
    </div>
  );
}