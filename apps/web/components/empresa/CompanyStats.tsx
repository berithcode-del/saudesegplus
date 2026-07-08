'use client';
import {
  PaperAirplaneIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const ICON_CONFIGS = [
  {
    label: 'ENVIADOS',
    key: 'sent',
    Icon: PaperAirplaneIcon,
    bg: 'rgba(59, 130, 246, 0.12)',
    color: '#3b82f6',
  },
  {
    label: 'ABERTOS',
    key: 'opened',
    Icon: EyeIcon,
    bg: 'rgba(245, 158, 11, 0.12)',
    color: '#f59e0b',
  },
  {
    label: 'EM ANDAMENTO',
    key: 'inProgress',
    Icon: ClockIcon,
    bg: 'rgba(14, 165, 233, 0.12)',
    color: '#0ea5e9',
  },
  {
    label: 'CONCLUÍDOS',
    key: 'completed',
    Icon: CheckCircleIcon,
    bg: 'rgba(34, 197, 94, 0.12)',
    color: '#22c55e',
  },
];

interface DashboardStats {
  total: number;
  sent: number;
  opened: number;
  inProgress: number;
  completed: number;
  expired: number;
}

interface CompanyStatsProps {
  stats: DashboardStats;
}

export default function CompanyStats({ stats }: CompanyStatsProps) {
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
            {stats[key as keyof DashboardStats] || 0}
          </div>
        </div>
      ))}
    </div>
  );
}
