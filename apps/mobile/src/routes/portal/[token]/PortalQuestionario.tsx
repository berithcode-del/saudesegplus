import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuestionDraft } from '../../../hooks/useQuestionDraft';
import { useApiClient } from '../../../app/providers/ApiProvider';
import { useOfflineQueue } from '../../../hooks/useOfflineQueue';
import { useConnectionStatus } from '../../../hooks/useConnectionStatus';
import type { QuestionDraft, TabagismoOption, AlcoolOption } from '../../../lib/questionDraft';

interface Step {
  id: string;
  title: string;
  render: (draft: QuestionDraft, update: (p: Partial<QuestionDraft>) => void) => React.ReactNode;
  canAdvance: (d: QuestionDraft) => boolean;
}

export function PortalQuestionario() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const apiClient = useApiClient();
  const { draft, update, loaded } = useQuestionDraft(token ?? '');
  const connection = useConnectionStatus();
  const { enqueue } = useOfflineQueue();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queued, setQueued] = useState(false);

  const steps = useMemo<Step[]>(
    () => [
      {
        id: 'queixas',
        title: 'Queixas de Saúde',
        render: (d, upd) => <TextStep question="Você tem alguma queixa de saúde atual?" value={d.queixas} onChange={v => upd({ queixas: v })} placeholder="Ex: dor nas costas, dor de cabeça frequente..." />,
        canAdvance: () => true,
      },
      {
        id: 'doencas',
        title: 'Doenças Prévias',
        render: (d, upd) => <TextStep question="Possui doenças prévias diagnosticadas?" value={d.doencasPrevias} onChange={v => upd({ doencasPrevias: v })} placeholder="Ex: hipertensão, diabetes..." />,
        canAdvance: () => true,
      },
      {
        id: 'medicamentos',
        title: 'Medicamentos',
        render: (d, upd) => <TextStep question="Faz uso de algum medicamento?" value={d.medicamentosEmUso} onChange={v => upd({ medicamentosEmUso: v })} placeholder="Liste os medicamentos que utiliza..." />,
        canAdvance: () => true,
      },
      {
        id: 'alergias',
        title: 'Alergias',
        render: (d, upd) => <TextStep question="Possui alergias conhecidas?" value={d.alergiasConhecidas} onChange={v => upd({ alergiasConhecidas: v })} placeholder="Ex: penicilina, dipirona, látex..." />,
        canAdvance: () => true,
      },
      {
        id: 'cirurgias',
        title: 'Cirurgias',
        render: (d, upd) => <TextStep question="Já realizou cirurgias?" value={d.cirurgiasPrevias} onChange={v => upd({ cirurgiasPrevias: v })} placeholder="Liste cirurgias já realizadas..." />,
        canAdvance: () => true,
      },
      {
        id: 'tabagismo',
        title: 'Tabagismo',
        render: (d, upd) => (
          <ChoiceStep
            question="Você fuma ou já fumou?"
            options={[
              { value: 'NUNCA', label: 'Nunca fumou' },
              { value: 'FUMante', label: 'Fumante atual' },
              { value: 'EX_FUMANTE', label: 'Ex-fumante' },
            ]}
            value={d.tabagismo}
            onChange={v => upd({ tabagismo: v as TabagismoOption })}
          >
            {d.tabagismo === 'FUMante' || d.tabagismo === 'EX_FUMANTE' ? (
              <div>
                <label style={labelStyle}>Quantos anos / cigarros por dia?</label>
                <textarea
                  value={d.tabagismoDetalhe}
                  onChange={e => upd({ tabagismoDetalhe: e.target.value })}
                  placeholder="Ex: 10 cigarros/dia por 5 anos"
                  style={taStyle}
                />
              </div>
            ) : null}
          </ChoiceStep>
        ),
        canAdvance: d => d.tabagismo !== '',
      },
      {
        id: 'alcool',
        title: 'Álcool',
        render: (d, upd) => (
          <ChoiceStep
            question="Como é seu consumo de álcool?"
            options={[
              { value: 'NAO', label: 'Não bebo' },
              { value: 'OCASIONAL', label: 'Ocasionalmente' },
              { value: 'FREQUENTE', label: 'Frequentemente' },
            ]}
            value={d.alcool}
            onChange={v => upd({ alcool: v as AlcoolOption })}
          >
            {d.alcool === 'OCASIONAL' || d.alcool === 'FREQUENTE' ? (
              <div>
                <label style={labelStyle}>Frequência e quantidade</label>
                <textarea
                  value={d.alcoolDetalhe}
                  onChange={e => upd({ alcoolDetalhe: e.target.value })}
                  placeholder="Ex: 2 cervejas aos finais de semana"
                  style={taStyle}
                />
              </div>
            ) : null}
          </ChoiceStep>
        ),
        canAdvance: d => d.alcool !== '',
      },
      {
        id: 'atividade',
        title: 'Atividade Física',
        render: (d, upd) => <TextStep question="Pratica atividade física?" value={d.atividadeFisica} onChange={v => upd({ atividadeFisica: v })} placeholder="Ex: caminhada 3x por semana, 30min" />,
        canAdvance: () => true,
      },
      {
        id: 'sono',
        title: 'Qualidade do Sono',
        render: (d, upd) => <TextStep question="Como está a qualidade do seu sono?" value={d.sono} onChange={v => upd({ sono: v })} placeholder="Ex: durmo 8h, durmo bem" />,
        canAdvance: () => true,
      },
    ],
    [],
  );

  const [stepIdx, setStepIdx] = useState(0);
  const step = steps[stepIdx];
  const progresso = ((stepIdx + 1) / steps.length) * 100;

  const handleSubmit = useCallback(async () => {
    if (!draft.declaracaoVeracidade) {
      setError('É necessário declarar que as informações são verdadeiras.');
      setStepIdx(steps.length);
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      queixas: draft.queixas || undefined,
      doencasPrevias: draft.doencasPrevias || undefined,
      medicamentosEmUso: draft.medicamentosEmUso || undefined,
      alergiasConhecidas: draft.alergiasConhecidas || undefined,
      cirurgiasPrevias: draft.cirurgiasPrevias || undefined,
      observacoes: draft.observacoes || undefined,
      tabagismo: draft.tabagismo || undefined,
      tabagismoDetalhe: draft.tabagismoDetalhe || undefined,
      alcool: draft.alcool || undefined,
      alcoolDetalhe: draft.alcoolDetalhe || undefined,
      atividadeFisica: draft.atividadeFisica || undefined,
      sono: draft.sono || undefined,
      declaracaoVeracidade: draft.declaracaoVeracidade,
    };

    if (connection === 'disconnected') {
      await enqueue('/api/portal/questionario', 'POST', payload);
      setQueued(true);
      setSubmitting(false);
      return;
    }

    try {
      await apiClient.fetch('/api/portal/questionario', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      navigate(`/p/${token}/documentos`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar questionário. Dados salvos localmente.');
      await enqueue('/api/portal/questionario', 'POST', payload);
      setQueued(true);
    } finally {
      setSubmitting(false);
    }
  }, [draft, connection, apiClient, enqueue, navigate, token, steps.length]);

  const avancar = useCallback(() => {
    if (stepIdx < steps.length - 1) {
      setStepIdx(i => i + 1);
      setError(null);
    } else {
      handleSubmit();
    }
  }, [stepIdx, steps.length, handleSubmit]);

  const voltar = useCallback(() => {
    if (stepIdx > 0) {
      setStepIdx(i => i - 1);
      setError(null);
    }
  }, [stepIdx]);

  if (!loaded) {
    return (
      <div style={{ padding: 24, textAlign: 'center', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <SpinnerInline />
        <p style={{ marginTop: 16, color: 'var(--text-secondary)', fontSize: 14 }}>Carregando rascunho...</p>
      </div>
    );
  }

  const isConfirmStep = stepIdx === steps.length - 1;
  const canAdvance = step?.canAdvance(draft) ?? false;

  if (!step) return <QuestionarioLoadingScreen />;

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: '0 auto', minHeight: '100%', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: 6 }}>
          Etapa {stepIdx + 1} de {steps.length}
        </div>
        <div style={{ height: 4, backgroundColor: 'var(--bg-input)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progresso}%`, backgroundColor: 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 500, marginTop: 12, color: 'var(--text-primary)' }}>{step.title}</h2>
      </div>

      <div style={{ flex: 1 }}>{step.render(draft, update)}</div>

      {queued && (
        <div role="status" style={{ padding: 12, marginBottom: 12, backgroundColor: 'rgba(251, 146, 60, 0.08)', color: '#c2410c', borderRadius: 12, fontSize: 14, minHeight: 48, display: 'flex', alignItems: 'center' }}>
          Salvo localmente. Será enviado quando a conexão voltar.
        </div>
      )}

      {error && (
        <div role="alert" style={{ padding: 16, marginBottom: 12, backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--accent-danger)', borderRadius: 12, fontSize: 14, minHeight: 48, display: 'flex', alignItems: 'center' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, paddingTop: 16, paddingBottom: 'calc(24px + var(--safe-bottom))' }}>
        {stepIdx > 0 && (
          <button onClick={voltar} className="btn btn-secondary" style={{ flex: 1 }}>
            Voltar
          </button>
        )}
        <button
          onClick={avancar}
          disabled={!canAdvance || submitting}
          className="btn btn-primary"
          style={{
            flex: stepIdx > 0 ? 2 : 1,
            opacity: !canAdvance || submitting ? 0.5 : 1,
            cursor: !canAdvance || submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Enviando...' : stepIdx < steps.length - 1 ? 'Avançar' : 'Finalizar'}
        </button>
      </div>
    </div>
  );
}

function TextStep({ question, value, onChange, placeholder }: { question: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 16, color: 'var(--text-primary)' }}>{question}</p>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input"
        style={taStyle}
      />
    </div>
  );
}

function ChoiceStep({
  question,
  options,
  value,
  onChange,
  children,
}: {
  question: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>{question}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map(o => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              padding: '16px',
              fontSize: 16,
              minHeight: 48,
              textAlign: 'left',
              border: value === o.value ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
              borderRadius: 12,
              backgroundColor: value === o.value ? 'rgba(79, 70, 229, 0.06)' : 'var(--bg-card)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
      {children && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, color: 'var(--text-secondary)' };
const taStyle: React.CSSProperties = { width: '100%', minHeight: 120, padding: 16, fontSize: 16, border: '1px solid var(--border-light)', borderRadius: 12, outline: 'none', resize: 'vertical', fontFamily: "'Inter', system-ui, sans-serif", backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' };

function SpinnerInline() {
  return (
    <>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border-light)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

function QuestionarioLoadingScreen() {
  return (
    <div style={{ padding: 24, textAlign: 'center', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <SpinnerInline />
      <p style={{ marginTop: 16, color: 'var(--text-secondary)', fontSize: 14 }}>Carregando questionario...</p>
    </div>
  );
}
