"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BeakerIcon,
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  ClipboardIcon,
  IdentificationIcon,
  TrashIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import {
  apiAdminClearSandbox,
  apiAdminCreateClinic,
  apiAdminCreateCompany,
  apiAdminCreateDoctor,
  apiAdminListClinics,
  apiAdminListCompanies,
  apiAdminListDoctors,
  apiAdminListSandboxPatients,
} from "@/app/lib/api";

type SandboxTab = "clinics" | "doctors" | "companies" | "patients";

interface SandboxClinic {
  id: string;
  name: string;
  cnpj: string;
  city?: string | null;
  state?: string | null;
  environment: "SANDBOX";
}

interface SandboxDoctor {
  id: string;
  name: string;
  crmNumber: string;
  crmState: string;
  city?: string | null;
  state?: string | null;
  verifiedAt?: string | null;
  environment: "SANDBOX";
}

interface SandboxCompany {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string | null;
  cnpj: string;
  city?: string | null;
  state?: string | null;
  status: string;
  environment: "SANDBOX";
}

interface SandboxPatient {
  id: string;
  name: string;
  cpf: string;
  status: string;
  createdAt: string;
  companies: Array<{
    company: {
      id: string;
      razaoSocial: string;
      nomeFantasia?: string | null;
    };
  }>;
  processoAsos: Array<{
    id: string;
    numeroProtocolo: string;
    status: string;
    tipoExame: string;
    dataAbertura: string;
    clinica?: { id: string; name: string } | null;
    empresa: {
      id: string;
      razaoSocial: string;
      nomeFantasia?: string | null;
    };
  }>;
  examRequests: Array<{
    id: string;
    status: string;
    examPurpose: string;
    createdAt: string;
    clinic?: { id: string; name: string } | null;
  }>;
}

interface Credentials {
  label: string;
  email: string;
  tempPassword: string;
}

const states = [
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
];

const initialClinic = {
  name: "",
  cnpj: "",
  city: "",
  state: "",
  email: "",
};

const initialDoctor = {
  name: "",
  crmNumber: "",
  crmState: "",
  city: "",
  state: "",
  email: "",
};

const initialCompany = {
  razaoSocial: "",
  nomeFantasia: "",
  cnpj: "",
  city: "",
  state: "",
  email: "",
};

