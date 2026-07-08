'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import ChatWidget from '../../components/ChatWidget';

const navItems = [
  { href: '/consultorio', icon: BuildingOfficeIcon },
  { href: '/consultorio/pacientes', icon: UserGroupIcon },
  { href: '/consultorio/check-in', icon: PlusIcon },
  { href: '/consultorio/financeiro', icon: CurrencyDollarIcon },
  { href: '/consultorio/configuracoes', icon: Cog6ToothIcon },
];

export default function ConsultorioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
        <main className="main-content">{children}</main>
        <ChatWidget perfil="CLINICA" />
      </div>
  );
}