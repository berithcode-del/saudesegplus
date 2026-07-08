'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GreetingClinic from '../../components/consultorio/GreetingClinic';
import ClinicStats from '../../components/consultorio/ClinicStats';
import PatientQueueTable from '../../components/consultorio/PatientQueueTable';
import QuickActionsClinic from '../../components/consultorio/QuickActionsClinic';
import DailyFlowChart from '../../components/consultorio/DailyFlowChart';
import ScheduleCalendar from '../../components/dashboard/ScheduleCalendar';
import { apiGetEvents, apiFetch } from '../../lib/api';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

interface Solicitacao {
  id: string;
  examPurpose: string;
  status: string;
  createdAt: string;
  patient: { name: string; cpf: string };
  clinic?: { name: string; city: string; state: string } | null;
}

export default function ConsultorioDashboard() {
  const router = useRouter();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [clinicName, setClinicName] = useState<string>('Clínica');
  const [clinicId, setClinicId] = useState<string>('');
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const meResult = await apiFetch('/api/auth/me');
        const user = meResult?.user ?? meResult ?? {};
        const clinicProfile = user.clinicProfile;
        const operatorProfile = user.operatorProfile;

        if (!clinicProfile && !operatorProfile?.clinicId) {
          setClinicName('Clínica');
          setLoading(false);
          return;
        }

        const currentClinicId = clinicProfile?.id ?? operatorProfile.clinicId;
        const currentClinicName = clinicProfile?.name ?? 'ClÃ­nica';

        setClinicId(currentClinicId);
        setClinicName(currentClinicName);

        const [solRes, eventsData] = await Promise.all([
          fetch(`${BACKEND_URL}/api/solicitacoes`),
          apiGetEvents('clinic', currentClinicId),
        ]);
        const result = await solRes.json();
        const apiData = result.data?.data || result.data || [];
        const data = Array.isArray(apiData) ? apiData : [];
        setSolicitacoes(data);
        if (eventsData) setEvents(eventsData);
      } catch {
        console.error('Erro ao carregar solicitações');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
        <div data-tour="checkin">
          <GreetingClinic name={clinicName} />
        </div>
        <div data-tour="exames">
          <ClinicStats solicitacoes={solicitacoes} />
        </div>
        <div data-tour="pacientes">
          <PatientQueueTable solicitacoes={solicitacoes} />
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
        <QuickActionsClinic />
        <DailyFlowChart solicitacoes={solicitacoes} />
        <ScheduleCalendar
          ownerType="clinic"
          ownerId={clinicId}
          events={events}
          onEventCreated={() => {
            if (clinicId) apiGetEvents('clinic', clinicId).then(res => setEvents(res));
          }}
        />
      </div>
    </div>
  );
}
