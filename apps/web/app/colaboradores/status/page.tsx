'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { apiGetColaboradorSolicitacoes } from '../../lib/api';

interface ExamRequestView {
  id: string;
  status: string;
  examPurpose: string;
  createdAt: string;
  clinic?: { name: string } | null;
}

const STATUS_LABEL: Record<string, string> = {
  AGUARDANDO_COLETA: 'Aguardando coleta de exames',
  NA_FILA_MEDICA: 'Na fila para atendimento médico',
  EM_COLETA: 'Em coleta de exames',
  EM_ATENDIMENTO_MEDICO: 'Em atendimento médico',
  CONCLUIDO: 'Concluído — ASO emitido',
};

function StatusContent() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get('id') ?? (typeof window !== 'undefined' ? window.localStorage.getItem('colaboradorPatientId') ?? '' : '');

  const [requests, setRequests] = useState<ExamRequestView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!patientId) {
      setLoading(false);
      setError('Não foi possível identificar seu cadastro. Use o link de status enviado após o cadastro.');
      return;
    }
    apiGetColaboradorSolicitacoes(patientId)
      .then((res) => setRequests(res.data ?? []))
      .catch(() => setError('Não foi possível carregar suas solicitações.'))
      .finally(() => setLoading(false));
  }, [patientId]);

  return (
    <div className="login-bg">
      <div className="login-card" style={{ maxWidth: '520px' }}>
        <div className="login-logo-wrap">
          <div className="login-logo-icon">✚</div>
          <span className="login-logo-text">
            Saúde<span>Seg</span>+
          </span>
        </div>
        <p className="login-subtitle">Minhas Solicitações de Exame</p>

        {loading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando...</p>}

        {error && (
          <div className="login-hint" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {!loading && !error && requests.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            Nenhuma solicitação encontrada ainda.
          </p>
        )}

        {requests.map((req) => (
          <div key={req.id} className="card" style={{ marginBottom: '12px', padding: '16px' }}>
            <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{req.examPurpose}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {STATUS_LABEL[req.status] ?? req.status}
            </div>
            {req.clinic?.name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                <BuildingOfficeIcon className="icon icon-xs" />
                {req.clinic.name}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ColaboradorStatusPage() {
  return (
    <Suspense fallback={<div className="login-bg"><div className="login-card"><p style={{ textAlign: 'center' }}>Carregando...</p></div></div>}>
      <StatusContent />
    </Suspense>
  );
}
