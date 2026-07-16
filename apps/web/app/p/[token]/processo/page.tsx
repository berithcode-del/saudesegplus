'use client';
import React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircleIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  MapPinIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  ClipboardDocumentCheckIcon,
  PencilSquareIcon,
  ArrowUpTrayIcon,
  SignalIcon,
  UserCircleIcon,
  BeakerIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

interface ProcessoData {
  id?: string;
  status?: string;
  paciente?: { nome?: string; cpf?: string };
  empresa?: { nome?: string };
  clinica?: { nome?: string; endereco?: string; latitude?: number; longitude?: number };
  proximaAcao?: { tipo: string; titulo?: string; descricao?: string };
  timeline?: Array<{ eventType?: string; descricao?: string; ocorridoEm?: string; occurredAt?: string }>;
  teleconsulta?: { disponivel: boolean; linkSala: string | null };
  progresso?: Array<{ label: string; concluido: boolean; ativo: boolean }>;
  examesSolicitados?: string[];
}

const acaoConfig: Record<string, { label: string; Icon: typeof ArrowRightIcon }> = {
  CONFIRMAR_DADOS: { label: 'Confirmar dados', Icon: ClipboardDocumentCheckIcon },
  ENVIAR_DOCUMENTOS: { label: 'Enviar documentos', Icon: ArrowUpTrayIcon },
  RESPONDER_QUESTIONARIO: { label: 'Responder questionário', Icon: PencilSquareIcon },
  ENTRAR_TELECONSULTA: { label: 'Entrar na teleconsulta', Icon: VideoCameraIcon },
  BAIXAR_ASO: { label: 'Baixar ASO', Icon: DocumentTextIcon },
};

