import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApiClient } from '../../app/providers/ApiProvider';
import type { ExamRequestStatus } from '@/lib/vendor/api-types';

interface ConsultaData {
  id: string;
  status: string;
  patient: {
    id: string;
    nome: string;
    cpf: string;
    birthDate: string;
    phone?: string;
    email?: string;
    anamneses?: { queixas?: string; historicoMedico?: string; medicamentos?: string; habitos?: string }[];
  };
  clinic?: { nome: string };
  invite?: { company?: { nome: string }; examPurpose?: string };
  results?: { id: string; typeName?: string; valueJson?: Record<string, unknown> }[];
  asoDocuments?: { id: string; decision?: string }[];
  presence?: { patientOnline: boolean };
}

export function MedicoConsulta() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apiClient = useApiClient();
  const [data, setData] = useState<ConsultaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [laudo, setLaudo] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showExams, setShowExams] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [decision, setDecision] = useState<'apto' | 'inapto' | ''>('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchConsulta = async () => {
      try {
        const result = (await apiClient.fetch(`/api/solicitacoes/${id}`)) as { data: ConsultaData };
        setData(result.data);
        if (result.data) {
          const anamnese = result.data.patient?.anamneses?.[0];
          if (anamnese) {
            setLaudo([
              anamnese.queixas ? `Queixas: ${anamnese.queixas}` : '',
              anamnese.historicoMedico ? `Histórico: ${anamnese.historicoMedico}` : '',
              anamnese.medicamentos ? `Medicamentos: ${anamnese.medicamentos}` : '',
              anamnese.habitos ? `Hábitos: ${anamnese.habitos}` : '',
            ].filter(Boolean).join('\n\n'));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar consulta');
      } finally {
        setLoading(false);
      }
    };
    fetchConsulta();
  }, [id, apiClient]);

  const saveLaudo = useCallback(async (text: string) => {
    if (!id) return;
    try {
      await apiClient.fetch(`/api/solicitacoes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ laudoTexto: text }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* silent */ }
  }, [id, apiClient]);

  const handleLaudoChange = useCallback((value: string) => {
    setLaudo(value);
    setSaved(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveLaudo(value), 1500);
  }, [saveLaudo]);

  const handleFinish = useCallback(async () => {
    if (!id || !decision) return;
    setSaving(true);
    try {
      await apiClient.fetch(`/api/solicitacoes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CONCLUIDO' as ExamRequestStatus, decision }),
      });
      navigate('/medico');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao finalizar consulta');
    } finally {
      setSaving(false);
      setShowFinishModal(false);
    }
  }, [id, decision, apiClient, navigate]);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} onRetry={() => window.location.reload()} />;
  if (!data) return <ErrorScreen message="Consulta não encontrada" onRetry={() => navigate('/medico')} />;

  const anamnese = data.patient?.anamneses?.[0];

  return (
    <div style={{ padding: 24, paddingBottom: 100, backgroundColor: 'var(--bg-app)' }}>
      <button
        onClick={() => navigate('/medico')}
        style={{ background: 'none', border: 'none', fontSize: 14, color: 'var(--accent-primary)', cursor: 'pointer', marginBottom: 16, padding: '8px 0', minHeight: 48 }}
      >
        ← Voltar para fila
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 4, color: 'var(--text-primary)' }}>Consulta Ativa</h1>

      {/* Patient Info */}
      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)' }}>{data.patient?.nome}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              CPF: {data.patient?.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
            </div>
          </div>
          {data.presence?.patientOnline !== undefined && (
            <span className={data.presence.patientOnline ? 'badge badge-success' : 'badge badge-danger'}>
              {data.presence.patientOnline ? 'Online' : 'Offline'}
            </span>
          )}
        </div>
        {data.invite?.company?.nome && (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
            Empresa: {data.invite.company.nome}
          </div>
        )}
        {data.invite?.examPurpose && (
          <div style={{ fontSize: 13, color: 'var(--accent-primary)', marginTop: 4, fontWeight: 500 }}>
            Finalidade: {data.invite.examPurpose}
          </div>
        )}
      </div>

      {/* Anamnese */}
      {anamnese && (
        <div className="card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>ANAMNESE</div>
          {anamnese.queixas && <DataRow label="Queixas" value={anamnese.queixas} />}
          {anamnese.historicoMedico && <DataRow label="Histórico" value={anamnese.historicoMedico} />}
          {anamnese.medicamentos && <DataRow label="Medicamentos" value={anamnese.medicamentos} />}
          {anamnese.habitos && <DataRow label="Hábitos" value={anamnese.habitos} />}
        </div>
      )}

      {/* Clinical Engine - Exams */}
      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <button
          onClick={() => setShowExams(!showExams)}
          style={{
            width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>EXAMES</div>
            <div style={{ fontSize: 16, fontWeight: 500, marginTop: 4, color: 'var(--text-primary)' }}>
              {data.results?.length || 0} exame(s) registrado(s)
            </div>
          </div>
          <span style={{ fontSize: 18, color: 'var(--text-muted)', transform: showExams ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
        </button>
        {showExams && data.results && data.results.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.results.map(r => (
              <div key={r.id} style={{ padding: 12, backgroundColor: 'var(--bg-input)', borderRadius: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{r.typeName || 'Exame'}</div>
                {r.valueJson && (
                  <pre style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                    {JSON.stringify(r.valueJson, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
        {showExams && (!data.results || data.results.length === 0) && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>Nenhum exame registrado</p>
        )}
      </div>

      {/* Laudo */}
      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          LAUDO MÉDICO
          {saved && <span style={{ color: 'var(--accent-success)', marginLeft: 8 }}>✓ Salvo</span>}
        </div>
        <textarea
          value={laudo}
          onChange={e => handleLaudoChange(e.target.value)}
          placeholder="Descreva o laudo médico, achados clínicos e conclusões..."
          className="input"
          style={{
            width: '100%', minHeight: 150, padding: 16, fontSize: 16,
            resize: 'vertical', fontFamily: 'inherit',
          }}
        />
      </div>

      {/* ASO Decision */}
      {data.asoDocuments && data.asoDocuments.length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>ASO</div>
          <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>Resultado: <strong>{data.asoDocuments[0]?.decision || 'Pendente'}</strong></div>
        </div>
      )}

      {/* Finish Button - thumb zone */}
      <div style={{ position: 'fixed', bottom: 72, left: 16, right: 16, zIndex: 50 }}>
        <button
          onClick={() => setShowFinishModal(true)}
          className="btn btn-primary"
          style={{
            width: '100%', padding: '16px 24px', fontSize: 16, fontWeight: 500, minHeight: 56,
            boxShadow: 'var(--shadow-btn)',
          }}
        >
          Finalizar Consulta
        </button>
      </div>

      {/* Finish Modal */}
      {showFinishModal && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 12, color: 'var(--text-primary)' }}>Finalizar Consulta</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Selecione o resultado da avaliação ocupacional:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {(['apto', 'inapto'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setDecision(opt)}
                  style={{
                    padding: '14px 16px', fontSize: 16, minHeight: 48, textAlign: 'left',
                    border: decision === opt ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
                    borderRadius: 12,
                    backgroundColor: decision === opt ? 'rgba(79, 70, 229, 0.08)' : 'var(--bg-card)',
                    color: decision === opt ? 'var(--accent-primary)' : 'var(--text-primary)',
                    cursor: 'pointer', textTransform: 'capitalize',
                  }}
                >
                  {opt === 'apto' ? 'Apto' : 'Inapto'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => { setShowFinishModal(false); setDecision(''); }}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '12px 16px', fontSize: 14, minHeight: 48 }}
              >
                Cancelar
              </button>
              <button
                onClick={handleFinish}
                disabled={!decision || saving}
                className="btn btn-primary"
                style={{
                  flex: 1, padding: '12px 16px', fontSize: 14, minHeight: 48,
                  opacity: !decision || saving ? 0.5 : 1, cursor: !decision || saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 14, marginTop: 2, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', backgroundColor: 'var(--bg-app)' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border-light)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ marginTop: 16, color: 'var(--text-secondary)', fontSize: 14 }}>Carregando consulta...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 16, backgroundColor: 'var(--bg-app)' }}>
      <p style={{ color: 'var(--accent-danger)', fontSize: 16 }}>{message}</p>
      <button onClick={onRetry} className="btn btn-primary" style={{ padding: '12px 24px', fontSize: 14, minHeight: 48 }}>
        Tentar novamente
      </button>
    </div>
  );
}

const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 };
const modalStyle: React.CSSProperties = { backgroundColor: 'var(--bg-card)', borderRadius: 20, padding: 24, maxWidth: 400, width: '100%', boxShadow: 'var(--shadow-card)' };
