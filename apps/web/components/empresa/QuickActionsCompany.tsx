'use client';
import Link from 'next/link';
import { PlusIcon, FolderOpenIcon } from '@heroicons/react/24/outline';

export default function QuickActionsCompany() {
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
          href="/empresa/solicitacoes"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
            transition: 'transform 0.1s',
          }}
        >
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '8px' }}>
            <PlusIcon style={{ width: 18, height: 18 }} />
          </div>
          Nova Solicitação
        </Link>

        <Link
          href="/empresa/documentos"
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
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '6px', borderRadius: '8px' }}>
            <FolderOpenIcon style={{ width: 18, height: 18 }} />
          </div>
          Gerenciar Documentos
        </Link>
      </div>
    </div>
  );
}
