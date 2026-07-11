import { useState, useEffect, useCallback } from 'react';
import { useApiClient } from '../../app/providers/ApiProvider';
import { GreetingCard } from '../../components/GreetingCard';
import { StatCard } from '../../components/StatCard';
import { QuickActions } from '../../components/QuickActions';
import { MobileBottomNav } from '../../components/MobileBottomNav';
import { MobilePage, MobileLoading } from '../../components/MobilePage';
import { AdminAgenda } from './AdminAgenda';

interface AdminStats {
  totalCompanies: number;
  totalPatients: number;
  totalSolicitacoes: number;
  totalAsoEmitidos: number;
  financial?: {
    receita: number;
    pendente: number;
    lucro: number;
  };
}

interface CalendarEvent {
  id: string;
  title?: string;
  type?: string;
  date?: string;
}

interface CalendarEventsResponse {
  data?: CalendarEvent[];
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const adminNavItems = [
  { to: '/admin', label: 'Painel', icon: 'chart' as const, end: true },
  { to: '/admin/empresas', label: 'Empresas', icon: 'building' as const },
  { to: '/admin/clinicas', label: 'Clinicas', icon: 'store' as const },
  { to: '/admin/medicos', label: 'Medicos', icon: 'users' as const },
  { to: '/admin/suporte', label: 'Suporte', icon: 'chat' as const },
  { to: '/admin/financeiro', label: 'Financas', icon: 'dollar' as const },
];

export function AdminDashboard() {
  const apiClient = useApiClient();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, eventsRes] = await Promise.all([
        apiClient.fetch('/api/admin/stats') as Promise<AdminStats | { data?: AdminStats } | null>,
        apiClient.fetch('/api/calendar?ownerType=admin&ownerId=admin') as Promise<CalendarEventsResponse | CalendarEvent[] | null>,
      ]);

      if (statsRes && typeof statsRes === 'object' && 'data' in statsRes) {
        setStats(statsRes.data ?? null);
      } else if (statsRes) {
        setStats(statsRes as AdminStats);
      }
      if (eventsRes) {
        const items = Array.isArray(eventsRes) ? eventsRes : eventsRes.data || [];
        setEvents(Array.isArray(items) ? items : []);
      }
    } catch (err) {
      console.error('[AdminDashboard] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <MobileLoading label="Carregando painel..." />;
  }

  return (
    <>
    <MobilePage>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, overflow: 'visible' }}>
      <GreetingCard
        role="Administrador"
        subtitle="Confira as metricas globais e o desempenho financeiro da plataforma."
        illustration="/illustrations/adm.png"
        illustrationAlt="SaudeSeg+ Admin"
        gradient="linear-gradient(130deg, #ede9fe 0%, #e0e7ff 60%, #dbeafe 100%)"
        accentColor="#8b5cf6"
        dropShadow="0 8px 24px rgba(139, 92, 246, 0.15)"
      />

      <section aria-labelledby="admin-operational-metrics">
      <h2 id="admin-operational-metrics" style={{ marginBottom: 16, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Metricas Operacionais</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
        }}
      >
        <StatCard
          label="Empresas Ativas"
          value={stats?.totalCompanies ?? 0}
          color="#3b82f6"
          bgColor="rgba(59, 130, 246, 0.12)"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18" />
              <path d="M9 8h1" />
              <path d="M9 12h1" />
              <path d="M9 16h1" />
              <path d="M14 8h1" />
              <path d="M14 12h1" />
              <path d="M14 16h1" />
              <path d="M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16" />
            </svg>
          }
        />
        <StatCard
          label="Pacientes"
          value={stats?.totalPatients ?? 0}
          color="#8b5cf6"
          bgColor="rgba(139, 92, 246, 0.12)"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          }
        />
        <StatCard
          label="Consultas"
          value={stats?.totalSolicitacoes ?? 0}
          color="#f59e0b"
          bgColor="rgba(245, 158, 11, 0.12)"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
        />
        <StatCard
          label="ASOs Emitidos"
          value={stats?.totalAsoEmitidos ?? 0}
          color="#22c55e"
          bgColor="rgba(34, 197, 94, 0.12)"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
      </div>
      </section>

      <section aria-labelledby="admin-financial-metrics">
        <h2 id="admin-financial-metrics" style={{ marginBottom: 16, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Desempenho Financeiro</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          className="card"
          style={{
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: 'rgba(34, 197, 94, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Receita Total
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: '#22c55e',
                lineHeight: 1.2,
                marginTop: 4,
              }}
            >
              {formatCurrency(stats?.financial?.receita ?? 0)}
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              A Receber
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: '#f59e0b',
                lineHeight: 1.2,
                marginTop: 4,
              }}
            >
              {formatCurrency(stats?.financial?.pendente ?? 0)}
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Lucro Liquido
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: '#3b82f6',
                lineHeight: 1.2,
                marginTop: 4,
              }}
            >
              {formatCurrency(stats?.financial?.lucro ?? 0)}
            </div>
          </div>
        </div>
      </div>
      </section>

      <QuickActions
        actions={[
          {
            label: 'Nova Empresa',
            to: '/admin/empresas/nova',
            variant: 'primary',
            gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            shadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18" />
                <path d="M9 8h1" />
                <path d="M9 12h1" />
                <path d="M9 16h1" />
                <path d="M14 8h1" />
                <path d="M14 12h1" />
                <path d="M14 16h1" />
                <path d="M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16" />
              </svg>
            ),
          },
          {
            label: 'Novo Medico',
            to: '/admin/medicos/novo',
            variant: 'secondary',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            ),
          },
        ]}
      />
      <AdminAgenda events={events} />
      </div>
    </MobilePage>
    <MobileBottomNav items={adminNavItems} />
    </>
  );
}
