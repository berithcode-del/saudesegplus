'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentTextIcon, MagnifyingGlassIcon, UserCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { apiMedicalSearch } from '../app/lib/api';

interface PatientResult {
  id: string;
  name: string;
  cpf?: string;
  lastExamAt?: string;
  processoNumero?: string | null;
  examRequestId?: string | null;
}

interface ProtocolResult {
  id: string;
  numeroProtocolo: string;
  patientName?: string | null;
  status?: string;
  examRequestId?: string | null;
}

interface SearchResult {
  patients: PatientResult[];
  protocols: ProtocolResult[];
}

export default function MedicalCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult>({ patients: [], protocols: [] });

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults({ patients: [], protocols: [] });
      return;
    }
    const timeout = window.setTimeout(() => {
      setLoading(true);
      apiMedicalSearch(trimmed)
        .then((data) => setResults(data as SearchResult))
        .catch(() => setResults({ patients: [], protocols: [] }))
        .finally(() => setLoading(false));
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const hasResults = useMemo(
    () => results.patients.length > 0 || results.protocols.length > 0,
    [results],
  );

  const goToRequest = (examRequestId?: string | null) => {
    if (!examRequestId) return;
    setOpen(false);
    router.push(`/medico/consulta/${examRequestId}`);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: '#f4f5fb',
          border: '1.5px solid #e5e7eb',
          borderRadius: '999px',
          padding: '10px 18px',
          width: '280px',
          cursor: 'pointer',
          color: '#6b7280',
          fontSize: '14px',
          textAlign: 'left',
        }}
      >
        <MagnifyingGlassIcon style={{ width: 18, height: 18, color: '#9ca3af', flexShrink: 0 }} />
        <span style={{ flex: 1 }}>Buscar paciente ou ASO</span>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>Ctrl K</span>
      </button>

      {open && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            background: 'rgba(15, 23, 42, 0.35)',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '9vh',
          }}
        >
          <div className="card" style={{ width: 'min(720px, calc(100vw - 32px))', maxHeight: '76vh', padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', borderBottom: '1px solid var(--border-light)' }}>
              <MagnifyingGlassIcon className="icon icon-sm" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Digite ao menos 3 caracteres"
                style={{ border: 'none', outline: 'none', flex: 1, fontSize: 16, background: 'transparent' }}
              />
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} aria-label="Fechar busca">
                <XMarkIcon className="icon icon-sm" />
              </button>
            </div>
            <div style={{ padding: 18, overflowY: 'auto', maxHeight: 'calc(76vh - 70px)' }}>
              {query.trim().length < 3 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Busque por nome do paciente ou código do prontuário.</p>
              ) : loading ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Buscando...</p>
              ) : !hasResults ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Nenhum resultado encontrado no seu escopo.</p>
              ) : (
                <div style={{ display: 'grid', gap: 18 }}>
                  {results.patients.length > 0 && (
                    <section>
                      <h3 style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Pacientes</h3>
                      {results.patients.map((patient) => (
                        <button key={patient.id} type="button" onClick={() => goToRequest(patient.examRequestId)} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 6 }}>
                          <UserCircleIcon className="icon icon-sm" />
                          <span style={{ textAlign: 'left' }}>{patient.name} · {patient.cpf ?? 'CPF protegido'} {patient.processoNumero ? `· ${patient.processoNumero}` : ''}</span>
                        </button>
                      ))}
                    </section>
                  )}
                  {results.protocols.length > 0 && (
                    <section>
                      <h3 style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Prontuários ASO</h3>
                      {results.protocols.map((protocol) => (
                        <button key={protocol.id} type="button" onClick={() => goToRequest(protocol.examRequestId)} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 6 }}>
                          <DocumentTextIcon className="icon icon-sm" />
                          <span style={{ textAlign: 'left' }}>{protocol.numeroProtocolo} · {protocol.patientName ?? 'Paciente não vinculado'} · {protocol.status}</span>
                        </button>
                      ))}
                    </section>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
