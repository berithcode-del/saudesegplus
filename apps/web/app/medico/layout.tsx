'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  HeartIcon,
  ArrowRightOnRectangleIcon,
  ChartBarSquareIcon,
  ClockIcon,
  Cog6ToothIcon,
  Cog8ToothIcon,
} from '@heroicons/react/24/outline';
import ChatWidget from '../../components/ChatWidget';
import MedicalCommandPalette from '../../components/MedicalCommandPalette';
import OperatorInboxButton from '../../components/OperatorInboxButton';
import { apiGetMedicoProfile, getProfileIdFromToken } from '../../lib/api';

interface DoctorProfileSummary {
  id?: string;
  name?: string;
  gender?: string | null;
  specialties?: string | null;
}

const navItems = [
  { href: '/medico', icon: ChartBarSquareIcon, label: 'Dashboard' },
  { href: '/medico/fila', icon: HeartIcon, label: 'Fila' },
  { href: '/medico/historico', icon: ClockIcon, label: 'Histórico' },
  { href: '/medico/configuracao', icon: Cog6ToothIcon, label: 'Configuração' },
];

export default function MedicoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [doctorName, setDoctorName] = useState('Médico(a)');
  const [doctorSpecialty, setDoctorSpecialty] = useState('Clínico Geral');
  const [doctorGender, setDoctorGender] = useState<string | null>(null);

  useEffect(() => {
    const doctorId = getProfileIdFromToken();
    if (!doctorId) return;

    apiGetMedicoProfile(doctorId)
      .then((result) => {
        if ((result as { success?: boolean })?.success === false) return;
        const profile =
          ((result as { data?: DoctorProfileSummary }).data ??
            result) as DoctorProfileSummary;
        if (profile?.name) setDoctorName(profile.name);
        if (profile?.specialties) setDoctorSpecialty(profile.specialties);
        if (profile?.gender) setDoctorGender(profile.gender);
      })
      .catch(() => {});
  }, []);

  const doctorPrefix =
    doctorGender === 'female'
      ? 'Dra.'
      : doctorGender === 'male'
        ? 'Dr.'
        : 'Dr(a).';
  const doctorInitial = doctorName?.trim()?.[0]?.toUpperCase() || 'M';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <img src="/LogoWhite.svg" alt="SaudeSeg+" />
          </div>
        </div>
        <nav className="nav-section">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
              data-tour={item.href.includes('config') ? 'configuracao' : undefined}
            >
              <item.icon className="icon nav-icon" />
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <Link href="/">
            <ArrowRightOnRectangleIcon className="icon" />
          </Link>
        </div>
      </aside>

      <main className="main-content">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '28px',
          }}
        >
          <MedicalCommandPalette />

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <OperatorInboxButton />

            <button
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                border: '1.5px solid #e5e7eb',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Cog8ToothIcon style={{ width: 18, height: 18, color: '#6b7280' }} />
            </button>

            <div style={{ width: 1, height: 28, background: '#e5e7eb' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  textAlign: 'right',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e1b4b' }}>
                  {doctorPrefix} {doctorName}
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                  {doctorSpecialty}
                </div>
              </div>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '15px',
                  boxShadow: '0 2px 10px rgba(79,70,229,0.3)',
                  flexShrink: 0,
                }}
              >
                {doctorInitial}
              </div>
            </div>
          </div>
        </div>

        {children}
        <ChatWidget perfil="MEDICO" />
      </main>
    </div>
  );
}
