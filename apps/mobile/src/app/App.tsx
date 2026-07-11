import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ApiProvider } from './providers/ApiProvider';
import { PortalErrorBoundary } from '../components/PortalErrorBoundary';
import { RequireRole } from '../components/RequireRole';
import { PortalLayout } from '../routes/portal/[token]/PortalLayout';
import { PortalAuth } from '../routes/portal/[token]/PortalAuth';
import { PortalConfirmar } from '../routes/portal/[token]/PortalConfirmar';
import { PortalQuestionario } from '../routes/portal/[token]/PortalQuestionario';
import { PortalDocumentos } from '../routes/portal/[token]/PortalDocumentos';
import { PortalTeleconsulta } from '../routes/portal/[token]/PortalTeleconsulta';
import { PortalAso } from '../routes/portal/[token]/PortalAso';
import { MedicoLogin } from '../routes/medico/MedicoLogin';
import { MedicoLayout } from '../routes/medico/MedicoLayout';
import { MedicoDashboard } from '../routes/medico/MedicoDashboard';
import { MedicoFila } from '../routes/medico/MedicoFila';
import { MedicoConsulta } from '../routes/medico/MedicoConsulta';
import { MedicoHistorico } from '../routes/medico/MedicoHistorico';
import { ConsultorioLayout } from '../routes/consultorio/ConsultorioLayout';
import { ConsultorioDashboard } from '../routes/consultorio/ConsultorioDashboard';
import { ConsultorioCheckin } from '../routes/consultorio/ConsultorioCheckin';
import { EmpresaDashboard } from '../routes/empresa/EmpresaDashboard';
import { AdminDashboard } from '../routes/admin/AdminDashboard';
import { Home } from '../routes/Home';

export function App() {
  return (
    <ApiProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Portal do Colaborador — rota curta oficial + alias legado */}
          <Route path="/p/:token/*" element={<PortalRoutes />} />
          <Route path="/portal/:token/*" element={<PortalRoutes />} />

          {/* Fluxo do Médico */}
          <Route path="/login" element={<MedicoLogin />} />
          <Route path="/profissional/login" element={<MedicoLogin />} />
          <Route path="/medico/login" element={<MedicoLogin />} />
          <Route path="/medico" element={<MedicoLayout />}>
            <Route index element={<MedicoDashboard />} />
            <Route path="fila" element={<MedicoFila />} />
            <Route path="consulta/:id" element={<MedicoConsulta />} />
            <Route path="historico" element={<MedicoHistorico />} />
          </Route>

          {/* Fluxo da Empresa */}
          <Route
            path="/empresa"
            element={
              <RequireRole roles={['COMPANY_ADMIN']}>
                <EmpresaDashboard />
              </RequireRole>
            }
          />

          {/* Consultório */}
          <Route
            path="/consultorio"
            element={
              <RequireRole roles={['CLINIC', 'OPERATOR']}>
                <ConsultorioLayout />
              </RequireRole>
            }
          >
            <Route index element={<ConsultorioDashboard />} />
            <Route path="check-in" element={<ConsultorioCheckin />} />
          </Route>

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <RequireRole roles={['ADMIN']}>
                <AdminDashboard />
              </RequireRole>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ApiProvider>
  );
}

function PortalRoutes() {
  return (
    <PortalErrorBoundary routeName="portal">
      <Routes>
        <Route element={<PortalLayout />}>
          <Route index element={<PortalAuth />} />
          <Route path="confirmar" element={<PortalConfirmar />} />
          <Route path="questionario" element={<PortalQuestionario />} />
          <Route path="documentos" element={<PortalDocumentos />} />
          <Route path="teleconsulta" element={<PortalTeleconsulta />} />
          <Route path="aso" element={<PortalAso />} />
        </Route>
      </Routes>
    </PortalErrorBoundary>
  );
}

function NotFound() {
  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <h1 style={{ fontSize: 48, color: 'var(--text-muted)' }}>404</h1>
      <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>Página não encontrada</p>
    </div>
  );
}
