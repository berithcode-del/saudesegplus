import { useMemo, useState } from 'react';
import { useApiClient } from '../../app/providers/ApiProvider';

interface Solicitacao {
  id: string;
  examPurpose: string;
  createdAt: string;
  patient?: { name: string };
}

interface CalendarEvent {
  id: string;
  title?: string;
  type?: string;
  date?: string;
}

interface ConsultorioScheduleProps {
  ownerId: string;
  solicitacoes: Solicitacao[];
  events: CalendarEvent[];
  onEventCreated: () => void;
}

interface Appointment {
  id: string;
  name: string;
  type: string;
  time: string;
  date: string;
  color: string;
  editable: boolean;
}

const WEEK_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function getWeekDates(baseDate: Date) {
  const dow = baseDate.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + diff);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

function getMonthDates(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const dates: Date[] = [];
  const firstDow = firstDay.getDay();
  const leadingDays = firstDow === 0 ? 6 : firstDow - 1;

  for (let index = leadingDays; index > 0; index -= 1) {
    dates.push(new Date(year, month, 1 - index));
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    dates.push(new Date(year, month, day));
  }

  const trailingDays = dates.length % 7;
  if (trailingDays !== 0) {
    for (let day = 1; day <= 7 - trailingDays; day += 1) {
      dates.push(new Date(year, month + 1, day));
    }
  }

  return dates;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getMonthLabel(date: Date) {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function getAppointmentColor(type: string) {
  if (type === 'Pessoal') return '#f59e0b';
  if (type === 'Reuniao') return '#0ea5e9';
  return '#4f46e5';
}

export function ConsultorioSchedule({
  ownerId,
  solicitacoes,
  events,
  onEventCreated,
}: ConsultorioScheduleProps) {
  const apiClient = useApiClient();
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekBase, setWeekBase] = useState(today);
  const [monthBase, setMonthBase] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [view, setView] = useState<'week' | 'month' | 'form'>('week');
  const [saving, setSaving] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('Reuniao');
  const [formDate, setFormDate] = useState('');

  const weekDates = useMemo(() => getWeekDates(weekBase), [weekBase]);
  const monthDates = useMemo(
    () => getMonthDates(monthBase.getFullYear(), monthBase.getMonth()),
    [monthBase]
  );

  const groupedAppointments = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};

    const addAppointment = (appointment: Appointment, date: string) => {
      const key = new Date(date).toDateString();
      grouped[key] = grouped[key] || [];
      grouped[key].push(appointment);
    };

    solicitacoes.forEach((solicitacao) => {
      addAppointment(
        {
          id: solicitacao.id,
          name: solicitacao.patient?.name || 'Exame solicitado',
          type: solicitacao.examPurpose || 'Retorno',
          time: formatTime(solicitacao.createdAt),
          date: solicitacao.createdAt,
          color: '#4f46e5',
          editable: false,
        },
        solicitacao.createdAt
      );
    });

    events.forEach((event) => {
      if (!event.date) return;
      addAppointment(
        {
          id: event.id,
          name: event.title || 'Compromisso',
          type: event.type || 'Reuniao',
          time: formatTime(event.date),
          date: event.date,
          color: getAppointmentColor(event.type || 'Reuniao'),
          editable: true,
        },
        event.date
      );
    });

    return grouped;
  }, [events, solicitacoes]);

  const selectedAppointments = groupedAppointments[selectedDate.toDateString()] || [];

  const moveWeek = (amount: number) => {
    const nextDate = new Date(weekBase);
    nextDate.setDate(nextDate.getDate() + amount * 7);
    setWeekBase(nextDate);
  };

  const moveMonth = (amount: number) => {
    setMonthBase(new Date(monthBase.getFullYear(), monthBase.getMonth() + amount, 1));
  };

  const openCreateForm = () => {
    setEditingEvent(null);
    setFormTitle('');
    setFormType('Reuniao');
    setFormDate('');
    setView('form');
  };

  const openEditForm = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormTitle(event.title || '');
    setFormType(event.type || 'Reuniao');
    const fallbackDate = new Date(selectedDate);
    setFormDate(event.date ? new Date(event.date).toISOString().slice(0, 16) : fallbackDate.toISOString().slice(0, 16));
    setView('form');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ownerId || !formDate) return;

    try {
      setSaving(true);
      const payload = {
        title: formTitle,
        type: formType,
        date: new Date(formDate).toISOString(),
      };

      if (editingEvent) {
        await apiClient.fetch(`/api/calendar/${editingEvent.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient.fetch('/api/calendar', {
          method: 'POST',
          body: JSON.stringify({ ...payload, ownerType: 'clinic', ownerId }),
        });
      }

      setView('week');
      setEditingEvent(null);
      setFormTitle('');
      setFormDate('');
      onEventCreated();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este compromisso?')) return;

    await apiClient.fetch(`/api/calendar/${eventId}`, { method: 'DELETE' });
    onEventCreated();
  };

  return (
    <section
      aria-labelledby="consultorio-agenda-title"
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 20,
        padding: 20,
        boxShadow: '0 4px 20px -2px rgba(149, 157, 165, 0.15)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {view !== 'form' && (
            <>
              <button type="button" onClick={() => view === 'month' ? moveMonth(-1) : moveWeek(-1)} style={navButtonStyle} aria-label="Periodo anterior">
                <Chevron direction="left" />
              </button>
              <button type="button" onClick={() => view === 'month' ? moveMonth(1) : moveWeek(1)} style={navButtonStyle} aria-label="Proximo periodo">
                <Chevron direction="right" />
              </button>
            </>
          )}
          {view === 'form' && (
            <button type="button" onClick={() => setView('week')} style={{ ...navButtonStyle, width: 'auto', padding: '0 12px', gap: 6 }}>
              <Chevron direction="left" />
              Voltar
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {view !== 'form' && (
            <button
              type="button"
              onClick={() => setView(view === 'month' ? 'week' : 'month')}
              style={{
                ...switchButtonStyle,
                background: view === 'month' ? '#4f46e5' : '#f8fafc',
                color: view === 'month' ? '#ffffff' : '#4f46e5',
              }}
            >
              <CalendarIcon />
              {view === 'month' ? getMonthLabel(monthBase) : getMonthLabel(weekDates[0] || today)}
            </button>
          )}
          <button type="button" onClick={openCreateForm} style={addButtonStyle} aria-label="Novo compromisso">
            +
          </button>
        </div>
      </div>

      {view === 'week' && (
        <>
          <div style={{ overflowX: 'auto', margin: '0 -4px 20px', padding: '0 4px 2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, minWidth: 308 }}>
              {weekDates.map((date, index) => {
                const dateKey = date.toDateString();
                const isToday = dateKey === today.toDateString();
                const isSelected = dateKey === selectedDate.toDateString();
                const hasAppointment = (groupedAppointments[dateKey]?.length || 0) > 0;

                return (
                  <button
                    type="button"
                    key={dateKey}
                    onClick={() => setSelectedDate(date)}
                    style={{
                      width: 40,
                      minWidth: 40,
                      minHeight: 56,
                      border: 'none',
                      borderRadius: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      background: isSelected ? '#4f46e5' : isToday ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                      color: isSelected ? '#ffffff' : '#1e1b4b',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? 'rgba(255,255,255,0.8)' : '#9ca3af' }}>{WEEK_DAYS[index]}</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: isSelected ? '#ffffff' : isToday ? '#4f46e5' : '#1e1b4b' }}>{date.getDate()}</span>
                    {hasAppointment && <span aria-label="Possui compromissos" style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.75)' : '#4f46e5' }} />}
                  </button>
                );
              })}
            </div>
          </div>

          <AppointmentList appointments={selectedAppointments} onEdit={openEditForm} onDelete={handleDelete} />
        </>
      )}

      {view === 'month' && (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 308 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
              {WEEK_DAYS.map((day) => <div key={day} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>{day}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {monthDates.map((date) => {
                const dateKey = date.toDateString();
                const isToday = dateKey === today.toDateString();
                const hasAppointment = (groupedAppointments[dateKey]?.length || 0) > 0;
                const isCurrentMonth = date.getMonth() === monthBase.getMonth();

                return (
                  <button
                    type="button"
                    key={dateKey}
                    onClick={() => {
                      setSelectedDate(date);
                      setWeekBase(date);
                      setView('week');
                    }}
                    style={{
                      minHeight: 40,
                      borderRadius: 8,
                      border: '1px solid #f3f4f6',
                      background: isToday ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                      opacity: isCurrentMonth ? 1 : 0.3,
                      color: isToday ? '#4f46e5' : '#1e1b4b',
                      fontSize: 12,
                      fontWeight: isToday ? 800 : 500,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 3,
                    }}
                  >
                    {date.getDate()}
                    {hasAppointment && <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#4f46e5' }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {view === 'form' && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="consultorio-event-title" style={labelStyle}>{editingEvent ? 'Editar compromisso' : 'Novo compromisso'}</label>
            <input id="consultorio-event-title" required value={formTitle} onChange={(event) => setFormTitle(event.target.value)} placeholder="Ex: Reuniao de alinhamento" style={inputStyle} />
          </div>
          <div>
            <label htmlFor="consultorio-event-date" style={labelStyle}>Data e hora</label>
            <input id="consultorio-event-date" type="datetime-local" required value={formDate} onChange={(event) => setFormDate(event.target.value)} style={inputStyle} />
          </div>
          <div>
            <label htmlFor="consultorio-event-type" style={labelStyle}>Tipo</label>
            <select id="consultorio-event-type" value={formType} onChange={(event) => setFormType(event.target.value)} style={inputStyle}>
              <option>Reuniao</option>
              <option>Pessoal</option>
              <option>Retorno</option>
              <option>Plantao</option>
              <option>Outros</option>
            </select>
          </div>
          <button type="submit" disabled={saving} style={{ ...saveButtonStyle, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Salvando...' : editingEvent ? 'Atualizar compromisso' : 'Salvar compromisso'}
          </button>
        </form>
      )}
    </section>
  );
}

function AppointmentList({
  appointments,
  onEdit,
  onDelete,
}: {
  appointments: Appointment[];
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
}) {
  if (appointments.length === 0) {
    return <div style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '10px 0' }}>Nenhum compromisso marcado.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {appointments.map((appointment) => (
        <div key={appointment.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', minHeight: 56, borderRadius: 10, background: '#f8fafc', borderLeft: `3px solid ${appointment.color}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appointment.name}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{appointment.type}</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>{appointment.time}</div>
          {appointment.editable && (
            <div style={{ display: 'flex', gap: 2 }}>
              <button type="button" onClick={() => onEdit({ id: appointment.id, title: appointment.name, type: appointment.type, date: appointment.date })} style={iconButtonStyle} aria-label="Editar compromisso">✎</button>
              <button type="button" onClick={() => onDelete(appointment.id)} style={{ ...iconButtonStyle, color: '#ef4444' }} aria-label="Excluir compromisso">×</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>{direction === 'left' ? '‹' : '›'}</span>;
}

function CalendarIcon() {
  return <span aria-hidden="true" style={{ fontSize: 14 }}>▣</span>;
}

const navButtonStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  color: '#6b7280',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

const switchButtonStyle: React.CSSProperties = {
  minHeight: 44,
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  padding: '0 12px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
};

const addButtonStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  border: 'none',
  borderRadius: 12,
  background: '#4f46e5',
  color: '#ffffff',
  fontSize: 25,
  lineHeight: 1,
  cursor: 'pointer',
};

const iconButtonStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  border: 'none',
  borderRadius: 10,
  background: 'transparent',
  color: '#4f46e5',
  fontSize: 20,
  cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  color: '#4b5563',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 48,
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  color: '#1e1b4b',
  fontSize: 14,
  boxSizing: 'border-box',
};

const saveButtonStyle: React.CSSProperties = {
  minHeight: 48,
  marginTop: 8,
  border: 'none',
  borderRadius: 10,
  background: '#4f46e5',
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer',
};
