import { useMemo, useState } from 'react';

interface CalendarEvent {
  id: string;
  title?: string;
  type?: string;
  date?: string;
}

interface EmpresaAgendaProps {
  events: CalendarEvent[];
}

const WEEK_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  result.setHours(0, 0, 0, 0);
  return result;
}

function dateKey(date: Date) {
  return date.toDateString();
}

function formatTime(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function EmpresaAgenda({ events }: EmpresaAgendaProps) {
  const today = new Date();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [selectedDate, setSelectedDate] = useState(() => dateKey(today));

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return date;
    }),
    [weekStart],
  );

  const eventsByDay = useMemo(() => events.reduce<Record<string, CalendarEvent[]>>((grouped, event) => {
    if (!event.date) return grouped;
    const key = dateKey(new Date(event.date));
    grouped[key] = [...(grouped[key] ?? []), event];
    return grouped;
  }, {}), [events]);

  const selectedEvents = eventsByDay[selectedDate] ?? [];
  const monthLabel = `${MONTHS[weekStart.getMonth()]} ${weekStart.getFullYear()}`;

  const changeWeek = (offset: number) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + offset * 7);
    setWeekStart(next);
  };

  return (
    <section className="card" style={{ padding: 20 }} aria-labelledby="empresa-agenda-title">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div>
          <h2 id="empresa-agenda-title" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Agenda</h2>
          <p style={{ marginTop: 3, fontSize: 12, color: 'var(--text-muted)' }}>{monthLabel}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => changeWeek(-1)} aria-label="Semana anterior" style={navButtonStyle}>‹</button>
          <button type="button" onClick={() => changeWeek(1)} aria-label="Proxima semana" style={navButtonStyle}>›</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 16 }}>
        {weekDates.map((date, index) => {
          const key = dateKey(date);
          const selected = key === selectedDate;
          const isToday = key === dateKey(today);
          const hasEvents = (eventsByDay[key]?.length ?? 0) > 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDate(key)}
              aria-label={`${WEEK_DAYS[index]} ${date.getDate()}`}
              aria-pressed={selected}
              style={{
                minHeight: 56,
                border: 'none',
                borderRadius: 12,
                background: selected ? '#3b82f6' : isToday ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                color: selected ? '#fff' : isToday ? '#2563eb' : 'var(--text-primary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 600, opacity: selected ? 0.8 : 0.65 }}>{WEEK_DAYS[index]}</span>
              <span style={{ fontSize: 15, fontWeight: 800 }}>{date.getDate()}</span>
              <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: '50%', background: hasEvents ? (selected ? '#fff' : '#3b82f6') : 'transparent' }} />
            </button>
          );
        })}
      </div>

      {selectedEvents.length === 0 ? (
        <p style={{ padding: '12px 4px 4px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          Nenhum compromisso marcado para este dia.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {selectedEvents.map((event) => (
            <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 12, background: '#f8fafc', borderLeft: '3px solid #3b82f6' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, color: 'var(--text-primary)' }}>{event.title || 'Compromisso'}</strong>
                <span style={{ display: 'block', marginTop: 3, fontSize: 11, color: 'var(--text-muted)' }}>{event.type || 'Agenda'}</span>
              </div>
              <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{formatTime(event.date)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const navButtonStyle = {
  width: 44,
  height: 44,
  borderRadius: 12,
  border: '1px solid var(--border-light)',
  background: '#fff',
  color: 'var(--text-secondary)',
  fontSize: 24,
  lineHeight: 1,
  cursor: 'pointer',
};
