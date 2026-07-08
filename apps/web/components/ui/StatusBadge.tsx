'use client';
import React from 'react';

/**
 * StatusBadge — fonte única de verdade para o status de uma Solicitação/ASO
 * em qualquer dashboard (empresa, médico, clínica).
 *
 * Usa as classes .badge / .badge-* já definidas em app/globals.css
 * (paleta de tokens UiMed). Nunca usar cores soltas — adicionar nova
 * variante aqui e em globals.css se surgir um status novo.
 */

export type SolicitacaoStatus =
  | 'AGUARDANDO_COLETA'
  | 'EM_COLETA'
  | 'NA_FILA_MEDICA'
  | 'EM_ATENDIMENTO_MEDICO'
  | 'CONCLUIDO'
  | 'CANCELADO';

const STATUS_CONFIG: Record<SolicitacaoStatus, { label: string; className: string }> = {
  AGUARDANDO_COLETA: { label: 'Aguardando Coleta', className: 'badge-waiting' },
  EM_COLETA: { label: 'Em Coleta', className: 'badge-info' },
  NA_FILA_MEDICA: { label: 'Na Fila Médica', className: 'badge-queued' },
  EM_ATENDIMENTO_MEDICO: { label: 'Em Atendimento', className: 'badge-in-progress' },
  CONCLUIDO: { label: 'Concluído', className: 'badge-done' },
  CANCELADO: { label: 'Cancelado', className: 'badge-cancelled' },
};

interface StatusBadgeProps {
  status: string;
  icon?: React.ReactNode;
}

export default function StatusBadge({ status, icon }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as SolicitacaoStatus] ?? {
    label: status,
    className: 'badge-waiting',
  };

  return (
    <span className={`badge ${config.className}`}>
      {icon}
      {config.label}
    </span>
  );
}
