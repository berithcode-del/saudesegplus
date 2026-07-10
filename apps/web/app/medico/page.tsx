'use client';
import { useEffect, useState } from 'react';
import GreetingSection from '../../components/dashboard/GreetingSection';
import ScheduleCalendar from '../../components/dashboard/ScheduleCalendar';
import WeeklyReports from '../../components/dashboard/WeeklyReports';
import AppointmentsTable from '../../components/dashboard/AppointmentsTable';
import PatientsChart from '../../components/dashboard/PatientsChart';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { apiGetMedicoProfile, apiGetMedicoSolicitacoes, apiGetEvents, getProfileIdFromToken } from '../../lib/api';

export default function MedicoDashboard() {
  const [doctorId, setDoctorId] = useState('');
  const [doctorProfile, setDoctorProfile] = useState<{ name: string; gender?: string | null; specialties?: string } | null>(null);
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setDoctorId(getProfileIdFromToken() ?? '');
  }, []);

  useEffect(() => {
    if (!doctorId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Calcula semana atual (Segunda a Domingo)
        const today = new Date();
        const dow = today.getDay();
        const diff = dow === 0 ? -6 : 1 - dow;
        const monday = new Date(today);
        monday.setDate(today.getDate() + diff);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        const [profileRes, solRes, eventsRes] = await Promise.all([
          apiGetMedicoProfile(doctorId),
          apiGetMedicoSolicitacoes(doctorId, monday.toISOString(), sunday.toISOString()),
          apiGetEvents('doctor', doctorId)
        ]);

        if (profileRes?.data) setDoctorProfile(profileRes.data);
        if (solRes?.data) setSolicitacoes(Array.isArray(solRes.data) ? solRes.data : []);
        if (eventsRes) setEvents(eventsRes);
      } catch (err) {
        console.error('Erro ao buscar dados do dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [doctorId]);

  if (!doctorId) {
    return (
      <div style={{ padding: '0' }}>
        <div
          style={{
            marginBottom: '24px',
            padding: '20px 28px',
            background: '#fff',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 20px -2px rgba(149,157,165,0.15)',
          }}
        >
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Nenhum médico selecionado. Configure seu perfil para dados personalizados.
          </p>
          <Link
            href="/medico/configuracao"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '10px',
              background: '#4f46e5',
              color: 'white',
              fontWeight: 600,
              fontSize: '13px',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <Cog6ToothIcon style={{ width: 15, height: 15 }} />
            Configurar
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>Carregando painel...</div>;
  }

  return (
    <>
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
          <div data-tour="fila">
            <GreetingSection name={doctorProfile?.name} gender={doctorProfile?.gender} />
          </div>
          <div data-tour="consulta">
            <WeeklyReports solicitacoes={solicitacoes} />
          </div>
          <div data-tour="historico">
            <AppointmentsTable solicitacoes={solicitacoes} />
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
          <ScheduleCalendar
            ownerType="doctor"
            ownerId={doctorId}
            solicitacoes={solicitacoes}
            events={events}
            onEventCreated={() => {
               apiGetEvents('doctor', doctorId).then(res => setEvents(res));
            }}
          />
          <PatientsChart solicitacoes={solicitacoes} />
        </div>
      </div>
    </>
  );
}