export default function AdminSandboxPage() {
  const [tab, setTab] = useState<SandboxTab>("clinics");
  const [clinics, setClinics] = useState<SandboxClinic[]>([]);
  const [doctors, setDoctors] = useState<SandboxDoctor[]>([]);
  const [companies, setCompanies] = useState<SandboxCompany[]>([]);
  const [patients, setPatients] = useState<SandboxPatient[]>([]);
  const [clinicForm, setClinicForm] = useState(initialClinic);
  const [doctorForm, setDoctorForm] = useState(initialDoctor);
  const [companyForm, setCompanyForm] = useState(initialCompany);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState(false);

  const loadSandbox = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [clinicResult, doctorResult, companyResult, patientResult] =
        await Promise.all([
          apiAdminListClinics("SANDBOX"),
          apiAdminListDoctors("SANDBOX"),
          apiAdminListCompanies({ environment: "SANDBOX" }),
          apiAdminListSandboxPatients(),
        ]);
      setClinics(clinicResult.data as SandboxClinic[]);
      setDoctors(doctorResult.data as SandboxDoctor[]);
      setCompanies(companyResult.data as SandboxCompany[]);
      setPatients(patientResult.data as SandboxPatient[]);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar o sandbox.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSandbox();
  }, [loadSandbox]);

  const showCredentials = (
    label: string,
    result: { email?: string; tempPassword?: string },
  ) => {
    if (!result.email || !result.tempPassword) return;
    setCredentials({
      label,
      email: result.email,
      tempPassword: result.tempPassword,
    });
    setCopied(false);
  };

  const createClinic = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await apiAdminCreateClinic({
        ...clinicForm,
        environment: "SANDBOX",
      });
      setClinicForm(initialClinic);
      showCredentials("Clínica de teste criada", result);
      await loadSandbox();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Erro ao criar clínica de teste.",
      );
    } finally {
      setSaving(false);
    }
  };

  const createDoctor = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await apiAdminCreateDoctor({
        ...doctorForm,
        environment: "SANDBOX",
      });
      setDoctorForm(initialDoctor);
      showCredentials("Médico de teste criado", result);
      await loadSandbox();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Erro ao criar médico de teste.",
      );
    } finally {
      setSaving(false);
    }
  };

  const createCompany = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await apiAdminCreateCompany({
        ...companyForm,
        environment: "SANDBOX",
      });
      setCompanyForm(initialCompany);
      showCredentials("Empresa de teste criada", result);
      await loadSandbox();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Erro ao criar empresa de teste.",
      );
    } finally {
      setSaving(false);
    }
  };

  const copyCredentials = async () => {
    if (!credentials) return;
    await navigator.clipboard.writeText(
      `E-mail: ${credentials.email}\nSenha temporária: ${credentials.tempPassword}`,
    );
    setCopied(true);
  };

  const clearSandbox = async () => {
    const confirmed = window.confirm(
      "Excluir todos os cadastros, pacientes, protocolos, exames e históricos do Sandbox? Os dados reais não serão alterados.",
    );
    if (!confirmed) return;

    setClearing(true);
    setError("");
    setSuccess("");
    try {
      const result = (await apiAdminClearSandbox()) as {
        deleted?: {
          clinics?: number;
          doctors?: number;
          companies?: number;
          patients?: number;
          protocols?: number;
        };
      };
      const deleted = result.deleted;
      setCredentials(null);
      setSuccess(
        deleted
          ? `Sandbox limpo: ${deleted.clinics ?? 0} clínicas, ${deleted.doctors ?? 0} médicos, ${deleted.companies ?? 0} empresas, ${deleted.patients ?? 0} pacientes e ${deleted.protocols ?? 0} protocolos excluídos.`
          : "Todos os dados do Sandbox foram excluídos.",
      );
      await loadSandbox();
    } catch (clearError) {
      setError(
        clearError instanceof Error
          ? clearError.message
          : "Não foi possível limpar o Sandbox.",
      );
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="sandbox-title">
          <div className="sandbox-mark">
            <BeakerIcon />
          </div>
          <div>
            <div className="sandbox-eyebrow">AMBIENTE ISOLADO</div>
            <h2>Sandbox</h2>
            <p>
              Crie personagens fictícios sem misturar dados com a operação real.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="sandbox-clear-button"
          disabled={clearing || loading}
          onClick={() => void clearSandbox()}
        >
          <TrashIcon />
          {clearing ? "Limpando..." : "Limpar dados de teste"}
        </button>
      </div>

      <div className="sandbox-notice">
        <strong>Proteção ativa:</strong> clínicas, médicos, empresas, pacientes
        e atendimentos criados aqui só se relacionam com outros registros
        sandbox.
      </div>

      <div className="summary-grid">
        <SummaryCard
          icon={<BuildingStorefrontIcon />}
          label="Clínicas de teste"
          value={clinics.length}
        />
        <SummaryCard
          icon={<UserGroupIcon />}
          label="Médicos de teste"
          value={doctors.length}
        />
        <SummaryCard
          icon={<BuildingOffice2Icon />}
          label="Empresas de teste"
          value={companies.length}
        />
        <SummaryCard
          icon={<IdentificationIcon />}
          label="Pacientes de teste"
          value={patients.length}
        />
      </div>

      {credentials && (
        <div className="credential-card">
          <div>
            <strong>{credentials.label}</strong>
            <span>{credentials.email}</span>
            <code>{credentials.tempPassword}</code>
          </div>
          <button className="btn btn-success" onClick={copyCredentials}>
            <ClipboardIcon className="icon icon-sm" />
            {copied ? "Copiado" : "Copiar acesso"}
          </button>
        </div>
      )}

      <div
        className="sandbox-tabs"
        role="tablist"
        aria-label="Cadastros sandbox"
      >
        <TabButton
          active={tab === "clinics"}
          onClick={() => setTab("clinics")}
          label="Clínicas"
        />
        <TabButton
          active={tab === "doctors"}
          onClick={() => setTab("doctors")}
          label="Médicos"
        />
        <TabButton
          active={tab === "companies"}
          onClick={() => setTab("companies")}
          label="Empresas"
        />
        <TabButton
          active={tab === "patients"}
          onClick={() => setTab("patients")}
          label="Pacientes e protocolos"
        />
      </div>

      {error && <div className="sandbox-error">{error}</div>}
      {success && <div className="sandbox-success">{success}</div>}

      <div
        className={`sandbox-workspace ${tab === "patients" ? "list-only" : ""}`}
      >
        {tab !== "patients" && (
          <div className="card sandbox-form-card">
            {tab === "clinics" && (
            <form onSubmit={createClinic}>
              <FormHeader
                title="Nova clínica de teste"
                description="Os pacientes cadastrados por ela herdarão o ambiente sandbox."
              />
              <TextField
                label="Nome"
                value={clinicForm.name}
                onChange={(name) =>
                  setClinicForm((current) => ({ ...current, name }))
                }
              />
              <TextField
                label="CNPJ fictício"
                value={clinicForm.cnpj}
                onChange={(cnpj) =>
                  setClinicForm((current) => ({ ...current, cnpj }))
                }
              />
              <LocationFields
                city={clinicForm.city}
                state={clinicForm.state}
                onCityChange={(city) =>
                  setClinicForm((current) => ({ ...current, city }))
                }
                onStateChange={(state) =>
                  setClinicForm((current) => ({ ...current, state }))
                }
              />
              <TextField
                label="E-mail de acesso"
                type="email"
                value={clinicForm.email}
                onChange={(email) =>
                  setClinicForm((current) => ({ ...current, email }))
                }
              />
              <SubmitButton saving={saving} />
            </form>
            )}

            {tab === "doctors" && (
            <form onSubmit={createDoctor}>
              <FormHeader
                title="Novo médico de teste"
                description="Ele será aprovado automaticamente e só verá a fila sandbox."
              />
              <TextField
                label="Nome"
                value={doctorForm.name}
                onChange={(name) =>
                  setDoctorForm((current) => ({ ...current, name }))
                }
              />
              <div className="field-row">
                <TextField
                  label="CRM fictício"
                  value={doctorForm.crmNumber}
                  onChange={(crmNumber) =>
                    setDoctorForm((current) => ({ ...current, crmNumber }))
                  }
                />
                <StateField
                  label="UF do CRM"
                  value={doctorForm.crmState}
                  onChange={(crmState) =>
                    setDoctorForm((current) => ({ ...current, crmState }))
                  }
                />
              </div>
              <LocationFields
                city={doctorForm.city}
                state={doctorForm.state}
                onCityChange={(city) =>
                  setDoctorForm((current) => ({ ...current, city }))
                }
                onStateChange={(state) =>
                  setDoctorForm((current) => ({ ...current, state }))
                }
              />
              <TextField
                label="E-mail de acesso"
                type="email"
                value={doctorForm.email}
                onChange={(email) =>
                  setDoctorForm((current) => ({ ...current, email }))
                }
              />
              <SubmitButton saving={saving} />
            </form>
            )}

            {tab === "companies" && (
            <form onSubmit={createCompany}>
              <FormHeader
                title="Nova empresa de teste"
                description="A empresa nasce liberada para criar convites no sandbox."
              />
              <TextField
                label="Razão social"
                value={companyForm.razaoSocial}
                onChange={(razaoSocial) =>
                  setCompanyForm((current) => ({ ...current, razaoSocial }))
                }
              />
              <TextField
                label="Nome fantasia"
                required={false}
                value={companyForm.nomeFantasia}
                onChange={(nomeFantasia) =>
                  setCompanyForm((current) => ({ ...current, nomeFantasia }))
                }
              />
              <TextField
                label="CNPJ fictício"
                value={companyForm.cnpj}
                onChange={(cnpj) =>
                  setCompanyForm((current) => ({ ...current, cnpj }))
                }
              />
              <LocationFields
                city={companyForm.city}
                state={companyForm.state}
                onCityChange={(city) =>
                  setCompanyForm((current) => ({ ...current, city }))
                }
                onStateChange={(state) =>
                  setCompanyForm((current) => ({ ...current, state }))
                }
              />
              <TextField
                label="E-mail de acesso"
                type="email"
                value={companyForm.email}
                onChange={(email) =>
                  setCompanyForm((current) => ({ ...current, email }))
                }
              />
              <SubmitButton saving={saving} />
            </form>
            )}
          </div>
        )}

        <div className="card sandbox-list-card">
          <div className="list-header">
            <div>
              <strong>
                {tab === "patients"
                  ? "Pacientes e protocolos no Sandbox"
                  : "Cadastros no Sandbox"}
              </strong>
              <span>
                {tab === "patients"
                  ? "Cada paciente aparece com os protocolos gerados no fluxo de teste."
                  : "Somente dados de teste aparecem nesta lista."}
              </span>
            </div>
            <button
              className="btn btn-ghost"
              onClick={() => void loadSandbox()}
            >
              Atualizar
            </button>
          </div>

          {loading ? (
            <div className="empty-state">Carregando ambiente...</div>
          ) : (
            <SandboxTable
              tab={tab}
              clinics={clinics}
              doctors={doctors}
              companies={companies}
              patients={patients}
            />
          )}
        </div>
      </div>

      <style>{`
        .sandbox-title {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }
        .sandbox-clear-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 40px;
          padding: 9px 14px;
          border: 1px solid #fecaca;
          border-radius: 10px;
          color: #b91c1c;
          background: #fff;
          cursor: pointer;
          font-size: 13px;
          font-weight: 750;
        }
        .sandbox-clear-button:hover:not(:disabled) {
          background: #fef2f2;
        }
        .sandbox-clear-button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }
        .sandbox-clear-button :global(svg) {
          width: 17px;
          height: 17px;
        }
        .sandbox-mark {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          color: #7c3aed;
          background: #f3e8ff;
          border: 1px solid #e9d5ff;
        }
        .sandbox-mark :global(svg) {
          width: 28px;
          height: 28px;
        }
        .sandbox-eyebrow {
          color: #7c3aed;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          margin-bottom: 3px;
        }
        .sandbox-notice {
          margin-bottom: 18px;
          padding: 14px 16px;
          border-radius: 12px;
          color: #5b21b6;
          background: #faf5ff;
          border: 1px solid #e9d5ff;
          font-size: 14px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }
        .credential-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
          padding: 16px;
          border-radius: 14px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
        }
        .credential-card > div {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          color: #166534;
        }
        .credential-card span {
          font-size: 14px;
        }
        .credential-card code {
          padding: 5px 9px;
          border-radius: 7px;
          background: #dcfce7;
          font-weight: 700;
        }
        .sandbox-tabs {
          display: flex;
          gap: 6px;
          margin-bottom: 14px;
          padding: 5px;
          width: fit-content;
          border-radius: 12px;
          background: #f3f4f6;
        }
        .sandbox-error {
          margin-bottom: 14px;
          padding: 12px 14px;
          border-radius: 10px;
          color: #b91c1c;
          background: #fef2f2;
          border: 1px solid #fecaca;
        }
        .sandbox-success {
          margin-bottom: 14px;
          padding: 12px 14px;
          border: 1px solid #bbf7d0;
          border-radius: 10px;
          color: #166534;
          background: #f0fdf4;
        }
        .sandbox-workspace {
          display: grid;
          grid-template-columns: minmax(300px, 0.8fr) minmax(480px, 1.4fr);
          gap: 18px;
          align-items: start;
        }
        .sandbox-workspace.list-only {
          grid-template-columns: minmax(0, 1fr);
        }
        .sandbox-form-card {
          padding: 22px;
        }
        .sandbox-list-card {
          overflow: hidden;
        }
        .field-row {
          display: grid;
          grid-template-columns: 1fr 120px;
          gap: 10px;
        }
        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 18px 20px;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }
        .list-header div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .list-header span {
          color: var(--text-muted);
          font-size: 12px;
        }
        .empty-state {
          padding: 48px 20px;
          text-align: center;
          color: var(--text-muted);
        }
        @media (max-width: 980px) {
          .page-header {
            align-items: flex-start;
            flex-direction: column;
          }
          .summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .sandbox-workspace {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 600px) {
          .summary-grid {
            grid-template-columns: 1fr;
          }
          .sandbox-tabs {
            width: 100%;
            overflow-x: auto;
          }
        }
      `}</style>
    </>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div
      className="card"
      style={{ padding: 18, display: "flex", gap: 14, alignItems: "center" }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          display: "grid",
          placeItems: "center",
          color: "#7c3aed",
          background: "#f3e8ff",
        }}
      >
        <span style={{ width: 20, height: 20 }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: 24, lineHeight: 1, fontWeight: 800 }}>
          {value}
        </div>
        <div style={{ marginTop: 5, color: "var(--text-muted)", fontSize: 13 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        padding: "8px 16px",
        border: 0,
        borderRadius: 9,
        cursor: "pointer",
        fontWeight: 700,
        color: active ? "#5b21b6" : "#6b7280",
        background: active ? "#fff" : "transparent",
        boxShadow: active ? "0 1px 3px rgba(15,23,42,.1)" : "none",
      }}
    >
      {label}
    </button>
  );
}

function FormHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h3 style={{ margin: 0, fontSize: 17 }}>{title}</h3>
      <p
        style={{
          margin: "6px 0 0",
          color: "var(--text-muted)",
          fontSize: 13,
          lineHeight: 1.45,
        }}
      >
        {description}
      </p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        {required ? " *" : ""}
      </label>
      <input
        className="form-input"
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function StateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="form-group">
      <label className="form-label">{label} *</label>
      <select
        className="form-select"
        value={value}
        required
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">UF</option>
        {states.map((state) => (
          <option key={state} value={state}>
            {state}
          </option>
        ))}
      </select>
    </div>
  );
}

function LocationFields({
  city,
  state,
  onCityChange,
  onStateChange,
}: {
  city: string;
  state: string;
  onCityChange: (value: string) => void;
  onStateChange: (value: string) => void;
}) {
  return (
    <div className="field-row">
      <TextField label="Cidade" value={city} onChange={onCityChange} />
      <StateField label="Estado" value={state} onChange={onStateChange} />
    </div>
  );
}

function SubmitButton({ saving }: { saving: boolean }) {
  return (
    <button
      type="submit"
      className="btn btn-primary"
      disabled={saving}
      style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
    >
      {saving ? "Criando..." : "Criar no sandbox"}
    </button>
  );
}