const EXAM_GUIDANCE: Record<string, { name: string; prep: string }> = {
  audiometria: { name: 'Audiometria', prep: 'Evite exposicao a ruido intenso antes do exame e leve protetor auditivo, se usar.' },
  acuidade_visual: { name: 'Acuidade visual', prep: 'Leve seus oculos ou lentes, caso use no dia a dia.' },
  espirometria: { name: 'Espirometria', prep: 'Evite fumar e usar broncodilatador antes do exame, se a clinica orientar.' },
  eletrocardiograma: { name: 'Eletrocardiograma (ECG)', prep: 'Use roupa confortavel e evite cremes na regiao do torax.' },
  eletroencefalograma: { name: 'Eletroencefalograma (EEG)', prep: 'Vá com o cabelo limpo e seco, sem gel, creme ou oleo.' },
  exames_laboratoriais: { name: 'Exames laboratoriais', prep: 'Confirme com a clinica se ha necessidade de jejum.' },
  radiografia_torax: { name: 'Radiografia de torax', prep: 'Evite acessorios metalicos e informe se houver suspeita de gravidez.' },
  psicossocial: { name: 'Avaliacao psicossocial', prep: 'Reserve um tempo tranquilo para responder as perguntas com atencao.' },
  pa: { name: 'Afericao de pressao arterial', prep: 'Evite cafe, cigarro e exercicio intenso 30 minutos antes.' },
  glicemia: { name: 'Glicemia capilar', prep: 'Leve informacoes sobre jejum se a clinica tiver orientado.' },
};

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function ExamGuidanceScreen({ clinic, exams }: { clinic?: ProcessoData['clinica']; exams: string[] }) {
  const requestedExams = exams.length > 0
    ? exams.map(code => EXAM_GUIDANCE[code] ?? {
      name: code.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()),
      prep: 'Siga as orientacoes da clinica credenciada para este exame.',
    })
    : [{ name: 'Exames ocupacionais', prep: 'A clinica informara os exames necessarios para sua funcao.' }];

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 12px rgba(31,38,135,0.08)',
      overflow: 'hidden',
      marginBottom: '20px',
    }}>
      <div style={{
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(79,70,229,0.1), rgba(59,111,245,0.06))',
        borderBottom: '1px solid rgba(79,70,229,0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#4f46e5', color: 'white',
          }}>
            <BeakerIcon style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase' }}>
              Proxima etapa
            </div>
            <h2 style={{ margin: 0, fontSize: '21px', fontWeight: 800, color: '#1e1b4b' }}>
              Orientacoes para seus exames
            </h2>
          </div>
        </div>
        <p style={{ margin: 0, color: '#4b5563', fontSize: '14px', lineHeight: 1.6 }}>
          Compareca a clinica indicada para realizar os exames abaixo. Depois que os resultados forem registrados, voce entra na fila medica.
        </p>
      </div>

      <div style={{ padding: '20px', display: 'grid', gap: '16px' }}>
        <div style={{
          padding: '16px',
          borderRadius: '16px',
          background: '#f8fafc',
          border: '1px solid #e5e7eb',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <BuildingOffice2Icon style={{ width: '22px', height: '22px', color: '#4f46e5', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e1b4b', marginBottom: '4px' }}>
                Onde fazer
              </div>
              <div style={{ fontSize: '14px', color: '#374151', fontWeight: 700 }}>
                {clinic?.nome ?? 'Clinica credenciada SaudeSeg+'}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px', lineHeight: 1.5 }}>
                {clinic?.endereco ?? 'Endereco da clinica sera exibido aqui quando a rota real estiver integrada.'}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e1b4b', marginBottom: '10px' }}>
            Exames solicitados
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {requestedExams.map((exam, index) => (
              <div key={exam.name} style={{
                display: 'grid',
                gridTemplateColumns: '32px 1fr',
                gap: '12px',
                padding: '14px',
                borderRadius: '14px',
                border: '1px solid #e5e7eb',
                background: 'white',
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '999px',
                  background: 'rgba(79,70,229,0.1)', color: '#4f46e5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 800,
                }}>
                  {index + 1}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>{exam.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5, marginTop: '3px' }}>{exam.prep}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          padding: '14px',
          borderRadius: '14px',
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.18)',
          color: '#92400e',
          fontSize: '13px',
          lineHeight: 1.5,
        }}>
          <ShieldCheckIcon style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '1px' }} />
          Leve um documento com foto. Se estiver usando medicamento continuo, mantenha o uso conforme orientacao do seu medico.
        </div>
      </div>
    </div>
  );
}

