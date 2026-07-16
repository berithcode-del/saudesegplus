'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  apiGetExamTypes,
  apiGetRequiredExams,
  apiFetch,
  apiQuotePayment,
  apiCreatePayment,
  apiConfirmPayment,
  type PaymentQuote,
} from '../../lib/api';
import { maskCPF, maskPhone, FIELD_LIMITS } from '../../../lib/formatUtils';
import {
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import PaymentReviewCard from '../../../components/ui/PaymentReviewCard';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

interface ExamTypeConfig {
  id: string;
  label: string;
  fields: Array<{ id: string; label: string; type: string; placeholder: string }>;
}

const DEFAULT_EXAM_TYPES: ExamTypeConfig[] = [
  { id: 'pa', label: 'Pressão Arterial', fields: [{ id: 'pressao_sistolica', label: 'Pressão Sistólica (mmHg)', type: 'number', placeholder: 'Ex: 120' }, { id: 'pressao_diastolica', label: 'Pressão Diastólica (mmHg)', type: 'number', placeholder: 'Ex: 80' }] },
  { id: 'audiometria', label: 'Audiometria', fields: [{ id: 'via_aerea_od', label: 'Via Aérea OD', type: 'text', placeholder: 'Resultado' }, { id: 'via_aerea_oe', label: 'Via Aérea OE', type: 'text', placeholder: 'Resultado' }] },
  { id: 'acuidade_visual', label: 'Acuidade Visual', fields: [{ id: 'od', label: 'Acuidade Visual OD', type: 'text', placeholder: 'Ex: 20/20' }, { id: 'oe', label: 'Acuidade Visual OE', type: 'text', placeholder: 'Ex: 20/20' }] },
  { id: 'peso_altura', label: 'Peso e Altura', fields: [{ id: 'peso', label: 'Peso (kg)', type: 'number', placeholder: 'Ex: 70' }, { id: 'altura', label: 'Altura (cm)', type: 'number', placeholder: 'Ex: 175' }] },
  { id: 'glicemia', label: 'Glicemia', fields: [{ id: 'valor_glicemia', label: 'Valor (mg/dL)', type: 'number', placeholder: 'Ex: 95' }] },
];

export default function CheckInPage() {
  const router = useRouter();
  const [step, setStep] = useState<'patient' | 'exams' | 'confirm'>('patient');
  const [patient, setPatient] = useState({ name: '', cpf: '', phone: '', birthDate: '', functionCboCode: '', examPurpose: 'admissional' });
  const [inviteId, setInviteId] = useState<string | undefined>(undefined);
  const [searchLoading, setSearchLoading] = useState(false);
  const [exams, setExams] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [examTypes, setExamTypes] = useState<ExamTypeConfig[]>([]);
  const [examTypesLoading, setExamTypesLoading] = useState(true);
  const [requiredExams, setRequiredExams] = useState<string[]>([]);
  const [selectedExamTypes, setSelectedExamTypes] = useState<string[]>([]);
  const [paymentQuote, setPaymentQuote] = useState<PaymentQuote | null>(null);

  useEffect(() => {
    apiGetExamTypes()
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : [];
        setExamTypes(data.length > 0 ? data : DEFAULT_EXAM_TYPES);
      })
      .catch(() => setExamTypes(DEFAULT_EXAM_TYPES))
      .finally(() => setExamTypesLoading(false));
  }, []);

  useEffect(() => {
    if (patient.functionCboCode) {
      apiGetRequiredExams(patient.functionCboCode)
        .then(r => {
          const exams = (Array.isArray(r.data) ? r.data : []) as string[];
          setRequiredExams(exams);
          if (exams.length > 0) {
            setInfoMessage(`Exames obrigatórios para esta função: ${exams.join(', ')}`);
            setTimeout(() => setInfoMessage(''), 8000);
          }
        })
        .catch(() => {});
    }
  }, [patient.functionCboCode]);

  useEffect(() => {
    if (requiredExams.length > 0 && examTypes.length > 0) {
      setSelectedExamTypes(prev => [...new Set([...prev, ...requiredExams])]);
    }
  }, [requiredExams, examTypes]);

  const handlePatientChange = (field: string, value: string) => {
    setPatient(prev => ({ ...prev, [field]: value }));
  };

  const handleExamChange = (field: string, value: string) => {
    setExams(prev => ({ ...prev, [field]: value }));
  };

  const handleSearchInvite = async () => {
    if (!patient.cpf) return;
    setSearchLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/company/invite/search?cpf=${patient.cpf.replace(/\D/g, '')}`);
      const result = await res.json();
      if (result.success && result.data) {
        const invite = result.data;
        setPatient(prev => ({
          ...prev,
          name: invite.collaboratorName || prev.name,
          functionCboCode: invite.roleFunction || prev.functionCboCode,
          examPurpose: invite.examType || prev.examPurpose,
        }));
        setInviteId(invite.id);
        setInfoMessage('Convite encontrado! Dados preenchidos.');
        setTimeout(() => setInfoMessage(''), 5000);
      } else {
        setError(result.message || 'Convite não encontrado para este CPF.');
      }
    } catch (err) {
      setError('Erro ao buscar convite.');
    } finally {
      setSearchLoading(false);
    }
  };

  const validateSelectedExamFields = () => {
    for (const typeId of selectedExamTypes) {
      const config = examTypes.find(e => e.id === typeId);
      if (!config) continue;
      const emptyFields = config.fields.filter(f => !exams[`${typeId}_${f.id}`]);
      if (emptyFields.length > 0) {
        throw new Error(`Preencha todos os campos do exame: ${config.label}`);
      }
    }
  };

  const handlePreparePaymentReview = async () => {
    setSaving(true);
    setError('');
    try {
      validateSelectedExamFields();
      const quoteResult = await apiQuotePayment({
        cboCode: patient.functionCboCode,
        examPurpose: patient.examPurpose,
        specialClearances: selectedExamTypes,
      }) as any;
      const quote = quoteResult?.data ?? quoteResult;
      if (!quote?.items?.length) {
        throw new Error('Cotacao nao retornou itens para pagamento.');
      }
      setPaymentQuote(quote);
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao preparar pagamento');
    } finally {
      setSaving(false);
    }
  };

  const handleSendToQueue = async () => {
    setSaving(true);
    setError('');
    try {
      if (!paymentQuote) {
        throw new Error('Revise o pagamento antes de enviar para a fila.');
      }
      validateSelectedExamFields();

      const paymentResult = await apiCreatePayment({
        flow: 'CLINIC_WALK_IN',
        method: 'SIMULADO',
        cboCode: patient.functionCboCode,
        examPurpose: patient.examPurpose,
        specialClearances: selectedExamTypes,
        checkoutPayload: {
          source: 'clinic-check-in',
          patientName: patient.name,
          patientCpf: patient.cpf,
          quote: paymentQuote,
        },
      }) as any;
      const paymentId = paymentResult?.data?.id ?? paymentResult?.id;
      if (!paymentId) {
        throw new Error('Pagamento criado sem identificador.');
      }

      await apiConfirmPayment(paymentId, 'SIMULADO');

      const createResult = await apiFetch('/api/exams/create-patient', {
        method: 'POST',
        body: JSON.stringify({
          name: patient.name,
          cpf: patient.cpf.replace(/\D/g, ''),
          phone: patient.phone.replace(/\D/g, ''),
          functionCboCode: patient.functionCboCode,
          examPurpose: patient.examPurpose,
          inviteId,
          paymentId,
        }),
      }) as any;
      if (!createResult.success || !createResult.data?.examRequest?.id) {
        throw new Error(createResult.message ?? 'Erro ao criar paciente');
      }

      const examRequestId = createResult.data.examRequest.id;

      // Validar campos obrigatórios
      for (const typeId of selectedExamTypes) {
        const config = examTypes.find(e => e.id === typeId);
        if (!config) continue;
        const emptyFields = config.fields.filter(f => !exams[`${typeId}_${f.id}`]);
        if (emptyFields.length > 0) {
          throw new Error(`Preencha todos os campos do exame: ${config.label}`);
        }
      }

      const results = selectedExamTypes.map(typeId => {
        const config = examTypes.find(e => e.id === typeId);
        const valueJson: Record<string, string> = {};
        if (config) {
          config.fields.forEach(field => {
            valueJson[field.id] = exams[`${typeId}_${field.id}`] ?? '';
          });
        }
        return { examType: typeId, valueJson };
      });

      await apiFetch('/api/exams', {
        method: 'POST',
        body: JSON.stringify({ examRequestId, results }),
      });

      const queueResult = await apiFetch(`/api/exams/${examRequestId}/send-to-queue`, {
        method: 'POST',
      }) as any;
      if (!queueResult.success) {
        throw new Error('Erro ao enviar para fila');
      }

      router.push('/consultorio');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar check-in');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Novo Check-in de Paciente</h2>
        <p>Preencha os dados e envie o paciente para a fila médica</p>
      </div>

      {error && (
        <div className="login-hint" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: '#dc2626', marginBottom: '16px' }}>
          {error}
        </div>
      )}
      {infoMessage && (
        <div style={{
          padding: '12px 14px', borderRadius: '12px',
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)',
          color: '#d97706', fontSize: '13px',
          marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
          {infoMessage}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {[
          { id: 'patient', n: 1, label: 'Dados do Paciente' },
          { id: 'exams', n: 2, label: 'Resultados dos Exames' },
          { id: 'confirm', n: 3, label: 'Confirmar & Enviar' },
        ].map((s) => (
          <div key={s.id} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
            background: step === s.id ? 'rgba(59,111,245,0.15)' : 'transparent',
            border: `1px solid ${step === s.id ? 'rgba(59,111,245,0.4)' : 'var(--border-light)'}`,
            color: step === s.id ? '#3b6ff5' : 'var(--text-muted)',
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '18px', height: '18px', borderRadius: '50%', fontSize: '11px', fontWeight: '700',
              background: step === s.id ? '#3b6ff5' : 'var(--border-light)',
              color: step === s.id ? 'white' : 'var(--text-muted)',
            }}>
              {s.n}
            </span>
            {s.label}
          </div>
        ))}
      </div>

      {step === 'patient' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '24px' }}>Dados do Paciente</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="patient-name">Nome Completo *</label>
              <input id="patient-name" className="form-input" placeholder="Nome do paciente" value={patient.name} onChange={e => handlePatientChange('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="patient-cpf">CPF *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input id="patient-cpf" className="form-input" placeholder="000.000.000-00" value={patient.cpf} onChange={e => handlePatientChange('cpf', maskCPF(e.target.value))} maxLength={FIELD_LIMITS.CPF} style={{ marginBottom: 0 }} />
                <button type="button" className="btn btn-secondary" onClick={handleSearchInvite} disabled={searchLoading || !patient.cpf}>
                  {searchLoading ? '...' : 'Buscar Convite'}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="patient-phone">Telefone</label>
              <input id="patient-phone" className="form-input" placeholder="(11) 99999-9999" value={patient.phone} onChange={e => handlePatientChange('phone', maskPhone(e.target.value))} maxLength={FIELD_LIMITS.PHONE} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="patient-birth">Data de Nascimento</label>
              <input id="patient-birth" type="date" className="form-input" value={patient.birthDate} onChange={e => handlePatientChange('birthDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="patient-cbo">Código CBO da Função</label>
              <input id="patient-cbo" className="form-input" placeholder="Ex: 7171-10" value={patient.functionCboCode} onChange={e => handlePatientChange('functionCboCode', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="exam-purpose">Tipo de Exame *</label>
              <select id="exam-purpose" className="form-select" value={patient.examPurpose} onChange={e => handlePatientChange('examPurpose', e.target.value)}>
                <option value="admissional">Admissional</option>
                <option value="periodico">Periódico</option>
                <option value="retorno">Retorno ao Trabalho</option>
                <option value="mudanca_funcao">Mudança de Função</option>
                <option value="demissional">Demissional</option>
              </select>
            </div>
          </div>
          <button id="btn-next-exams" className="btn btn-primary" onClick={() => setStep('exams')} disabled={!patient.name || !patient.cpf}>
            Próximo: Exames
            <ArrowRightIcon className="icon icon-sm" />
          </button>
        </div>
      )}

      {step === 'exams' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '24px' }}>Resultados dos Exames</h3>

          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Selecione os tipos de exame realizados</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {examTypes.map(t => {
                const isRequired = requiredExams.includes(t.id);
                const isSelected = selectedExamTypes.includes(t.id);
                return (
                  <label key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', borderRadius: '8px',
                    background: isSelected ? 'rgba(59,111,245,0.08)' : 'var(--bg-input)',
                    border: `1px solid ${isSelected ? 'rgba(59,111,245,0.3)' : 'var(--border-light)'}`,
                    cursor: isRequired ? 'default' : 'pointer',
                    fontSize: '14px',
                  }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isRequired}
                      onChange={() => {
                        if (isRequired) return;
                        setSelectedExamTypes(prev =>
                          prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id]
                        );
                      }}
                    />
                    {t.label} {isRequired ? '(obrigatório)' : ''}
                  </label>
                );
              })}
            </div>
          </div>

          {selectedExamTypes.map(typeId => {
            const config = examTypes.find(e => e.id === typeId);
            if (!config) return null;
            return (
              <div key={typeId} style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>{config.label}</h4>
                <div className="form-grid">
                  {config.fields.map(field => (
                    <div className="form-group" key={field.id}>
                      <label className="form-label" htmlFor={`exam-${typeId}-${field.id}`}>{field.label}</label>
                      <input
                        id={`exam-${typeId}-${field.id}`}
                        type={field.type}
                        className="form-input"
                        placeholder={field.placeholder}
                        value={exams[`${typeId}_${field.id}`] ?? ''}
                        onChange={e => handleExamChange(`${typeId}_${field.id}`, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-ghost" onClick={() => setStep('patient')}>
              <ArrowLeftIcon className="icon icon-sm" />
              Voltar
            </button>
            <button id="btn-next-confirm" className="btn btn-primary" onClick={handlePreparePaymentReview} disabled={saving}>
              {saving ? 'Gerando cotacao...' : 'Proximo: pagamento'}
              <ArrowRightIcon className="icon icon-sm" />
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '600', marginBottom: '24px' }}>
            <CheckCircleIcon className="icon icon-sm" />
            Resumo do Check-in
          </h3>
          <div style={{ display: 'grid', gap: '12px', marginBottom: '32px' }}>
            <div style={{ padding: '16px', background: 'rgba(59,111,245,0.06)', borderRadius: '10px', border: '1px solid rgba(59,111,245,0.12)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Paciente</div>
              <div style={{ fontWeight: '700', fontSize: '18px', color: 'var(--text-primary)' }}>{patient.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>CPF: {patient.cpf} | Exame: {patient.examPurpose}</div>
            </div>
            <div style={{ padding: '16px', background: 'rgba(0,212,170,0.06)', borderRadius: '10px', border: '1px solid rgba(0,212,170,0.12)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Exames Registrados</div>
              {selectedExamTypes.map(typeId => {
                const config = examTypes.find(e => e.id === typeId);
                if (!config) return null;
                return (
                  <div key={typeId} style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{config.label}</p>
                    {config.fields.map(field => {
                      const val = exams[`${typeId}_${field.id}`];
                      if (!val) return null;
                      return (
                        <div key={field.id} style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{field.label}:</strong> {val}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
          {paymentQuote && (
            <PaymentReviewCard
              subjectName={patient.name}
              examPurpose={patient.examPurpose}
              quote={paymentQuote}
              loading={saving}
              onBack={() => {
                setPaymentQuote(null);
                setStep('exams');
              }}
              onConfirm={handleSendToQueue}
              confirmLabel="Confirmar pagamento e enviar para fila"
            />
          )}
          <div style={{ display: 'none', gap: '12px' }}>
            <button className="btn btn-ghost" onClick={() => setStep('exams')}>
              <ArrowLeftIcon className="icon icon-sm" />
              Voltar
            </button>
            <button id="btn-send-queue" className="btn btn-primary" onClick={handleSendToQueue} disabled={saving}>
              {saving ? (
                <><ClockIcon className="icon" /> Enviando...</>
              ) : (
                <><PaperAirplaneIcon className="icon" /> Enviar para Fila Médica</>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
