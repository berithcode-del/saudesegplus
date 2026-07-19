'use client';

import { useEffect, useState } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  UserCircleIcon,
  BuildingOffice2Icon,
  BeakerIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  IdentificationIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { asoProtocoloApi } from '@/lib/api/aso-protocolo';
import type { ProtocoloASO, StatusProtocolo } from '@/lib/types/aso-protocolo';

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

const EVENT_TYPE_LABEL: Record<string, string> = {
  criacao: 'Protocolo Criado',
  status: 'Status Alterado',
  medico: 'Médico Alterado',
  documentos: 'Documentos Atualizados',
  admin_atualizacao: 'Atualização Administrativa',
  CADASTRO_CONCLUIDO: 'Cadastro do Colaborador Concluído',
  LINK_ENVIADO: 'Link de Convite Enviado',
};

const EVENT_COLOR: Record<string, string> = {
  criacao: '#4f46e5',
  status: '#f59e0b',
  medico: '#0891b2',
  documentos: '#10b981',
  admin_atualizacao: '#6366f1',
  CADASTRO_CONCLUIDO: '#22c55e',
  LINK_ENVIADO: '#3b82f6',
  default: '#8b5cf6',
};

interface ProntuarioPopupProps {
  /** Número do protocolo ASO (ex: "ASO-2026-0042") */
  numeroProtocolo: string;
  /** Se true, o popup fica visível */
  isOpen: boolean;
  /** Callback para fechar o popup */
  onClose: () => void;
}

