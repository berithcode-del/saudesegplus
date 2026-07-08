'use client';
import { useState } from 'react';
import { AdjustmentsHorizontalIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Solicitacao {
  id: string;
  examPurpose: string;
  status: string;
  createdAt: string;
  patient: { name: string; cpf: string };
  clinic?: { name: string; city: string; state: string } | null;
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  AGUARDANDO_COLETA: { label: 'Aguardando Coleta', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  EM_COLETA: { label: 'Em Coleta', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  NA_FILA_MEDICA: { label: 'Na Fila Médica', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  EM_ATENDIMENTO_MEDICO: { label: 'Em Atendimento', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)' },
  CONCLUIDO: { label: 'Concluído', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' },
};

function getInitial(name: string) {
  return name ? name.charAt(0).toUpperCase() : '?';
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const AVATAR_COLORS = ['#0d9488', '#0ea5e9', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6'];

interface PatientQueueTableProps {
  solicitacoes?: Solicitacao[];
}

export default function PatientQueueTable({ solicitacoes = [] }: PatientQueueTableProps) {
  const [activeRow, setActiveRow] = useState<string | null>(null);

  const displayData = solicitacoes.slice(0, 10); // Limit visual render

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '20px',
        boxShadow: '0 4px 20px -2px rgba(149, 157, 165, 0.15)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px 16px',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1e1b4b' }}>Fila de Pacientes</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              background: '#fff',
              fontSize: '13px',
              color: '#6b7280',
              cursor: 'pointer',
            }}
          >
            <AdjustmentsHorizontalIcon style={{ width: 16, height: 16 }} />
            Filtrar
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
              {['Paciente', 'Exame', 'Chegada', 'Status', 'Ações'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#9ca3af',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {h}
                    {h && h !== 'Ações' && <ChevronUpDownIcon style={{ width: 12, height: 12, flexShrink: 0 }} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                  Nenhum paciente na fila.
                </td>
              </tr>
            ) : (
              displayData.map((sol, idx) => {
                const isActive = activeRow === sol.id;
                const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                const info = STATUS_LABEL[sol.status] ?? { label: sol.status, color: '#6b7280', bg: '#f3f4f6' };

                return (
                  <tr
                    key={sol.id}
                    onClick={() => setActiveRow(isActive ? null : sol.id)}
                    style={{
                      cursor: 'pointer',
                      background: isActive ? '#f8fafc' : 'transparent',
                      transition: 'background 0.18s ease',
                      borderBottom: isActive ? 'none' : '1px solid #F3F4F6',
                    }}
                  >
                    {/* Paciente */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: avatarColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '13px',
                            flexShrink: 0,
                          }}
                        >
                          {getInitial(sol.patient?.name)}
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, color: '#1e1b4b', fontSize: '13px', display: 'block' }}>
                            {sol.patient?.name || 'Sem Nome'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#6b7280', display: 'block' }}>
                            {sol.patient?.cpf || '---'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Exame */}
                    <td style={{ padding: '12px 16px', color: '#4b5563', fontSize: '13px', textTransform: 'capitalize' }}>
                      {sol.examPurpose}
                    </td>

                    {/* Data/Hora */}
                    <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '13px' }}>
                      <div>{formatTime(sol.createdAt)}</div>
                      <div style={{ fontSize: '11px' }}>{formatDate(sol.createdAt)}</div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          background: info.bg,
                          color: info.color,
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        {info.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px' }}>
                      {(sol.status === 'AGUARDANDO_COLETA' || sol.status === 'EM_COLETA') ? (
                        <Link
                          href={`/consultorio/exames/${sol.id}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            background: '#0d9488',
                            color: 'white',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          Registrar
                        </Link>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>Visualizar</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
