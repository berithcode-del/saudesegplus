'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  HeartIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { FIELD_LIMITS } from '../../../../lib/formatUtils';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

type FormState = {
  queixas: string;
  doencasPrevias: string;
  medicamentosEmUso: string;
  alergiasConhecidas: string;
  cirurgiasPrevias: string;
  tabagismo: string;
  tabagismoDetalhe: string;
  alcool: string;
  alcoolDetalhe: string;
  atividadeFisica: string;
  sono: string;
  observacoes: string;
  declaracaoVeracidade: boolean;
};

const initialState: FormState = {
  queixas: '',
  doencasPrevias: '',
  medicamentosEmUso: '',
  alergiasConhecidas: '',
  cirurgiasPrevias: '',
  tabagismo: 'nao',
  tabagismoDetalhe: '',
  alcool: 'nao',
  alcoolDetalhe: '',
  atividadeFisica: 'nao_informado',
  sono: '',
  observacoes: '',
  declaracaoVeracidade: false,
};

const steps = [
  { title: 'Saude atual', subtitle: 'Conte se existe alguma queixa ou condicao importante.', Icon: HeartIcon },
  { title: 'Historico medico', subtitle: 'Informe antecedentes que ajudam o medico a avaliar o ASO.', Icon: ClipboardDocumentCheckIcon },
  { title: 'Habitos', subtitle: 'Responda sobre fumo, bebida, sono e atividade fisica.', Icon: ShieldCheckIcon },
  { title: 'Declaracao', subtitle: 'Revise e confirme a veracidade das informacoes.', Icon: CheckCircleIcon },
];

const choiceStyle = (active: boolean): React.CSSProperties => ({
  padding: '10px 12px',
  borderRadius: '12px',
  border: `1px solid ${active ? '#4f46e5' : '#e5e7eb'}`,
  background: active ? 'rgba(79,70,229,0.08)' : 'white',
  color: active ? '#3730a3' : '#374151',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
});

