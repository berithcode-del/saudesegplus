'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import ChatWidget from '../../components/ChatWidget';
import OperatorInboxButton from '../../components/OperatorInboxButton';
import { apiFetch } from '../lib/api';

const navItems = [
  { href: '/consultorio', icon: BuildingOfficeIcon },
  { href: '/consultorio/pacientes', icon: UserGroupIcon },
  { href: '/consultorio/check-in', icon: PlusIcon },
  { href: '/consultorio/asos', icon: DocumentTextIcon },
  { href: '/consultorio/financeiro', icon: CurrencyDollarIcon },
  { href: '/consultorio/configuracoes', icon: Cog6ToothIcon },
];

export default function ConsultorioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [activeActor, setActiveActor] = useState<{ name: string; type: string } | null>(null);

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then((result: any) => {
        const currentRole = result?.role ?? result?.user?.role ?? null;
        setRole(currentRole);
        setActiveActor(result?.activeActor ?? null);
        if (currentRole === 'CLINIC' && !['/consultorio/selecionar-perfil', '/consultorio/configuracoes'].includes(pathname)) {
          router.replace('/consultorio/selecionar-perfil');
        }
      })
      .catch(() => setRole(null));
  }, [pathname, router]);

  const switchActor = async () => {
    try {
      await apiFetch('/api/auth/clinic-workspace/end', { method: 'POST' });
    } catch {
      // A troca local ainda deve funcionar caso a sessão já tenha expirado no servidor.
    }
    const workspaceToken = localStorage.getItem('clinicWorkspaceToken');
    if (workspaceToken) {
      localStorage.setItem('token', workspaceToken);
      sessionStorage.setItem('token', workspaceToken);
    }
    router.replace('/consultorio/selecionar-perfil');
    router.refresh();
  };

  const visibleNavItems = navItems.filter((item) => {
    if (role === 'OPERATOR' && item.href === '/consultorio/financeiro') return false;
    if (
      role === 'DOCTOR' &&
      ['/consultorio/asos', '/consultorio/financeiro', '/consultorio/configuracoes'].includes(item.href)
    ) return false;
    return true;
  });

  return (
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-mark">
            <img src="/LogoWhite.svg" alt="SaudeSeg+" />
            </div>
          </div>
          <nav className="nav-section">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              >
                <item.icon className="icon nav-icon" />
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
          {activeActor && pathname !== '/consultorio/selecionar-perfil' && (
            <div style={{ margin: '14px 24px 0', padding: '10px 14px', border: '1px solid #c7d2fe', borderRadius: 12, background: '#eef2ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#3730a3', fontSize: 13 }}><strong>Profissional ativo:</strong> {activeActor.name} · {activeActor.type === 'DOCTOR' ? 'Médico' : 'Operador'}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <OperatorInboxButton />
                <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={switchActor}>Trocar profissional</button>
              </div>
            </div>
          )}
          {children}
        </main>
        <ChatWidget perfil="CLINICA" />
      </div>
  );
}
