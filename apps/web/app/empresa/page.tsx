'use client';
import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import GreetingCompany from '../../components/empresa/GreetingCompany';
import CompanyStats from '../../components/empresa/CompanyStats';
import RecentInvitesTable from '../../components/empresa/RecentInvitesTable';
import QuickActionsCompany from '../../components/empresa/QuickActionsCompany';
import InvitesChart from '../../components/empresa/InvitesChart';
import ScheduleCalendar from '../../components/dashboard/ScheduleCalendar';
import { apiGetEvents } from '../../lib/api';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

interface DashboardStats {
  total: number;
  sent: number;
  opened: number;
  inProgress: number;
  completed: number;
  expired: number;
}

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

export default function EmpresaDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    sent: 0,
    opened: 0,
    inProgress: 0,
    completed: 0,
    expired: 0,
  });
  const [recentInvites, setRecentInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState<string>('');
  const [companyId, setCompanyId] = useState<string>('');
  const [events, setEvents] = useState<any[]>([]);

  const fetchDashboard = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const parts = token?.split('.') ?? [];
      const payload = parts[1] ? JSON.parse(atob(parts[1])) : null;
      const profileId = payload?.profileId || payload?.companyId;
      
      const currentCompanyId = localStorage.getItem('companyId') || profileId;

      if (!currentCompanyId) {
        setLoading(false);
        return;
      }

      localStorage.setItem('companyId', currentCompanyId);
      setCompanyId(currentCompanyId);

      const [companyRes, statsRes, invitesRes, eventsData] = await Promise.all([
        fetch(`${BACKEND_URL}/api/company/${currentCompanyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BACKEND_URL}/api/company/${currentCompanyId}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BACKEND_URL}/api/company/${currentCompanyId}/invites`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiGetEvents('company', currentCompanyId),
      ]);

      const [companyResult, statsResult, invitesResult] = await Promise.all([
        companyRes.json(),
        statsRes.json(),
        invitesRes.json(),
      ]);
      if (eventsData) setEvents(eventsData);

      const currentCompany = companyResult.data ?? companyResult;
      if (currentCompany) {
        setCompanyName(
          currentCompany.nomeFantasia ||
            currentCompany.razaoSocial ||
            currentCompany.name ||
            'Empresa',
        );
      }

      if (statsResult.data) {
        setStats(statsResult.data);
      }

      const invites = invitesResult.data ?? [];
      setRecentInvites(Array.isArray(invites) ? invites : []);
    } catch (err) {
      console.error('Erro ao buscar dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (!companyId) return;
    const token = localStorage.getItem('token');
    const socket = io(`${BACKEND_URL}/company`, {
      auth: { token },
    });
    socket.emit('join_company', { companyId });
    
    socket.on('invite_status_change', () => {
      fetchDashboard();
    });

    return () => {
      socket.disconnect();
    };
  }, [companyId, fetchDashboard]);

  if (loading) {
    return <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>Carregando painel...</div>;
  }

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
        <div data-tour="painel">
          <GreetingCompany name={companyName} />
        </div>
        <CompanyStats stats={stats} />
        <div data-tour="solicitacoes">
          <RecentInvitesTable invites={recentInvites} />
        </div>
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
        <div data-tour="colaboradores">
          <QuickActionsCompany />
        </div>
        <InvitesChart invites={recentInvites} />
        <ScheduleCalendar
          ownerType="company"
          ownerId={companyId}
          events={events}
          onEventCreated={() => {
            if (companyId) apiGetEvents('company', companyId).then(res => setEvents(res));
          }}
        />
      </div>
    </div>
  );
}
