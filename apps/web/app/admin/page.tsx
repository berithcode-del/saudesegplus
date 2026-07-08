'use client';
import { useEffect, useState } from 'react';
import {
  BuildingOffice2Icon,
  UserGroupIcon,
  DocumentTextIcon,
  CheckBadgeIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { apiAdminStats } from '../../app/lib/api';
import { apiGetEvents } from '../../lib/api';
import ScheduleCalendar from '../../components/dashboard/ScheduleCalendar';
import QuickActionsAdmin from '../../components/admin/QuickActionsAdmin';

interface AdminStats {
  totalCompanies: number;
  totalPatients: number;
  totalSolicitacoes: number;
  totalAsoEmitidos: number;
  financial?: {
    receita: number;
    repasses: number;
    pendente: number;
    lucro: number;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      apiAdminStats().then(r => setStats(r.data ?? r)).catch(() => {}),
      apiGetEvents('admin', 'admin').then(setEvents).catch(() => {})
    ]).finally(() => setLoading(false));
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const currentHour = new Date().getHours();
  let greeting = 'Boa noite';
  if (currentHour >= 5 && currentHour < 12) greeting = 'Bom dia';
  else if (currentHour >= 12 && currentHour < 18) greeting = 'Boa tarde';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 8fr) minmax(0, 4fr)',
        gap: '24px',
        alignItems: 'start',
        overflow: 'visible',
      }}
    >
      {/* ── Coluna Esquerda (70%) ────────────── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          overflow: 'visible',
          paddingTop: '60px',
        }}
      >
        {/* Greeting Banner */}
        <div style={{
          position: 'relative',
          height: '180px',
          borderRadius: '24px',
          overflow: 'visible',
          background: 'linear-gradient(130deg, #eef2ff 0%, #e0e7ff 60%, #ede9fe 100%)',
          border: '1px solid #c7d2fe',
          boxShadow: '0 4px 24px -2px rgba(79, 70, 229, 0.12)',
        }}>
          {/* Texto */}
          <div style={{ position: 'relative', zIndex: 1, padding: '36px 40px', maxWidth: '60%' }}>
            <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Painel Administrativo
            </p>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#1e1b4b', lineHeight: 1.3 }}>
              {greeting}, <span style={{ color: '#4f46e5' }}>Administrador</span> 👋
            </h1>
            <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '13px' }}>
              Confira as métricas globais e o desempenho financeiro da plataforma.
            </p>
          </div>

          {/* Logo 3D */}
          <img
            src="/illustrations/adm.png"
            alt="SaúdeSeg+ Admin"
            style={{
              position: 'absolute',
              bottom: 0,
              right: '24px',
              height: '240px',
              width: 'auto',
              objectFit: 'contain',
              objectPosition: 'bottom',
              zIndex: 2,
              pointerEvents: 'none',
              filter: 'drop-shadow(0 8px 24px rgba(79, 70, 229, 0.15))',
            }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>

        {loading ? (
          <div className="page-center"><p style={{ color: 'var(--text-muted)' }}>Carregando métricas...</p></div>
        ) : (
          <>
            {/* Métricas Operacionais */}
            <div>
              <h3 style={{ marginBottom: '16px', color: '#1e1b4b', fontSize: '16px', fontWeight: 700 }}>Métricas Operacionais</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                {[
                  { label: 'Empresas Ativas', value: stats?.totalCompanies ?? 0, icon: BuildingOffice2Icon, color: '#3b82f6', bg: '#eff6ff' },
                  { label: 'Pacientes', value: stats?.totalPatients ?? 0, icon: UserGroupIcon, color: '#8b5cf6', bg: '#f5f3ff' },
                  { label: 'Consultas / Exames', value: stats?.totalSolicitacoes ?? 0, icon: DocumentTextIcon, color: '#f59e0b', bg: '#fffbeb' },
                  { label: 'ASOs Emitidos', value: stats?.totalAsoEmitidos ?? 0, icon: CheckBadgeIcon, color: '#10b981', bg: '#ecfdf5' },
                ].map(card => (
                  <div key={card.label} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 20px -2px rgba(149, 157, 165, 0.15)' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '14px', background: card.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color
                    }}>
                      <card.icon style={{ width: '24px', height: '24px' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</div>
                      <div style={{ fontSize: '28px', fontWeight: 800, color: '#1e1b4b', lineHeight: 1.2, marginTop: '4px' }}>{card.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Métricas Financeiras */}
            <div>
              <h3 style={{ marginBottom: '16px', color: '#1e1b4b', fontSize: '16px', fontWeight: 700 }}>Desempenho Financeiro</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { label: 'Receita Total', value: stats?.financial?.receita ?? 0, icon: CurrencyDollarIcon, color: '#10b981', bg: '#ecfdf5', note: 'Pagamentos confirmados' },
                  { label: 'A Receber', value: stats?.financial?.pendente ?? 0, icon: ClockIcon, color: '#f59e0b', bg: '#fffbeb', note: 'Pagamentos pendentes' },
                  { label: 'Lucro Líquido Estimado', value: stats?.financial?.lucro ?? 0, icon: ArrowTrendingUpIcon, color: '#3b82f6', bg: '#eff6ff', note: 'Receita - Repasses - Despesas' },
                ].map(card => (
                  <div key={card.label} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 20px -2px rgba(149, 157, 165, 0.15)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</div>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: card.color, lineHeight: 1.2, marginTop: '8px' }}>
                          {formatCurrency(card.value)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>{card.note}</div>
                      </div>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '50%', background: card.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, flexShrink: 0
                      }}>
                        <card.icon style={{ width: '22px', height: '22px' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Coluna Direita (30%) ─────────────── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          paddingTop: '60px',
        }}
      >
        <QuickActionsAdmin />
        <ScheduleCalendar
          events={events}
        />
      </div>
    </div>
  );
}
