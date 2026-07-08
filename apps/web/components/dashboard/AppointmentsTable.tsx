'use client';
import { useState } from 'react';
import { AdjustmentsHorizontalIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { CheckIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

function StatusIcon({ status, active }: { status: string; active: boolean }) {
  if (active) return <CheckIcon style={{ width: 16, height: 16, color: 'white' }} />;
  if (status === 'CONCLUIDO') return <CheckIcon style={{ width: 14, height: 14, color: '#22c55e' }} />;
  if (status === 'EM_ATENDIMENTO_MEDICO') return <ClockIcon style={{ width: 14, height: 14, color: '#4f46e5' }} />;
  return <ExclamationCircleIcon style={{ width: 14, height: 14, color: '#f59e0b' }} />;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getInitial(name: string) {
  return name ? name.charAt(0).toUpperCase() : '?';
}

const AVATAR_COLORS = ['#4f46e5', '#0ea5e9', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6'];

interface AppointmentsTableProps {
  solicitacoes?: any[];
}

export default function AppointmentsTable({ solicitacoes = [] }: AppointmentsTableProps) {
  const [activeRow, setActiveRow] = useState<string | null>(null);

  // Limita para 8 na interface por enquanto para não quebrar layout
  const displayData = solicitacoes.slice(0, 8);

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
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1e1b4b' }}>Meus Agendamentos</h2>
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

      {/* Tabela */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
              {['Nome', 'Localização', 'Data', 'Horário', 'Status', ''].map((h) => (
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
                    {h && h !== '' && <ChevronUpDownIcon style={{ width: 12, height: 12, flexShrink: 0 }} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                  Nenhuma solicitação encontrada para o período.
                </td>
              </tr>
            ) : (
              displayData.map((sol, idx) => {
                const isActive = activeRow === sol.id;
                const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];

                return (
                  <tr
                    key={sol.id}
                    onClick={() => setActiveRow(isActive ? null : sol.id)}
                    style={{
                      cursor: 'pointer',
                      background: isActive ? '#4f46e5' : 'transparent',
                      transition: 'background 0.18s ease',
                      borderBottom: isActive ? 'none' : '1px solid #F3F4F6',
                    }}
                  >
                    {/* Nome */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: isActive ? 'rgba(255,255,255,0.25)' : avatarColor,
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
                        <span
                          style={{
                            fontWeight: 600,
                            color: isActive ? 'white' : '#1e1b4b',
                            fontSize: '13px',
                          }}
                        >
                          {sol.patient?.name || 'Sem Nome'}
                        </span>
                      </div>
                    </td>

                    {/* Localização */}
                    <td
                      style={{
                        padding: '12px 16px',
                        color: isActive ? 'rgba(255,255,255,0.85)' : '#6b7280',
                        fontSize: '13px',
                      }}
                    >
                      {sol.clinic?.city ?? '---'}
                    </td>

                    {/* Data */}
                    <td
                      style={{
                        padding: '12px 16px',
                        color: isActive ? 'rgba(255,255,255,0.85)' : '#6b7280',
                        fontSize: '13px',
                      }}
                    >
                      {formatDate(sol.createdAt)}
                    </td>

                    {/* Horário */}
                    <td
                      style={{
                        padding: '12px 16px',
                        color: isActive ? 'white' : '#1e1b4b',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '13px',
                      }}
                    >
                      {formatTime(sol.createdAt)}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: isActive
                            ? 'rgba(255,255,255,0.2)'
                            : sol.status === 'CONCLUIDO'
                            ? 'rgba(34, 197, 94, 0.12)'
                            : sol.status === 'EM_ATENDIMENTO_MEDICO'
                            ? 'rgba(79, 70, 229, 0.12)'
                            : 'rgba(245, 158, 11, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <StatusIcon status={sol.status} active={isActive} />
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px' }}>
                      <Link
                        href={`/medico/consulta/${sol.id}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontSize: '18px',
                          color: isActive ? 'rgba(255,255,255,0.7)' : '#9ca3af',
                          textDecoration: 'none',
                          letterSpacing: '2px',
                        }}
                      >
                        •••
                      </Link>
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
