'use client';
import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, CalendarIcon, ArrowLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { apiCreateEvent, apiUpdateEvent, apiDeleteEvent } from '../../lib/api';

const WEEK_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function getWeekDates(baseDate: Date) {
  const dow = baseDate.getDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getMonthDates(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const dates = [];
  
  // Pad beginning
  const firstDow = firstDay.getDay(); // 0=Sun
  const diff = firstDow === 0 ? 6 : firstDow - 1;
  
  for (let i = diff; i > 0; i--) {
    const d = new Date(year, month, 1 - i);
    dates.push(d);
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    dates.push(new Date(year, month, i));
  }
  
  // Pad end to make 35 or 42 cells
  const remaining = dates.length % 7;
  if (remaining !== 0) {
    for (let i = 1; i <= 7 - remaining; i++) {
      dates.push(new Date(year, month + 1, i));
    }
  }
  
  return dates;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

interface ScheduleCalendarProps {
  ownerType?: 'doctor' | 'company' | 'clinic';
  ownerId?: string;
  solicitacoes?: any[];
  events?: any[];
  onEventCreated?: () => void;
}

export default function ScheduleCalendar({
  ownerType,
  ownerId,
  solicitacoes = [],
  events = [],
  onEventCreated,
}: ScheduleCalendarProps) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekBase, setWeekBase] = useState(today);
  const [monthBase, setMonthBase] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [view, setView] = useState<'week' | 'month' | 'form'>('week');
  const [loading, setLoading] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('Reunião');
  const [formDate, setFormDate] = useState('');

  const weekDates = getWeekDates(weekBase);
  const monthDates = getMonthDates(monthBase.getFullYear(), monthBase.getMonth());

  const prevWeek = () => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() - 7);
    setWeekBase(d);
  };

  const nextWeek = () => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() + 7);
    setWeekBase(d);
  };

  const prevMonth = () => {
    setMonthBase(new Date(monthBase.getFullYear(), monthBase.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setMonthBase(new Date(monthBase.getFullYear(), monthBase.getMonth() + 1, 1));
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerType || !ownerId) return alert('Sem identificação de usuário para criar evento.');
    try {
      setLoading(true);
      await apiCreateEvent({
        title: formTitle,
        type: formType,
        date: new Date(formDate).toISOString(),
        ownerType,
        ownerId,
      });
      setFormTitle('');
      setFormDate('');
      setView('week');
      if (onEventCreated) onEventCreated();
    } catch (err) {
      alert('Erro ao criar evento');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEvent = async (id: string, updates: { title?: string; type?: string; date?: string }) => {
    try {
      await apiUpdateEvent(id, updates);
      if (onEventCreated) onEventCreated();
    } catch (err) {
      alert('Erro ao atualizar evento');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;
    try {
      setDeleteLoading(id);
      await apiDeleteEvent(id);
      if (onEventCreated) onEventCreated();
    } catch (err) {
      alert('Erro ao excluir evento');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEditClick = (appt: any) => {
    setEditingEvent(appt);
    setFormTitle(appt.name);
    setFormType(appt.type);
    setFormDate(new Date(appt.id).toISOString().slice(0, 16));
    setView('form');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
      try {
        setLoading(true);
        await handleUpdateEvent(editingEvent.id, {
          title: formTitle,
          type: formType,
          date: new Date(formDate).toISOString(),
        });
        setEditingEvent(null);
        setFormTitle('');
        setFormDate('');
        setView('week');
        if (onEventCreated) onEventCreated();
      } catch (err) {} finally {
        setLoading(false);
      }
    } else {
      await handleCreateEvent(e);
    }
  };

  // Merge solicitacoes and events into grouped object
  const groupedAppointments = [...solicitacoes, ...events].reduce((acc, curr) => {
    const isEvent = !!curr.title; // If it has title, it's a CalendarEvent, else it's ExamRequest
    const date = new Date(isEvent ? curr.date : curr.createdAt);
    const dateKey = date.toDateString();
    
    if (!acc[dateKey]) acc[dateKey] = [];
    
    let type = isEvent ? curr.type : 'Retorno';
    let color = '#4f46e5';
    let name = isEvent ? curr.title : (curr.patient?.name || 'Exame Solicitado');

    if (!isEvent && curr.examPurpose === 'admissional') {
      type = 'Novo Paciente';
      color = '#22c55e';
    } else if (isEvent && type === 'Pessoal') {
      color = '#f59e0b';
    } else if (isEvent && type === 'Reunião') {
      color = '#0ea5e9';
    }

    acc[dateKey].push({
      id: curr.id,
      name,
      type,
      time: formatTime(date.toISOString()),
      color,
    });
    
    return acc;
  }, {} as Record<string, any[]>);

  const selectedKey = selectedDate.toDateString();
  const appointments = groupedAppointments[selectedKey] || [];
  const firstDate = weekDates[0] || new Date();
  const weekMonthLabel = `${MONTHS[firstDate.getMonth()]} ${firstDate.getFullYear()}`;
  const monthViewLabel = `${MONTHS[monthBase.getMonth()]} ${monthBase.getFullYear()}`;

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: '0 4px 20px -2px rgba(149, 157, 165, 0.15)',
        transition: 'height 0.3s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {view === 'week' && (
            <>
              <button onClick={prevWeek} style={btnNavStyle}><ChevronLeftIcon style={iconStyle} /></button>
              <button onClick={nextWeek} style={btnNavStyle}><ChevronRightIcon style={iconStyle} /></button>
            </>
          )}
          {view === 'month' && (
            <>
              <button onClick={prevMonth} style={btnNavStyle}><ChevronLeftIcon style={iconStyle} /></button>
              <button onClick={nextMonth} style={btnNavStyle}><ChevronRightIcon style={iconStyle} /></button>
            </>
          )}
          {view === 'form' && (
            <button onClick={() => setView('week')} style={{ ...btnNavStyle, width: 'auto', padding: '0 12px' }}>
              <ArrowLeftIcon style={{ ...iconStyle, marginRight: 4 }} /> Voltar
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setView(view === 'month' ? 'week' : 'month')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              background: view === 'month' ? '#4f46e5' : '#f8fafc',
              fontSize: '13px',
              fontWeight: 600,
              color: view === 'month' ? 'white' : '#4f46e5',
              cursor: 'pointer',
            }}
          >
            <CalendarIcon style={{ width: 14, height: 14 }} />
            {view === 'month' ? monthViewLabel : weekMonthLabel}
          </button>
          
          <button
            onClick={() => setView('form')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '10px',
              border: 'none',
              background: '#4f46e5',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            <PlusIcon style={{ width: 18, height: 18 }} />
          </button>
        </div>
      </div>

      {/* --- WEEK VIEW --- */}
      {view === 'week' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px', marginBottom: '20px' }}>
            {weekDates.map((date, idx) => {
              const isToday = date.toDateString() === today.toDateString();
              const isSelected = date.toDateString() === selectedDate.toDateString();
              const hasAppt = (groupedAppointments[date.toDateString()]?.length ?? 0) > 0;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(date)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 4px',
                    borderRadius: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    background: isSelected ? '#4f46e5' : isToday ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 500, color: isSelected ? 'rgba(255,255,255,0.8)' : '#9ca3af' }}>{WEEK_DAYS[idx]}</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: isSelected ? 'white' : isToday ? '#4f46e5' : '#1e1b4b' }}>{date.getDate()}</span>
                  {hasAppt && <div style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.7)' : '#4f46e5' }} />}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {appointments.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '10px' }}>Nenhum compromisso marcado.</div>
            ) : (
              appointments.map((appt: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: '10px', background: '#f8fafc', borderLeft: `3px solid ${appt.color}`, gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e1b4b' }}>{appt.name}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{appt.type}</div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>{appt.time}</div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleEditClick(appt)}
                      style={{ padding: '4px', borderRadius: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                      title="Editar"
                    >
                      <PencilIcon style={{ width: 14, height: 14, color: '#4f46e5' }} />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(appt.id)}
                      disabled={deleteLoading === appt.id}
                      style={{ padding: '4px', borderRadius: '4px', border: 'none', background: 'transparent', cursor: deleteLoading === appt.id ? 'not-allowed' : 'pointer' }}
                      title="Excluir"
                    >
                      <TrashIcon style={{ width: 14, height: 14, color: '#ef4444' }} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* --- MONTH VIEW --- */}
      {view === 'month' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
            {WEEK_DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#9ca3af' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {monthDates.map((date, idx) => {
              const isToday = date.toDateString() === today.toDateString();
              const isCurrentMonth = date.getMonth() === monthBase.getMonth();
              const hasAppt = (groupedAppointments[date.toDateString()]?.length ?? 0) > 0;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDate(date);
                    setWeekBase(date);
                    setView('week');
                  }}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '8px',
                    border: '1px solid #f3f4f6',
                    background: isToday ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    opacity: isCurrentMonth ? 1 : 0.3,
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: isToday ? 700 : 500, color: isToday ? '#4f46e5' : '#1e1b4b' }}>
                    {date.getDate()}
                  </span>
                  {hasAppt && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#4f46e5' }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* --- FORM VIEW --- */}
      {view === 'form' && (
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4b5563', marginBottom: '6px' }}>{editingEvent ? 'Editar Compromisso' : 'Novo Compromisso'}</label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              placeholder="Ex: Reunião de Alinhamento"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4b5563', marginBottom: '6px' }}>Data e Hora</label>
            <input
              type="datetime-local"
              required
              value={formDate}
              onChange={e => setFormDate(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4b5563', marginBottom: '6px' }}>Tipo</label>
            <select
              value={formType}
              onChange={e => setFormType(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '14px', background: 'white' }}
            >
              <option>Reunião</option>
              <option>Pessoal</option>
              <option>Retorno</option>
              <option>Plantão</option>
              <option>Outros</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              padding: '12px',
              background: '#4f46e5',
              color: 'white',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Salvando...' : editingEvent ? 'Atualizar Compromisso' : 'Salvar Compromisso'}
          </button>
        </form>
      )}
    </div>
  );
}

const btnNavStyle = {
  width: 28,
  height: 28,
  borderRadius: '50%',
  border: '1px solid #e5e7eb',
  background: 'transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
const iconStyle = { width: 14, height: 14, color: '#6b7280' };
