'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  DocumentCheckIcon,
  FolderOpenIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import ChatWidget from '../../components/ChatWidget';

const navItems = [
  { href: '/empresa', icon: Squares2X2Icon },
  { href: '/empresa/solicitacoes', icon: ClipboardDocumentListIcon },
  { href: '/empresa/asos', icon: DocumentCheckIcon },
  { href: '/empresa/documentos', icon: FolderOpenIcon },
  { href: '/empresa/configuracoes', icon: Cog6ToothIcon },
];

export default function EmpresaLayout({ children }: { children: React.ReactNode }) {
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
        <ChatWidget perfil="EMPRESA" />
      </div>
  );
}