function OnlineWindowScreen({ doctorViewing }: { doctorViewing: boolean }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const windowStart = new Date(now);
  windowStart.setHours(14, 0, 0, 0);
  const windowEnd = new Date(now);
  windowEnd.setHours(15, 0, 0, 0);
  const isInsideWindow = now >= windowStart && now <= windowEnd;
  const msToWindow = windowStart.getTime() - now.getTime();
  const msToWindowEnd = windowEnd.getTime() - now.getTime();
  const windowProgress = isInsideWindow
    ? Math.min(100, Math.max(0, ((now.getTime() - windowStart.getTime()) / (windowEnd.getTime() - windowStart.getTime())) * 100))
    : now > windowEnd ? 100 : 0;

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 12px rgba(31,38,135,0.08)',
      overflow: 'hidden',
      marginBottom: '20px',
    }}>
      <div style={{
        padding: '24px',
        background: 'linear-gradient(135deg, #4f46e5, #3b6ff5)',
        color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '16px',
            background: 'rgba(255,255,255,0.16)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <SignalIcon style={{ width: '26px', height: '26px' }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.82 }}>
              Plantao medico online
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>
              Fique online das 14h as 15h
            </h2>
          </div>
        </div>
        <p style={{ fontSize: '14px', lineHeight: 1.6, opacity: 0.9, margin: 0 }}>
          Este e o periodo em que o medico revisa seu perfil, confere os resultados e pode chamar voce para finalizar o ASO.
        </p>
      </div>

      <div style={{ padding: '20px', display: 'grid', gap: '16px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '16px',
          alignItems: 'center',
          padding: '16px',
          borderRadius: '16px',
          background: '#f8fafc',
          border: '1px solid #e5e7eb',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', fontSize: '13px', fontWeight: 800, marginBottom: '8px' }}>
              <CalendarDaysIcon style={{ width: '18px', height: '18px' }} />
              Janela de atendimento
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
              {isInsideWindow
                ? 'Voce esta dentro da janela. Mantenha esta tela aberta.'
                : now > windowEnd
                  ? 'A janela estimada terminou. Continue online enquanto aguardamos nova chamada.'
                  : 'Quando a janela abrir, seu status online aparece para o medico.'}
            </div>
          </div>
          <div style={{
            minWidth: '88px',
            textAlign: 'center',
            padding: '10px 12px',
            borderRadius: '14px',
            background: isInsideWindow ? 'rgba(34,197,94,0.1)' : 'rgba(79,70,229,0.08)',
            color: isInsideWindow ? '#16a34a' : '#4f46e5',
            fontSize: '22px',
            fontWeight: 900,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {isInsideWindow ? formatCountdown(msToWindowEnd) : formatCountdown(msToWindow)}
          </div>
        </div>

        <div>
          <div style={{ height: '10px', borderRadius: '999px', background: '#e5e7eb', overflow: 'hidden' }}>
            <div style={{
              width: `${windowProgress}%`,
              height: '100%',
              borderRadius: '999px',
              background: isInsideWindow ? '#22c55e' : '#4f46e5',
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#6b7280', fontWeight: 700 }}>
            <span>14h</span>
            <span>15h</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{
            padding: '14px',
            borderRadius: '14px',
            border: '1px solid rgba(34,197,94,0.2)',
            background: 'rgba(34,197,94,0.08)',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#16a34a', marginBottom: '6px' }}>Seu status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 800, color: '#065f46' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', animation: 'blink 1.5s infinite' }} />
              Online e disponivel
            </div>
          </div>
          <div style={{
            padding: '14px',
            borderRadius: '14px',
            border: `1px solid ${doctorViewing ? 'rgba(79,70,229,0.22)' : '#e5e7eb'}`,
            background: doctorViewing ? 'rgba(79,70,229,0.08)' : '#f8fafc',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: doctorViewing ? '#4f46e5' : '#6b7280', marginBottom: '6px' }}>Medico</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 800, color: doctorViewing ? '#312e81' : '#4b5563' }}>
              <UserCircleIcon style={{ width: '16px', height: '16px' }} />
              {doctorViewing ? 'Vendo seu perfil' : 'Aguardando revisao'}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '10px',
          padding: '14px',
          borderRadius: '14px',
          background: 'rgba(79,70,229,0.06)',
          border: '1px solid rgba(79,70,229,0.14)',
          color: '#3730a3',
          fontSize: '13px',
          lineHeight: 1.5,
        }}>
          <ClockIcon style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '1px' }} />
          Mantenha o celular por perto, internet ativa e notificacoes liberadas. Se o medico iniciar a chamada, esta tela muda automaticamente.
        </div>
      </div>
    </div>
  );
}

function WaitingRoom({ status, teleconsultaUrl, doctorViewing }: { status: string; teleconsultaUrl: string | null; doctorViewing: boolean }) {
  const isBeingCalled = !!teleconsultaUrl;
  const isWaiting = status === 'NA_FILA_MEDICA' || (status === 'EM_ATENDIMENTO_MEDICO' && !teleconsultaUrl);

  if (isBeingCalled && teleconsultaUrl) {
    return (
      <div style={{ marginBottom: '20px' }}>
        {/* Banner pulsante de chamada */}
        <div style={{
          background: 'linear-gradient(135deg, #059669, #10b981)',
          borderRadius: '20px',
          padding: '28px 24px',
          textAlign: 'center',
          marginBottom: '16px',
          boxShadow: '0 8px 32px rgba(5,150,105,0.35)',
          animation: 'pulse-glow 2s infinite',
        }}>
          <div style={{ fontSize: '52px', marginBottom: '10px' }}>📹</div>
          <h2 style={{ color: 'white', fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>
            O médico está te chamando!
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', marginBottom: '24px' }}>
            Sua teleconsulta está pronta. Entre agora para falar com o médico.
          </p>
          <a
            href={teleconsultaUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              background: 'white', color: '#059669',
              fontWeight: 700, fontSize: '16px',
              padding: '14px 32px', borderRadius: '14px',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
          >
            <VideoCameraIcon style={{ width: '20px', height: '20px' }} />
            Entrar na Teleconsulta
          </a>
        </div>

        {/* Iframe embutido */}
        <div style={{
          background: 'white', borderRadius: '20px',
          border: '1px solid #e5e7eb', overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(31,38,135,0.08)',
        }}>
          <div style={{
            padding: '12px 16px', background: '#f0fdf4',
            borderBottom: '1px solid #d1fae5',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'blink 1s infinite' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#065f46' }}>Sala de Teleconsulta Ativa</span>
          </div>
          <iframe
            src={teleconsultaUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            style={{ width: '100%', height: '480px', border: 'none' }}
            title="Teleconsulta"
          />
        </div>
      </div>
    );
  }

  if (isWaiting) {
      return <OnlineWindowScreen doctorViewing={doctorViewing} />;
    }

    return null;
}

export default function ProcessoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = React.use(params);
  const router = useRouter();
  const [data, setData] = useState<ProcessoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [doctorViewing, setDoctorViewing] = useState(false);
  const doctorViewingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProcesso = useCallback(async () => {
    const portalToken = sessionStorage.getItem('portalToken');
    if (!portalToken) {
      router.replace(`/p/${token}`);
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/portal/processo`, {
        headers: { Authorization: `Bearer ${portalToken}` },
      });
      if (res.status === 401) {
        sessionStorage.removeItem('portalToken');
        router.replace(`/p/${token}`);
        return;
      }
      const json = await res.json();
      const processo = json.data ?? json;
      if (processo?.id) setData(processo);
    } catch {
      // polling vai tentar de novo
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    fetchProcesso();
    // Polling a cada 5 segundos para detectar chamada do médico
    const interval = setInterval(fetchProcesso, 5000);
    return () => clearInterval(interval);
  }, [fetchProcesso]);

  useEffect(() => {
    const processId = data?.id;
    const portalToken = sessionStorage.getItem('portalToken');
    if (!processId || !portalToken) return;

    let active = true;
    let socket: {
      on: (event: string, handler: (payload?: Record<string, unknown>) => void) => void;
      emit: (event: string, payload: Record<string, unknown>) => void;
      disconnect: () => void;
    } | null = null;

    import('socket.io-client').then(({ io }) => {
      if (!active) return;
      socket = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],
        auth: { token: portalToken },
      });

      socket.on('connect', () => {
        socket?.emit('join_process', { processId });
      });

      socket.on('teleconsulta_iniciada', (payload = {}) => {
        if (payload.examRequestId !== processId) return;
        const linkSala = typeof payload.linkSala === 'string' ? payload.linkSala : null;
        setData(prev => ({
          ...(prev ?? {}),
          id: prev?.id ?? processId,
          status: 'EM_ATENDIMENTO_MEDICO',
          teleconsulta: { disponivel: !!linkSala, linkSala },
          proximaAcao: {
            tipo: 'ENTRAR_TELECONSULTA',
            titulo: 'Teleconsulta Disponivel',
            descricao: 'Entre na sala de teleconsulta',
          },
        }));
        fetchProcesso();
      });

      socket.on('doctor_viewing_patient', (payload = {}) => {
        if (payload.processId !== processId) return;
        setDoctorViewing(true);
        if (doctorViewingTimeoutRef.current) clearTimeout(doctorViewingTimeoutRef.current);
        doctorViewingTimeoutRef.current = setTimeout(() => setDoctorViewing(false), 20000);
      });
    }).catch(() => {
      // Polling continua como fallback.
    });

    return () => {
      active = false;
      socket?.disconnect();
      if (doctorViewingTimeoutRef.current) clearTimeout(doctorViewingTimeoutRef.current);
    };
  }, [data?.id, fetchProcesso]);

  useEffect(() => {
    // Envia heartbeat a cada 15 segundos para manter o status online na fila médica
    const sendHeartbeat = async () => {
      const portalToken = sessionStorage.getItem('portalToken');
      if (!portalToken) return;
      try {
        await fetch(`${BACKEND_URL}/api/portal/heartbeat`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${portalToken}` },
        });
      } catch (err) {
        console.error('Falha ao enviar heartbeat:', err);
      }
    };
    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 15000);
    return () => clearInterval(heartbeatInterval);
  }, []);

  const handleCta = () => {
    if (!data?.proximaAcao) return;
    const tipo = data.proximaAcao.tipo;
    const map: Record<string, string> = {
      CONFIRMAR_DADOS: `/p/${token}/confirmar`,
      ENVIAR_DOCUMENTOS: `/p/${token}/documentos`,
      RESPONDER_QUESTIONARIO: `/p/${token}/questionario`,
      ENTRAR_TELECONSULTA: `/p/${token}/teleconsulta`,
      BAIXAR_ASO: `/p/${token}/aso`,
    };
    const path = map[tipo];
    if (path) router.push(path);
  };

  const progresso = data?.progresso ?? [];
  const firstIncompleteIndex = progresso.findIndex(p => !p.concluido);
  const etapaIndex = firstIncompleteIndex === -1 ? Math.max(0, progresso.length - 1) : firstIncompleteIndex;
  const acao = data?.proximaAcao;
  const config = acao ? acaoConfig[acao.tipo] : null;
  const isCtaClickable = !!config && !['AGUARDAR_RESULTADOS', 'AGUARDAR_MEDICO'].includes(acao?.tipo ?? '');
  const teleconsultaUrl = data?.teleconsulta?.linkSala ?? null;
  const isWaitingForDoctor = !!teleconsultaUrl || ['NA_FILA_MEDICA', 'EM_ATENDIMENTO_MEDICO'].includes(data?.status ?? '');
  const isWaitingForExams = !teleconsultaUrl && data?.status === 'AGUARDANDO_EXAMES';

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>Carregando...</div>;
  }

  return (
    <div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes pulse-glow { 0%,100% { box-shadow:0 8px 32px rgba(5,150,105,0.35); } 50% { box-shadow:0 8px 52px rgba(5,150,105,0.6); } }
        @keyframes pulse-dot { 0%,100% { box-shadow:0 0 0 4px rgba(59,111,245,0.2); } 50% { box-shadow:0 0 0 8px rgba(59,111,245,0.1); } }
      `}</style>

      {/* Barra de Progresso */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '20px 16px',
        boxShadow: '0 2px 12px rgba(31,38,135,0.08)', border: '1px solid #e5e7eb', marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '12px', left: '8%', right: '8%', height: '3px', background: '#e5e7eb', zIndex: 0 }} />
          <div style={{
            position: 'absolute', top: '12px', left: '8%', height: '3px', background: '#7c3aed', zIndex: 0,
            width: progresso.length > 1 ? `${(etapaIndex / (progresso.length - 1)) * 84}%` : '0%',
            transition: 'width 0.4s ease',
          }} />
          {progresso.map((p, i) => {
            const concluida = p.concluido;
            const atual = i === etapaIndex;
            return (
              <div key={p.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 1, width: `${100 / progresso.length}%` }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, color: 'white',
                  background: concluida ? '#7c3aed' : atual ? '#3b6ff5' : '#d1d5db',
                  animation: atual ? 'pulse-dot 1.5s infinite' : 'none',
                }}>
                  {concluida ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '9px', fontWeight: 600, color: concluida ? '#7c3aed' : atual ? '#3b6ff5' : '#9ca3af', textAlign: 'center', lineHeight: 1.2 }}>
                  {p.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {isWaitingForExams && <ExamGuidanceScreen clinic={data?.clinica} exams={data?.examesSolicitados ?? []} />}

      {/* Sala de Espera / Teleconsulta */}
      {isWaitingForDoctor && <WaitingRoom status={data?.status ?? ''} teleconsultaUrl={teleconsultaUrl} doctorViewing={doctorViewing} />}

      {/* Card de Próxima Ação (oculto quando teleconsulta está ativa) */}
      {!isWaitingForExams && !(isWaitingForDoctor && teleconsultaUrl) && (
        <div style={{
          background: 'white', borderRadius: '20px', padding: '28px 24px',
          boxShadow: '0 2px 12px rgba(31,38,135,0.08)', border: '1px solid #e5e7eb',
          textAlign: 'center', marginBottom: '20px',
        }}>
          {config ? (
            <config.Icon style={{ width: '48px', height: '48px', color: '#4f46e5', marginBottom: '16px' }} />
          ) : (
            <ClockIcon style={{ width: '48px', height: '48px', color: '#9ca3af', marginBottom: '16px' }} />
          )}
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e1b4b', marginBottom: '6px' }}>
            {acao?.titulo ?? 'Próxima ação'}
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px', lineHeight: 1.5 }}>
            {acao?.descricao ?? 'Aguardando atualização do processo.'}
          </p>

          {data?.clinica && (
            <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(79,70,229,0.05)', border: '1px solid rgba(79,70,229,0.12)', marginBottom: '16px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <MapPinIcon style={{ width: '16px', height: '16px', color: '#4f46e5', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e1b4b' }}>{data.clinica.nome}</div>
                  {data.clinica.endereco && <div style={{ fontSize: '12px', color: '#6b7280' }}>{data.clinica.endereco}</div>}
                </div>
              </div>
            </div>
          )}

          {config && isCtaClickable ? (
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleCta}>
              {config.label}
              <ArrowRightIcon style={{ width: '16px', height: '16px' }} />
            </button>
          ) : acao && ['AGUARDAR_RESULTADOS', 'AGUARDAR_MEDICO'].includes(acao.tipo) ? (
            <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '13px', color: '#d97706' }}>
              <ClockIcon style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '6px' }} />
              Acompanhando...
            </div>
          ) : null}
        </div>
      )}

      {/* Timeline */}
      {data?.timeline && data.timeline.length > 0 && (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <button onClick={() => setTimelineOpen(!timelineOpen)} style={{ width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#1e1b4b', fontFamily: 'inherit' }}>
            <span>Ver histórico</span>
            {timelineOpen ? <ChevronUpIcon style={{ width: '18px', height: '18px', color: '#6b7280' }} /> : <ChevronDownIcon style={{ width: '18px', height: '18px', color: '#6b7280' }} />}
          </button>
          {timelineOpen && (
            <div style={{ padding: '0 20px 20px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '8px', top: '4px', bottom: '4px', width: '2px', background: '#e5e7eb' }} />
                {data.timeline.map((evento, i) => (
                  <div key={i} style={{ display: 'flex', gap: '14px', paddingBottom: '16px', position: 'relative' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#7c3aed', flexShrink: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircleIcon style={{ width: '10px', height: '10px', color: 'white' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e1b4b', marginBottom: '2px' }}>
                        {evento.descricao ?? evento.eventType}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {new Date((evento.ocorridoEm ?? evento.occurredAt) as string).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
