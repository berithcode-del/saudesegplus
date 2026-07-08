'use client';
import Link from 'next/link';
import { UserPlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function QuickActionsClinic() {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: '0 4px 20px -2px rgba(149, 157, 165, 0.15)',
      }}
    >
      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e1b4b', marginBottom: '16px' }}>
        Ações Rápidas
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Link
          href="/consultorio/check-in"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
            color: 'white',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
            transition: 'transform 0.1s',
          }}
        >
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '8px' }}>
            <UserPlusIcon style={{ width: 18, height: 18 }} />
          </div>
          Novo Check-in
        </Link>

        <Link
          href="/consultorio/pacientes"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            background: '#f8fafc',
            border: '1px solid #e5e7eb',
            color: '#1e1b4b',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          <div style={{ background: 'rgba(13, 148, 136, 0.1)', color: '#0d9488', padding: '6px', borderRadius: '8px' }}>
            <MagnifyingGlassIcon style={{ width: 18, height: 18 }} />
          </div>
          Buscar Paciente
        </Link>
      </div>
    </div>
  );
}