export function ProntuarioPopup({ numeroProtocolo, isOpen, onClose }: ProntuarioPopupProps) {
  const [protocolo, setProtocolo] = useState<ProtocoloASO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadedNumero, setLoadedNumero] = useState('');

  useEffect(() => {
    if (!isOpen || !numeroProtocolo) return;

    // Evita recarregar se já estamos com o mesmo protocolo
    if (numeroProtocolo === loadedNumero && protocolo) return;

    setLoading(true);
    setError('');
    setLoadedNumero(numeroProtocolo);
    setProtocolo(null);

    const controller = new AbortController();

    asoProtocoloApi
      .getByNumero(numeroProtocolo)
      .then((data) => {
        if (!controller.signal.aborted) {
          setProtocolo(data);
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar prontuário');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [isOpen, numeroProtocolo, loadedNumero, protocolo]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  const formatDateShort = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getStatusInfo = (status: StatusProtocolo) =>
    STATUS_COLOR[status] || { bg: 'rgba(156, 163, 175, 0.12)', color: '#6b7280', text: status };

  const getEventLabel = (acao: string) => EVENT_TYPE_LABEL[acao] || acao;

  const getEventColor = (acao: string) => EVENT_COLOR[acao] || EVENT_COLOR.default;

  if (!isOpen) return null;

  const statusInfo = protocolo ? getStatusInfo(protocolo.status) : null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Prontuário ${numeroProtocolo}`}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '900px',
          width: '100%',
          maxHeight: '92vh',
          padding: '0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexShrink: 0,
            background: 'linear-gradient(135deg, #fafaff 0%, #f5f5ff 100%)',
          }}
        >
          <div>
            {protocolo ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2
                  style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    color: '#1e1b4b',
                    letterSpacing: '-0.3px',
                  }}
                >
                  {protocolo.numeroProtocolo}
                </h2>
                <span
                  style={{
                    background: statusInfo!.bg,
                    color: statusInfo!.color,
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {statusInfo!.text}
                </span>
              </div>
            ) : (
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e1b4b' }}>
                {numeroProtocolo}
              </h2>
            )}
            {protocolo && (
              <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '3px' }}>
                {TIPO_EXAME_LABEL[protocolo.tipoExame] || protocolo.tipoExame} · Aberto em {formatDateShort(protocolo.dataAbertura)}
                {protocolo.dataConclusao && ` · Concluído em ${formatDateShort(protocolo.dataConclusao)}`}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {protocolo && (
              <span
                style={{
                  background: 'rgba(79, 70, 229, 0.08)',
                  border: '1px solid rgba(79, 70, 229, 0.2)',
                  color: '#4f46e5',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                }}
              >
                PRONTUÁRIO
              </span>
            )}
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Fechar prontuário"
            >
              <XMarkIcon className="icon" />
            </button>
          </div>
        </div>

        {/* Modal Body — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{
                width: '40px', height: '40px', border: '3px solid #e5e7eb',
                borderTopColor: '#4f46e5', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
              }} />
              <p style={{ color: '#6b7280', fontSize: '14px' }}>Carregando prontuário...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <ExclamationTriangleIcon
                style={{ width: '44px', height: '44px', color: '#dc2626', margin: '0 auto 12px' }}
              />
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: '#1e1b4b' }}>
                Prontuário não encontrado
              </h3>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>{error}</p>
            </div>
          )}

          {/* Content */}
          {protocolo && (
            <div style={{ display: 'grid', gap: '18px' }}>

              {/* Identificação do Paciente */}
              <div style={{
                background: 'linear-gradient(135deg, #fafaff 0%, #f0f0ff 100%)',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                padding: '20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#4f46e5', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <UserCircleIcon className="icon" /> Identificação do Paciente
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Nome</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e1b4b' }}>{protocolo.paciente?.name || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>CPF</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', fontFamily: 'monospace' }}>
                      {protocolo.paciente?.cpf
                        ? protocolo.paciente.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Empresa</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>{protocolo.empresa?.nomeFantasia || protocolo.empresa?.razaoSocial || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Tipo</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>{TIPO_EXAME_LABEL[protocolo.tipoExame] || protocolo.tipoExame}</div>
                  </div>
                </div>
              </div>

              {/* Informações do Processo */}
              <div style={{ border: '1px solid var(--border-light)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#4f46e5', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <BeakerIcon className="icon" /> Informações do Processo
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Clínica</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{protocolo.clinica?.name || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Médico</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>
                      {protocolo.medico
                        ? `${protocolo.medico.name} (CRM ${protocolo.medico.crmNumber ?? ''}-${protocolo.medico.crmState ?? ''})`
                        : 'Não atribuído'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Abertura</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{formatDate(protocolo.dataAbertura)}</div>
                  </div>
                  {protocolo.dataConclusao && (
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Conclusão</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#16a34a' }}>{formatDateShort(protocolo.dataConclusao)}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Histórico do Prontuário */}
              <div style={{ border: '1px solid var(--border-light)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#4f46e5', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <CalendarDaysIcon className="icon" /> Histórico do Prontuário
                </div>
                {protocolo.historico && protocolo.historico.length > 0 ? (
                  <div style={{ position: 'relative' }}>
                    {/* Linha vertical */}
                    <div style={{
                      position: 'absolute',
                      left: '11px',
                      top: '8px',
                      bottom: '8px',
                      width: '2px',
                      background: 'linear-gradient(to bottom, #4f46e5, #e5e7eb)',
                      borderRadius: '1px',
                    }} />
                    {protocolo.historico.map((event, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          gap: '14px',
                          paddingBottom: idx < protocolo.historico.length - 1 ? '18px' : '0',
                          position: 'relative',
                        }}
                      >
                        {/* Círculo do evento */}
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: getEventColor(event.acao),
                          flexShrink: 0,
                          zIndex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 0 0 3px white, 0 0 0 5px ${getEventColor(event.acao)}30`,
                        }}>
                          <CheckCircleIcon style={{ width: '12px', height: '12px', color: 'white' }} />
                        </div>
                        <div style={{ flex: 1, paddingTop: '2px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e1b4b', marginBottom: '2px' }}>
                            {getEventLabel(event.acao)}
                          </div>
                          <div style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ClockIcon style={{ width: '10px', height: '10px' }} />
                            {new Date(event.timestamp).toLocaleString('pt-BR')}
                          </div>
                          {(event.de || event.para) && event.acao !== 'criacao' && (
                            <div style={{
                              marginTop: '6px',
                              padding: '6px 10px',
                              background: '#fafafa',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb',
                              fontSize: '11px',
                              fontFamily: 'monospace',
                            }}>
                              {event.de && <span style={{ color: '#ef4444' }}>De: {JSON.stringify(event.de)}</span>}
                              {event.de && event.para && <span style={{ margin: '0 4px', color: '#9ca3af' }}>→</span>}
                              {event.para && <span style={{ color: '#22c55e' }}>Para: {JSON.stringify(event.para)}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#9ca3af', textAlign: 'center', padding: '16px' }}>
                    Nenhum evento registrado no histórico
                  </p>
                )}
              </div>

              {/* Documentos */}
              <div style={{ border: '1px solid var(--border-light)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#4f46e5', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <ClipboardDocumentCheckIcon className="icon" /> Documentos Anexados
                </div>
                {protocolo.documentos && protocolo.documentos.length > 0 ? (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {protocolo.documentos.map((doc: { id?: string; tipo?: string; url?: string; data?: string; descricao?: string }, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          padding: '14px',
                          background: '#fafafa',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e1b4b', fontSize: '13px', marginBottom: '2px', textTransform: 'capitalize' }}>
                            {doc.tipo || `Documento ${idx + 1}`}
                          </div>
                          {doc.descricao && (
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{doc.descricao}</div>
                          )}
                          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>
                            Anexado em: {doc.data ? new Date(doc.data).toLocaleString('pt-BR') : '—'}
                          </div>
                        </div>
                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ fontSize: '11px', padding: '6px 12px', flexShrink: 0 }}
                          >
                            <DocumentTextIcon className="icon-sm" /> Ver
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '14px' }}>
                    Nenhum documento anexado
                  </div>
                )}
              </div>

              {/* Observações */}
              {protocolo.observacoes && (
                <div style={{ border: '1px solid var(--border-light)', borderRadius: '16px', padding: '20px', borderLeft: '4px solid #4f46e5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#4f46e5', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <InformationCircleIcon className="icon" /> Observações
                  </div>
                  <p style={{ whiteSpace: 'pre-wrap', color: '#374151', lineHeight: 1.7, fontSize: '14px' }}>
                    {protocolo.observacoes}
                  </p>
                </div>
              )}

              {/* Dados da Solicitação Vinculada */}
              {protocolo.examRequest && (
                <div style={{ border: '1px solid var(--border-light)', borderRadius: '16px', padding: '20px', borderLeft: '4px solid #4f46e5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#4f46e5', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <IdentificationIcon className="icon" /> Solicitação de Exame Vinculada
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', fontSize: '13px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Status</div>
                      <span className="badge" style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '11px' }}>
                        {protocolo.examRequest.status}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Origem</div>
                      <div style={{ fontWeight: 600 }}>{protocolo.examRequest.source || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Finalidade</div>
                      <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{protocolo.examRequest.examPurpose || '—'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}