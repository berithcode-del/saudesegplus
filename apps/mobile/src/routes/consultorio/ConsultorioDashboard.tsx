import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiClient } from '../../app/providers/ApiProvider';
import { mobileStorage } from '../../lib/storage';
import { getProfileIdFromToken } from '@/lib/vendor/api-client';
import { GreetingCard } from '../../components/GreetingCard';
import { StatCard } from '../../components/StatCard';
import { DataTable } from '../../components/DataTable';
import { QuickActions } from '../../components/QuickActions';
import { BarChart } from '../../components/BarChart';
import { MobilePage, MobileLoading } from '../../components/MobilePage';
import { ConsultorioSchedule } from './ConsultorioSchedule';

interface Solicitacao {
  id: string;
  status: string;
  examPurpose: string;
  createdAt: string;
  patient?: { name: string; cpf: string };
}

interface CalendarEvent {
  id: string;
  title?: string;
  type?: string;
  date?: string;
}

const DAYS_PT: string[] = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

export function ConsultorioDashboard() {
  const apiClient = useApiClient();
  const navigate = useNavigate();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [clinicName, setClinicName] = useState('Clinica');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const clinicId = getProfileIdFromToken(mobileStorage);
      if (!clinicId) {
        setLoading(false);
        return;
      }

      const [profileRes, solRes] = await Promise.all([
        apiClient.fetch(`/api/clinic/${clinicId}`) as Promise<{ name?: string; nomeFantasia?: string } | null>,
        apiClient.fetch('/api/solicitacoes') as Promise<{ data?: { data?: Solicitacao[] } | Solicitacao[] } | null>,
      ]);

      if (profileRes) {
        setClinicName(profileRes.name || profileRes.nomeFantasia || 'Clinica');
      }
      if (solRes) {
        const raw = solRes.data;
        const items = Array.isArray(raw) ? raw : raw?.data || [];
        setSolicitacoes(items);
      }

      try {
        const eventsRes = await apiClient.fetch(
          `/api/calendar?ownerType=clinic&ownerId=${encodeURIComponent(clinicId)}`
        ) as { data?: CalendarEvent[] } | CalendarEvent[] | null;
        const eventData = Array.isArray(eventsRes) ? eventsRes : eventsRes?.data || [];
        setEvents(eventData);
      } catch {
        setEvents([]);
      }
    } catch (err) {
      console.error('[ConsultorioDashboard] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = {
    aguardandoColeta: solicitacoes.filter((s) => s.status === 'AGUARDANDO_COLETA').length,
    naFila: solicitacoes.filter((s) => s.status === 'NA_FILA_MEDICA').length,
    emAtendimento: solicitacoes.filter(
      (s) => s.status === 'EM_ATENDIMENTO_MEDICO' || s.status === 'EM_COLETA'
    ).length,
    concluidos: solicitacoes.filter((s) => s.status === 'CONCLUIDO').length,
  };

  const weeklyData = (() => {
    const result: { label: string; value: number }[] = [];
    const today = new Date();
    const dow = today.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);

    for (let i = 0; i < 6; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const dayStr = day.toDateString();
      const count = solicitacoes.filter(
        (s) => new Date(s.createdAt).toDateString() === dayStr
      ).length;
      result.push({ label: DAYS_PT[i] ?? '', value: count });
    }
    return result;
  })();

  if (loading) {
    return <MobileLoading label="Carregando painel..." />;
  }

  return (
    <MobilePage>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, overflow: 'visible' }}>
      <GreetingCard
        name={clinicName}
        role="Clinica"
        subtitle="Confira o fluxo de pacientes e solicitacoes em tempo real."
        illustration="/illustrations/clinica3d.png"
        illustrationAlt="Clinica 3D"
        gradient="linear-gradient(130deg, #f0fdfa 0%, #d1fae5 60%, #ecfdf5 100%)"
        accentColor="#0d9488"
        dropShadow="0 8px 24px rgba(13, 148, 136, 0.15)"
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
        }}
      >
        <StatCard
          label="Aguardando Coleta"
          value={stats.aguardandoColeta}
          color="#f59e0b"
          bgColor="rgba(245, 158, 11, 0.12)"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <StatCard
          label="Na Fila"
          value={stats.naFila}
          color="#8b5cf6"
          bgColor="rgba(139, 92, 246, 0.12)"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          }
        />
        <StatCard
          label="Em Atendimento"
          value={stats.emAtendimento}
          color="#3b82f6"
          bgColor="rgba(59, 130, 246, 0.12)"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          }
        />
        <StatCard
          label="Concluidos"
          value={stats.concluidos}
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
        title="Fila de Pacientes"
        data={solicitacoes}
        maxItems={6}
        statusMap={{
          AGUARDANDO_COLETA: { label: 'Aguardando Coleta', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.12)' },
          NA_FILA_MEDICA: { label: 'Na Fila', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.12)' },
          EM_ATENDIMENTO_MEDICO: { label: 'Em Atendimento', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.12)' },
          EM_COLETA: { label: 'Em Coleta', color: '#0ea5e9', bgColor: 'rgba(14, 165, 233, 0.12)' },
          CONCLUIDO: { label: 'Concluido', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.12)' },
        }}
        onRowClick={(item) => navigate(`/consultorio/exames/${item.id}`)}
        getAvatarName={(item) => item.patient?.name || 'Paciente'}
        getAvatarInitial={(item) => (item.patient?.name?.[0] || 'P').toUpperCase()}
        getAvatarSubtext={(item) =>
          item.patient?.cpf ? `CPF: ${item.patient.cpf}` : ''
        }
        columns={[
          {
            key: 'examPurpose',
            label: 'Exame',
          },
          {
            key: 'createdAt',
            label: 'Chegada',
            render: (item) => {
              const d = new Date(item.createdAt);
              return `${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
            },
          },
        ]}
      />

      <QuickActions
        actions={[
          {
            label: 'Novo Check-in',
            to: '/consultorio/check-in',
            variant: 'primary',
            gradient: 'linear-gradient(135deg, #0d9488 0%, #22c55e 100%)',
            shadow: '0 4px 14px rgba(13, 148, 136, 0.35)',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <polyline points="17 11 19 13 23 9" />
              </svg>
            ),
          },
          {
            label: 'Buscar Paciente',
            to: '/consultorio/pacientes',
            variant: 'secondary',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            ),
          },
        ]}
      />

      <BarChart
        title="Fluxo de Pacientes"
        data={weeklyData}
        primaryColor="#0d9488"
        secondaryColor="#0d9488"
        height={160}
      />

      <ConsultorioSchedule
        ownerId={getProfileIdFromToken(mobileStorage) || ''}
        solicitacoes={solicitacoes}
        events={events}
        onEventCreated={fetchData}
      />
      </div>
    </MobilePage>
  );
}
