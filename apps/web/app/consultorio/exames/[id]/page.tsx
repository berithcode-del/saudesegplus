'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { getAuthToken } from '@/lib/api';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

const EXAM_LABELS: Record<string, string> = {
  audiometria: 'Audiometria',
  acuidade_visual: 'Acuidade Visual',
  espirometria: 'Espirometria',
  eletrocardiograma: 'Eletrocardiograma (ECG)',
  eletroencefalograma: 'Eletroencefalograma (EEG)',
  exames_laboratoriais: 'Exames Laboratoriais',
  radiografia_torax: 'Radiografia de Torax',
  psicossocial: 'Avaliacao Psicossocial',
  sangue: 'Exame de Sangue (Laboratorial)',
  raio_x: 'Raio-X',
};

const DEFAULT_EXAM_OPTIONS = [
  'audiometria',
  'acuidade_visual',
  'espirometria',
  'eletrocardiograma',
  'eletroencefalograma',
  'exames_laboratoriais',
  'radiografia_torax',
  'psicossocial',
];

interface Solicitacao {
  id: string;
  examPurpose: string;
  status: string;
  patient: { name: string; cpf: string; functionCboCode: string };
  clinic?: { name: string } | null;
}

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null);
  const [error, setError] = useState('');
  const [examType, setExamType] = useState('audiometria');
  const [isFormValid, setIsFormValid] = useState(false);
  const [examsSaved, setExamsSaved] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [observacao, setObservacao] = useState('');
  const [nomeOutroExame, setNomeOutroExame] = useState('');

  const [requiredExams, setRequiredExams] = useState<string[]>([]);

  useEffect(() => {
    const fetchSolicitacao = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/solicitacoes/${params.id}`);
        const result = await res.json();
        if (result.data) {
          setSolicitacao(result.data);
          
          if (result.data.patient?.functionCboCode) {
            const reqRes = await fetch(`${BACKEND_URL}/api/exams/required?cboCode=${result.data.patient.functionCboCode}`);
            const reqData = await reqRes.json();
            if (reqData.success && reqData.data?.requiredExams) {
              setRequiredExams(reqData.data.requiredExams);
              if (reqData.data.requiredExams.length > 0) {
                setExamType(reqData.data.requiredExams[0]);
              }
            }
          }
        } else {
          setError('Solicitação não encontrada');
        }
      } catch {
        setError('Erro ao carregar dados da solicitação');
      } finally {
        setLoading(false);
      }
    };
    fetchSolicitacao();
  }, [params.id]);

  const handleSaveExams = async () => {
    setSaving(true);
    setError('');
    try {
      let attachmentUrl = undefined;

      if (!file) {
        setError('Nenhum arquivo selecionado');
        setSaving(false);
        return;
      }

      if (examType === 'outros' && !nomeOutroExame.trim()) {
        setError('Por favor, informe o nome do exame.');
        setSaving(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch(`${BACKEND_URL}/api/upload/exam-file`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${getAuthToken()}`,
              },
              body: formData,
            });
      const uploadData = await uploadRes.json();
      
      if (!uploadData.success || !uploadData.fileUrl) {
        setError('Erro ao fazer upload do arquivo');
        setSaving(false);
        return;
      }

      attachmentUrl = uploadData.fileUrl;
      const finalExamName = examType === 'outros' ? nomeOutroExame : formatExamName(examType);

      const res = await fetch(`${BACKEND_URL}/api/exams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examRequestId: params.id,
          examType: examType,
          valueJson: { nome_exame: finalExamName, observacao },
          attachmentUrl,
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setExamsSaved(true);
        setFile(null);
        setObservacao('');
        setNomeOutroExame('');
        setIsFormValid(false);
      } else {
        setError(result?.message || 'Erro ao salvar exames');
      }
    } catch {
      setError('Erro ao conectar com o servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleSendToQueue = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/exams/${params.id}/send-to-queue`, {
        method: 'POST',
      });
      const result = await res.json();
      if (result.success) {
        router.push('/consultorio');
      } else {
        setError('Erro ao enviar para fila médica');
      }
    } catch {
      setError('Erro ao conectar com o servidor');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-center">
        <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
      </div>
    );
  }

  if (error && !solicitacao) {
    return (
      <div className="page-center">
        <p style={{ color: '#dc2626' }}>{error}</p>
      </div>
    );
  }

  const formatExamName = (code: string) =>
    EXAM_LABELS[code] || code.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div>
      <div className="page-header">
        <h2>Exames de {solicitacao?.patient.name}</h2>
        <p>Tipo: <strong>{solicitacao?.examPurpose}</strong> | CPF: {solicitacao?.patient.cpf}</p>
      </div>

      {error && (
        <div className="login-hint" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: '#dc2626', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {requiredExams.length > 0 && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px',
          background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.2)',
          marginBottom: '16px', color: '#1d4ed8'
        }}>
          <strong style={{ display: 'block', marginBottom: '4px' }}>Exames obrigatórios para a função (CBO {solicitacao?.patient.functionCboCode}):</strong>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
            {requiredExams.map(ex => (
              <li key={ex}>{formatExamName(ex)}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>Registrar Exames</h3>
          <select
            className="form-select"
            value={examType}
            onChange={(e) => {
              setExamType(e.target.value);
              setFile(null);
              setObservacao('');
              setNomeOutroExame('');
              setIsFormValid(false);
            }}
            style={{ width: 'auto' }}
          >
            {requiredExams.length > 0 && (
              <optgroup label="Exames Obrigatórios (CBO)">
                {requiredExams.map(ex => (
                  <option key={`req-${ex}`} value={ex}>{formatExamName(ex)}</option>
                ))}
              </optgroup>
            )}
            {requiredExams.length === 0 && (
              <optgroup label="Exames">
                {DEFAULT_EXAM_OPTIONS.map(ex => (
                  <option key={ex} value={ex}>{formatExamName(ex)}</option>
                ))}
              </optgroup>
            )}
            <option value="outros">Outro exame adicional</option>
          </select>
        </div>

        <div className="form-group" style={{ marginTop: '16px' }}>
          {examType === 'outros' && (
            <>
              <label className="form-label">Nome do Exame <span style={{ color: '#e53e3e' }}>*</span></label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ex: Hemograma Completo" 
                value={nomeOutroExame}
                onChange={e => setNomeOutroExame(e.target.value)}
                style={{ marginBottom: '12px' }}
              />
            </>
          )}
          
          <label className="form-label">Observação (Opcional)</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Ex: Paciente relatou dificuldade no ouvido esquerdo" 
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
            style={{ marginBottom: '12px' }}
          />

          <label className="form-label">Arquivo do Exame (PDF ou Imagem) <span style={{ color: '#e53e3e' }}>*</span></label>
          <input 
            key={examType}
            type="file" 
            className="form-input" 
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                setFile(e.target.files[0] ?? null);
                setIsFormValid(true);
              } else {
                setFile(null);
                setIsFormValid(false);
              }
            }} 
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button
            className="btn btn-primary"
            disabled={!isFormValid || saving || examsSaved}
            onClick={handleSaveExams}
          >
            {saving ? 'Salvando...' : 'Salvar Exames'}
          </button>
          <button
            className="btn btn-success"
            disabled={!examsSaved || saving}
            onClick={handleSendToQueue}
          >
            {saving ? 'Enviando...' : (<><PaperAirplaneIcon className="icon" /> Enviar para Fila Médica</>)}
          </button>
        </div>
      </div>
    </div>
  );
}
