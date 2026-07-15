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
import {
  BuildingOffice2Icon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

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

interface ClinicInfo {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
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
  const [clinic, setClinic] = useState<ClinicInfo | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const parts = token?.split('.') ?? [];
      const payload = parts[1] ? JSON.parse(atob(parts[1])) : null;
      const profileId = payload?.profileId || payload?.companyId;

      const currentCompanyId = profileId || localStorage.getItem('companyId');

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
        // Set clinic info if available
        if (currentCompany.clinic) {
          setClinic(currentCompany.clinic);
        }
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
        {clinic && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: 'rgba(79,70,229,0.08)',
              border: '1px solid rgba(79,70,229,0.2)',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <BuildingOffice2Icon style={{ width: 20, height: 20, color: '#4f46e5' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e1b4b' }}>
                Clínica Atribuída
              </div>
              <div style={{ fontSize: '14px', color: '#374151', fontWeight: 700 }}>
                {clinic.name}
              </div>
              {clinic.address && (
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPinIcon style={{ width: 14, height: 14 }} />
                  {clinic.address}, {clinic.city}/{clinic.state}
                </div>
              )}
            </div>
          </div>
        )}
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
