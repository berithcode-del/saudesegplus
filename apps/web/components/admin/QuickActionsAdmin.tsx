'use client';
import Link from 'next/link';
import { ClipboardDocumentCheckIcon, UserPlusIcon } from '@heroicons/react/24/outline';

export default function QuickActionsAdmin() {
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
          href="/admin/empresas/pendentes"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
            color: 'white',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
            transition: 'transform 0.1s',
          }}
        >
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '8px' }}>
            <ClipboardDocumentCheckIcon style={{ width: 18, height: 18 }} />
          </div>
          Empresas Pendentes
        </Link>

        <Link
          href="/admin/medicos/novo"
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
          <div style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', padding: '6px', borderRadius: '8px' }}>
            <UserPlusIcon style={{ width: 18, height: 18 }} />
          </div>
          Novo Médico
        </Link>
      </div>
    </div>
  );
}
