import { useState, useEffect, useCallback } from 'react';
import { useApiClient } from '../../app/providers/ApiProvider';
import { mobileStorage } from '../../lib/storage';
import { getProfileIdFromToken } from '@/lib/vendor/api-client';
import { GreetingCard } from '../../components/GreetingCard';
import { StatCard } from '../../components/StatCard';
import { DataTable } from '../../components/DataTable';
import { QuickActions } from '../../components/QuickActions';
import { HorizontalBarChart } from '../../components/HorizontalBarChart';
import { MobileBottomNav } from '../../components/MobileBottomNav';
import { MobilePage, MobileLoading } from '../../components/MobilePage';
import { EmpresaAgenda } from './EmpresaAgenda';

interface DashboardStats {
  sent: number;
  opened: number;
  inProgress: number;
  completed: number;
}

interface Invite {
  id: string;
  status: string;
  examType: string;
  createdAt: string;
  expiresAt: string;
  expectedCpf?: string;
  expectedEmail?: string;
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

const EXAM_TYPE_LABELS: Record<string, string> = {
  admissional: 'Admissional',
  periodico: 'Periodico',
  demissional: 'Demissional',
  retorno_funcao: 'Retorno a Funcao',
  mudanca_funcao: 'Mudanca de Funcao',
};

const empresaNavItems = [
  { to: '/empresa', label: 'Painel', icon: 'grid' as const, end: true },
  { to: '/empresa/solicitacoes', label: 'Solicitar', icon: 'clipboard' as const },
  { to: '/empresa/asos', label: 'ASOs', icon: 'document-check' as const },
  { to: '/empresa/documentos', label: 'Docs', icon: 'folder' as const },
  { to: '/empresa/configuracoes', label: 'Config', icon: 'cog' as const },
];

export function EmpresaDashboard() {
  const apiClient = useApiClient();
  const [stats, setStats] = useState<DashboardStats>({
    sent: 0,
    opened: 0,
    inProgress: 0,
    completed: 0,
  });
  const [invites, setInvites] = useState<Invite[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const companyId = getProfileIdFromToken(mobileStorage);
      if (!companyId) {
        setLoading(false);
        return;
      }
      setCompanyId(companyId);

      const [companyRes, statsRes, invitesRes, eventsRes] = await Promise.all([
        apiClient.fetch(`/api/company/${companyId}`) as Promise<{ nomeFantasia?: string; razaoSocial?: string; name?: string } | null>,
        apiClient.fetch(`/api/company/${companyId}/dashboard`) as Promise<{ data?: DashboardStats } | null>,
        apiClient.fetch(`/api/company/${companyId}/invites`) as Promise<{ data?: Invite[] } | null>,
        apiClient.fetch(`/api/calendar?ownerType=company&ownerId=${encodeURIComponent(companyId)}`) as Promise<CalendarEventsResponse | CalendarEvent[] | null>,
      ]);

      if (companyRes) {
        setCompanyName(
          companyRes.nomeFantasia ||
            companyRes.razaoSocial ||
            companyRes.name ||
            'Empresa'
        );
      }
      if (statsRes?.data) {
        setStats(statsRes.data);
      }
      if (invitesRes) {
        const items = invitesRes.data || [];
        setInvites(Array.isArray(items) ? items : []);
      }
      if (eventsRes) {
        const items = Array.isArray(eventsRes) ? eventsRes : eventsRes.data || [];
        setEvents(Array.isArray(items) ? items : []);
      }
    } catch (err) {
      console.error('[EmpresaDashboard] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const chartData = [
    {
      label: 'Admissional',
      value: invites.filter((i) => i.examType === 'admissional').length,
      color: '#3b82f6',
    },
    {
      label: 'Periodico',
      value: invites.filter((i) => i.examType === 'periodico').length,
      color: '#22c55e',
    },
    {
      label: 'Demissional',
      value: invites.filter((i) => i.examType === 'demissional').length,
      color: '#f59e0b',
    },
    {
      label: 'Outros',
      value: invites.filter(
        (i) =>
          i.examType !== 'admissional' &&
          i.examType !== 'periodico' &&
          i.examType !== 'demissional'
      ).length,
      color: '#8b5cf6',
    },
  ];

  if (loading) {
    return <MobileLoading label="Carregando painel..." />;
  }

  return (
    <>
    <MobilePage>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, overflow: 'visible' }}>
      <GreetingCard
        name={companyName}
        role="Empresa"
        subtitle="Aqui esta o resumo da saude ocupacional dos seus colaboradores."
        illustration="/illustrations/empresa3d.png"
        illustrationAlt="Empresa 3D"
        gradient="linear-gradient(130deg, #eff6ff 0%, #e0e7ff 60%, #ede9fe 100%)"
        accentColor="#3b82f6"
        dropShadow="0 8px 24px rgba(59, 130, 246, 0.15)"
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
        }}
      >
        <StatCard
          label="Enviados"
          value={stats.sent}
          color="#3b82f6"
          bgColor="rgba(59, 130, 246, 0.12)"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          }
        />
        <StatCard
          label="Abertos"
          value={stats.opened}
          color="#f59e0b"
          bgColor="rgba(245, 158, 11, 0.12)"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          }
        />
        <StatCard
          label="Em Andamento"
          value={stats.inProgress}
          color="#0ea5e9"
          bgColor="rgba(14, 165, 233, 0.12)"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <StatCard
          label="Concluidos"
          value={stats.completed}
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

      <DataTable
        title="Convites Recentes"
        data={invites}
        maxItems={6}
        statusMap={{
          CONCLUIDO: { label: 'Concluido', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.12)' },
          ABERTO: { label: 'Aberto', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.12)' },
          ENVIADO: { label: 'Enviado', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.12)' },
          EXPIRADO: { label: 'Expirado', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.12)' },
          default: { label: 'Pendente', color: '#0ea5e9', bgColor: 'rgba(14, 165, 233, 0.12)' },
        }}
        getAvatarName={(item) => item.expectedEmail || 'Colaborador'}
        getAvatarInitial={(item) => (item.expectedEmail?.[0] || 'C').toUpperCase()}
        getAvatarSubtext={(item) => item.expectedCpf ? `CPF: ${item.expectedCpf}` : ''}
        columns={[
          {
            key: 'examType',
            label: 'Tipo',
            render: (item) => EXAM_TYPE_LABELS[item.examType] || item.examType,
          },
          {
            key: 'expiresAt',
            label: 'Validade',
            render: (item) => {
              const d = new Date(item.expiresAt);
              return d.toLocaleDateString('pt-BR');
            },
          },
        ]}
      />

      <QuickActions
        actions={[
          {
            label: 'Nova Solicitacao',
            to: '/empresa/solicitacoes',
            variant: 'primary',
            gradient: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            shadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            ),
          },
          {
            label: 'Gerenciar Documentos',
            to: '/empresa/documentos',
            variant: 'secondary',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            ),
          },
        ]}
      />

      <HorizontalBarChart
        title="Exames Mais Solicitados"
        data={chartData}
      />

      <EmpresaAgenda events={events} />
      </div>
    </MobilePage>
    <MobileBottomNav items={empresaNavItems} />
    </>
  );
}
