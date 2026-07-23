"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BeakerIcon,
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  ClipboardIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import {
  apiAdminCreateClinic,
  apiAdminCreateCompany,
  apiAdminCreateDoctor,
  apiAdminListClinics,
  apiAdminListCompanies,
  apiAdminListDoctors,
} from "@/app/lib/api";

type SandboxTab = "clinics" | "doctors" | "companies";

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
  const [clinicForm, setClinicForm] = useState(initialClinic);
  const [doctorForm, setDoctorForm] = useState(initialDoctor);
  const [companyForm, setCompanyForm] = useState(initialCompany);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState(false);

  const loadSandbox = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [clinicResult, doctorResult, companyResult] = await Promise.all([
        apiAdminListClinics("SANDBOX"),
        apiAdminListDoctors("SANDBOX"),
        apiAdminListCompanies({ environment: "SANDBOX" }),
      ]);
      setClinics(clinicResult.data as SandboxClinic[]);
      setDoctors(doctorResult.data as SandboxDoctor[]);
      setCompanies(companyResult.data as SandboxCompany[]);
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
      </div>

      {error && <div className="sandbox-error">{error}</div>}

      <div className="sandbox-workspace">
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

        <div className="card sandbox-list-card">
          <div className="list-header">
            <div>
              <strong>Cadastros no sandbox</strong>
              <span>Somente dados de teste aparecem nesta lista.</span>
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
          grid-template-columns: repeat(3, minmax(0, 1fr));
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
        .sandbox-workspace {
          display: grid;
          grid-template-columns: minmax(300px, 0.8fr) minmax(480px, 1.4fr);
          gap: 18px;
          align-items: start;
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
          .summary-grid {
            grid-template-columns: 1fr;
          }
          .sandbox-workspace {
            grid-template-columns: 1fr;
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
}: {
  tab: SandboxTab;
  clinics: SandboxClinic[];
  doctors: SandboxDoctor[];
  companies: SandboxCompany[];
}) {
  const items =
    tab === "clinics" ? clinics : tab === "doctors" ? doctors : companies;
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
        </tbody>
      </table>
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
