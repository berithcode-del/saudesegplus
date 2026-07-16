"use client";
import { useEffect, useState } from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { apiFetch, getProfileIdFromToken } from "../../lib/api";
import { apiGetMedicoProfile } from "@/lib/api";
import FaqHelp from "../../../components/FaqHelp";
import { maskPhone, FIELD_LIMITS } from '../../../lib/formatUtils';

type TabType = "perfil" | "seguranca" | "assinatura";

interface DoctorProfile {
  id: string;
  name: string;
  gender: string | null;
  crmNumber: string;
  crmState: string;
  city: string | null;
  state: string | null;
  specialties: string | null;
  rqeNumber: string | null;
  email: string | null;
  phone: string | null;
  contactEmail: string | null;
  verifiedAt: string | null;
}

export default function MedicoConfiguracaoPage() {
  const [activeTab, setActiveTab] = useState<TabType>("perfil");
  const tabs = {
    perfil: { label: "Perfil", description: "Seus dados profissionais" },
    seguranca: { label: "Segurança", description: "Alterar senha" },
    assinatura: { label: "Assinatura", description: "Certificado digital" },
  };

  const [doctorId, setDoctorId] = useState("");
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formContactEmail, setFormContactEmail] = useState("");

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [pinForm, setPinForm] = useState({
    currentPassword: "",
    pin: "",
    confirmPin: "",
  });
  const [pinSaving, setPinSaving] = useState(false);
  const [pinMessage, setPinMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const id = getProfileIdFromToken() ?? "";
    setDoctorId(id);
    if (!id) {
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    apiGetMedicoProfile(id)
      .then((r) => {
        if ((r as { success?: boolean })?.success === false) {
          setProfile(null);
          return;
        }
        const d = (r as any)?.data ?? r;
        if (!d?.id) {
          setProfile(null);
          return;
        }
        setProfile(d);
        setFormCity(d?.city ?? "");
        setFormState(d?.state ?? "");
        setFormPhone(d?.phone ?? "");
        setFormContactEmail(d?.contactEmail ?? "");
      })
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));
  }, []);

  const handleSaveProfile = async () => {
    if (!doctorId) return;
    setProfileSaving(true);
    try {
      const result = await apiFetch(`/api/medicos/${doctorId}/perfil`, {
        method: "PATCH",
        body: JSON.stringify({
          city: formCity || null,
          state: formState || null,
          phone: formPhone.replace(/\D/g, ''),
          contactEmail: formContactEmail.trim() || undefined,
        }),
      });
      if (result.success) {
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
      }
    } catch {
      alert("Erro ao salvar perfil");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMessage({ type: "error", text: "As senhas não conferem" });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMessage({
        type: "error",
        text: "A nova senha deve ter no mínimo 6 caracteres",
      });
      return;
    }
    setPwSaving(true);
    setPwMessage(null);
    try {
      const result = await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      if (result.success) {
        setPwMessage({ type: "success", text: "Senha alterada com sucesso!" });
        setPwForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setPwMessage({
          type: "error",
          text: result.message || "Erro ao alterar senha",
        });
      }
    } catch (error) {
      setPwMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erro ao alterar senha",
      });
    } finally {
      setPwSaving(false);
    }
  };

  const handleSetSignaturePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pinForm.pin)) {
      setPinMessage({
        type: "error",
        text: "O PIN deve conter exatamente 4 dígitos",
      });
      return;
    }
    if (pinForm.pin !== pinForm.confirmPin) {
      setPinMessage({ type: "error", text: "Os PINs não conferem" });
      return;
    }

    setPinSaving(true);
    setPinMessage(null);
    try {
      const result = await apiFetch("/api/medicos/signature-pin", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: pinForm.currentPassword,
          pin: pinForm.pin,
        }),
      });
      setPinMessage({
        type: "success",
        text: result.message ?? "PIN cadastrado com sucesso!",
      });
      setPinForm({ currentPassword: "", pin: "", confirmPin: "" });
    } catch (error) {
      setPinMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erro ao cadastrar PIN",
      });
    } finally {
      setPinSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Configurações</h2>
        <div className="tabs-bar">
          {(Object.keys(tabs) as Array<TabType>).map((tab) => (
            <button
              key={tab}
              className={`tab-item ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tabs[tab].label}
            </button>
          ))}
        </div>
        <p>{tabs[activeTab].description}</p>
      </div>

      {activeTab === "perfil" && (
        <div className="card">
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#1e1b4b",
              marginBottom: "16px",
            }}
          >
            Dados do Médico
          </h3>
          {profileLoading ? (
            <p style={{ color: "#6b7280", fontSize: "14px" }}>Carregando...</p>
          ) : profile ? (
            <>
              <div className="info-grid">
                <InfoRow label="Nome" value={profile.name} />
                <InfoRow
                  label="CRM"
                  value={`${profile.crmNumber} / ${profile.crmState}`}
                />
                {profile.rqeNumber && (
                  <InfoRow label="RQE" value={profile.rqeNumber} />
                )}
                <InfoRow
                  label="Especialidades"
                  value={profile.specialties ?? "Não informado"}
                />
                <InfoRow
                  label="Sexo"
                  value={
                    profile.gender === "female"
                      ? "Feminino"
                      : profile.gender === "male"
                        ? "Masculino"
                        : "NÃ£o informado"
                  }
                />
                <InfoRow label="E-mail" value={profile.email ?? "-"} />
                <InfoRow
                  label="Status"
                  value={profile.verifiedAt ? "Verificado" : "Pendente"}
                />
              </div>
              <div className="divider" />
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1e1b4b",
                  marginBottom: "12px",
                }}
              >
                Localização
              </h4>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Telefone de contato</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formPhone}
                    onChange={(e) => setFormPhone(maskPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    maxLength={FIELD_LIMITS.PHONE}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">E-mail de contato</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formContactEmail}
                    onChange={(e) => setFormContactEmail(e.target.value)}
                    placeholder="contato@exemplo.com"
                    maxLength={FIELD_LIMITS.EMAIL}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cidade</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="Ex: São Paulo"
                    maxLength={FIELD_LIMITS.CITY}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select
                    className="form-select"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {[
                      "AC",
                      "AL",
                      "AP",
                      "AM",
                      "BA",
                      "CE",
                      "DF",
                      "ES",
                      "GO",
                      "MA",
                      "MT",
                      "MS",
                      "MG",
                      "PA",
                      "PB",
                      "PR",
                      "PE",
                      "PI",
                      "RJ",
                      "RN",
                      "RS",
                      "RO",
                      "RR",
                      "SC",
                      "SP",
                      "SE",
                      "TO",
                    ].map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                marginTop: "20px",
                padding: "12px 14px",
                border: "1px solid #c7d2fe",
                borderRadius: "8px",
                background: "#eef2ff",
                color: "#3730a3",
                fontSize: "13px",
                lineHeight: 1.5,
              }}>
                <InformationCircleIcon style={{ width: 19, height: 19, flexShrink: 0 }} />
                <span>Para alterar nome, CRM, RQE ou e-mail de acesso, entre em contato com o administrador da plataforma.</span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                  marginTop: "24px",
                }}
              >
                {profileSaved && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#22c55e",
                      fontSize: "13px",
                      alignSelf: "center",
                    }}
                  >
                    <CheckCircleIcon className="icon icon-sm" /> Salvo com
                    sucesso!
                  </span>
                )}
                <button
                  className="btn btn-primary"
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                >
                  {profileSaving ? (
                    <>
                      <ClockIcon className="icon" /> Salvando...
                    </>
                  ) : (
                    "Salvar Alterações"
                  )}
                </button>
              </div>
            </>
          ) : (
            <p style={{ color: "#dc2626", fontSize: "14px" }}>
              Perfil médico não encontrado.
            </p>
          )}
        </div>
      )}

      {activeTab === "seguranca" && (
        <div className="card">
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#1e1b4b",
              marginBottom: "16px",
            }}
          >
            Alterar Senha
          </h3>
          <form onSubmit={handleChangePassword}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Senha Atual</label>
                <input
                  type="password"
                  className="form-input"
                  value={pwForm.currentPassword}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, currentPassword: e.target.value })
                  }
                  placeholder="Digite sua senha atual"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nova Senha</label>
                <input
                  type="password"
                  className="form-input"
                  value={pwForm.newPassword}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, newPassword: e.target.value })
                  }
                  placeholder="Digite a nova senha"
                  minLength={6}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmar Nova Senha</label>
                <input
                  type="password"
                  className="form-input"
                  value={pwForm.confirmPassword}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, confirmPassword: e.target.value })
                  }
                  placeholder="Repita a nova senha"
                  minLength={6}
                  required
                />
              </div>
            </div>
            {pwMessage && (
              <p
                style={{
                  color: pwMessage.type === "success" ? "#22c55e" : "#dc2626",
                  fontSize: "14px",
                  marginTop: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <CheckCircleIcon className="icon icon-sm" />
                {pwMessage.text}
              </p>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "16px",
              }}
            >
              <button
                type="submit"
                className="btn btn-primary"
                disabled={pwSaving}
              >
                {pwSaving ? (
                  <>
                    <ClockIcon className="icon" /> Alterando...
                  </>
                ) : (
                  "Alterar Senha"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "assinatura" && (
        <div className="card">
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#1e1b4b",
              marginBottom: "16px",
            }}
          >
            Assinatura Digital
          </h3>
          <p
            style={{ color: "#6b7280", fontSize: "14px", marginBottom: "20px" }}
          >
            Cadastre um PIN pessoal de 4 dígitos para autorizar a emissão de
            ASOs.
          </p>
          <form onSubmit={handleSetSignaturePin}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Senha Atual</label>
                <input
                  type="password"
                  className="form-input"
                  value={pinForm.currentPassword}
                  onChange={(e) =>
                    setPinForm({ ...pinForm, currentPassword: e.target.value })
                  }
                  placeholder="Digite sua senha atual"
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Novo PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  className="form-input"
                  value={pinForm.pin}
                  onChange={(e) =>
                    setPinForm({
                      ...pinForm,
                      pin: e.target.value.replace(/\D/g, "").slice(0, 4),
                    })
                  }
                  placeholder="4 dígitos"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmar PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  className="form-input"
                  value={pinForm.confirmPin}
                  onChange={(e) =>
                    setPinForm({
                      ...pinForm,
                      confirmPin: e.target.value.replace(/\D/g, "").slice(0, 4),
                    })
                  }
                  placeholder="Repita o PIN"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            {pinMessage && (
              <p
                role="status"
                style={{
                  color: pinMessage.type === "success" ? "#22c55e" : "#dc2626",
                  fontSize: "14px",
                  marginTop: "12px",
                }}
              >
                {pinMessage.text}
              </p>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "16px",
              }}
            >
              <button
                type="submit"
                className="btn btn-primary"
                disabled={pinSaving}
              >
                {pinSaving ? (
                  <>
                    <ClockIcon className="icon" /> Salvando...
                  </>
                ) : (
                  "Cadastrar PIN"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <FaqHelp perfil="DOCTOR" />
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        padding: "10px 0",
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      <span
        style={{
          width: "140px",
          fontSize: "13px",
          fontWeight: 500,
          color: "#6b7280",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: "14px", color: "#1f2937" }}>{value}</span>
    </div>
  );
}
