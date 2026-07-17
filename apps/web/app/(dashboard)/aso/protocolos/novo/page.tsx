'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { asoProtocoloApi } from '@/lib/api/aso-protocolo';
import type { CreateProtocoloDto, TipoExame } from '@/lib/types/aso-protocolo';
import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const tipoExameOptions = [
  { value: 'ADMISSIONAL', label: 'Admissional' },
  { value: 'PERIODICO', label: 'Periódico' },
  { value: 'DEMISSIONAL', label: 'Demissional' },
  { value: 'MUDANCA_FUNCAO', label: 'Mudança de Função' },
  { value: 'RETORNO_TRABALHO', label: 'Retorno ao Trabalho' },
];

export default function NovoProtocoloPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateProtocoloDto>({
    empresaId: '',
    clinicaId: '',
    pacienteId: '',
    tipoExame: 'ADMISSIONAL',
    observacoes: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await asoProtocoloApi.create(form);
      router.push(`/aso/protocolos/${res.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar protocolo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>Novo Protocolo ASO</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Crie um novo processo de ASO manualmente</p>
        </div>
        <a href="/aso/protocolos">
          <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowPathIcon className="icon" /> Voltar
          </button>
        </a>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: '24px' }}>
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="label">Empresa (ID)</label>
            <input
              type="text"
              className="input"
              placeholder="ID da empresa"
              value={form.empresaId}
              onChange={(e) => handleChange('empresaId', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Clínica (ID)</label>
            <input
              type="text"
              className="input"
              placeholder="ID da clínica"
              value={form.clinicaId}
              onChange={(e) => handleChange('clinicaId', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Paciente (ID)</label>
            <input
              type="text"
              className="input"
              placeholder="ID do paciente"
              value={form.pacienteId}
              onChange={(e) => handleChange('pacienteId', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Tipo de Exame</label>
            <select
              className="select"
              value={form.tipoExame}
              onChange={(e) => handleChange('tipoExame', e.target.value)}
              required
            >
              {tipoExameOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Observações</label>
            <textarea
              className="input"
              rows={4}
              placeholder="Observações iniciais (opcional)"
              value={form.observacoes}
              onChange={(e) => handleChange('observacoes', e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <a href="/aso/protocolos">
              <button type="button" className="btn btn-secondary">Cancelar</button>
            </a>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {loading ? (
                <>
                  <CheckCircleIcon className="icon animate-spin" /> Criando...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="icon" /> Criar Protocolo
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}