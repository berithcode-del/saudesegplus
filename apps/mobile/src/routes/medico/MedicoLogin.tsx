import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfessionalAuth } from '../../hooks/useProfessionalAuth';

export function MedicoLogin() {
  const navigate = useNavigate();
  const { login, status, error } = useProfessionalAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForm, setShowForm] = useState(false);
  const loading = status === 'loading';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    const redirectPath = await login(email, password);
    if (redirectPath) navigate(redirectPath);
  };

  return (
    <main className={`login-experience${showForm ? ' is-form-open' : ''}`}>
      <section className="login-slide login-slide-intro" aria-hidden={showForm}>
        <BrandMark />

        <div className="login-hero-copy">
          <h1>
            Cuide da saude ocupacional dos seus <span>colaboradores</span>
          </h1>
          <p>
            Acompanhe exames periodicos, emita ASOs e gerencie atestados com nossa plataforma inteligente.
          </p>
        </div>

        <div className="login-hero-art">
          <img src="/illustrations/empresa3d.png" alt="Clinica ocupacional SaudeSeg+" />
        </div>

        <button type="button" className="login-primary-action" onClick={() => setShowForm(true)}>
          login
        </button>

        <p className="login-powered">power by BerithCode</p>
      </section>

      <section className="login-slide login-slide-form" aria-hidden={!showForm}>
        <BrandMark />

        <div className="login-form-shell">
          <section className="login-form-card">
            <div className="login-form-badge">
              <span aria-hidden="true">+</span>
              Acesso Profissional
            </div>

            <div className="login-form-logo" aria-hidden="true">
              <span />
              <span />
            </div>

            <h1>Acesse sua conta</h1>
            <p>Medicos, clinicas e administracao</p>

            {error && (
              <div className="login-form-error" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form-fields">
              <label className="login-input-line">
                <span aria-hidden="true">@</span>
                <input
                  type="email"
                  required
                  placeholder="seu.email@saudeseg.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  maxLength={254}
                />
              </label>

              <label className="login-input-line">
                <span aria-hidden="true">#</span>
                <input
                  type="password"
                  required
                  placeholder="senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  minLength={6}
                  maxLength={128}
                />
              </label>

              <div className="login-form-extras">
                <label>
                  <input type="checkbox" />
                  Lembrar-me
                </label>
                <a href="#">Esqueceu a senha?</a>
              </div>

              <button type="submit" className="login-form-submit" disabled={loading || !email || !password}>
                {loading ? 'Entrando...' : 'Acessar Painel'}
              </button>
            </form>

            <button type="button" className="login-form-secondary" onClick={() => setShowForm(false)}>
              Voltar para apresentacao
            </button>
          </section>

          <p className="login-card-footer">By BerithCode - Todos os direitos reservados 2026</p>
        </div>

        <p className="login-powered">power by BerithCode</p>
      </section>
    </main>
  );
}

function BrandMark() {
  return (
    <div className="login-brand-mark">
      <div className="login-brand-icon" aria-hidden="true">
        <span />
        <span />
      </div>
      <strong>SaudeSeg+</strong>
    </div>
  );
}
