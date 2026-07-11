import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePortalAuth } from '../../../hooks/usePortalAuth';

export function PortalAuth() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { previewToken, authenticate, status, error } = usePortalAuth();

  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [preview, setPreview] = useState<{ empresaNome?: string; tipoExame?: string; expirado?: boolean } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    previewToken(token).then(data => {
      if (data) {
        if (data.expirado) {
          setPreviewError('Este link expirou. Solicite um novo acesso.');
        } else {
          setPreview(data);
        }
      } else {
        setPreviewError('Token inválido ou expirado.');
      }
    });
  }, [token, previewToken]);

  const loading = status === 'loading';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !lgpdConsent) return;
    const success = await authenticate(token, cpf, birthDate);
    if (success) {
      navigate(`/p/${token}/confirmar`);
    }
  };

  const formatCpf = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  };

  const displayError = error || previewError;

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--text-primary)', marginBottom: 8 }}>
          Bem-vindo ao SaudeSeg+
        </h1>
        {preview?.empresaNome && (
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
            {preview.empresaNome}
          </p>
        )}
        {preview?.tipoExame && (
          <p style={{ fontSize: 13, color: 'var(--accent-primary)', marginBottom: 16, fontWeight: 600 }}>
            Exame: {preview.tipoExame}
          </p>
        )}
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
          Para acessar seu fluxo de saúde ocupacional, confirme seus dados.
        </p>
      </div>

      {displayError && (
        <div role="alert" style={{
          padding: 16, marginBottom: 16,
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          color: 'var(--accent-danger)',
          borderRadius: 12, fontSize: 14, minHeight: 48,
          display: 'flex', alignItems: 'center',
        }}>
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={labelStyle}>CPF</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={formatCpf(cpf)}
            onChange={e => setCpf(e.target.value.replace(/\D/g, '').slice(0, 11))}
            required
            className="input"
          />
        </div>

        <div>
          <label style={labelStyle}>Data de Nascimento</label>
          <input
            type="date"
            value={birthDate}
            onChange={e => setBirthDate(e.target.value)}
            required
            className="input"
          />
        </div>

        <label style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          cursor: 'pointer', padding: '8px 0',
        }}>
          <input
            type="checkbox"
            checked={lgpdConsent}
            onChange={e => setLgpdConsent(e.target.checked)}
            style={{ marginTop: 2, width: 20, height: 20, accentColor: 'var(--accent-primary)' }}
          />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4, paddingTop: 12 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Consentimento LGPD:</strong> Autorizo o tratamento dos meus dados pessoais e de saúde para fins de
            avaliação médica ocupacional, conforme a Lei nº 13.709/2018.
          </span>
        </label>
      </form>

      <div style={{ marginTop: 16, paddingBottom: 'calc(24px + var(--safe-bottom))' }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !lgpdConsent || !cpf || !birthDate}
          className="btn btn-primary"
          style={{
            width: '100%',
            opacity: loading || !lgpdConsent || !cpf || !birthDate ? 0.5 : 1,
            cursor: loading || !lgpdConsent || !cpf || !birthDate ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Validando...' : 'Entrar'}
        </button>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  marginBottom: 6,
  color: 'var(--text-secondary)',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
};
