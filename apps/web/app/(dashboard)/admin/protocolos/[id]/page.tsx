'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  UserCircleIcon,
  BuildingOffice2Icon,
  BeakerIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { asoProtocoloApi } from '@/lib/api/aso-protocolo';
import type { ProtocoloASO, StatusProtocolo, UpdateProtocoloDto } from '@/lib/types/aso-protocolo';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

const STATUS_COLOR: Record<StatusProtocolo, { bg: string; color: string; text: string }> = {
  AGUARDANDO_COLETA: { bg: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', text: 'Aguardando Coleta' },
  EM_COLETA: { bg: 'rgba(168, 85, 247, 0.12)', color: '#a855f7', text: 'Em Coleta' },
  NA_FILA_MEDICA: { bg: 'rgba(249, 115, 22, 0.12)', color: '#ea580c', text: 'Na Fila Médica' },
  EM_ATENDIMENTO: { bg: 'rgba(6, 182, 212, 0.12)', color: '#0891b2', text: 'Em Atendimento' },
  DOCUMENTOS_PENDENTES: { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706', text: 'Documentos Pendentes' },
  CONCLUIDO: { bg: 'rgba(34, 197, 94, 0.12)', color: '#16a34a', text: 'Concluído' },
  CANCELADO: { bg: 'rgba(156, 163, 175, 0.12)', color: '#6b7280', text: 'Cancelado' },
};

const TIPO_EXAME_LABEL: Record<string, string> = {
  ADMISSIONAL: 'Admissional',
  PERIODICO: 'Periódico',
  DEMISSIONAL: 'Demissional',
  MUDANCA_FUNCAO: 'Mudança de Função',
  RETORNO_TRABALHO: 'Retorno ao Trabalho',
};

export default function AdminProtocoloDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [protocolo, setProtocolo] = useState<ProtocoloASO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'delete' | 'forceStatus' | 'edit'>('delete');
  const [editForm, setEditForm] = useState<Partial<UpdateProtocoloDto> & { numeroProtocolo?: string }>({});

  const id = params.id as string;

  const loadProtocolo = async () => {
    setLoading(true);
    try {
      const data = await asoProtocoloApi.getById(id);
      setProtocolo(data);
      setEditForm({
        numeroProtocolo: data.numeroProtocolo,
        status: data.status,
        medicoId: data.medicoId,
        observacoes: data.observacoes,
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar protocolo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProtocolo();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const { numeroProtocolo, ...updateDto } = editForm;
      await asoProtocoloApi.adminUpdate(id, { ...updateDto, numeroProtocolo });
      await loadProtocelo();
      alert('Protocolo atualizado com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar');
    } finally {
      setSaving(false);
      setShowModal(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await asoProtocoloApi.adminDelete(id, '');
      alert('Protocolo excluído permanentemente');
      router.push('/admin/protocolos');
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir');
    } finally {
      setDeleting(false);
      setShowModal(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getStatusInfo = (status: StatusProtocolo) => {
    return STATUS_COLOR[status] || { bg: 'rgba(156, 163, 175, 0.12)', color: '#6b7280', text: status };
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Carregando...</div>;
  }

  if (error && !protocolo) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <ExclamationTriangleIcon className="icon" style={{ width: '48px', height: '48px', color: '#dc2626', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Erro ao carregar</h3>
        <p style={{ color: '#6b7280' }}>{error}</p>
        <button className="btn btn-primary" onClick={() => router.push('/admin/protocolos')} style={{ marginTop: '16px' }}>
          Voltar à Lista
        </button>
      </div>
    );
  }

  const p = protocolo!;
  const statusInfo = getStatusInfo(p.status);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button className="btn btn-ghost" onClick={() => router.back()}>
          <ArrowLeftIcon className="icon" /> Voltar
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e1b4b' }}>{p.numeroProtocolo}</h1>
            <span style={{
              background: statusInfo.bg,
              color: statusInfo.color,
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'capitalize',
            }}>
              {statusInfo.text}
            </span>
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            {TIPO_EXAME_LABEL[p.tipoExame] || p.tipoExame} · Aberto em {formatDateShort(p.dataAbertura)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => { setEditForm({ ...p }); setModalType('edit'); setShowModal(true); }}>
            <PencilIcon className="icon" /> Editar
          </button>
          <button className="btn btn-outline" style={{ color: '#dc2626', borderColor: '#fca5a5' }} onClick={() => { setModalType('delete'); setShowModal(true); }}>
            <TrashIcon className="icon" /> Excluir
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
        {/* Main Content */}
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Key Info */}
          <div className="card" style={{ background: 'linear-gradient(135deg, #fafaff 0%, #f3f4f6 100%)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                  <UserCircleIcon className="icon" /> Paciente
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>{p.paciente?.name || '—'}</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>{p.paciente?.cpf || '—'}</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                  <BuildingOffice2Icon className="icon" /> Empresa
                </div>
                <div style={{ fontWeight: 600 }}>{p.empresa?.nomeFantasia || p.empresa?.razaoSocial || '—'}</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                  <BeakerIcon className="icon" /> Clínica
                </div>
                <div style={{ fontWeight: 600 }}>{p.clinica?.name || '—'}</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                  <UserCircleIcon className="icon" /> Médico
                </div>
                <div style={{ fontWeight: 600 }}>
                  {p.medico ? `${p.medico.name} (${p.medico.crmNumber || ''} ${p.medico.crmState || ''})` : 'Não atribuído'}
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                  <ClipboardDocumentCheckIcon className="icon" /> Tipo Exame
                </div>
                <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{TIPO_EXAME_LABEL[p.tipoExame] || p.tipoExame}</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                  <CalendarDaysIcon className="icon" /> Datas
                </div>
                <div style={{ fontSize: '13px', display: 'grid', gap: '2px' }}>
                  <div>Abertura: <strong>{formatDate(p.dataAbertura)}</strong></div>
                  <div>Conclusão: <strong>{formatDateShort(p.dataConclusao)}</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#4f46e5', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
              <ClipboardDocumentCheckIcon className="icon" /> Documentos Anexados
            </div>
            {p.documentos && p.documentos.length > 0 ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                {p.documentos.map((doc: any, idx: number) => (
                  <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', background: '#fafafa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{doc.tipo || `Documento ${idx + 1}`}</span>
                      {doc.fileUrl && (
                        <a href={`${BACKEND_URL}${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                          <DocumentTextIcon className="icon-sm" /> Visualizar
                        </a>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Anexado em: {doc.anexadoEm ? new Date(doc.anexadoEm).toLocaleString('pt-BR') : '—'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
                Nenhum documento anexado
              </div>
            )}
          </div>

          {/* History */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#4f46e5', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
              <InformationCircleIcon className="icon" /> Histórico do Protocolo
            </div>
            {p.historico && p.historico.length > 0 ? (
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '8px', top: '4px', bottom: '4px', width: '2px', background: '#e5e7eb' }} />
                {p.historico.map((event: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', gap: '14px', paddingBottom: '16px', position: 'relative' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#4f46e5', flexShrink: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircleIcon style={{ width: '10px', height: '10px', color: 'white' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e1b4b', marginBottom: '2px' }}>
                        {event.acao === 'criacao' ? 'Protocolo Criado' :
                         event.acao === 'status' ? `Status Alterado: ${event.de} → ${event.para}` :
                         event.acao === 'medico' ? `Médico Alterado` :
                         event.acao === 'documentos' ? `Documentos Atualizados` :
                         event.acao === 'admin_atualizacao' ? 'Atualização Administrativa' : event.acao}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {new Date(event.timestamp).toLocaleString('pt-BR')} · Por: {event.userId}
                      </div>
                      {(event.de || event.para) && event.acao !== 'criacao' && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', fontFamily: 'monospace' }}>
                          De: {JSON.stringify(event.de)} → Para: {JSON.stringify(event.para)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>Sem histórico registrado</p>
            )}
          </div>

          {/* Observations */}
          {p.observacoes && (
            <div className="card" style={{ borderLeft: '4px solid #4f46e5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#4f46e5', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
                <InformationCircleIcon className="icon" /> Observações
              </div>
              <p style={{ whiteSpace: 'pre-wrap', color: '#374151' }}>{p.observacoes}</p>
            </div>
          )}
        </div>

        {/* Sidebar - Quick Actions */}
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#4f46e5', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
              <BeakerIcon className="icon" /> Ações Rápidas
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <button
                className="btn btn-primary"
                style={{ justifyContent: 'flex-start', gap: '10px' }}
                onClick={() => { setEditForm({ ...p }); setModalType('edit'); setShowModal(true); }}
              >
                <PencilIcon className="icon" /> Editar Protocolo
              </button>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', gap: '10px' }}
                onClick={() => router.push(`/aso/protocolos/busca?q=${p.numeroProtocolo}`)}
              >
                <DocumentTextIcon className="icon" /> Buscar Público
              </button>
              <button
                className="btn btn-ghost"
                style={{ justifyContent: 'flex-start', gap: '10px', color: '#dc2626', borderColor: '#fca5a5' }}
                onClick={() => { setModalType('delete'); setShowModal(true); }}
              >
                <TrashIcon className="icon" /> Excluir Permanentemente
              </button>
            </div>
          </div>

          {/* Related Exam Request */}
          {p.examRequest && (
            <div className="card" style={{ borderLeft: '4px solid #4f46e5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#4f46e5', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
                <InformationCircleIcon className="icon" /> Solicitação de Exame Vinculada
              </div>
              <div style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
                <div><strong>ID:</strong> {p.examRequest.id}</div>
                <div><strong>Status:</strong> <span className="badge" style={{ background: '#dbeafe', color: '#1d4ed8' }}>{p.examRequest.status}</span></div>
                <div><strong>Finalidade:</strong> {p.examRequest.examPurpose}</div>
                <div><strong>Origem:</strong> {p.examRequest.source}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showModal && modalType === 'edit' && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Editar Protocolo</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>
            <div style={{ padding: '24px', display: 'grid', gap: '16px' }}>
              <div className="form-group">
                <label>Nº Protocolo</label>
                <input className="form-input" value={editForm.numeroProtocolo || ''} onChange={e => setEditForm(prev => ({ ...prev, numeroProtocolo: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="form-input" value={editForm.status || ''} onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}>
                  <option value="AGUARDANDO_COLETA">Aguardando Coleta</option>
                  <option value="EM_COLETA">Em Coleta</option>
                  <option value="NA_FILA_MEDICA">Na Fila Médica</option>
                  <option value="EM_ATENDIMENTO">Em Atendimento</option>
                  <option value="DOCUMENTOS_PENDENTES">Documentos Pendentes</option>
                  <option value="CONCLUIDO">Concluído</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>
              <div className="form-group">
                <label>Médico ID (opcional)</label>
                <input className="form-input" value={editForm.medicoId || ''} onChange={e => setEditForm(prev => ({ ...prev, medicoId: e.target.value }))} placeholder="ID do médico" />
              </div>
              <div className="form-group">
                <label>Observações</label>
                <textarea className="form-input" rows={3} value={editForm.observacoes || ''} onChange={e => setEditForm(prev => ({ ...prev, observacoes: e.target.value }))} placeholder="Observações administrativas..." />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && modalType === 'delete' && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '480px' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#dc2626' }}>Excluir Protocolo Permanentemente</h3>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                Tem certeza que deseja excluir o protocolo <strong>{p.numeroProtocolo}</strong>?
              </p>
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: '#b91c1c' }}>
                <strong>⚠️ Ação Irreversível:</strong> Isso removerá permanentemente o protocolo e a solicitação de exame vinculada (se houver). Não há como desfazer.
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn" style={{ background: '#dc2626', color: 'white' }} onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Excluindo...' : 'Confirmar Exclusão'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}