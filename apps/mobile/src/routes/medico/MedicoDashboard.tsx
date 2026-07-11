import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiClient } from '../../app/providers/ApiProvider';
import { mobileStorage } from '../../lib/storage';
import { getProfileIdFromToken } from '@/lib/vendor/api-client';
import { GreetingCard } from '../../components/GreetingCard';
import { StatCard } from '../../components/StatCard';
import { DataTable } from '../../components/DataTable';
import { MobilePage, MobileLoading } from '../../components/MobilePage';

interface Solicitacao {
  id: string;
  status: string;
  examPurpose: string;
  createdAt: string;
  patient?: { name: string };
  clinic?: { city?: string };
  queueStatus?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  type?: string;
  date: string;
}

interface ScheduleItem {
  id: string;
  name: string;
  time: string;
  date: string;
  type: string;
  color: string;
  requestId?: string;
}

const DAYS_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];

function getWeekDates(baseDate: Date) {
  const day = baseDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  return DAYS_PT.map((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return { date, label };
  });
}

function getDateKey(value: string | Date) {
  return new Date(value).toDateString();
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSelectedDate(value: Date) {
  return value
    .toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeList<T>(response: T[] | { data?: T[] } | null) {
  return Array.isArray(response) ? response : response?.data || [];
}

function buildScheduleItems(solicitacoes: Solicitacao[], events: CalendarEvent[]): ScheduleItem[] {
  const requestItems = solicitacoes.map((item) => ({
    id: `request-${item.id}`,
    requestId: item.id,
    name: item.patient?.name || 'Paciente',
    time: formatTime(item.createdAt),
    date: item.createdAt,
    type: item.examPurpose === 'admissional' ? 'Novo paciente' : 'Retorno',
    color: item.examPurpose === 'admissional' ? '#22c55e' : '#4f46e5',
  }));

  const eventItems = events.map((event) => ({
    id: `event-${event.id}`,
    name: event.title,
    time: formatTime(event.date),
    date: event.date,
    type: event.type || 'Evento',
    color: event.type === 'Pessoal' ? '#f59e0b' : '#0ea5e9',
  }));

  return [...requestItems, ...eventItems].sort(
    (first, second) => new Date(first.date).getTime() - new Date(second.date).getTime()
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M16 2.5v4M8 2.5v4M3 9.5h18" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function PatientsChart({ data }: { data: { label: string; novos: number; retorno: number }[] }) {
  const maxBarValue = Math.max(...data.map((day) => Math.max(day.novos, day.retorno)), 1);

  return (
    <section className="card" style={{ padding: 20, borderRadius: 20 }} aria-labelledby="patients-chart-title">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
        <div>
          <h2 id="patients-chart-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            Numero de Pacientes
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Novos vs Retorno</p>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 32, padding: '0 10px', border: '1px solid var(--border-light)', borderRadius: 10, background: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
          Esta semana
        </span>
      </div>

      <div role="img" aria-label="Grafico semanal de pacientes novos e de retorno" style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 154, padding: '0 2px 8px', borderBottom: '1px solid var(--border-light)' }}>
        {data.map((day) => {
          const novosHeight = day.novos > 0 ? Math.max((day.novos / maxBarValue) * 112, 8) : 0;
          const retornoHeight = day.retorno > 0 ? Math.max((day.retorno / maxBarValue) * 112, 8) : 0;

          return (
            <div key={day.label} style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 5 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 2, width: '100%', height: 120 }}>
                <div aria-label={`${day.novos} pacientes novos`} style={{ width: '42%', maxWidth: 18, height: novosHeight, borderRadius: '5px 5px 2px 2px', background: '#4f46e5', transition: 'height 0.3s ease' }} />
                <div aria-label={`${day.retorno} pacientes de retorno`} style={{ width: '42%', maxWidth: 18, height: retornoHeight, borderRadius: '5px 5px 2px 2px', background: '#f59e0b', transition: 'height 0.3s ease' }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>{day.label}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 18px', marginTop: 14 }}>
        <LegendItem color="#4f46e5" label="Novos" />
        <LegendItem color="#f59e0b" label="Retorno" />
      </div>
    </section>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  );
}

function ScheduleCard({ items, onOpenRequest, onToday }: { items: ScheduleItem[]; onOpenRequest: (id: string) => void; onToday: () => void }) {
  const weekDates = getWeekDates(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const selectedKey = getDateKey(selectedDate);
  const selectedItems = items.filter((item) => getDateKey(item.date) === selectedKey);

  return (
    <section className="card" style={{ padding: 18, borderRadius: 20 }} aria-labelledby="schedule-title">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, color: '#4f46e5', background: 'rgba(79, 70, 229, 0.1)' }}>
            <CalendarIcon />
          </span>
          <div>
            <h2 id="schedule-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Agenda</h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Compromissos da semana</p>
          </div>
        </div>
        <button type="button" onClick={onToday} style={{ minWidth: 48, minHeight: 44, padding: '0 10px', border: '1px solid var(--border-light)', borderRadius: 10, background: 'var(--bg-card)', color: '#4f46e5', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          Hoje
        </button>
      </div>

      <div role="tablist" aria-label="Dias da semana" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 1px 8px', scrollbarWidth: 'none' }}>
        {weekDates.map(({ date, label }) => {
          const active = getDateKey(date) === selectedKey;
          const hasAppointments = items.some((item) => getDateKey(item.date) === getDateKey(date));

          return (
            <button
              key={date.toISOString()}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedDate(date)}
              style={{ flex: '0 0 48px', minWidth: 48, minHeight: 58, padding: '7px 4px', border: active ? '1px solid #4f46e5' : '1px solid var(--border-light)', borderRadius: 14, background: active ? '#4f46e5' : 'var(--bg-card)', color: active ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s ease' }}
            >
              <span style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', opacity: active ? 0.85 : 0.7 }}>{label}</span>
              <strong style={{ display: 'block', marginTop: 4, fontSize: 16, lineHeight: 1 }}>{date.getDate()}</strong>
              <span aria-label={hasAppointments ? 'Com agendamento' : 'Sem agendamento'} style={{ display: 'block', width: 5, height: 5, margin: '6px auto 0', borderRadius: '50%', background: hasAppointments ? (active ? '#fbbf24' : '#4f46e5') : 'transparent' }} />
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 12, paddingTop: 14, borderTop: '1px solid var(--border-light)' }}>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{formatSelectedDate(selectedDate)}</h3>

        {selectedItems.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {selectedItems.slice(0, 4).map((item) => {
              const content = (
                <>
                  <span aria-hidden="true" style={{ width: 4, alignSelf: 'stretch', minHeight: 38, borderRadius: 4, background: item.color }} />
                  <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, color: 'var(--text-primary)' }}>{item.name}</strong>
                    <span style={{ display: 'block', marginTop: 3, fontSize: 11, color: 'var(--text-muted)' }}>{item.time} · {item.type}</span>
                  </span>
                  {item.requestId && <ArrowIcon />}
                </>
              );

              if (!item.requestId) {
                return <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 58, padding: '9px 10px', border: '1px solid var(--border-light)', borderRadius: 12, background: 'var(--bg-subtle)' }}>{content}</div>;
              }

              return (
                <button key={item.id} type="button" onClick={() => onOpenRequest(item.requestId!)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 58, padding: '9px 10px', border: '1px solid var(--border-light)', borderRadius: 12, background: 'var(--bg-card)', cursor: 'pointer' }}>
                  {content}
                </button>
              );
            })}
            {selectedItems.length > 4 && <span style={{ paddingTop: 2, fontSize: 11, color: 'var(--text-muted)' }}>+{selectedItems.length - 4} compromissos</span>}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 10, padding: '12px 10px', borderRadius: 12, background: 'var(--bg-subtle)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nenhum compromisso para este dia.</span>
            <span style={{ color: '#4f46e5' }}><CalendarIcon /></span>
          </div>
        )}
      </div>
    </section>
  );
}

export function MedicoDashboard() {
  const apiClient = useApiClient();
  const navigate = useNavigate();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [doctorName, setDoctorName] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const profileId = getProfileIdFromToken(mobileStorage);
      if (!profileId) {
        setLoading(false);
        return;
      }

      const today = new Date();
      const dow = today.getDay();
      const diff = dow === 0 ? -6 : 1 - dow;
      const monday = new Date(today);
      monday.setDate(today.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const [profileRes, solRes, eventRes] = await Promise.all([
        apiClient.fetch(`/api/medicos/${profileId}`) as Promise<{ name?: string } | null>,
        apiClient.fetch(
          `/api/solicitacoes?medicoId=${profileId}&start=${monday.toISOString()}&end=${sunday.toISOString()}`
        ) as Promise<Solicitacao[] | { data?: Solicitacao[] } | null>,
        apiClient.fetch(
          `/api/calendar?ownerType=doctor&ownerId=${encodeURIComponent(profileId)}&startDate=${monday.toISOString()}&endDate=${sunday.toISOString()}`
        ) as Promise<CalendarEvent[] | { data?: CalendarEvent[] } | null>,
      ]);

      if (profileRes) {
        setDoctorName(profileRes.name || '');
      }
      setSolicitacoes(normalizeList(solRes));
      setCalendarEvents(normalizeList(eventRes));
    } catch (err) {
      console.error('[MedicoDashboard] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = {
    total: solicitacoes.length,
    emAtendimento: solicitacoes.filter((s) => s.status === 'EM_ATENDIMENTO_MEDICO').length,
    concluidos: solicitacoes.filter((s) => s.status === 'CONCLUIDO').length,
    naFila: solicitacoes.filter(
      (s) => s.status === 'NA_FILA_MEDICA' || s.queueStatus === 'WAITING'
    ).length,
  };

  const weeklyData = (() => {
    const result: { label: string; novos: number; retorno: number }[] = [];
    const today = new Date();
    const dow = today.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const daySols = solicitacoes.filter(
        (s) => new Date(s.createdAt).toDateString() === day.toDateString()
      );
      result.push({
        label: DAYS_PT[i] ?? '',
        novos: daySols.filter((s) => s.examPurpose === 'admissional').length,
        retorno: daySols.filter((s) => s.examPurpose !== 'admissional').length,
      });
    }
    return result;
  })();

  if (loading) {
    return <MobileLoading label="Carregando painel..." />;
  }

  return (
    <MobilePage>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, overflow: 'visible' }}>
        <div style={{ marginBottom: 40 }}>
          <GreetingCard
            name={doctorName}
            role="Dr(a)."
            subtitle="Tenha um otimo dia de trabalho"
            illustration="/illustrations/medico3d.png"
            illustrationAlt="Medico 3D"
            gradient="linear-gradient(130deg, #f5f3ff 0%, #eff6ff 60%, #f0fdf4 100%)"
            accentColor="#f59e0b"
            dropShadow="0 8px 24px rgba(79, 70, 229, 0.15)"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
          <StatCard
            label="Total"
            value={stats.total}
            color="#4f46e5"
            bgColor="rgba(79, 70, 229, 0.12)"
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></svg>}
          />
          <StatCard
            label="Em Atendimento"
            value={stats.emAtendimento}
            color="#f59e0b"
            bgColor="rgba(245, 158, 11, 0.12)"
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
          />
          <StatCard
            label="Concluidos"
            value={stats.concluidos}
            color="#22c55e"
            bgColor="rgba(34, 197, 94, 0.12)"
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
          />
          <StatCard
            label="Na Fila"
            value={stats.naFila}
            color="#0ea5e9"
            bgColor="rgba(14, 165, 233, 0.12)"
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>}
          />
        </div>

        <ScheduleCard
          items={buildScheduleItems(solicitacoes, calendarEvents)}
          onOpenRequest={(id) => navigate(`/medico/consulta/${id}`)}
          onToday={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        />

        <DataTable
          title="Meus Agendamentos"
          data={solicitacoes}
          maxItems={6}
          statusMap={{
            CONCLUIDO: { label: 'Concluido', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.12)' },
            EM_ATENDIMENTO_MEDICO: { label: 'Em Atendimento', color: '#4f46e5', bgColor: 'rgba(79, 70, 229, 0.12)' },
            default: { label: 'Aguardando', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.12)' },
          }}
          onRowClick={(item) => navigate(`/medico/consulta/${item.id}`)}
          getAvatarName={(item) => item.patient?.name || 'Paciente'}
          getAvatarInitial={(item) => (item.patient?.name?.[0] || 'P').toUpperCase()}
          getAvatarSubtext={(item) => item.examPurpose}
          columns={[]}
        />

        <PatientsChart data={weeklyData} />
      </div>
    </MobilePage>
  );
}
