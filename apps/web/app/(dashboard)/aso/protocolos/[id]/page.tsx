'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { asoProtocoloApi } from '@/lib/api/aso-protocolo';
import type { ProtocoloASO, UpdateProtocoloDto, StatusProtocolo } from '@/lib/types/aso-protocolo';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

// Simple toast replacement for antd message
const toast = {
  success: (msg: string) => alert(`✅ ${msg}`),
  error: (msg: string) => alert(`❌ ${msg}`),
};
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

const statusOptions = [
  { value: 'AGUARDANDO_COLETA', label: 'Aguardando Coleta' },
  { value: 'EM_COLETA', label: 'Em Coleta' },
  { value: 'NA_FILA_MEDICA', label: 'Na Fila Médica' },
  { value: 'EM_ATENDIMENTO', label: 'Em Atendimento' },
  { value: 'DOCUMENTOS_PENDENTES', label: 'Documentos Pendentes' },
  { value: 'CONCLUIDO', label: 'Concluído' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

export default function ProtocoloDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [protocolo, setProtocolo] = useState<ProtocoloASO | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpdateProtocoloDto>({
    status: 'AGUARDANDO_COLETA',
    medicoId: '',
    observacoes: '',
    documentos: [],
  });
  const [viewer, setViewer] = useState<{ url: string; protocolo: ProtocoloASO } | null>(null);

  useEffect(() => {
    if (id) fetchProtocolo();
  }, [id]);

  const fetchProtocolo = async () => {
    setLoading(true);
    try {
      const res = await asoProtocoloApi.getById(id);
      setProtocolo(res);
      setForm({
        status: res.status,
        medicoId: res.medicoId || '',
        observacoes: res.observacoes || '',
        documentos: res.documentos || [],
      });
    } catch (err) {
      toast.error('Erro ao carregar protocolo');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await asoProtocoloApi.update(id, form);
      setProtocolo(res);
      setEditing(false);
      toast.success('Protocolo atualizado com sucesso');
    } catch (err) {
      toast.error('Erro ao atualizar protocolo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja cancelar este protocolo?')) return;
    try {
      await asoProtocoloApi.delete(id);
      toast.success('Protocolo cancelado');
      router.push('/aso/protocolos');
    } catch (err) {
      toast.error('Erro ao cancelar protocolo');
    }
  };

  const openPDF = async (url: string) => {
    if (!url) return;
    const response = await fetch(`${BACKEND_URL}${url}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    if (!response.ok) return;
    setViewer({ url: URL.createObjectURL(await response.blob()), protocolo: protocolo! });
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>Carregando...</div>;
  if (!protocolo) return <div style={{ textAlign: 'center', padding: '40px' }}>Protocolo não encontrado</div>;

  const p = protocolo;
  const statusInfo = statusColors[p.status];

  return (
    <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>{p.numeroProtocolo}</h2>
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PencilIcon className="icon" /> Editar
          </button>
          <button className="btn btn-danger" onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrashIcon className="icon" /> Cancelar
          </button>
          <a href="/aso/protocolos">
            <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowPathIcon className="icon" /> Voltar
            </button>
          </a>
        </div>
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
                <th style={{ width: '120px' }}>Ação</th>
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
                        onClick={() => openPDF(doc.url)}
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

      {/* Modal Edição */}
      {editing && (
        <div
          className="modal-overlay"
          onClick={() => setEditing(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            style={{
              width: 'min(600px, 94vw)',
              borderRadius: '16px',
              overflow: 'hidden',
              background: 'white',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3>Editar Protocolo</h3>
              <button className="modal-close" onClick={() => setEditing(false)}>
                <XMarkIcon className="icon" />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="label">Status</label>
                  <select
                    className="select"
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as StatusProtocolo }))}
                    style={{ width: '100%' }}
                  >
                    {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="label">Médico Responsável (ID)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="ID do médico"
                    value={form.medicoId}
                    onChange={(e) => setForm((prev) => ({ ...prev, medicoId: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="label">Observações</label>
                  <textarea
                    className="input"
                    rows={4}
                    placeholder="Observações adicionais"
                    value={form.observacoes}
                    onChange={(e) => setForm((prev) => ({ ...prev, observacoes: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {saving ? (
                      <>
                        <CheckCircleIcon className="icon animate-spin" /> Salvando...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="icon" /> Salvar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualização PDF */}
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