"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  VideoCameraIcon,
  MapPinIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  LinkIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import {
  apiGetSolicitacao,
  apiCreateVideoRoom,
  apiFetch,
  getAuthToken,
  getProfileIdFromToken,
} from "../../../lib/api";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

type Decision = "APTO" | "APTO_COM_RESTRICAO" | "INAPTO" | "";

interface SolicitacaoData {
  id: string;
  patient: {
    id: string;
    name: string;
    cpf: string;
    birthDate?: string;
    phone?: string;
    functionCboCode?: string;
    anamneses?: Array<{
      queixas?: string;
      historicoOcupacional?: string;
      historicoMedico?: string;
      medicamentos?: string;
      habitos?: string;
    }>;
  };
  examPurpose: string;
  status: string;
  clinic?: { name: string; city?: string; state?: string } | null;
  results?: Array<{
    id: string;
    type?: { name: string };
    valueJson: string;
    attachmentUrl?: string;
  }>;
  asoDocuments?: Array<{
    id: string;
    decision: string;
    restrictionNotes?: string;
    validUntil: string;
    pdfUrl?: string;
    createdAt: string;
  }>;
  invite?: { company?: { nomeFantasia?: string; name?: string } } | null;
  teleconsultations?: Array<{
    id: string;
    startedAt: string;
    hostRoomUrl?: string;
  }>;
  presence?: {
    patientOnline?: boolean;
  };
  createdAt: string;
}

