import { Outlet } from 'react-router-dom';
import { MobileBottomNav } from '../../components/MobileBottomNav';

const consultorioNavItems = [
  { to: '/consultorio', label: 'Clinica', icon: 'building' as const, end: true },
  { to: '/consultorio/pacientes', label: 'Pacientes', icon: 'users' as const },
  { to: '/consultorio/check-in', label: 'Check-in', icon: 'plus' as const },
  { to: '/consultorio/financeiro', label: 'Financeiro', icon: 'dollar' as const },
  { to: '/consultorio/configuracoes', label: 'Config', icon: 'cog' as const },
];

export function ConsultorioLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, paddingBottom: 88 }}>
        <Outlet />
      </main>
      <MobileBottomNav items={consultorioNavItems} />
    </div>
  );
}
