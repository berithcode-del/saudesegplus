'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  EnvelopeIcon,
  LockClosedIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '') ||
  (process.env.NODE_ENV === 'production'
    ? 'https://backend-production-fdc1.up.railway.app'
    : 'http://localhost:3001');

type Mode = 'empresa' | 'profissional';

function rememberRole(role: string) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `app_role=${encodeURIComponent(role)}; Path=/; SameSite=Lax${secure}`;
}

export default function EmpresaLoginPage() {
  const router = useRouter();

  // Modo atual e estado de flip
  const [mode, setMode] = useState<Mode>('empresa');
  const [isFlipping, setIsFlipping] = useState(false);

  // Toggle entre Login e Cadastro (empresa)
  const [isRegistering, setIsRegistering] = useState(false);

  // Estados comuns
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estados de Cadastro (empresa)
  const [cnpj, setCnpj] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');

  const handleToggleMode = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    // Troca o conteúdo no meio do flip (90°)
    setTimeout(() => {
      setMode((prev) => (prev === 'empresa' ? 'profissional' : 'empresa'));
      setError('');
      setIsRegistering(false);
    }, 350);
    // Finaliza o flip
    setTimeout(() => setIsFlipping(false), 700);
  };

  const handleEmpresaLoginSubmit = async (e: React.FormEvent) => {
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
      rememberRole(role);
      if (role === 'COMPANY_ADMIN') {
        const companyId = data.user?.companyAdminProfile?.companyId;
        if (companyId) {
          localStorage.setItem('companyId', companyId);
        }
        router.push('/empresa');
      } else {
        throw new Error('Esta conta não é de empresa. Use "Acesso Profissional" abaixo.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login');
    } finally {
      setLoading(false);
    }
  };

  const handleEmpresaRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cnpj,
          razaoSocial,
          contactEmail: email,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Erro ao cadastrar empresa');

      // Sucesso no cadastro: fazer login automaticamente
      await handleEmpresaLoginSubmit(e);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar cadastro');
      setLoading(false);
    }
  };

  const handleProfissionalSubmit = async (e: React.FormEvent) => {
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
      rememberRole(role);
      if (role === 'COMPANY_ADMIN') {
        throw new Error('Empresas devem usar o formulário da Empresa (Volte e cadastre-se).');
      }
      if (role === 'ADMIN') router.push('/admin');
      else if (role === 'DOCTOR') router.push('/medico');
      else if (role === 'OPERATOR' || role === 'CLINIC') router.push('/consultorio');
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
          min-height: 100vh;
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

        .illustration-area {
          flex: 1;
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
          margin-top: -130px;
          min-height: 0;
          position: relative;
          z-index: 1;
        }

        .illustration-area img {
          width: 115%;
          max-width: 650px;
          max-height: 115%;
          object-fit: contain;
          object-position: right bottom;
          filter: drop-shadow(0 20px 40px rgba(79,70,229,0.12));
          transform: translateX(-55px) translateY(40px);
        }

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

        /* ─── 3D FLIP WRAPPERS ─── */
        .card-3d-wrapper {
          width: 100%;
          max-width: 440px;
          perspective: 1200px;
        }

        .card-3d-inner {
          position: relative;
          width: 100%;
          transition: transform 0.7s cubic-bezier(0.45, 0.05, 0.55, 0.95);
          transform-style: preserve-3d;
          will-change: transform;
        }

        .card-3d-inner.is-flipped {
          transform: rotateY(180deg);
        }

        .card-3d-face {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 32px;
        }

        .card-3d-face-back {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          transform: rotateY(180deg);
        }

        @media (prefers-reduced-motion: reduce) {
          .card-3d-inner { transition: none; }
        }

        /* ─── CLAY CARD (FRENTE — EMPRESA) ─── */
        .clay-card {
          width: 100%;
          background: #eaecf7;
          border-radius: 32px;
          padding: 32px 36px 28px;
          box-shadow:
            16px 16px 34px #cdd0e8,
            -12px -12px 28px #ffffff;
          transition: all 0.3s ease;
        }

        /* ─── CLAY CARD (VERSO — PROFISSIONAL) ─── */
        .clay-card-pro {
          width: 100%;
          background: #1e1b4b;
          border-radius: 32px;
          padding: 32px 36px 28px;
          box-shadow:
            16px 16px 34px rgba(30,27,75,0.45),
            -12px -12px 28px rgba(99,102,241,0.15);
          transition: all 0.3s ease;
        }

        .pro-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #e0e7ff;
          color: #4338ca;
          padding: 5px 11px;
          border-radius: 20px;
          font-size: 11.5px;
          font-weight: 700;
          margin-bottom: 18px;
          letter-spacing: 0.3px;
          box-shadow: inset 1px 1px 3px rgba(255,255,255,0.7), 2px 2px 6px rgba(67,56,202,0.1);
        }

        .pro-badge-pro {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #312e81;
          color: #a5b4fc;
          padding: 5px 11px;
          border-radius: 20px;
          font-size: 11.5px;
          font-weight: 700;
          margin-bottom: 18px;
          letter-spacing: 0.3px;
          box-shadow: inset 1px 1px 3px rgba(255,255,255,0.08), 2px 2px 6px rgba(99,102,241,0.25);
        }

        .card-logo-wrap {
          width: 60px;
          height: 60px;
          background: #4f46e5;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
          box-shadow:
            5px 5px 12px rgba(79,70,229,0.3),
            -3px -3px 8px rgba(255,255,255,0.8),
            inset -2px -2px 5px rgba(0,0,0,0.1),
            inset 2px 2px 5px rgba(255,255,255,0.15);
        }

        .card-logo-wrap-pro {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #6366f1, #4338ca);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
          box-shadow:
            5px 5px 12px rgba(99,102,241,0.45),
            -3px -3px 8px rgba(165,180,252,0.18),
            inset -2px -2px 5px rgba(0,0,0,0.25),
            inset 2px 2px 5px rgba(255,255,255,0.2);
        }

        .card-title {
          font-size: 24px;
          font-weight: 800;
          color: #1e1b4b;
          text-align: center;
          margin-bottom: 4px;
          letter-spacing: -0.4px;
        }

        .card-title-pro {
          font-size: 24px;
          font-weight: 800;
          color: #e0e7ff;
          text-align: center;
          margin-bottom: 4px;
          letter-spacing: -0.4px;
        }

        .card-subtitle {
          font-size: 14px;
          color: #9ca3af;
          text-align: center;
          font-weight: 500;
          margin-bottom: 22px;
        }

        .card-subtitle-pro {
          font-size: 14px;
          color: #a5b4fc;
          text-align: center;
          font-weight: 500;
          margin-bottom: 22px;
        }

        /* ─── INPUTS (EMPRESA) ─── */
        .input-group {
          position: relative;
          margin-bottom: 12px;
        }

        .input-field {
          width: 100%;
          padding: 13px 14px 13px 44px;
          border-radius: 14px;
          border: none;
          background: #eaecf7;
          box-shadow:
            inset 4px 4px 9px #cdd0e8,
            inset -4px -4px 9px #ffffff;
          font-size: 14.5px;
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
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 18px;
          height: 18px;
          color: #a8adcc;
          pointer-events: none;
          transition: color 0.2s;
        }

        /* ─── INPUTS (PROFISSIONAL) ─── */
        .input-field-pro {
          width: 100%;
          padding: 13px 14px 13px 44px;
          border-radius: 14px;
          border: none;
          background: #2e2a5f;
          box-shadow:
            inset 4px 4px 9px rgba(0,0,0,0.35),
            inset -4px -4px 9px rgba(99,102,241,0.18);
          font-size: 14.5px;
          font-family: 'Inter', system-ui, sans-serif;
          font-weight: 500;
          color: #ffffff;
          outline: none;
          transition: box-shadow 0.2s ease;
        }

        .input-field-pro::placeholder { color: #818ae0; font-weight: 400; }

        .input-field-pro:focus {
          box-shadow:
            inset 5px 5px 11px rgba(0,0,0,0.4),
            inset -5px -5px 11px rgba(99,102,241,0.22),
            0 0 0 2px rgba(99,102,241,0.4);
        }

        .input-icon-pro {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 18px;
          height: 18px;
          color: #a5b4fc;
          pointer-events: none;
          transition: color 0.2s;
        }

        /* Extras Row */
        .extras-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 8px 0 20px;
        }
        .remember-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          color: #6b7280;
          cursor: pointer;
          font-weight: 500;
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

        .remember-label-pro {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          color: #a5b4fc;
          cursor: pointer;
          font-weight: 500;
        }
        .remember-check-pro {
          width: 16px;
          height: 16px;
          accent-color: #6366f1;
          cursor: pointer;
        }
        .forgot-link-pro {
          font-size: 13.5px;
          font-weight: 600;
          color: #a5b4fc;
          text-decoration: none;
        }

        /* ─── BOTÃO SUBMIT (EMPRESA) ─── */
        .btn-login {
          width: 100%;
          padding: 13px 20px;
          background: #4f46e5;
          color: #fff;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
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

        /* ─── BOTÃO SUBMIT (PROFISSIONAL) ─── */
        .btn-login-pro {
          width: 100%;
          padding: 13px 20px;
          background: linear-gradient(135deg, #6366f1, #4338ca);
          color: #fff;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s;
          box-shadow:
            5px 6px 14px rgba(99,102,241,0.4),
            -3px -3px 8px rgba(165,180,252,0.18),
            inset -2px -2px 5px rgba(0,0,0,0.25),
            inset 2px 2px 5px rgba(255,255,255,0.18);
        }

        .btn-login-pro:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.08);
        }

        /* Toggle Button — trocar modo */
        .toggle-btn {
          width: 100%;
          padding: 12px;
          margin-top: 10px;
          background: transparent;
          color: #4f46e5;
          border: 2px solid #e0e7ff;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .toggle-btn:hover {
          background: #e0e7ff;
        }

        .toggle-btn-pro {
          width: 100%;
          padding: 12px;
          margin-top: 10px;
          background: transparent;
          color: #a5b4fc;
          border: 2px solid #312e81;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .toggle-btn-pro:hover {
          background: #312e81;
        }

        /* Error */
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

        .error-box-pro {
          background: #4c1d95;
          border: 1px solid #7c3aed;
          color: #fde68a;
          padding: 12px 16px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        @media (max-width: 960px) {
          .login-root { grid-template-columns: 1fr; }
          .login-left { display: none; }
          .login-right { padding: 24px; align-items: flex-start; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-icon { animation: spin 1s linear infinite; }
      `}</style>

      <div className="login-root">

        {/* ─── LEFT PANEL ─── */}
        <div className="login-left">
          <div className="login-brand">
            <div className="brand-icon-wrap">
              <svg width="28" height="28" viewBox="0 0 105.23 102.14" xmlns="http://www.w3.org/2000/svg">
                <path d="m73.4,3.64v23.83c0,24.17-19.6,43.77-43.77,43.77H3.92c-2.16,0-3.92-1.75-3.92-3.92v-23.66c0-7.05,5.72-12.77,12.77-12.77h10.55c4.7,0,8.51-3.81,8.51-8.51v-9.62c0-7.05,5.72-12.77,12.77-12.77h25.17c2.01,0,3.64,1.63,3.64,3.64Z" fill="#fff"/>
                <path d="m31.83,98.5v-23.83c0-24.17,19.6-43.77,43.77-43.77h25.72c2.16,0,3.92,1.75,3.92,3.92v23.66c0,7.05-5.72,12.77-12.77,12.77h-10.55c-4.7,0-8.51,3.81-8.51,8.51v9.62c0,7.05-5.72,12.77-12.77,12.77h-25.17c-2.01,0-3.64-1.63-3.64-3.64Z" fill="#fff" opacity=".5"/>
              </svg>
            </div>
            <span className="brand-name">SaúdeSeg+</span>
          </div>

          <div className="left-middle">
            <h1 className="left-tagline">
              {mode === 'empresa' ? (
                <>Cuide da saúde<br />ocupacional dos seus<br /><span>colaboradores</span></>
              ) : (
                <>Conectando empresas<br />e médicos pela<br /><span>saúde ocupacional</span></>
              )}
            </h1>
            <p className="left-sub">
              {mode === 'empresa' ? (
                <>Acompanhe exames periódicos,<br />emita ASOs e gerencie<br />atestados com nossa<br />plataforma inteligente.</>
              ) : (
                <>Plataforma completa de<br />gestão de exames<br />ocupacionais, teleconsulta<br />e emissão de ASO.</>
              )}
            </p>
          </div>

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
          <div className="card-3d-wrapper">
            <div
              className={`card-3d-inner${mode === 'profissional' ? ' is-flipped' : ''}`}
            >
              {/* ═══════════ FACE FRONTAL — EMPRESA ═══════════ */}
              <div className="card-3d-face card-3d-face-front">
                <div className="clay-card">

                  <div style={{ textAlign: 'center' }}>
                    <div className="pro-badge" style={{ background: '#ecfdf5', color: '#059669', boxShadow: 'inset 1px 1px 3px rgba(255,255,255,0.7), 2px 2px 6px rgba(5,150,105,0.1)' }}>
                      <BuildingOfficeIcon style={{ width: 14, height: 14, strokeWidth: 2.5 }} />
                      Portal da Empresa
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div className="card-logo-wrap">
                      <svg width="32" height="32" viewBox="0 0 105.23 102.14" xmlns="http://www.w3.org/2000/svg">
                        <path d="m73.4,3.64v23.83c0,24.17-19.6,43.77-43.77,43.77H3.92c-2.16,0-3.92-1.75-3.92-3.92v-23.66c0-7.05,5.72-12.77,12.77-12.77h10.55c4.7,0,8.51-3.81,8.51-8.51v-9.62c0-7.05,5.72-12.77,12.77-12.77h25.17c2.01,0,3.64,1.63,3.64,3.64Z" fill="#fff"/>
                        <path d="m31.83,98.5v-23.83c0-24.17,19.6-43.77,43.77-43.77h25.72c2.16,0,3.92,1.75,3.92,3.92v23.66c0,7.05-5.72,12.77-12.77,12.77h-10.55c-4.7,0-8.51,3.81-8.51,8.51v9.62c0,7.05-5.72,12.77-12.77,12.77h-25.17c-2.01,0-3.64-1.63-3.64-3.64Z" fill="#fff" opacity=".5"/>
                      </svg>
                    </div>
                    <h2 className="card-title">{isRegistering ? 'Criar Conta' : 'Acesse sua conta'}</h2>
                    <p className="card-subtitle">
                      {isRegistering ? 'Cadastre sua empresa em minutos' : 'Gerencie a saúde dos seus colaboradores'}
                    </p>
                  </div>

                  {error && mode === 'empresa' && (
                    <div className="error-box">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      {error}
                    </div>
                  )}

                  <form onSubmit={isRegistering ? handleEmpresaRegisterSubmit : handleEmpresaLoginSubmit}>
                    {isRegistering && (
                      <>
                        <div className="input-group">
                          <input
                            type="text"
                            required
                            className="input-field"
                            placeholder="CNPJ"
                            value={cnpj}
                            onChange={(e) => setCnpj(e.target.value.replace(/\D/g, '').slice(0, 14))}
                            inputMode="numeric"
                            maxLength={14}
                          />
                          <DocumentTextIcon className="input-icon" />
                        </div>
                        <div className="input-group">
                          <input
                            type="text"
                            required
                            className="input-field"
                            placeholder="Razão Social"
                            value={razaoSocial}
                            onChange={(e) => setRazaoSocial(e.target.value)}
                            maxLength={150}
                          />
                          <BuildingOfficeIcon className="input-icon" />
                        </div>
                      </>
                    )}

                    <div className="input-group">
                      <input
                        type="email"
                        required
                        className="input-field"
                        placeholder={isRegistering ? 'E-mail do responsável' : 'E-mail da empresa'}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        maxLength={254}
                      />
                      <EnvelopeIcon className="input-icon" />
                    </div>

                    <div className="input-group" style={{ marginBottom: isRegistering ? '20px' : '12px' }}>
                      <input
                        type="password"
                        required
                        className="input-field"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={isRegistering ? 'new-password' : 'current-password'}
                        minLength={isRegistering ? 6 : 6}
                        maxLength={128}
                      />
                      <LockClosedIcon className="input-icon" />
                    </div>

                    {!isRegistering && (
                      <div className="extras-row">
                        <label className="remember-label">
                          <input type="checkbox" className="remember-check" />
                          Lembrar-me
                        </label>
                        <a href="#" className="forgot-link">Esqueceu a senha?</a>
                      </div>
                    )}

                    <button type="submit" className="btn-login" disabled={loading}>
                      {loading ? (
                        <>
                          <svg className="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle opacity="0.25" cx="12" cy="12" r="10" strokeWidth="4"/>
                            <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                          {isRegistering ? 'Cadastrando...' : 'Entrando...'}
                        </>
                      ) : (
                        isRegistering ? 'Criar Conta' : 'Acessar Painel'
                      )}
                    </button>
                  </form>

                  <button
                    type="button"
                    className="toggle-btn"
                    onClick={() => {
                      setIsRegistering(!isRegistering);
                      setError('');
                    }}
                  >
                    {isRegistering ? 'Já tenho uma conta. Fazer login' : 'Ainda não tem conta? Cadastre-se'}
                  </button>

                  {/* Botão para alternar para Acesso Profissional */}
                  <button
                    type="button"
                    className="toggle-btn"
                    onClick={handleToggleMode}
                    disabled={isFlipping}
                    style={{
                      marginTop: '8px',
                      color: '#4338ca',
                      borderColor: '#c7d2fe',
                      background: 'rgba(199,210,254,0.3)',
                    }}
                  >
                    <UserCircleIcon style={{ width: 18, height: 18 }} />
                    Acesso Profissional
                  </button>
                </div>
              </div>

              {/* ═══════════ FACE TRASEIRA — PROFISSIONAL ═══════════ */}
              <div className="card-3d-face card-3d-face-back">
                <div className="clay-card-pro">

                  <div style={{ textAlign: 'center' }}>
                    <div className="pro-badge-pro">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                      </svg>
                      Acesso Profissional
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div className="card-logo-wrap-pro">
                      <svg width="32" height="32" viewBox="0 0 105.23 102.14" xmlns="http://www.w3.org/2000/svg">
                        <path d="m73.4,3.64v23.83c0,24.17-19.6,43.77-43.77,43.77H3.92c-2.16,0-3.92-1.75-3.92-3.92v-23.66c0-7.05,5.72-12.77,12.77-12.77h10.55c4.7,0,8.51-3.81,8.51-8.51v-9.62c0-7.05,5.72-12.77,12.77-12.77h25.17c2.01,0,3.64,1.63,3.64,3.64Z" fill="#fff"/>
                        <path d="m31.83,98.5v-23.83c0-24.17,19.6-43.77,43.77-43.77h25.72c2.16,0,3.92,1.75,3.92,3.92v23.66c0,7.05-5.72,12.77-12.77,12.77h-10.55c-4.7,0-8.51,3.81-8.51,8.51v9.62c0,7.05-5.72,12.77-12.77,12.77h-25.17c-2.01,0-3.64-1.63-3.64-3.64Z" fill="#fff" opacity=".5"/>
                      </svg>
                    </div>
                    <h2 className="card-title-pro">SaúdeSeg+</h2>
                    <p className="card-subtitle-pro">Administradores, Clínicas e Médicos</p>
                  </div>

                  {error && mode === 'profissional' && (
                    <div className="error-box-pro">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleProfissionalSubmit}>
                    <div className="input-group">
                      <input
                        type="email"
                        required
                        className="input-field-pro"
                        placeholder="Seu e-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      maxLength={254}
                      />
                      <EnvelopeIcon className="input-icon-pro" />
                    </div>

                    <div className="input-group">
                      <input
                        type="password"
                        required
                        className="input-field-pro"
                        placeholder="Sua senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      minLength={8}
                      maxLength={128}
                      />
                      <LockClosedIcon className="input-icon-pro" />
                    </div>

                    <div className="extras-row">
                      <label className="remember-label-pro">
                        <input type="checkbox" className="remember-check-pro" />
                        Lembrar-me
                      </label>
                      <a href="#" className="forgot-link-pro">Esqueceu a senha?</a>
                    </div>

                    <button type="submit" className="btn-login-pro" disabled={loading}>
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

                  <button
                    type="button"
                    className="toggle-btn-pro"
                    onClick={handleToggleMode}
                    disabled={isFlipping}
                  >
                    <BuildingOfficeIcon style={{ width: 18, height: 18 }} />
                    Voltar para Empresa
                  </button>
                </div>
              </div>
            </div>
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