export default function ConsultaPage() {
  const params = useParams<{ id: string }>();
  const [solicitacao, setSolicitacao] = useState<SolicitacaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"exames" | "anamnese" | "notas">(
    "exames",
  );
  const [decision, setDecision] = useState<Decision>("");
  const [notes, setNotes] = useState("");
  const [restriction, setRestriction] = useState("");
  const [signing, setSigning] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [videoRoomUrl, setVideoRoomUrl] = useState<string | null>(null);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState<
    "video" | "exam" | "anamnese" | "notas" | "aso"
  >("video");
  const [workspaceExamId, setWorkspaceExamId] = useState<string | null>(null);
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>(
    {},
  );
  const [patientOnline, setPatientOnline] = useState(false);
  const [roomError, setRoomError] = useState("");
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [signaturePin, setSignaturePin] = useState("");
  const [signatureError, setSignatureError] = useState("");

  const openExamAttachment = async (resultId: string) => {
    setWorkspaceMode("exam");
    setWorkspaceExamId(resultId);
    setExpandedExamId(resultId);
    if (attachmentUrls[resultId]) return;
    const response = await fetch(
      `${BACKEND_URL}/api/solicitacoes/results/${resultId}/attachment`,
      {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      },
    );
    if (!response.ok) throw new Error("Nao foi possivel carregar o anexo");
    const objectUrl = URL.createObjectURL(await response.blob());
    setAttachmentUrls((current) => ({ ...current, [resultId]: objectUrl }));
  };

  useEffect(() => {
    setDoctorId(getProfileIdFromToken() ?? "");
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await apiGetSolicitacao(params.id);
        if (result.data) {
          setSolicitacao(result.data);
          setPatientOnline(!!result.data.presence?.patientOnline);
          if (
            result.data.teleconsultations &&
            result.data.teleconsultations.length > 0
          ) {
            setVideoRoomUrl(
              result.data.teleconsultations[0].hostRoomUrl ?? null,
            );
          }
        }
      } catch (err) {
        console.error("Erro ao carregar solicitação:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  useEffect(() => {
    if (!solicitacao?.id) return;
    const token = getAuthToken();
    if (!token) return;

    let active = true;
    let interval: ReturnType<typeof setInterval> | null = null;
    let socket: {
      on: (
        event: string,
        handler: (payload?: Record<string, unknown>) => void,
      ) => void;
      emit: (event: string, payload: Record<string, unknown>) => void;
      disconnect: () => void;
    } | null = null;

    import("socket.io-client")
      .then(({ io }) => {
        if (!active) return;
        socket = io(BACKEND_URL, {
          transports: ["websocket", "polling"],
          auth: { token },
        });

        const announceViewing = () => {
          socket?.emit("doctor_viewing_patient", {
            processId: params.id,
            doctorId: doctorId || undefined,
          });
        };

        socket.on("connect", () => {
          socket?.emit("join_process", { processId: params.id });
          announceViewing();
        });

        socket.on("teleconsulta_iniciada", (payload = {}) => {
          if (payload.examRequestId !== params.id) return;
          const hostRoomUrl =
            typeof payload.hostRoomUrl === "string"
              ? payload.hostRoomUrl
              : null;
          if (hostRoomUrl) setVideoRoomUrl(hostRoomUrl);
        });

        interval = setInterval(announceViewing, 10000);
      })
      .catch(() => {
        // A consulta continua funcionando sem WebSocket; o portal ainda tem polling.
      });

    return () => {
      active = false;
      if (interval) clearInterval(interval);
      socket?.disconnect();
    };
  }, [doctorId, params.id, solicitacao?.id]);

  const parsedExams = solicitacao?.results?.map((r) => {
    let values: Record<string, string> = {};
    try {
      values = JSON.parse(r.valueJson);
    } catch {
      values = {};
    }
    return { ...r, parsedValues: values };
  });

  function getExamStatus(
    typeName: string,
    key: string,
    value: string,
  ): "normal" | "attention" | "critical" | null {
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    if (typeName === "pa") {
      if (key === "pressao_sistolica") {
        if (num > 180) return "critical";
        if (num > 140) return "attention";
        if (num < 90) return "attention";
      }
      if (key === "pressao_diastolica") {
        if (num > 120) return "critical";
        if (num > 90) return "attention";
        if (num < 60) return "attention";
      }
    }
    if (typeName === "glicemia") {
      if (num > 300) return "critical";
      if (num > 126) return "attention";
      if (num < 70) return "attention";
    }
    return null;
  }

  const anamnese = solicitacao?.patient?.anamneses?.[0];

  const handleCreateRoom = async () => {
    if (!doctorId) {
      setRoomError(
        "Nao foi possivel identificar o medico autenticado. Faca login novamente.",
      );
      return;
    }
    setCreatingRoom(true);
    setRoomError("");
    try {
      const result = await apiCreateVideoRoom(params.id);
      const roomUrl = result.data?.hostRoomUrl ?? result.hostRoomUrl ?? null;
      if (!result?.success || !roomUrl) {
        setRoomError(
          "Nao foi possivel criar a sala. Faca login novamente e tente de novo.",
        );
        return;
      }
      setVideoRoomUrl(roomUrl);
      setWorkspaceMode("video");
    } catch (err) {
      setRoomError(
        err instanceof Error
          ? err.message
          : "Erro ao criar sala de teleconsulta.",
      );
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleSign = () => {
    if (!decision || !doctorId) return;
    setSignaturePin("");
    setSignatureError("");
    setIsPinModalOpen(true);
  };

  const handleConfirmSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(signaturePin)) {
      setSignatureError("Digite seu PIN de 4 dígitos.");
      return;
    }

    setSigning(true);
    setSignatureError("");
    try {
      const signatureData = await apiFetch("/api/signature/generate", {
        method: "POST",
        body: JSON.stringify({ examRequestId: params.id }),
      });

      await apiFetch(`/api/signature/sign/${signatureData.asoDocumentId}`, {
        method: "POST",
        body: JSON.stringify({ pin: signaturePin }),
      });

      const pdfData = await apiFetch("/api/aso/generate", {
        method: "POST",
        body: JSON.stringify({
          examRequestId: params.id,
          decision,
          restrictionNotes:
            decision === "APTO_COM_RESTRICAO" ? restriction : undefined,
        }),
      });
      if (!pdfData.pdfUrl) {
        throw new Error("ASO gerado sem arquivo PDF. Tente novamente.");
      }

      const generatedAsoDocument = {
        id: pdfData.asoDocumentId ?? signatureData.asoDocumentId,
        decision,
        restrictionNotes:
          decision === "APTO_COM_RESTRICAO" ? restriction : undefined,
        pdfUrl: pdfData.pdfUrl,
        validUntil: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        createdAt: new Date().toISOString(),
      };
      setSignatureUrl(signatureData.url);
      setPdfUrl(pdfData.pdfUrl);
      setWorkspaceMode("aso");
      setSolicitacao((current) => {
        if (!current) return current;
        const otherAsoDocuments = (current.asoDocuments ?? []).filter(
          (document) => document.id !== generatedAsoDocument.id,
        );
        return {
          ...current,
          status: "CONCLUIDO",
          asoDocuments: [generatedAsoDocument, ...otherAsoDocuments],
        };
      });
      setSignaturePin("");
      setIsPinModalOpen(false);
    } catch (error) {
      setSignatureError(
        error instanceof Error ? error.message : "Erro ao gerar assinatura.",
      );
    } finally {
      setSigning(false);
    }
  };

  const decisionOptions: {
    value: Decision;
    label: string;
    Icon: typeof CheckCircleIcon;
    color: string;
    bg: string;
  }[] = [
    {
      value: "APTO",
      label: "Apto",
      Icon: CheckCircleIcon,
      color: "#38a169",
      bg: "rgba(56,161,105,0.15)",
    },
    {
      value: "APTO_COM_RESTRICAO",
      label: "Apto com Restrição",
      Icon: ExclamationTriangleIcon,
      color: "#f5a623",
      bg: "rgba(245,166,35,0.15)",
    },
    {
      value: "INAPTO",
      label: "Inapto",
      Icon: XCircleIcon,
      color: "#e53e3e",
      bg: "rgba(229,62,62,0.15)",
    },
  ];
  const asoDocuments = solicitacao?.asoDocuments ?? [];
  const asoWithPdf = asoDocuments.find((document) => document.pdfUrl);
  const displayedAsoDocument =
    asoWithPdf ??
    asoDocuments.find(
      (document) => document.decision && document.decision !== "PENDENTE",
    ) ??
    asoDocuments[0];
  const displayedAsoPdfUrl = asoWithPdf?.pdfUrl ?? pdfUrl;
  const hasAsoPdfFile = !!displayedAsoPdfUrl;

  if (loading) {
    return (
      <div className="page-center">
        <p style={{ color: "var(--text-muted)" }}>Carregando...</p>
      </div>
    );
  }

  if (!solicitacao) {
    return (
      <div className="page-center">
        <p style={{ color: "#dc2626" }}>Solicitação não encontrada</p>
      </div>
    );
  }

  const patient = solicitacao.patient;
  const workspaceExam = parsedExams?.find(
    (exam) => exam.id === workspaceExamId,
  );
  const workspaceExamUrl = workspaceExamId
    ? attachmentUrls[workspaceExamId]
    : null;
  const workspaceExamIsImage = !!workspaceExam?.attachmentUrl?.match(
    /\.(jpeg|jpg|gif|png)$/i,
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 420px",
        gap: "20px",
        minHeight: "calc(100vh - 160px)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div
          className="card"
          style={{
            flex: 1,
            position: "relative",
            minHeight: "360px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {workspaceMode === "exam" ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "14px 18px",
                  borderBottom: "1px solid var(--border-light)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      fontWeight: 800,
                      textTransform: "uppercase",
                    }}
                  >
                    Visualização de exame
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      color: "var(--text-primary)",
                      fontWeight: 800,
                    }}
                  >
                    {workspaceExam?.parsedValues["nome_exame"] ||
                      workspaceExam?.type?.name ||
                      "Exame anexado"}
                  </div>
                </div>
                <button
                  className="btn btn-ghost"
                  onClick={() => setWorkspaceMode("video")}
                >
                  Voltar para vídeo
                </button>
              </div>
              <div
                style={{
                  flex: 1,
                  minHeight: "620px",
                  padding: "16px",
                  background: "#f8fafc",
                }}
              >
                {!workspaceExam ? (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    Selecione um exame na lateral para visualizar.
                  </div>
                ) : !workspaceExamUrl ? (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    Carregando anexo do exame...
                  </div>
                ) : workspaceExamIsImage ? (
                  <img
                    src={workspaceExamUrl}
                    alt="Exame"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      borderRadius: "12px",
                      background: "white",
                    }}
                  />
                ) : (
                  <iframe
                    src={workspaceExamUrl}
                    style={{
                      width: "100%",
                      height: "100%",
                      minHeight: "620px",
                      border: "none",
                      borderRadius: "12px",
                      background: "white",
                    }}
                    title="PDF do Exame"
                  />
                )}
              </div>
            </div>
          ) : workspaceMode === "anamnese" ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                padding: "28px",
                overflowY: "auto",
              }}
            >
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  marginBottom: "18px",
                  color: "var(--text-primary)",
                }}
              >
                Anamnese do paciente
              </h2>
              <div
                style={{
                  display: "grid",
                  gap: "14px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.7,
                }}
              >
                {anamnese ? (
                  <>
                    {anamnese.queixas && (
                      <section className="card" style={{ boxShadow: "none" }}>
                        <strong>Queixas</strong>
                        <p style={{ whiteSpace: "pre-line", marginTop: "8px" }}>
                          {anamnese.queixas}
                        </p>
                      </section>
                    )}
                    {anamnese.historicoMedico && (
                      <section className="card" style={{ boxShadow: "none" }}>
                        <strong>Histórico médico</strong>
                        <p style={{ whiteSpace: "pre-line", marginTop: "8px" }}>
                          {anamnese.historicoMedico}
                        </p>
                      </section>
                    )}
                    {anamnese.historicoOcupacional && (
                      <section className="card" style={{ boxShadow: "none" }}>
                        <strong>Histórico ocupacional</strong>
                        <p style={{ whiteSpace: "pre-line", marginTop: "8px" }}>
                          {anamnese.historicoOcupacional}
                        </p>
                      </section>
                    )}
                    {anamnese.medicamentos && (
                      <section className="card" style={{ boxShadow: "none" }}>
                        <strong>Medicamentos</strong>
                        <p style={{ whiteSpace: "pre-line", marginTop: "8px" }}>
                          {anamnese.medicamentos}
                        </p>
                      </section>
                    )}
                    {anamnese.habitos && (
                      <section className="card" style={{ boxShadow: "none" }}>
                        <strong>Hábitos</strong>
                        <p style={{ whiteSpace: "pre-line", marginTop: "8px" }}>
                          {anamnese.habitos}
                        </p>
                      </section>
                    )}
                  </>
                ) : (
                  <p style={{ color: "var(--text-muted)" }}>
                    Nenhuma anamnese registrada para este paciente.
                  </p>
                )}
              </div>
            </div>
          ) : workspaceMode === "notas" ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                padding: "28px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  marginBottom: "18px",
                  color: "var(--text-primary)",
                }}
              >
                Notas clínicas
              </h2>
              <textarea
                id="clinical-notes-workspace"
                className="form-input"
                style={{
                  flex: 1,
                  minHeight: "560px",
                  resize: "vertical",
                  fontSize: "15px",
                  lineHeight: 1.6,
                }}
                placeholder="Anotações clínicas (criptografadas em repouso)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          ) : workspaceMode === "aso" ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "14px 18px",
                  borderBottom: "1px solid var(--border-light)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      fontWeight: 800,
                      textTransform: "uppercase",
                    }}
                  >
                    ASO emitido
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      color: "var(--text-primary)",
                      fontWeight: 800,
                    }}
                  >
                    {displayedAsoDocument?.decision === "INAPTO"
                      ? "Inapto"
                      : displayedAsoDocument?.decision === "APTO_COM_RESTRICAO"
                        ? "Apto com Restrição"
                        : "Apto"}
                  </div>
                </div>
                <button
                  className="btn btn-ghost"
                  onClick={() => setWorkspaceMode("video")}
                >
                  Voltar para vídeo
                </button>
              </div>
              <div
                style={{
                  flex: 1,
                  minHeight: "620px",
                  padding: "16px",
                  background: "#f8fafc",
                }}
              >
                {displayedAsoPdfUrl ? (
                  <iframe
                    src={displayedAsoPdfUrl}
                    style={{
                      width: "100%",
                      height: "100%",
                      minHeight: "620px",
                      border: "none",
                      borderRadius: "12px",
                      background: "white",
                    }}
                    title="PDF do ASO"
                  />
                ) : (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      color: "var(--text-muted)",
                      padding: "24px",
                    }}
                  >
                    O arquivo PDF do ASO ainda não está disponível. Emita o ASO
                    para visualizar o documento aqui.
                  </div>
                )}
              </div>
            </div>
          ) : !videoRoomUrl ? (
            <div style={{ textAlign: "center" }}>
              <VideoCameraIcon
                className="icon"
                style={{
                  width: "64px",
                  height: "64px",
                  marginBottom: "16px",
                  color: "var(--text-muted)",
                }}
              />
              <p
                style={{
                  color: "var(--text-secondary)",
                  marginBottom: "20px",
                  fontSize: "14px",
                }}
              >
                Paciente aguardando na sala virtual
              </p>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 14px",
                  borderRadius: "999px",
                  background: patientOnline
                    ? "rgba(34,197,94,0.08)"
                    : "rgba(156,163,175,0.12)",
                  border: `1px solid ${patientOnline ? "rgba(34,197,94,0.22)" : "rgba(156,163,175,0.24)"}`,
                  color: patientOnline ? "#16a34a" : "var(--text-muted)",
                  fontSize: "12px",
                  fontWeight: 700,
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: patientOnline ? "#22c55e" : "#9ca3af",
                  }}
                />
                {patientOnline
                  ? "Paciente online"
                  : "Paciente sem sinal recente"}
              </div>
              <button
                id="btn-create-room"
                className="btn btn-primary"
                onClick={handleCreateRoom}
                disabled={creatingRoom}
              >
                <VideoCameraIcon className="icon" />
                {creatingRoom ? "Criando sala..." : "Iniciar teleconsulta"}
              </button>
              {roomError && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#dc2626",
                    marginTop: "10px",
                    maxWidth: "320px",
                  }}
                >
                  {roomError}
                </p>
              )}
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border-light)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  Sala de Teleconsulta Ativa
                </span>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      color: patientOnline ? "#16a34a" : "var(--text-muted)",
                      fontWeight: 700,
                    }}
                  >
                    {patientOnline
                      ? "Paciente online"
                      : "Paciente sem sinal recente"}
                  </span>
                  <span
                    className="badge badge-done"
                    style={{ padding: "2px 8px" }}
                  >
                    Em Andamento
                  </span>
                </div>
              </div>
              <iframe
                src={videoRoomUrl}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                style={{
                  width: "100%",
                  flex: 1,
                  border: "none",
                  minHeight: "500px",
                  borderRadius: "0 0 12px 12px",
                }}
                title="Teleconsulta Jitsi Meet Médico"
              />
            </div>
          )}
        </div>

        <div className="card" style={{ padding: "16px 20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: "700", fontSize: "16px" }}>
                {patient.name}
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                CPF: {patient.cpf} · {solicitacao.examPurpose} · CBO{" "}
                {patient.functionCboCode ?? "-"}
              </div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: patientOnline ? "#16a34a" : "var(--text-muted)",
                }}
              >
                {patientOnline
                  ? "Paciente online no portal"
                  : "Paciente sem heartbeat nos ultimos 30s"}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  marginTop: "2px",
                }}
              >
                <MapPinIcon className="icon icon-xs" />
                {solicitacao.clinic?.city ?? ""}/
                {solicitacao.clinic?.state ?? ""} ·{" "}
                {solicitacao.clinic?.name ?? ""}
              </div>
            </div>
            <span className="priority-badge priority-city">
              <MapPinIcon className="icon" />
              Mesma Cidade
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          overflowY: "auto",
        }}
      >
        <div className="card" style={{ padding: "0" }}>
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--border-light)",
            }}
          >
            <button
              className={
                workspaceMode === "video" ? "btn btn-primary" : "btn btn-ghost"
              }
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => setWorkspaceMode("video")}
            >
              <VideoCameraIcon className="icon icon-sm" />
              Área de vídeo
            </button>
            {(displayedAsoDocument || displayedAsoPdfUrl) && (
              <button
                className={
                  workspaceMode === "aso" ? "btn btn-primary" : "btn btn-ghost"
                }
                style={{
                  width: "100%",
                  justifyContent: "center",
                  marginTop: "10px",
                }}
                onClick={() => setWorkspaceMode("aso")}
              >
                <DocumentTextIcon className="icon icon-sm" />
                Visualizar ASO
              </button>
            )}
          </div>
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--border-light)",
            }}
          >
            {(
              [
                { id: "exames", label: "Exames", Icon: BeakerIcon },
                {
                  id: "anamnese",
                  label: "Anamnese",
                  Icon: ClipboardDocumentListIcon,
                },
                { id: "notas", label: "Notas", Icon: PencilSquareIcon },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "anamnese") setWorkspaceMode("anamnese");
                  if (tab.id === "notas") setWorkspaceMode("notas");
                }}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "12px",
                  background: "transparent",
                  border: "none",
                  borderBottom:
                    activeTab === tab.id
                      ? "2px solid #3b6ff5"
                      : "2px solid transparent",
                  color:
                    activeTab === tab.id ? "#3b6ff5" : "var(--text-secondary)",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                <tab.Icon className="icon icon-sm" />
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: "20px" }}>
            {activeTab === "exames" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {parsedExams && parsedExams.length > 0 ? (
                  parsedExams.map((exam) => {
                    if (exam.attachmentUrl) {
                      const isSelected =
                        workspaceExamId === exam.id && workspaceMode === "exam";
                      return (
                        <div
                          key={exam.id}
                          className="card"
                          style={{
                            padding: "16px",
                            background: "var(--bg-input)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              cursor: "pointer",
                            }}
                            onClick={() => void openExamAttachment(exam.id)}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <DocumentTextIcon
                                className="icon icon-sm"
                                style={{ color: "#3b6ff5" }}
                              />
                              <span
                                style={{ fontWeight: 600, fontSize: "14px" }}
                              >
                                {exam.parsedValues["nome_exame"] ||
                                  "Exame Anexado"}
                              </span>
                            </div>
                            <span
                              style={{ fontSize: "12px", color: "#3b6ff5" }}
                            >
                              {isSelected ? "Aberto" : "Abrir"}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={exam.id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          paddingBottom: "8px",
                          borderBottom: "1px solid var(--border-light)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                          }}
                        >
                          {exam.type?.name}
                        </div>
                        {Object.entries(exam.parsedValues).map(
                          ([key, value]) => {
                            const status = getExamStatus(
                              exam.type?.name ?? "",
                              key,
                              value,
                            );
                            return (
                              <div
                                key={`${exam.id}-${key}`}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  padding: "10px 14px",
                                  borderRadius: "8px",
                                  background:
                                    status === "critical"
                                      ? "rgba(229,62,62,0.08)"
                                      : status === "attention"
                                        ? "rgba(245,166,35,0.08)"
                                        : "var(--bg-input)",
                                  border: `1px solid ${status === "critical" ? "#dc2626" : status === "attention" ? "#f5a623" : "var(--border-light)"}`,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "13px",
                                    color: "var(--text-secondary)",
                                  }}
                                >
                                  {key.replace(/_/g, " ")}
                                </span>
                                <span
                                  style={{
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    color: "var(--text-primary)",
                                  }}
                                >
                                  {value}
                                </span>
                              </div>
                            );
                          },
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "13px",
                      textAlign: "center",
                    }}
                  >
                    Nenhum exame registrado ainda
                  </p>
                )}
              </div>
            )}

            {activeTab === "anamnese" && (
              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                  lineHeight: "1.6",
                }}
              >
                {anamnese ? (
                  <>
                    {anamnese.queixas && (
                      <p
                        style={{ marginBottom: "8px", whiteSpace: "pre-line" }}
                      >
                        <strong style={{ color: "var(--text-primary)" }}>
                          Queixas:
                        </strong>{" "}
                        {anamnese.queixas}
                      </p>
                    )}
                    {anamnese.historicoMedico && (
                      <p
                        style={{ marginBottom: "8px", whiteSpace: "pre-line" }}
                      >
                        <strong style={{ color: "var(--text-primary)" }}>
                          Histórico Médico:
                        </strong>{" "}
                        {anamnese.historicoMedico}
                      </p>
                    )}
                    {anamnese.historicoOcupacional && (
                      <p
                        style={{ marginBottom: "8px", whiteSpace: "pre-line" }}
                      >
                        <strong style={{ color: "var(--text-primary)" }}>
                          Histórico Ocupacional:
                        </strong>{" "}
                        {anamnese.historicoOcupacional}
                      </p>
                    )}
                    {anamnese.medicamentos && (
                      <p
                        style={{ marginBottom: "8px", whiteSpace: "pre-line" }}
                      >
                        <strong style={{ color: "var(--text-primary)" }}>
                          Medicamentos:
                        </strong>{" "}
                        {anamnese.medicamentos}
                      </p>
                    )}
                    {anamnese.habitos && (
                      <p
                        style={{ marginBottom: "8px", whiteSpace: "pre-line" }}
                      >
                        <strong style={{ color: "var(--text-primary)" }}>
                          Hábitos:
                        </strong>{" "}
                        {anamnese.habitos}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p>
                      <strong style={{ color: "var(--text-primary)" }}>
                        Queixas:
                      </strong>{" "}
                      Nenhuma relatada
                    </p>
                    <p style={{ marginTop: "8px" }}>
                      <strong style={{ color: "var(--text-primary)" }}>
                        Histórico:
                      </strong>{" "}
                      Sem histórico registrado.
                    </p>
                    <p style={{ marginTop: "8px" }}>
                      <strong style={{ color: "var(--text-primary)" }}>
                        Medicamentos:
                      </strong>{" "}
                      Nenhum informado.
                    </p>
                  </>
                )}
              </div>
            )}

            {activeTab === "notas" && (
              <textarea
                id="clinical-notes"
                className="form-input"
                style={{ minHeight: "160px", resize: "vertical" }}
                placeholder="Anotações clínicas (criptografadas em repouso)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            )}
          </div>
        </div>

        <div className="card">
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "700",
              marginBottom: "16px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--text-secondary)",
            }}
          >
            Decisão do ASO
          </h3>

          {(() => {
            const isConcluido = solicitacao?.status === "CONCLUIDO";
            const asoExistente = displayedAsoDocument;
            if (isConcluido && asoExistente && hasAsoPdfFile) {
              return (
                <div
                  className="card"
                  style={{
                    padding: 0,
                    border: "none",
                    boxShadow: "none",
                    background: "transparent",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: "700",
                      marginBottom: "16px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    ASO Emitido
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "16px",
                      borderRadius: "10px",
                      background: "rgba(34,197,94,0.08)",
                      border: "1px solid rgba(34,197,94,0.2)",
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth="2"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <div style={{ fontWeight: 700, color: "#16a34a" }}>
                        {asoExistente.decision === "APTO"
                          ? "Apto"
                          : asoExistente.decision === "INAPTO"
                            ? "Inapto"
                            : "Apto com Restrição"}
                      </div>
                      {asoExistente.restrictionNotes && (
                        <div
                          style={{
                            fontSize: "13px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          Restrição: {asoExistente.restrictionNotes}
                        </div>
                      )}
                      {asoExistente.validUntil && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                          }}
                        >
                          Válido até:{" "}
                          {new Date(asoExistente.validUntil).toLocaleDateString(
                            "pt-BR",
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWorkspaceMode("aso")}
                    className="btn btn-primary"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      marginTop: "12px",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ marginRight: "8px" }}
                    >
                      <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Visualizar ASO na plataforma
                  </button>
                </div>
              );
            }
            return (
              <>
                {isConcluido && asoExistente && !hasAsoPdfFile && (
                  <div
                    style={{
                      padding: "14px 16px",
                      borderRadius: "12px",
                      background: "rgba(245,166,35,0.12)",
                      border: "1px solid rgba(245,166,35,0.3)",
                      color: "#92400e",
                      fontSize: "14px",
                      lineHeight: 1.5,
                      marginBottom: "16px",
                    }}
                  >
                    A decisão foi registrada, mas o arquivo PDF do ASO ainda não
                    está disponível. Selecione a decisão novamente e tente
                    emitir o arquivo.
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginBottom: "16px",
                  }}
                >
                  {decisionOptions.map((opt) => (
                    <button
                      key={opt.value}
                      id={`btn-decision-${opt.value.toLowerCase()}`}
                      onClick={() => setDecision(opt.value)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px 16px",
                        borderRadius: "10px",
                        background:
                          decision === opt.value ? opt.bg : "var(--bg-input)",
                        border: `1px solid ${decision === opt.value ? opt.color : "var(--border-light)"}`,
                        color:
                          decision === opt.value
                            ? opt.color
                            : "var(--text-secondary)",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s",
                      }}
                    >
                      <opt.Icon className="icon icon-sm" />
                      {opt.label}
                    </button>
                  ))}
                </div>

                {decision === "APTO_COM_RESTRICAO" && (
                  <div className="form-group">
                    <label className="form-label">
                      Descrição da Restrição *
                    </label>
                    <textarea
                      id="restriction-notes"
                      className="form-input"
                      style={{ minHeight: "80px", resize: "vertical" }}
                      placeholder="Descreva as restrições..."
                      value={restriction}
                      onChange={(e) => setRestriction(e.target.value)}
                    />
                  </div>
                )}

                <button
                  id="btn-sign-aso"
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    marginTop: "8px",
                  }}
                  onClick={handleSign}
                  disabled={
                    !decision ||
                    signing ||
                    (decision === "APTO_COM_RESTRICAO" && !restriction) ||
                    hasAsoPdfFile ||
                    !videoRoomUrl
                  }
                >
                  {signing ? (
                    <>
                      <ClockIcon className="icon" /> Processando...
                    </>
                  ) : signatureUrl ? (
                    <>
                      <LinkIcon className="icon" /> Acessar Assinatura
                    </>
                  ) : (
                    <>
                      <PencilSquareIcon className="icon" /> Emitir ASO
                    </>
                  )}
                </button>

                {pdfUrl && (
                  <div style={{ marginTop: "16px", textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => setWorkspaceMode("aso")}
                      className="btn btn-success"
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      <DocumentTextIcon className="icon" />
                      Visualizar ASO Assinado
                    </button>
                  </div>
                )}

                {!videoRoomUrl && !isConcluido && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#e53e3e",
                      textAlign: "center",
                      marginTop: "8px",
                    }}
                  >
                    A sala de teleconsulta precisa ser criada antes de emitir o
                    ASO.
                  </p>
                )}
                {!decision && videoRoomUrl && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      textAlign: "center",
                      marginTop: "8px",
                    }}
                  >
                    Selecione uma decisão para habilitar a assinatura
                  </p>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {isPinModalOpen && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !signing)
              setIsPinModalOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(15, 23, 42, 0.55)",
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="signature-pin-title"
            onSubmit={handleConfirmSignature}
            className="card"
            style={{ width: "100%", maxWidth: "420px", margin: 0 }}
          >
            <h3
              id="signature-pin-title"
              style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}
            >
              Confirmar assinatura
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "14px",
                marginBottom: "20px",
              }}
            >
              Digite seu PIN pessoal para emitir e assinar este ASO.
            </p>
            <div className="form-group">
              <label className="form-label" htmlFor="signature-pin">
                PIN de assinatura
              </label>
              <input
                id="signature-pin"
                autoFocus
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                autoComplete="off"
                className="form-input"
                value={signaturePin}
                onChange={(event) =>
                  setSignaturePin(
                    event.target.value.replace(/\D/g, "").slice(0, 4),
                  )
                }
                placeholder="••••"
                required
              />
            </div>
            {signatureError && (
              <p
                role="alert"
                style={{
                  color: "#dc2626",
                  fontSize: "13px",
                  marginTop: "10px",
                }}
              >
                {signatureError}
              </p>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                type="button"
                className="btn"
                onClick={() => setIsPinModalOpen(false)}
                disabled={signing}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={signing || signaturePin.length !== 4}
              >
                {signing ? (
                  <>
                    <ClockIcon className="icon" /> Assinando...
                  </>
                ) : (
                  "Confirmar e emitir"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
