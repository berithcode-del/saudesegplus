'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiValidateInvite } from '../../lib/api';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Link de convite inválido: token não informado.');
      return;
    }

    setLoading(true);
    try {
      // Não enviamos e-mail/CPF: eles já vêm do convite criado pela
      // empresa (expectedEmail/expectedCpf) e servem para confirmar a
      // identidade do colaborador, não para serem digitados de novo.
      const result = await apiValidateInvite({ token, name, password });
      const patientId = result?.data?.patientId;

      if (patientId && typeof window !== 'undefined') {
        window.localStorage.setItem('colaboradorPatientId', patientId);
      }
      window.dispatchEvent(new Event('colaboradorCadastrado'));

      // Antes redirecionava para /empresa/solicitacoes (painel da
      // empresa) — um colaborador recém-cadastrado deve ver a própria
      // solicitação, não o painel interno da empresa (F2-REQ-003/015).
      router.push(`/colaboradores/status?id=${patientId ?? ''}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Token inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo-wrap">
          <div className="login-logo-icon">✚</div>
          <span className="login-logo-text">
            Saúde<span>Seg</span>+
          </span>
        </div>
        <p className="login-subtitle">Cadastro de Colaborador</p>

        {!token && (
          <div className="login-hint" style={{ marginBottom: '16px' }}>
            <strong>Link inválido.</strong> Acesse pelo link de convite enviado
            pela sua empresa.
          </div>
        )}

        {error && (
          <div
            className="login-hint"
            style={{
              marginBottom: '16px',
              background: 'rgba(239,68,68,0.08)',
              borderColor: 'rgba(239,68,68,0.25)',
              color: '#dc2626',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-name">Nome completo</label>
            <input
              id="signup-name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">Senha</label>
            <input
              id="signup-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
            disabled={loading || !token}
          >
            {loading ? 'Enviando...' : 'Concluir Cadastro'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function InviteSignupPage() {
  return (
    <Suspense fallback={<div className="login-bg"><div className="login-card"><p className="login-subtitle">Carregando...</p></div></div>}>
      <SignupForm />
    </Suspense>
  );
}
