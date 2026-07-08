'use client';
import {
  UserGroupIcon,
  QueueListIcon,
  ClockIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

interface Solicitacao {
  status: string;
}

interface ClinicStatsProps {
  solicitacoes?: Solicitacao[];
}

const ICON_CONFIGS = [
  {
    label: 'AGUARDANDO COLETA',
    key: 'aguardando',
    Icon: UserGroupIcon,
    bg: 'rgba(245, 158, 11, 0.12)',
    color: '#f59e0b',
  },
  {
    label: 'NA FILA MÉDICA',
    key: 'naFila',
    Icon: QueueListIcon,
    bg: 'rgba(139, 92, 246, 0.12)',
    color: '#8b5cf6',
  },
  {
    label: 'EM ATENDIMENTO',
    key: 'emAtendimento',
    Icon: ClockIcon,
    bg: 'rgba(59, 130, 246, 0.12)',
    color: '#3b82f6',
  },
  {
    label: 'CONCLUÍDOS',
    key: 'concluidos',
    Icon: CheckBadgeIcon,
    bg: 'rgba(34, 197, 94, 0.12)',
    color: '#22c55e',
  },
];

export default function ClinicStats({ solicitacoes = [] }: ClinicStatsProps) {
  const values = {
    aguardando: solicitacoes.filter((s) => s.status === 'AGUARDANDO_COLETA').length,
    naFila: solicitacoes.filter((s) => s.status === 'NA_FILA_MEDICA').length,
    emAtendimento: solicitacoes.filter((s) => s.status === 'EM_ATENDIMENTO_MEDICO' || s.status === 'EM_COLETA').length,
    concluidos: solicitacoes.filter((s) => s.status === 'CONCLUIDO').length,
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
      }}
    >
      {ICON_CONFIGS.map(({ label, key, Icon, bg, color }) => (
        <div
          key={key}
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 4px 20px -2px rgba(149, 157, 165, 0.15)',
            transition: 'all 0.2s ease',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}
          >
            <Icon style={{ width: '22px', height: '22px', color }} />
          </div>

          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '4px',
            }}
          >
            {label}
          </div>

          <div
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: '#1e1b4b',
              lineHeight: 1,
            }}
          >
            {values[key as keyof typeof values]}
          </div>
        </div>
      ))}
    </div>
  );
}
