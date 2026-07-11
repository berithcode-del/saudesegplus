import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePortalProcess } from '../../../hooks/usePortalProcess';
import { useApiClient } from '../../../app/providers/ApiProvider';

export function PortalConfirmar() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const apiClient = useApiClient();
  const { data, loading, error, refetch } = usePortalProcess();

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);

  useEffect(() => {
    if (data?.paciente) {
      setPhone(data.paciente.phone || '');
      setEmail(data.paciente.email || '');
    }
  }, [data]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await apiClient.fetch('/api/portal/confirmar-dados', {
        method: 'POST',
        body: JSON.stringify({ phone: phone || undefined, email: email || undefined }),
      });
      navigate(`/p/${token}/questionario`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao confirmar dados');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !data) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen message={error} onRetry={refetch} />;
  }

  if (!data) return <LoadingScreen />;

  const paciente = data.paciente;
  const formatCpf = (cpf: string) =>
    cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '100%', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 8, color: 'var(--text-primary)' }}>Confirme seus dados</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
          Verifique se seus dados estão corretos. Toque em qualquer campo para editar.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <DataRow label="Nome" value={paciente.nome} editable={false} />
          <DataRow label="CPF" value={formatCpf(paciente.cpf)} editable={false} />
          <DataRow label="Data de Nascimento" value={formatDate(paciente.birthDate)} editable={false} />
          <DataRow
            label="Telefone"
            value={phone}
            editable
            editing={editingPhone}
            onEditToggle={() => setEditingPhone(v => !v)}
            onValueChange={setPhone}
            placeholder="(00) 00000-0000"
          />
          <DataRow
            label="E-mail"
            value={email}
            editable
            editing={editingEmail}
            onEditToggle={() => setEditingEmail(v => !v)}
            onValueChange={setEmail}
            placeholder="seu@email.com"
          />
        </div>
      </div>

      {submitError && (
        <div
          role="alert"
          style={{ padding: 16, marginBottom: 12, backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--accent-danger)', borderRadius: 12, fontSize: 14 }}
        >
          {submitError}
        </div>
      )}

      <div style={{ paddingBottom: 'calc(24px + var(--safe-bottom))' }}>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '16px 24px',
            fontSize: 16,
            fontWeight: 500,
            minHeight: 48,
            opacity: submitting ? 0.6 : 1,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Salvando...' : 'Confirmar e Prosseguir'}
        </button>
      </div>
    </div>
  );
}

interface DataRowProps {
  label: string;
  value: string;
  editable?: boolean;
  editing?: boolean;
  onEditToggle?: () => void;
  onValueChange?: (v: string) => void;
  placeholder?: string;
}

function DataRow({ label, value, editable, editing, onEditToggle, onValueChange, placeholder }: DataRowProps) {
  return (
    <div
      className="card"
      style={{
        padding: 16,
        minHeight: 64,
      }}
      onClick={editable ? onEditToggle : undefined}
      role={editable ? 'button' : undefined}
    >
      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
      {editable && editing ? (
        <input
          type={editing ? 'text' : 'text'}
          inputMode={label === 'E-mail' ? 'email' : 'text'}
          placeholder={placeholder}
          value={value}
          autoFocus
          onChange={e => onValueChange?.(e.target.value)}
          onBlur={onEditToggle}
          className="input"
          style={{
            width: '100%',
            fontSize: 16,
            fontWeight: 500,
            border: 'none',
            borderBottom: '2px solid var(--accent-primary)',
            outline: 'none',
            padding: '4px 0',
            minHeight: 32,
            backgroundColor: 'transparent',
          }}
        />
      ) : (
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 32 }}>
          <span>{value || placeholder || '—'}</span>
          {editable && <span style={{ fontSize: 12, color: 'var(--accent-primary)', minWidth: 48 }}>{editing ? 'OK' : 'Editar'}</span>}
        </div>
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border-light)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ marginTop: 16, color: 'var(--text-secondary)', fontSize: 14 }}>Carregando...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 16 }}>
      <div style={{ fontSize: 40 }}>⚠️</div>
      <p style={{ color: 'var(--accent-danger)', fontSize: 16 }}>{message}</p>
      <button
        onClick={onRetry}
        className="btn btn-primary"
        style={{
          padding: '12px 24px',
          fontSize: 14,
          fontWeight: 500,
          minHeight: 48,
          cursor: 'pointer',
        }}
      >
        Tentar novamente
      </button>
    </div>
  );
}