function SandboxTable({
  tab,
  clinics,
  doctors,
  companies,
  patients,
}: {
  tab: SandboxTab;
  clinics: SandboxClinic[];
  doctors: SandboxDoctor[];
  companies: SandboxCompany[];
  patients: SandboxPatient[];
}) {
  const items =
    tab === "clinics"
      ? clinics
      : tab === "doctors"
        ? doctors
        : tab === "companies"
          ? companies
          : patients;
  if (items.length === 0) {
    return (
      <div className="empty-state">
        Nenhum cadastro de teste nesta categoria.
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="queue-table">
        <thead>
          {tab === "clinics" && (
            <tr>
              <th>Clínica</th>
              <th>CNPJ</th>
              <th>Local</th>
              <th>Ambiente</th>
            </tr>
          )}
          {tab === "doctors" && (
            <tr>
              <th>Médico</th>
              <th>CRM</th>
              <th>Local</th>
              <th>Status</th>
            </tr>
          )}
          {tab === "companies" && (
            <tr>
              <th>Empresa</th>
              <th>CNPJ</th>
              <th>Local</th>
              <th>Status</th>
            </tr>
          )}
          {tab === "patients" && (
            <tr>
              <th>Paciente</th>
              <th>CPF</th>
              <th>Empresa</th>
              <th>Protocolos</th>
              <th>Clínica</th>
              <th>Status</th>
            </tr>
          )}
        </thead>
        <tbody>
          {tab === "clinics" &&
            clinics.map((clinic) => (
              <tr key={clinic.id}>
                <td style={{ fontWeight: 700 }}>{clinic.name}</td>
                <td>{clinic.cnpj}</td>
                <td>{formatLocation(clinic.city, clinic.state)}</td>
                <td>
                  <SandboxBadge />
                </td>
              </tr>
            ))}
          {tab === "doctors" &&
            doctors.map((doctor) => (
              <tr key={doctor.id}>
                <td style={{ fontWeight: 700 }}>{doctor.name}</td>
                <td>
                  {doctor.crmNumber}/{doctor.crmState}
                </td>
                <td>{formatLocation(doctor.city, doctor.state)}</td>
                <td>
                  <span
                    style={{ color: "#15803d", fontWeight: 700, fontSize: 12 }}
                  >
                    Aprovado
                  </span>
                </td>
              </tr>
            ))}
          {tab === "companies" &&
            companies.map((company) => (
              <tr key={company.id}>
                <td style={{ fontWeight: 700 }}>
                  {company.nomeFantasia || company.razaoSocial}
                </td>
                <td>{company.cnpj}</td>
                <td>{formatLocation(company.city, company.state)}</td>
                <td>
                  <span
                    style={{ color: "#15803d", fontWeight: 700, fontSize: 12 }}
                  >
                    {company.status}
                  </span>
                </td>
              </tr>
            ))}
          {tab === "patients" &&
            patients.map((patient) => {
              const companyNames = patient.companies.map(
                ({ company }) =>
                  company.nomeFantasia || company.razaoSocial,
              );
              const clinicNames = patient.processoAsos
                .map(({ clinica }) => clinica?.name)
                .filter((name): name is string => Boolean(name));

              return (
                <tr key={patient.id}>
                  <td style={{ fontWeight: 700 }}>{patient.name}</td>
                  <td>{formatCpf(patient.cpf)}</td>
                  <td>{unique(companyNames).join(", ") || "—"}</td>
                  <td>
                    {patient.processoAsos.length > 0 ? (
                      <div className="protocol-list">
                        {patient.processoAsos.map((processo) => (
                          <span key={processo.id}>
                            {processo.numeroProtocolo}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "Sem protocolo"
                    )}
                  </td>
                  <td>{unique(clinicNames).join(", ") || "—"}</td>
                  <td>
                    <span
                      style={{
                        color: "#15803d",
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      {patient.status}
                    </span>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
      <style>{`
        .protocol-list {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 5px;
        }
        .protocol-list span {
          display: inline-flex;
          padding: 4px 7px;
          border-radius: 7px;
          color: #5b21b6;
          background: #f3e8ff;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
          font-weight: 750;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}

function SandboxBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        padding: "3px 8px",
        borderRadius: 999,
        color: "#6d28d9",
        background: "#f3e8ff",
        fontSize: 11,
        fontWeight: 800,
      }}
    >
      SANDBOX
    </span>
  );
}

function formatLocation(city?: string | null, state?: string | null) {
  return [city, state].filter(Boolean).join(" / ") || "—";
}

function formatCpf(cpf: string) {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function unique(values: string[]) {
  return [...new Set(values)];
}
