'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Credenciais inválidas');
      sessionStorage.setItem('token', data.token);
      localStorage.setItem('token', data.token);
      const role = data.user?.role;
      if (role === 'COMPANY_ADMIN') {
        throw new Error('Empresas devem fazer login pelo portal de empresas (/empresas/login)');
      }
      
      if (role === 'ADMIN') router.push('/admin');
      else if (role === 'DOCTOR') router.push('/consultorio');
      else if (role === 'OPERATOR') router.push('/clinica');
      else router.push('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body { font-family: 'Inter', system-ui, sans-serif; }

        /* ─── ROOT ─── */
        .login-root {
          height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #eaecf7;
          overflow: hidden;
        }

        /* ─── LEFT PANEL ─── */
        .login-left {
          display: flex;
          flex-direction: column;
          padding: 48px 48px 24px 64px;
          height: 100vh;
          overflow: hidden;
          position: relative;
        }

        /* Brand top */
        .login-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .brand-icon-wrap {
          width: 46px;
          height: 46px;
          background: #4f46e5;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 5px 5px 12px rgba(79,70,229,0.22), -3px -3px 8px #fff;
          flex-shrink: 0;
        }

        .brand-name {
          font-size: 22px;
          font-weight: 800;
          color: #1e1b4b;
          letter-spacing: -0.3px;
        }

        /* Middle: tagline */
        .left-middle {
          flex: 0 0 auto;
          padding-top: 40px;
          position: relative;
          z-index: 2;
        }

        .left-tagline {
          font-size: 42px;
          font-weight: 800;
          color: #1e1b4b;
          line-height: 1.15;
          letter-spacing: -1px;
          margin-bottom: 16px;
          max-width: 480px;
        }

        .left-tagline span { color: #4f46e5; }

        .left-sub {
          font-size: 16px;
          color: #6b7280;
          line-height: 1.6;
          max-width: 400px;
          font-weight: 400;
        }

        /* Bottom: illustration fills remaining space */
        .illustration-area {
          flex: 1;
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
          margin-top: -130px; /* Sobe mais para ficar ao lado do subtítulo */
          min-height: 0;
          position: relative;
          z-index: 1;
        }

        .illustration-area img {
          width: 115%; /* Faz a imagem ficar bem grande, vazando o container */
          max-width: 650px; /* Bem gigante */
          max-height: 115%;
          object-fit: contain;
          object-position: right bottom;
          filter: drop-shadow(0 20px 40px rgba(79,70,229,0.12));
          transform: translateX(-55px) translateY(40px);
        }

        /* Footer */
        .login-footer {
          flex-shrink: 0;
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          z-index: 2;
        }

        /* ─── RIGHT PANEL ─── */
        .login-right {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px;
          height: 100vh;
          background: #eaecf7;
          overflow-y: auto;
        }

        /* ─── CLAY CARD ─── */
        .clay-card {
          width: 100%;
          max-width: 440px;
          background: #eaecf7;
          border-radius: 36px;
          padding: 48px 40px 40px;
          box-shadow:
            16px 16px 34px #cdd0e8,
            -12px -12px 28px #ffffff;
        }

        /* Badge Profissional */
        .pro-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #e0e7ff;
          color: #4338ca;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 24px;
          letter-spacing: 0.3px;
          box-shadow: inset 1px 1px 3px rgba(255,255,255,0.7), 2px 2px 6px rgba(67,56,202,0.1);
        }

        /* Card header */
        .card-logo-wrap {
          width: 68px;
          height: 68px;
          background: #4f46e5;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 18px;
          box-shadow:
            5px 5px 12px rgba(79,70,229,0.3),
            -3px -3px 8px rgba(255,255,255,0.8),
            inset -2px -2px 5px rgba(0,0,0,0.1),
            inset 2px 2px 5px rgba(255,255,255,0.15);
        }

        .card-title {
          font-size: 26px;
          font-weight: 800;
          color: #1e1b4b;
          text-align: center;
          margin-bottom: 5px;
          letter-spacing: -0.4px;
        }

        .card-subtitle {
          font-size: 14.5px;
          color: #9ca3af;
          text-align: center;
          font-weight: 500;
          margin-bottom: 32px;
        }

        /* ─── INPUTS ─── */
        .input-group {
          position: relative;
          margin-bottom: 16px;
        }

        .input-field {
          width: 100%;
          padding: 16px 16px 16px 48px;
          border-radius: 16px;
          border: none;
          background: #eaecf7;
          box-shadow:
            inset 4px 4px 9px #cdd0e8,
            inset -4px -4px 9px #ffffff;
          font-size: 15px;
          font-family: 'Inter', system-ui, sans-serif;
          font-weight: 500;
          color: #1e1b4b;
          outline: none;
          transition: box-shadow 0.2s ease;
        }

        .input-field::placeholder { color: #b0b5cc; font-weight: 400; }

        .input-field:focus {
          box-shadow:
            inset 5px 5px 11px #c5c9e0,
            inset -5px -5px 11px #ffffff,
            0 0 0 2px rgba(79,70,229,0.14);
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          color: #a8adcc;
          pointer-events: none;
          transition: color 0.2s;
        }

        /* ─── EXTRAS ROW ─── */
        .extras-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 12px 0 28px;
        }

        .remember-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          color: #6b7280;
          cursor: pointer;
          font-weight: 500;
          user-select: none;
        }

        .remember-check {
          width: 16px;
          height: 16px;
          accent-color: #4f46e5;
          cursor: pointer;
        }

        .forgot-link {
          font-size: 13.5px;
          font-weight: 600;
          color: #4f46e5;
          text-decoration: none;
        }

        .forgot-link:hover { opacity: 0.75; }

        /* ─── SUBMIT BUTTON ─── */
        .btn-login {
          width: 100%;
          padding: 16px 20px;
          background: #4f46e5;
          color: #fff;
          border: none;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 700;
          font-family: 'Inter', system-ui, sans-serif;
          letter-spacing: 0.15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s;
          box-shadow:
            5px 6px 14px rgba(79,70,229,0.28),
            -3px -3px 8px rgba(255,255,255,0.6),
            inset -2px -2px 5px rgba(0,0,0,0.12),
            inset 2px 2px 5px rgba(255,255,255,0.15);
        }

        .btn-login:hover:not(:disabled) {
          transform: translateY(-2px);
          background: #4338ca;
        }

        .btn-login:active:not(:disabled) {
          transform: translateY(0px);
          box-shadow:
            inset 3px 3px 7px rgba(0,0,0,0.18),
            inset -3px -3px 7px rgba(255,255,255,0.1);
        }

        .btn-login:disabled { opacity: 0.65; cursor: not-allowed; }

        /* ─── ERROR ─── */
        .error-box {
          background: #fff1f1;
          border: 1px solid #fca5a5;
          color: #b91c1c;
          padding: 12px 16px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 960px) {
          .login-root { grid-template-columns: 1fr; }
          .login-left { display: none; }
          .login-right { padding: 24px; }
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-icon { animation: spin 1s linear infinite; }
      `}</style>

      <div className="login-root">

        {/* ─── LEFT PANEL ─── */}
        <div className="login-left">
          {/* Brand */}
          <div className="login-brand">
            <div className="brand-icon-wrap">
              <svg width="28" height="28" viewBox="0 0 105.23 102.14" xmlns="http://www.w3.org/2000/svg">
                <path d="m73.4,3.64v23.83c0,24.17-19.6,43.77-43.77,43.77H3.92c-2.16,0-3.92-1.75-3.92-3.92v-23.66c0-7.05,5.72-12.77,12.77-12.77h10.55c4.7,0,8.51-3.81,8.51-8.51v-9.62c0-7.05,5.72-12.77,12.77-12.77h25.17c2.01,0,3.64,1.63,3.64,3.64Z" fill="#fff"/>
                <path d="m31.83,98.5v-23.83c0-24.17,19.6-43.77,43.77-43.77h25.72c2.16,0,3.92,1.75,3.92,3.92v23.66c0,7.05-5.72,12.77-12.77,12.77h-10.55c-4.7,0-8.51,3.81-8.51,8.51v9.62c0,7.05-5.72,12.77-12.77,12.77h-25.17c-2.01,0-3.64-1.63-3.64-3.64Z" fill="#fff" opacity=".5"/>
              </svg>
            </div>
            <span className="brand-name">SaúdeSeg+</span>
          </div>

          {/* Tagline */}
          <div className="left-middle">
            <h1 className="left-tagline">
              Conectando empresas<br />
              e médicos pela<br />
              <span>saúde ocupacional</span>
            </h1>
            <p className="left-sub">
              Plataforma completa de<br/>
              gestão de exames<br/>
              ocupacionais, teleconsulta<br/>
              e emissão de ASO.
            </p>
          </div>

          {/* Ilustração — preenche o restante e ancora na base */}
          <div className="illustration-area">
            <img
              src="/images/ilustracao-login.png"
              alt="Ilustração SaúdeSeg+"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>


        </div>

        {/* ─── RIGHT PANEL ─── */}
        <div className="login-right">
          <div className="clay-card">

            {/* Badge */}
            <div style={{ textAlign: 'center' }}>
              <div className="pro-badge">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
                Acesso Profissional
              </div>
            </div>

            {/* Card Logo */}
            <div style={{ textAlign: 'center' }}>
              <div className="card-logo-wrap">
                <svg width="32" height="32" viewBox="0 0 105.23 102.14" xmlns="http://www.w3.org/2000/svg">
                  <path d="m73.4,3.64v23.83c0,24.17-19.6,43.77-43.77,43.77H3.92c-2.16,0-3.92-1.75-3.92-3.92v-23.66c0-7.05,5.72-12.77,12.77-12.77h10.55c4.7,0,8.51-3.81,8.51-8.51v-9.62c0-7.05,5.72-12.77,12.77-12.77h25.17c2.01,0,3.64,1.63,3.64,3.64Z" fill="#fff"/>
                  <path d="m31.83,98.5v-23.83c0-24.17,19.6-43.77,43.77-43.77h25.72c2.16,0,3.92,1.75,3.92,3.92v23.66c0,7.05-5.72,12.77-12.77,12.77h-10.55c-4.7,0-8.51,3.81-8.51,8.51v9.62c0,7.05-5.72,12.77-12.77,12.77h-25.17c-2.01,0-3.64-1.63-3.64-3.64Z" fill="#fff" opacity=".5"/>
                </svg>
              </div>
              <h2 className="card-title">SaúdeSeg+</h2>
              <p className="card-subtitle">Administradores, Clínicas e Médicos</p>
            </div>

            {/* Error */}
            {error && (
              <div className="error-box">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="input-group">
                <input
                  type="email"
                  required
                  className="input-field"
                  placeholder="Seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <EnvelopeIcon className="input-icon" />
              </div>

              {/* Password */}
              <div className="input-group">
                <input
                  type="password"
                  required
                  className="input-field"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <LockClosedIcon className="input-icon" />
              </div>

              {/* Remember + Forgot */}
              <div className="extras-row">
                <label className="remember-label">
                  <input type="checkbox" className="remember-check" />
                  Lembrar-me
                </label>
                <a href="#" className="forgot-link">Esqueceu a senha?</a>
              </div>

              {/* Submit */}
              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? (
                  <>
                    <svg className="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar na Plataforma
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="login-footer" style={{ textAlign: 'center', marginTop: '20px' }}>
            <span>By <strong>BerithCode</strong></span>
            <span>•</span>
            <span>Todos os direitos reservados 2026</span>
          </div>
        </div>

      </div>
    </>
  );
}
