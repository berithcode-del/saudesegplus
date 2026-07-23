'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, MagnifyingGlassIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { apiFetch } from '../../../lib/api';

type Doctor = { id: string; name: string; crmNumber: string; crmState: string; pinConfigured?: boolean };
type Membership = { id: string; doctor: Doctor };

export default function ClinicDoctorsPage() {
  const router = useRouter();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [available, setAvailable] = useState<Doctor[]>([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const result = await apiFetch('/api/clinic/doctors');
      setMemberships(Array.isArray(result?.data) ? result.data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const search = async () => {
    const result = await apiFetch(`/api/clinic/doctors/available?q=${encodeURIComponent(query)}`);
    setAvailable(Array.isArray(result?.data) ? result.data : []);
  };

  const associate = async () => {
    if (!selectedId) return;
    const result = await apiFetch('/api/clinic/doctors', {
      method: 'POST',
      body: JSON.stringify({ doctorId: selectedId, ...(pin ? { operationalPin: pin } : {}) }),
    });
    setMessage(`Médico associado. PIN operacional: ${result.data.operationalPin}`);
    setSelectedId(''); setPin('');
    await load();
  };

  const remove = async (doctorId: string) => {
    if (!window.confirm('Encerrar o vínculo deste médico com a clínica?')) return;
    await apiFetch(`/api/clinic/doctors/${doctorId}`, { method: 'DELETE' });
    await load();
  };

  return (
    <>
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => router.push('/consultorio/configuracoes')}><ArrowLeftIcon className="icon" /> Voltar</button>
        <h2 style={{ marginTop: 16 }}>Médicos da clínica</h2>
        <p>Associe médicos que poderão atuar nesta unidade e aparecer na antessala.</p>
      </div>
      {message && <div className="card" style={{ borderColor: '#86efac', background: '#f0fdf4', marginBottom: 18 }}>{message}</div>}
      <div className="card" style={{ marginBottom: 18 }}>
        <h3>Associar médico</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <MagnifyingGlassIcon style={{ width: 18, position: 'absolute', left: 12, top: 13, color: '#9ca3af' }} />
            <input className="form-input" style={{ paddingLeft: 38 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="Nome ou CRM" />
          </div>
          <button className="btn btn-ghost" onClick={search}>Buscar</button>
        </div>
        {available.length > 0 && (
          <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
            <select className="form-select" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
              <option value="">Selecione um médico</option>
              {available.map(doctor => <option key={doctor.id} value={doctor.id}>{doctor.name} · CRM {doctor.crmNumber}/{doctor.crmState}</option>)}
            </select>
            <input className="form-input" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="PIN de 6 dígitos (vazio para gerar automaticamente)" inputMode="numeric" />
            <button className="btn btn-primary" onClick={associate} disabled={!selectedId || Boolean(pin && pin.length !== 6)}><PlusIcon className="icon" /> Associar médico</button>
          </div>
        )}
      </div>
      <div className="card">
        <h3>Equipe médica ativa</h3>
        {loading ? <p>Carregando...</p> : memberships.length === 0 ? <p style={{ color: '#6b7280' }}>Nenhum médico associado.</p> : (
          <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
            {memberships.map(({ doctor }) => (
              <div key={doctor.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, border: '1px solid #e5e7eb', borderRadius: 12 }}>
                <div><strong>{doctor.name}</strong><div style={{ color: '#6b7280', fontSize: 13 }}>CRM {doctor.crmNumber}/{doctor.crmState} · {doctor.pinConfigured ? 'PIN configurado' : 'Sem PIN'}</div></div>
                <button className="btn btn-ghost" onClick={() => remove(doctor.id)}><TrashIcon className="icon" /> Encerrar vínculo</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
