'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  HeartIcon,
  ArrowRightOnRectangleIcon,
  ChartBarSquareIcon,
  ClockIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  BellIcon,
  Cog8ToothIcon,
} from '@heroicons/react/24/outline';
import ChatWidget from '../../components/ChatWidget';

const navItems = [
  { href: '/medico', icon: ChartBarSquareIcon, label: 'Dashboard' },
  { href: '/medico/fila', icon: HeartIcon, label: 'Fila' },
  { href: '/medico/historico', icon: ClockIcon, label: 'Histórico' },
  { href: '/medico/configuracao', icon: Cog6ToothIcon, label: 'Configuração' },
];

export default function MedicoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [search, setSearch] = useState('');

  return (
      <div className="app-shell">
      {/* ── Sidebar ────────────────────────────── */}
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

      {/* ── Main Content ───────────────────────── */}
      <main className="main-content">
        {/* Topbar com busca */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '28px',
          }}
        >
          {/* Barra de Pesquisa */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#f4f5fb',
              border: '1.5px solid #e5e7eb',
              borderRadius: '999px',
              padding: '10px 18px',
              width: '280px',
              transition: 'all 0.2s ease',
            }}
          >
            <MagnifyingGlassIcon
              style={{ width: 18, height: 18, color: '#9ca3af', flexShrink: 0 }}
            />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '14px',
                color: '#1e1b4b',
                width: '100%',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Ações da direita */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Sino de notificações */}
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
                position: 'relative',
              }}
            >
              <BellIcon style={{ width: 18, height: 18, color: '#6b7280' }} />
              {/* Bolinha indicadora */}
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#ef4444',
                  border: '2px solid #fff',
                }}
              />
            </button>

            {/* Engrenagem de config */}
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

            {/* Divisor */}
            <div style={{ width: 1, height: 28, background: '#e5e7eb' }} />

            {/* Avatar + Nome */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  textAlign: 'right',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e1b4b' }}>
                  Dr(a). Médico(a)
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>Clínico Geral</div>
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
                M
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo da página */}
        {children}
        <ChatWidget perfil="MEDICO" />
      </main>
      </div>
  );
}