export default function QuestionarioPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = React.use(params);
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const current = steps[step]!;
  const isLast = step === steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.declaracaoVeracidade) {
      setError('Confirme a declaracao para finalizar o questionario.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const portalToken = sessionStorage.getItem('portalToken');
      const res = await fetch(`${BACKEND_URL}/api/portal/questionario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${portalToken}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('Erro ao salvar questionario.');
      router.push(`/p/${token}/processo`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '18px 16px',
        boxShadow: '0 2px 12px rgba(31,38,135,0.08)',
        border: '1px solid #e5e7eb',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase' }}>
            Anamnese ocupacional
          </span>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#4f46e5' }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div style={{ width: '100%', height: '7px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#4f46e5', borderRadius: '999px', transition: 'width 0.3s ease', width: `${progress}%` }} />
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '26px 22px',
        boxShadow: '0 2px 12px rgba(31,38,135,0.08)',
        border: '1px solid #e5e7eb',
      }}>
        {error && (
          <div style={{
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#dc2626',
            fontSize: '13px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'rgba(79,70,229,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <current.Icon style={{ width: '24px', height: '24px', color: '#4f46e5' }} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1e1b4b' }}>
              {current.title}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280', lineHeight: 1.4 }}>
              {current.subtitle}
            </p>
          </div>
        </div>

        {step === 0 && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Tem alguma queixa de saude hoje?</label>
              <textarea className="form-input" style={{ minHeight: '96px', resize: 'vertical' }} placeholder="Ex: dor, tontura, falta de ar, cansaco, ansiedade, nenhuma queixa..." value={form.queixas} onChange={e => update('queixas', e.target.value)} maxLength={FIELD_LIMITS.QUESTIONARIO} />
            </div>
            <div className="form-group">
              <label className="form-label">Usa algum medicamento?</label>
              <textarea className="form-input" style={{ minHeight: '86px', resize: 'vertical' }} placeholder="Informe nome, dose ou escreva nenhum." value={form.medicamentosEmUso} onChange={e => update('medicamentosEmUso', e.target.value)} maxLength={FIELD_LIMITS.QUESTIONARIO} />
            </div>
            <div className="form-group">
              <label className="form-label">Tem alergias conhecidas?</label>
              <textarea className="form-input" style={{ minHeight: '76px', resize: 'vertical' }} placeholder="Ex: medicamento, alimento, produto quimico, nenhuma." value={form.alergiasConhecidas} onChange={e => update('alergiasConhecidas', e.target.value)} maxLength={FIELD_LIMITS.QUESTIONARIO} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Doencas previas ou atuais</label>
              <textarea className="form-input" style={{ minHeight: '96px', resize: 'vertical' }} placeholder="Ex: hipertensao, diabetes, asma, depressao, epilepsia, nenhuma." value={form.doencasPrevias} onChange={e => update('doencasPrevias', e.target.value)} maxLength={FIELD_LIMITS.QUESTIONARIO} />
            </div>
            <div className="form-group">
              <label className="form-label">Cirurgias, internacoes ou acidentes importantes</label>
              <textarea className="form-input" style={{ minHeight: '96px', resize: 'vertical' }} placeholder="Descreva se houver. Se nao, deixe em branco ou escreva nenhum." value={form.cirurgiasPrevias} onChange={e => update('cirurgiasPrevias', e.target.value)} maxLength={FIELD_LIMITS.QUESTIONARIO} />
            </div>
            <div className="form-group">
              <label className="form-label">Observacoes ocupacionais</label>
              <textarea className="form-input" style={{ minHeight: '86px', resize: 'vertical' }} placeholder="Ex: ja teve afastamento, acidente de trabalho, restricao anterior, nada a declarar." value={form.observacoes} onChange={e => update('observacoes', e.target.value)} maxLength={FIELD_LIMITS.QUESTIONARIO} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'grid', gap: '18px' }}>
            <div>
              <label className="form-label">Fuma?</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {([
                  ['nao', 'Nao'],
                  ['ex_fumante', 'Ex-fumante'],
                  ['fumante', 'Sim'],
                ] as const).map(([value, label]) => (
                  <button key={value} type="button" style={choiceStyle(form.tabagismo === value)} onClick={() => update('tabagismo', value)}>
                    {label}
                  </button>
                ))}
              </div>
              {form.tabagismo !== 'nao' && (
                <input className="form-input" style={{ marginTop: '10px' }} placeholder="Ha quanto tempo? Quantidade aproximada?" value={form.tabagismoDetalhe} onChange={e => update('tabagismoDetalhe', e.target.value)} maxLength={FIELD_LIMITS.QUESTIONARIO} />
              )}
            </div>

            <div>
              <label className="form-label">Consome bebida alcoolica?</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {([
                  ['nao', 'Nao'],
                  ['social', 'Socialmente'],
                  ['frequente', 'Frequente'],
                ] as const).map(([value, label]) => (
                  <button key={value} type="button" style={choiceStyle(form.alcool === value)} onClick={() => update('alcool', value)}>
                    {label}
                  </button>
                ))}
              </div>
              {form.alcool !== 'nao' && (
                <input className="form-input" style={{ marginTop: '10px' }} placeholder="Frequencia aproximada" value={form.alcoolDetalhe} onChange={e => update('alcoolDetalhe', e.target.value)} maxLength={FIELD_LIMITS.QUESTIONARIO} />
              )}
            </div>

            <div>
              <label className="form-label">Pratica atividade fisica?</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {([
                  ['nao', 'Nao'],
                  ['ocasional', 'Ocasional'],
                  ['regular', 'Regular'],
                ] as const).map(([value, label]) => (
                  <button key={value} type="button" style={choiceStyle(form.atividadeFisica === value)} onClick={() => update('atividadeFisica', value)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Sono e descanso</label>
              <textarea className="form-input" style={{ minHeight: '76px', resize: 'vertical' }} placeholder="Ex: dorme bem, insonia, trabalho noturno, sonolencia durante o dia..." value={form.sono} onChange={e => update('sono', e.target.value)} maxLength={FIELD_LIMITS.QUESTIONARIO} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{
              padding: '16px',
              borderRadius: '14px',
              background: '#f8fafc',
              border: '1px solid #e5e7eb',
              color: '#374151',
              fontSize: '13px',
              lineHeight: 1.6,
            }}>
              Suas respostas serao enviadas para o medico do trabalho antes da teleconsulta. Elas ajudam na avaliacao dos exames, na conversa por video e na emissao do ASO.
            </div>

            <label style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              padding: '14px',
              borderRadius: '14px',
              border: `1px solid ${form.declaracaoVeracidade ? 'rgba(34,197,94,0.28)' : '#e5e7eb'}`,
              background: form.declaracaoVeracidade ? 'rgba(34,197,94,0.08)' : 'white',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={form.declaracaoVeracidade}
                onChange={e => update('declaracaoVeracidade', e.target.checked)}
                style={{ marginTop: '3px', width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '13px', lineHeight: 1.55, color: '#374151' }}>
                Declaro que as informacoes preenchidas sao verdadeiras e completas, e autorizo sua utilizacao pelo medico do trabalho para avaliacao ocupacional e emissao do ASO.
              </span>
            </label>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          {step > 0 && (
            <button className="btn btn-ghost" onClick={() => setStep(s => Math.max(0, s - 1))}>
              <ArrowLeftIcon style={{ width: '16px', height: '16px' }} />
              Voltar
            </button>
          )}
          <div style={{ flex: 1 }} />
          {isLast ? (
            <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={handleSubmit} disabled={saving}>
              {saving ? 'Salvando...' : (
                <><CheckCircleIcon style={{ width: '16px', height: '16px' }} /> Confirmar anamnese</>
              )}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}>
              Proximo
              <ArrowRightIcon style={{ width: '16px', height: '16px' }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
