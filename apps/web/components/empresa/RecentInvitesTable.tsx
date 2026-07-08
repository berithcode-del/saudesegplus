'use client';
import { useState } from 'react';
import { AdjustmentsHorizontalIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { CheckIcon, ClockIcon, PaperAirplaneIcon, EyeIcon, XCircleIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

function StatusBadge({ status }: { status: string }) {
  if (status === 'CONCLUIDO') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(34,197,94,0.12)', color: '#22c55e', fontSize: '11px', fontWeight: 600 }}>
        <CheckIcon style={{ width: 12, height: 12 }} /> Concluído
      </div>
    );
  }
  if (status === 'ABERTO') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontSize: '11px', fontWeight: 600 }}>
        <EyeIcon style={{ width: 12, height: 12 }} /> Aberto
      </div>
    );
  }
  if (status === 'ENVIADO') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(59,130,246,0.12)', color: '#3b82f6', fontSize: '11px', fontWeight: 600 }}>
        <PaperAirplaneIcon style={{ width: 12, height: 12 }} /> Enviado
      </div>
    );
  }
  if (status === 'EXPIRADO') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontSize: '11px', fontWeight: 600 }}>
        <XCircleIcon style={{ width: 12, height: 12 }} /> Expirado
      </div>
    );
  }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(14,165,233,0.12)', color: '#0ea5e9', fontSize: '11px', fontWeight: 600 }}>
      <ClockIcon style={{ width: 12, height: 12 }} /> Andamento
    </div>
  );
}

function getExamTypeLabel(type: string) {
  const map: Record<string, string> = {
    admissional: 'Admissional',
    periodico: 'Periódico',
    demissional: 'Demissional',
    mudanca_funcao: 'Mudança de Função',
    retorno: 'Retorno ao Trabalho',
  };
  return map[type] ?? type;
}

function getDaysUntilExpiry(expiresAt: string) {
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
  if (days < 0) return 'Expirado';
  if (days === 0) return 'Expira hoje';
  return `${days} dias restantes`;
}

function getInitial(emailOrCpf: string) {
  if (!emailOrCpf) return '?';
  if (emailOrCpf.includes('@')) return emailOrCpf.charAt(0).toUpperCase();
  return emailOrCpf.charAt(0);
}

const AVATAR_COLORS = ['#3b82f6', '#0ea5e9', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6'];

interface Invite {
  id: string;
  status: string;
  examType: string;
  createdAt: string;
  expiresAt: string;
  expectedCpf?: string;
  expectedEmail?: string;
  timelineEvents: { eventType: string; occurredAt: string }[];
}

interface RecentInvitesTableProps {
  invites?: Invite[];
}

export default function RecentInvitesTable({ invites = [] }: RecentInvitesTableProps) {
  const [activeRow, setActiveRow] = useState<string | null>(null);

  const displayData = invites.slice(0, 8);

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
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1e1b4b' }}>Convites Recentes</h2>
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
              {['Colaborador', 'Tipo de Exame', 'Status', 'Validade', 'Ações'].map((h) => (
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
                  Nenhum convite encontrado.
                </td>
              </tr>
            ) : (
              displayData.map((invite, idx) => {
                const isActive = activeRow === invite.id;
                const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                const identifier = invite.expectedEmail || invite.expectedCpf || 'Sem ID';

                return (
                  <tr
                    key={invite.id}
                    onClick={() => setActiveRow(isActive ? null : invite.id)}
                    style={{
                      cursor: 'pointer',
                      background: isActive ? '#f8fafc' : 'transparent',
                      transition: 'background 0.18s ease',
                      borderBottom: isActive ? 'none' : '1px solid #F3F4F6',
                    }}
                  >
                    {/* Colaborador */}
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
                          {getInitial(identifier)}
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, color: '#1e1b4b', fontSize: '13px', display: 'block' }}>
                            {invite.expectedEmail || 'Sem Email'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#6b7280', display: 'block' }}>
                            {invite.expectedCpf || 'Sem CPF'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Tipo */}
                    <td style={{ padding: '12px 16px', color: '#4b5563', fontSize: '13px' }}>
                      {getExamTypeLabel(invite.examType)}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={invite.status} />
                    </td>

                    {/* Validade */}
                    <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '13px' }}>
                      {getDaysUntilExpiry(invite.expiresAt)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px' }}>
                      <Link
                        href={`/empresa/solicitacoes`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontSize: '13px',
                          color: '#3b82f6',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        Ver Detalhes
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
