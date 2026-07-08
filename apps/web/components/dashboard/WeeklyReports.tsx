'use client';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline';

const ICON_CONFIGS = [
  {
    label: 'TOTAL SOLICITAÇÕES',
    key: 'total',
    Icon: ClipboardDocumentListIcon,
    bg: 'rgba(79, 70, 229, 0.12)',
    color: '#4f46e5',
  },
  {
    label: 'EM ATENDIMENTO',
    key: 'emAtendimento',
    Icon: ClockIcon,
    bg: 'rgba(245, 158, 11, 0.12)',
    color: '#f59e0b',
  },
  {
    label: 'CONCLUÍDOS',
    key: 'concluidos',
    Icon: CheckCircleIcon,
    bg: 'rgba(34, 197, 94, 0.12)',
    color: '#22c55e',
  },
  {
    label: 'NA FILA',
    key: 'naFila',
    Icon: QueueListIcon,
    bg: 'rgba(14, 165, 233, 0.12)',
    color: '#0ea5e9',
  },
];

interface WeeklyReportsProps {
  solicitacoes?: any[];
}

export default function WeeklyReports({ solicitacoes = [] }: WeeklyReportsProps) {
  const values = {
    total: solicitacoes.length,
    emAtendimento: solicitacoes.filter((s) => s.status === 'EM_ATENDIMENTO_MEDICO').length,
    concluidos: solicitacoes.filter((s) => s.status === 'CONCLUIDO').length,
    naFila: solicitacoes.filter((s) => s.status === 'NA_FILA_MEDICA' || s.queueStatus === 'WAITING').length,
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
