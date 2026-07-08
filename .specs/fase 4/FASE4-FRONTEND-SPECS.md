# Fase 4 — Frontend: Especificação de Implementações

**Data:** 28/06/2026  
**Referência backend:** `FASE4-BACKEND-TASKS.md` + `FASE4-BACKEND-OVERVIEW.md`  
**Base de análise:** código atual do frontend (`Front.zip`) cruzado com todas as tasks da Fase 4 já executadas no backend.

---

## Como ler este documento

Cada seção corresponde a uma ou mais tasks do backend que **já estão prontas** e que exigem implementação ou correção no frontend. As seções seguem a mesma numeração de sprints do backend (4A → 4B → 4C → 4D) para facilitar o rastreamento.

Legenda de prioridade:
- 🔴 **Crítico** — bloqueia fluxo já funcional no backend
- 🟡 **Alto** — feature completa no backend mas invisível no frontend
- 🟢 **Médio** — melhoria operacional ou de UX

---

## Sumário de implementações

| ID | Feature | Prioridade | Arquivo(s) principal(is) |
|----|---------|-----------|--------------------------|
| FF-4A-01 | Dropdown de médicos na fila (usa `GET /api/medicos`) | 🔴 | `medico/fila/page.tsx` |
| FF-4A-02 | Check-in multi-exame com tipos do backend | 🔴 | `consultorio/check-in/page.tsx`, `api.ts` |
| FF-4A-03 | `decision` + `restrictionNotes` no PATCH de solicitação | 🔴 | `medico/consulta/[id]/page.tsx`, `api.ts` |
| FF-4A-04 | Campo `validUntil` no upload de documentos | 🔴 | `empresa/documentos/page.tsx` |
| FF-4A-05 | Endpoint correto de documentos + `isValid` real | 🔴 | `empresa/documentos/page.tsx` |
| FF-4A-06 | Método PATCH + campos completos nas configurações | 🔴 | `empresa/configuracoes/page.tsx` |
| FF-4A-07 | Preview do convite antes da autenticação (`GET /api/portal/preview/:token`) | 🟡 | `p/[token]/page.tsx` |
| FF-4A-08 | Status-check com checklist na tela de configurações | 🟡 | `empresa/configuracoes/page.tsx` |
| FF-4A-09 | Modo leitura na consulta médica quando CONCLUIDO | 🟡 | `medico/consulta/[id]/page.tsx` |
| FF-4A-10 | Item "Histórico" na sidebar do médico | 🟡 | `medico/layout.tsx` |
| FF-4A-11 | Filtros de status e data no histórico | 🟡 | `medico/historico/page.tsx` |
| FF-4A-12 | Indicador visual de valores fora de faixa nos exames | 🟡 | `medico/consulta/[id]/page.tsx` |
| FF-4B-01 | Botão "Criar sala de teleconsulta" na tela do médico | 🔴 | `medico/consulta/[id]/page.tsx` |
| FF-4B-02 | Tela de boas-vindas do portal (primeira visita) | 🟡 | `p/[token]/page.tsx` |
| FF-4B-03 | Link Google Maps para clínica no portal | 🟢 | `p/[token]/processo/page.tsx` |
| FF-4C-01 | Autenticação JWT real na tela de login | 🔴 | `app/page.tsx`, `api.ts` |
| FF-4C-02 | Token Bearer em todas as chamadas autenticadas | 🔴 | `api.ts` + todos os `page.tsx` |
| FF-4C-03 | `middleware.ts` para proteção de rotas por role | 🔴 | `middleware.ts` (criar) |
| FF-4D-01 | Módulo Admin (`/admin/*`) | 🟡 | `app/admin/` (criar) |
| FF-4D-02 | Exportar CSV de solicitações da empresa | 🟢 | `empresa/solicitacoes/page.tsx` |
| FF-4D-03 | Paginação nas listagens | 🟢 | múltiplos `page.tsx` |

---

## SPRINT 4A — Fechar gaps da Fase 3

---

### FF-4A-01 — Dropdown de médicos na fila

**Prioridade:** 🔴 Crítico  
**Arquivo:** `app/medico/fila/page.tsx`  
**Backend pronto:** `GET /api/medicos` (TASK-4A-01 indiretamente; `apiListMedicos` já existe em `api.ts`)

#### Contexto

A fila do médico usa `<input type="text">` para o médico colar o próprio UUID manualmente. O backend já tem `GET /api/medicos` listando os médicos ativos. A função `apiListMedicos()` existe em `api.ts` mas nunca é chamada.

#### O que implementar

Ao montar o componente, chamar `apiListMedicos()` e popular um `<select>`. O ID selecionado continua sendo salvo em `localStorage` para persistência entre recargas.

```tsx
// Adicionar ao estado
const [medicos, setMedicos] = useState<{ id: string; name: string; crmNumber: string; crmState: string }[]>([]);
const [loadingMedicos, setLoadingMedicos] = useState(true);

// Adicionar ao useEffect inicial
useEffect(() => {
  apiListMedicos()
    .then(res => setMedicos(Array.isArray(res.data) ? res.data : []))
    .catch(() => setMedicos([]))
    .finally(() => setLoadingMedicos(false));
}, []);

// Substituir o <input> por:
<select
  id="doctor-select"
  className="form-select"
  value={doctorId}
  onChange={(e) => handleSaveDoctorId(e.target.value)}
  disabled={loadingMedicos}
>
  <option value="">
    {loadingMedicos ? 'Carregando médicos...' : 'Selecione o médico'}
  </option>
  {medicos.map((m) => (
    <option key={m.id} value={m.id}>
      {m.name} — CRM {m.crmNumber}/{m.crmState}
    </option>
  ))}
</select>
```

#### Critério de aceite

- Ao entrar na tela, o `<select>` é populado com médicos reais do banco.
- Selecionar um médico carrega a fila automaticamente.
- O ID selecionado persiste entre recargas da página via `localStorage`.
- O mesmo padrão deve ser replicado em `app/medico/historico/page.tsx` (mesmo problema).

---

### FF-4A-02 — Check-in multi-exame com tipos do backend

**Prioridade:** 🔴 Crítico  
**Arquivo:** `app/consultorio/check-in/page.tsx`, `app/lib/api.ts`  
**Backend pronto:** `GET /api/exams/types` (TASK-4A-01), `GET /api/exams/required` (TASK-4A-01), `POST /api/exams` com array (TASK-4A-02)

#### Contexto

O check-in tem a lista de tipos de exame hardcoded (`EXAM_TYPES` local) e permite selecionar **um único tipo** por vez via `<select>`. O backend agora serve os tipos dinamicamente e aceita múltiplos resultados em um único `POST`.

#### O que implementar

**1. Adicionar em `api.ts`:**

```typescript
export async function apiGetExamTypes() {
  const res = await fetch(`${BACKEND_URL}/api/exams/types`);
  if (!res.ok) throw new Error('Falha ao buscar tipos de exame');
  return res.json();
}

export async function apiGetRequiredExams(cboCode: string) {
  const res = await fetch(`${BACKEND_URL}/api/exams/required?cboCode=${encodeURIComponent(cboCode)}`);
  if (!res.ok) return { data: { requiredExams: [], riskGrade: 'desconhecido', requiresInPerson: false } };
  return res.json();
}
```

**2. Refatorar o componente de check-in:**

- Ao montar, chamar `apiGetExamTypes()` para carregar os tipos disponíveis (substituir `EXAM_TYPES` hardcoded).
- Quando `functionCboCode` perder o foco (evento `onBlur`), chamar `apiGetRequiredExams(cboCode)` e marcar como obrigatórios os tipos retornados em `requiredExams`. Exibir aviso informativo (não bloqueante).
- Substituir o `<select>` de tipo único por um grupo de **checkboxes**, um por tipo de exame. Tipos obrigatórios pelo CBO devem ser pré-marcados e não desabilitáveis. Tipos opcionais podem ser marcados/desmarcados livremente.
- Campos de coleta renderizados dinamicamente para cada tipo marcado.
- Mapa de campos por tipo (mínimo):

| `name` do ExamType | Campos |
|---|---|
| `pa` | Pressão Sistólica (mmHg), Pressão Diastólica (mmHg) |
| `audiometria` | Via Aérea OD, Via Aérea OE |
| `acuidade_visual` | Acuidade OD, Acuidade OE |
| `peso_altura` | Peso (kg), Altura (cm) |
| `glicemia` | Valor (mg/dL) |

**3. Atualizar a submissão:**

```typescript
// Montar array de resultados
const results = selectedExamTypeIds.map(typeId => ({
  examType: typeId,
  valueJson: examValues[typeId] ?? {},
}));

// Enviar formato novo
const examRes = await fetch(`${BACKEND_URL}/api/exams`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ examRequestId, results }),
});
```

#### Critério de aceite

- Lista de tipos carregada da API (não hardcoded).
- Ao digitar CBO válido, tipos obrigatórios são pré-selecionados com aviso visual.
- CBO sem mapeamento mostra aviso mas não bloqueia o check-in.
- Campos mudam conforme tipos selecionados.
- Submissão cria um `ExamResult` por tipo no banco.

---

### FF-4A-03 — `decision` e `restrictionNotes` no PATCH de solicitação

**Prioridade:** 🔴 Crítico  
**Arquivo:** `app/medico/consulta/[id]/page.tsx`, `app/lib/api.ts`  
**Backend pronto:** `PATCH /api/solicitacoes/:id` cria `AsoDocument` atomicamente (TASK-4A-04)

#### Contexto

`handleSign` chama `apiUpdateSolicitacao` com apenas `{ status, laudoTexto }`. O backend agora espera `decision` e `restrictionNotes` para criar o `AsoDocument` na mesma transação. Sem esses campos, o ASO nunca tem `decision` gravado.

#### O que implementar

**1. Atualizar `apiUpdateSolicitacao` em `api.ts`:**

```typescript
export async function apiUpdateSolicitacao(
  id: string,
  body: {
    status: string;
    laudoTexto?: string;
    decision?: string;
    restrictionNotes?: string;
    doctorId?: string;
  }
) {
  const res = await fetch(`${BACKEND_URL}/api/solicitacoes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Falha ao atualizar solicitação');
  return res.json();
}
```

**2. Atualizar a chamada em `handleSign`:**

```typescript
await apiUpdateSolicitacao(params.id, {
  status: 'CONCLUIDO',
  laudoTexto,
  decision,
  restrictionNotes: decision === 'APTO_COM_RESTRICAO' ? restriction : undefined,
  doctorId,
});
```

#### Critério de aceite

- Após emitir ASO, `AsoDocument.decision` é gravado no banco com o valor correto.
- O download do PDF retorna documento com a decisão real (não vazio).

---

### FF-4A-04 — Campo `validUntil` no upload de documentos

**Prioridade:** 🔴 Crítico  
**Arquivo:** `app/empresa/documentos/page.tsx`  
**Backend pronto:** Upload valida PDF e atualiza `Company.pcmsoValidUntil` / `ppraValidUntil` (TASK-4A-06)

#### Contexto

O formulário de upload não tem campo de data de validade. Sem `validUntil`, o backend não consegue calcular `isValid` e a empresa nunca transita para `status = LIBERADA`.

#### O que implementar

Adicionar ao modal/formulário de upload:

```tsx
// Adicionar ao estado
const [validUntil, setValidUntil] = useState('');

// Adicionar ao formulário (antes do botão Enviar)
<div className="form-group">
  <label className="form-label" htmlFor="valid-until">
    Data de Validade do Documento *
  </label>
  <input
    id="valid-until"
    type="date"
    className="form-input"
    value={validUntil}
    min={new Date().toISOString().split('T')[0]}
    onChange={(e) => setValidUntil(e.target.value)}
    required
  />
  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
    Data de vencimento do PCMSO/PPRA conforme o documento
  </span>
</div>

// Adicionar ao FormData antes do fetch
formData.append('validUntil', validUntil);

// Validação client-side antes de enviar
if (!validUntil) {
  setError('Informe a data de validade do documento.');
  return;
}
```

#### Critério de aceite

- Não é possível submeter o formulário sem a data de validade.
- Após upload com data futura, a tela reflete o status "Válido" com a data correta.
- Quando ambos PCMSO e PPRA tiverem datas futuras, a empresa exibe status "Liberada".

---

### FF-4A-05 — Endpoint correto de documentos e `isValid` real

**Prioridade:** 🔴 Crítico  
**Arquivo:** `app/empresa/documentos/page.tsx`, `app/lib/api.ts`  
**Backend pronto:** `GET /api/company/:id/documentos` retornando `{ pcmso: { url, validUntil, isValid }, ppra: { ... } }` (TASK-4A-06)

#### Contexto

A tela chama `GET /api/upload/documents/:companyId` (endpoint legado) em vez do novo `GET /api/company/:id/documentos`, que retorna o formato estruturado com `isValid`. O badge "Válido" é fixo — não reflete a data real.

#### O que implementar

**1. Adicionar em `api.ts`:**

```typescript
export async function apiGetDocumentos(companyId: string) {
  const res = await fetch(`${BACKEND_URL}/api/company/${companyId}/documentos`);
  if (!res.ok) throw new Error('Falha ao buscar documentos');
  return res.json();
}

export async function apiUploadDocumento(companyId: string, formData: FormData) {
  const res = await fetch(`${BACKEND_URL}/api/company/${companyId}/documentos`, {
    method: 'POST',
    body: formData,  // sem Content-Type — browser define multipart boundary
  });
  if (!res.ok) throw new Error('Falha no upload do documento');
  return res.json();
}
```

**2. Atualizar `fetchDocs` para usar `apiGetDocumentos`:**

```typescript
// Interface esperada do novo endpoint
interface DocumentoStatus {
  url: string | null;
  validUntil: string | null;
  isValid: boolean;
}
interface DocumentosData {
  pcmso: DocumentoStatus;
  ppra: DocumentoStatus;
}
```

**3. Atualizar a UI para exibir status real:**

```tsx
// Para cada seção (PCMSO / PPRA):
const doc = tipo === 'PCMSO' ? documentos?.pcmso : documentos?.ppra;
const diasParaVencer = doc?.validUntil
  ? Math.ceil((new Date(doc.validUntil).getTime() - Date.now()) / 86400000)
  : null;

// Badge de status:
{doc?.isValid && diasParaVencer !== null && diasParaVencer <= 30 ? (
  <span className="badge badge-warning">⚠️ Vence em {diasParaVencer} dias</span>
) : doc?.isValid ? (
  <span className="badge badge-done">✅ Válido até {new Date(doc.validUntil!).toLocaleDateString('pt-BR')}</span>
) : doc?.url ? (
  <span className="badge badge-expired">⚠️ Expirado</span>
) : (
  <span className="badge badge-waiting">❌ Não enviado</span>
)}
```

#### Critério de aceite

- Badge reflete o estado real (`isValid`) vindo do backend.
- Documentos com validade < 30 dias exibem alerta de "próximo de vencer".
- Documentos expirados exibem badge "Expirado" (não "Válido").

---

### FF-4A-06 — Método PATCH e campos completos nas configurações

**Prioridade:** 🔴 Crítico  
**Arquivo:** `app/empresa/configuracoes/page.tsx`  
**Backend pronto:** `PATCH /api/company/:id` (TASK-4A-06 / B8-REQ-002)

#### Contexto

O `handleSave` usa `method: 'PUT'` e não inclui os campos `razaoSocial` e `address`. O backend espera `PATCH` e os campos ausentes nunca são atualizáveis pela UI.

#### O que implementar

**1. Corrigir método HTTP:**

```typescript
// De: method: 'PUT'
// Para: method: 'PATCH'
```

**2. Adicionar campos ao estado e ao formulário:**

```typescript
// Interface atualizada
interface CompanyData {
  razaoSocial: string;    // ← adicionar
  nomeFantasia: string;
  cnpj: string;
  address: string;        // ← adicionar
  cep: string;
  city: string;
  state: string;
  status?: string;        // ← adicionar (somente leitura)
}

// Campos extras no formulário:
// "Razão Social" — editável
// "Endereço" — editável  
// "Status" — somente leitura, com widget colorido (ver FF-4A-08)
```

**3. Incluir no body do PATCH:**

```typescript
body: JSON.stringify({
  razaoSocial: companyData.razaoSocial,
  nomeFantasia: companyData.nomeFantasia,
  address: companyData.address,
  cep: companyData.cep,
  city: companyData.city,
  state: companyData.state,
  // CNPJ e status NÃO devem ser enviados
}),
```

#### Critério de aceite

- `PATCH /api/company/:id` é chamado (não `PUT`).
- Campos `razaoSocial` e `address` são editáveis e persistidos.
- CNPJ permanece somente leitura.

---

### FF-4A-07 — Preview do convite antes da autenticação

**Prioridade:** 🟡 Alto  
**Arquivo:** `app/p/[token]/page.tsx`  
**Backend pronto:** `GET /api/portal/preview/:token` (TASK-4A-05)

#### Contexto

A tela de validação já tenta chamar `GET /api/portal/invite/:token` (endpoint que não existe na spec). O backend agora expõe `GET /api/portal/preview/:token` retornando `{ empresaNome, tipoExame, expirado }`.

#### O que implementar

Corrigir o endpoint chamado no `useEffect` inicial:

```typescript
// De:
const res = await fetch(`${BACKEND_URL}/api/portal/invite/${params.token}`);

// Para:
const res = await fetch(`${BACKEND_URL}/api/portal/preview/${params.token}`);
const data = await res.json();
if (data.expirado) {
  setError('Este link não está mais disponível. Entre em contato com a empresa.');
  return;
}
setInviteName(data.empresaNome ?? '');
// Exibir também data.tipoExame na tela de apresentação
```

**Adicionar mensagem específica para link expirado:**

Quando `expirado === true`, a tela deve exibir uma mensagem informativa e ocultar o formulário de CPF/data de nascimento (o funcionário não tem o que preencher).

```tsx
if (linkExpirado) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <p style={{ fontWeight: 700, color: '#dc2626' }}>Link expirado</p>
      <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>
        Este link não está mais disponível. Entre em contato com a empresa para solicitar um novo convite.
      </p>
    </div>
  );
}
```

#### Critério de aceite

- Tela exibe nome da empresa e tipo de exame antes de o funcionário preencher qualquer dado.
- Link expirado mostra mensagem específica sem formulário.
- Link válido exibe o formulário normalmente.

---

### FF-4A-08 — Status-check com checklist e widget de status

**Prioridade:** 🟡 Alto  
**Arquivo:** `app/empresa/configuracoes/page.tsx`, `app/lib/api.ts`  
**Backend pronto:** `GET /api/company/:id/status-check` (TASK-4A-07)

#### Contexto

A tela de configurações não exibe o status atual da empresa nem o checklist de requisitos para liberação.

#### O que implementar

**1. Adicionar em `api.ts`:**

```typescript
export async function apiGetCompanyStatusCheck(companyId: string) {
  const res = await fetch(`${BACKEND_URL}/api/company/${companyId}/status-check`);
  if (!res.ok) throw new Error('Falha ao buscar status da empresa');
  return res.json();
}
```

**2. Widget de status da empresa** (abaixo do título da página):

```tsx
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  LIBERADA:             { label: 'Liberada',             color: '#16a34a', bg: 'rgba(34,197,94,0.1)',  desc: 'Empresa habilitada para envio de convites' },
  CADASTRO_INCOMPLETO:  { label: 'Cadastro incompleto',  color: '#d97706', bg: 'rgba(245,158,11,0.1)', desc: 'Complete os dados para liberar convites' },
  EM_ANALISE:           { label: 'Em análise',           color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', desc: 'Aguardando aprovação do administrador' },
  DOCUMENTACAO_VENCIDA: { label: 'Documentação vencida', color: '#dc2626', bg: 'rgba(239,68,68,0.1)',  desc: 'Renove os documentos para reativar convites' },
};

// Renderizar o widget:
{statusCheck && (
  <div style={{ padding: '16px', borderRadius: '12px', background: cfg.bg, border: `1px solid ${cfg.color}20`, marginBottom: '24px' }}>
    <div style={{ fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
    <div style={{ fontSize: '13px', color: cfg.color, opacity: 0.8 }}>{cfg.desc}</div>
  </div>
)}
```

**3. Checklist de requisitos** (seção separada abaixo do formulário):

```tsx
{statusCheck && (
  <div className="card" style={{ marginTop: '20px' }}>
    <h3>Requisitos para liberação</h3>
    {[
      { ok: statusCheck.hasRazaoSocial, label: 'Razão Social cadastrada' },
      { ok: statusCheck.hasPcmso && statusCheck.pcmsoValid, label: 'PCMSO válido', link: '/empresa/documentos' },
      { ok: statusCheck.hasPpra && statusCheck.ppraValid,  label: 'PPRA válido',  link: '/empresa/documentos' },
      { ok: statusCheck.hasClinicAssigned, label: 'Clínica atribuída' },
    ].map(item => (
      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
        <span>{item.ok ? '✅' : '❌'}</span>
        <span style={{ flex: 1, color: item.ok ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
          {item.label}
        </span>
        {!item.ok && item.link && (
          <Link href={item.link} style={{ fontSize: '12px', color: '#3b6ff5' }}>Resolver →</Link>
        )}
      </div>
    ))}
  </div>
)}
```

#### Critério de aceite

- Widget de status exibe cor e descrição corretos conforme `CompanyStatus`.
- Checklist reflete valores reais do backend.
- Links "Resolver" levam para a tela de documentos quando cabível.

---

### FF-4A-09 — Modo leitura na consulta médica quando CONCLUIDO

**Prioridade:** 🟡 Alto  
**Arquivo:** `app/medico/consulta/[id]/page.tsx`

#### Contexto

Quando a solicitação está `CONCLUIDO` e já possui `asoDocuments`, o botão "Emitir ASO" deve ser desabilitado e a decisão já registrada deve ser exibida.

#### O que implementar

```tsx
const isReadOnly = solicitacao?.status === 'CONCLUIDO';
const asoExistente = solicitacao?.asoDocuments?.[0];

// Substituir seção "Decisão do ASO" quando read-only:
{isReadOnly && asoExistente ? (
  <div className="card">
    <h3>ASO Emitido</h3>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', borderRadius: '10px', background: 'rgba(34,197,94,0.08)' }}>
      <CheckCircleIcon className="icon" style={{ color: '#16a34a' }} />
      <div>
        <div style={{ fontWeight: 700 }}>
          {asoExistente.decision === 'APTO' ? 'Apto' :
           asoExistente.decision === 'INAPTO' ? 'Inapto' : 'Apto com Restrição'}
        </div>
        {asoExistente.restrictionNotes && (
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Restrição: {asoExistente.restrictionNotes}
          </div>
        )}
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Válido até: {new Date(asoExistente.validUntil).toLocaleDateString('pt-BR')}
        </div>
      </div>
    </div>
    {asoExistente.pdfUrl && (
      <a href={`${BACKEND_URL}${asoExistente.pdfUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px', textDecoration: 'none' }}>
        <DocumentTextIcon className="icon" /> Baixar ASO
      </a>
    )}
  </div>
) : (
  /* seção de emissão existente */
)}
```

Adicionalmente, a interface `SolicitacaoData` deve incluir `asoDocuments`:

```typescript
asoDocuments?: Array<{
  id: string;
  decision: string;
  restrictionNotes?: string;
  validUntil: string;
  pdfUrl?: string;
}>;
```

#### Critério de aceite

- Consulta com `status = CONCLUIDO` não exibe botões de emissão.
- Decisão e validade do ASO existente são exibidos.
- Link de download do PDF aparece quando `pdfUrl` está preenchido.

---

### FF-4A-10 — Item "Histórico" na sidebar do médico

**Prioridade:** 🟡 Alto  
**Arquivo:** `app/medico/layout.tsx`

#### O que implementar

```typescript
// Adicionar à lista navItems:
import { ClockIcon } from '@heroicons/react/24/outline';

const navItems = [
  { href: '/medico/fila',      icon: HeartIcon,           label: 'Fila' },
  { href: '/medico/historico', icon: ClockIcon,            label: 'Histórico' },  // ← adicionar
  { href: '/medico/dashboard', icon: ChartBarSquareIcon,   label: 'Dashboard' },
];
```

#### Critério de aceite

- Item "Histórico" visível na sidebar, com ícone de relógio.
- Link ativo com destaque quando na rota `/medico/historico`.

---

### FF-4A-11 — Filtros de status e data no histórico

**Prioridade:** 🟡 Alto  
**Arquivo:** `app/medico/historico/page.tsx`

#### O que implementar

Adicionar controles de filtro acima da tabela:

```tsx
// Estado
const [filtroStatus, setFiltroStatus] = useState('');
const [filtroPeriodo, setFiltroPeriodo] = useState('30'); // '7', '30', 'custom'
const [dataInicio, setDataInicio] = useState('');
const [dataFim, setDataFim]     = useState('');

// Filtro client-side (os dados já estão carregados):
const solicitacoesFiltradas = solicitacoes.filter((sol) => {
  const passaStatus = !filtroStatus || sol.status === filtroStatus;
  let passaData = true;
  if (filtroPeriodo !== 'custom') {
    const dias = parseInt(filtroPeriodo);
    passaData = new Date(sol.createdAt) >= new Date(Date.now() - dias * 86400000);
  } else if (dataInicio && dataFim) {
    const d = new Date(sol.createdAt);
    passaData = d >= new Date(dataInicio) && d <= new Date(dataFim);
  }
  return passaStatus && passaData;
});

// UI de filtros:
<div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
  <select className="form-select" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ width: 'auto' }}>
    <option value="">Todos os status</option>
    <option value="CONCLUIDO">Concluído</option>
    <option value="EM_ATENDIMENTO_MEDICO">Em atendimento</option>
  </select>
  <select className="form-select" value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)} style={{ width: 'auto' }}>
    <option value="7">Últimos 7 dias</option>
    <option value="30">Últimos 30 dias</option>
    <option value="custom">Período customizado</option>
  </select>
  {filtroPeriodo === 'custom' && (
    <>
      <input type="date" className="form-input" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={{ width: 'auto' }} />
      <input type="date" className="form-input" value={dataFim}    onChange={e => setDataFim(e.target.value)}    style={{ width: 'auto' }} />
    </>
  )}
</div>
```

#### Critério de aceite

- Filtro por status altera a lista exibida em tempo real.
- Período "últimos 7 dias" e "últimos 30 dias" funcionam sem chamada extra ao backend.
- Período customizado com intervalo de datas funciona.

---

### FF-4A-12 — Indicador visual de valores fora de faixa

**Prioridade:** 🟡 Alto  
**Arquivo:** `app/medico/consulta/[id]/page.tsx`

#### O que implementar

Adicionar função de avaliação e aplicar estilo ao card do resultado:

```typescript
function avaliarResultado(typeName: string, key: string, value: string): 'normal' | 'atencao' {
  const v = parseFloat(value);
  if (isNaN(v)) return 'normal';
  if (typeName?.toLowerCase().includes('pa') || key === 'pressao_sistolica') {
    if (v > 140 || v < 90) return 'atencao';
  }
  if (key === 'pressao_diastolica') {
    if (v > 90 || v < 60) return 'atencao';
  }
  if (typeName?.toLowerCase().includes('glicemia') || key === 'glicemia') {
    if (v > 100 || v < 70) return 'atencao';
  }
  return 'normal';
}

// No render dos exames, usar o retorno para colorir o card:
const status = avaliarResultado(exam.type?.name ?? '', key, value);
// border e background diferentes quando status === 'atencao'
// ícone ExclamationTriangleIcon visível quando 'atencao'
```

#### Critério de aceite

- Pressão sistólica > 140 exibe indicador visual de atenção.
- Pressão diastólica > 90 exibe indicador visual de atenção.
- Valores normais exibem sem destaque negativo.

---

## SPRINT 4B — Comunicação com o mundo externo

---

### FF-4B-01 — Botão "Criar sala de teleconsulta" na tela do médico

**Prioridade:** 🔴 Crítico  
**Arquivo:** `app/medico/consulta/[id]/page.tsx`  
**Backend pronto:** `POST /api/teleconsultation/create-room` (TASK-4C-01)

#### Contexto

O médico precisa de um botão para gerar o link da sala de vídeo. Sem esse botão, `Teleconsultation.videoSessionId` nunca é preenchido e o portal do funcionário fica preso em "Preparando sua sala, aguarde...".

#### O que implementar

**1. Adicionar em `api.ts`:**

```typescript
export async function apiCreateVideoRoom(examRequestId: string, doctorId: string) {
  const res = await fetch(`${BACKEND_URL}/api/teleconsultation/create-room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ examRequestId, doctorId }),
  });
  if (!res.ok) throw new Error('Falha ao criar sala de vídeo');
  return res.json();
}
```

**2. Adicionar estado e botão na consulta:**

```tsx
const [videoRoomUrl, setVideoRoomUrl] = useState<string | null>(null);
const [creatingRoom, setCreatingRoom] = useState(false);

const handleCreateRoom = async () => {
  if (!doctorId) return;
  setCreatingRoom(true);
  try {
    const result = await apiCreateVideoRoom(params.id, doctorId);
    setVideoRoomUrl(result.data?.hostRoomUrl ?? result.hostRoomUrl ?? null);
  } catch {
    alert('Erro ao criar sala de teleconsulta.');
  } finally {
    setCreatingRoom(false);
  }
};

// Renderizar na área de vídeo (painel superior da consulta):
{!videoRoomUrl ? (
  <button
    id="btn-create-room"
    className="btn btn-primary"
    onClick={handleCreateRoom}
    disabled={creatingRoom}
  >
    <VideoCameraIcon className="icon" />
    {creatingRoom ? 'Criando sala...' : 'Iniciar teleconsulta'}
  </button>
) : (
  <a
    href={videoRoomUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="btn btn-success"
    style={{ textDecoration: 'none' }}
  >
    <VideoCameraIcon className="icon" />
    Entrar na sala (médico)
  </a>
)}
```

**Nota:** O `hostRoomUrl` (URL do médico, com controles de host) é diferente do `videoSessionId` (URL pública do paciente salva no banco). O médico deve usar o `hostRoomUrl` retornado pelo endpoint, não o link do paciente.

#### Critério de aceite

- Botão "Iniciar teleconsulta" visível na tela de consulta antes de sala ser criada.
- Após criar, exibe link para o médico entrar na sala como host.
- O portal do funcionário exibe o link da sala (via polling do processo) após o médico criar a sala.

---

### FF-4B-02 — Tela de boas-vindas do portal (primeira visita)

**Prioridade:** 🟡 Alto  
**Arquivo:** `app/p/[token]/page.tsx` (ou nova rota `app/p/[token]/boas-vindas/page.tsx`)

#### Contexto

Após autenticação bem-sucedida, o usuário é redirecionado diretamente para `/processo` sem qualquer contextualização. A spec define uma tela de boas-vindas que apresenta: nome do funcionário, empresa, tipo do exame e prazo.

#### O que implementar

**Opção recomendada:** exibir como segundo estado da própria página `/p/[token]`, após autenticação, antes do redirecionamento. Usar `sessionStorage.getItem('primeiroAcesso')` para controlar a exibição única.

```tsx
// Após auth bem-sucedida (handleSubmit):
const isFirstAccess = !sessionStorage.getItem('primeiroAcessoConcluido');
sessionStorage.setItem('portalToken', data.data.sessionToken);
sessionStorage.setItem('processId', data.data.processId);

if (isFirstAccess) {
  // Exibir tela de boas-vindas
  setShowWelcome(true);
  setWelcomeData({
    nome: data.data.patientName,
    empresa: inviteName,
    tipoExame: data.data.tipoExame,
    prazo: data.data.prazo,
  });
} else {
  router.push(`/p/${params.token}/processo`);
}

// Componente de boas-vindas (modal ou estado alternativo):
// - Nome do funcionário
// - Empresa
// - Tipo de exame (admissional, periódico, etc.)
// - Prazo de conclusão (quando disponível)
// - Botão único "Iniciar processo" → router.push(`/p/${params.token}/processo`) + sessionStorage.setItem('primeiroAcessoConcluido', '1')
```

#### Critério de aceite

- Na primeira autenticação, tela de boas-vindas é exibida antes do processo.
- Revalidações subsequentes (token 4h expirado) vão direto para o processo.
- Botão "Iniciar processo" leva para `/p/:token/processo`.

---

### FF-4B-03 — Link Google Maps para clínica no portal

**Prioridade:** 🟢 Médio  
**Arquivo:** `app/p/[token]/processo/page.tsx`

#### Contexto

A tela de processo já exibe endereço da clínica e já tem `latitude`/`longitude` na interface `ProcessoData.clinica`. O link para Google Maps já está implementado condicionalmente. Verificar se o backend retorna `latitude` e `longitude` — se retornar apenas `endereco` como string, o link deve ser gerado por endereço.

#### O que implementar

Garantir fallback por endereço quando coordenadas não estiverem disponíveis:

```tsx
{data.clinica && (
  <a
    href={
      data.clinica.latitude && data.clinica.longitude
        ? `https://www.google.com/maps/dir/?api=1&destination=${data.clinica.latitude},${data.clinica.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.clinica.endereco ?? data.clinica.nome ?? '')}`
    }
    target="_blank"
    rel="noopener noreferrer"
  >
    Abrir no Google Maps
  </a>
)}
```

#### Critério de aceite

- Link Google Maps aparece quando próxima ação é `COMPARECER_CLINICA`.
- Funciona tanto com coordenadas quanto com endereço textual.

---

## SPRINT 4C — Autenticação JWT real

---

### FF-4C-01 — Autenticação JWT real na tela de login

**Prioridade:** 🔴 Crítico  
**Arquivo:** `app/page.tsx` (tela de login), `app/lib/api.ts`  
**Backend pronto:** `POST /api/auth/login` emite JWT com `{ sub, email, role, profileId }` (TASK-4D-01, TASK-4D-02)

#### Contexto

A tela de login (`app/page.tsx`) atualmente é um seletor de perfil que apenas navega para a rota correta sem nenhuma autenticação. A função `apiLogin` existe em `api.ts` mas nunca é usada. Com o guard JWT global ativado no backend (TASK-4D-01), todas as rotas autenticadas passarão a exigir Bearer token — o frontend precisa estar preparado.

#### O que implementar

**1. Atualizar a tela de login para coletar e-mail e senha:**

```tsx
// Substituir o seletor de role por formulário de login real
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

const handleLogin = async () => {
  setLoading(true);
  setError('');
  try {
    const result = await apiLogin(email, password);
    if (!result.accessToken) throw new Error(result.message ?? 'Credenciais inválidas');
    
    // Salvar token e dados de sessão
    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('userRole', result.role);
    localStorage.setItem('profileId', result.profileId ?? '');
    
    // Navegar conforme a role
    const routes: Record<string, string> = {
      DOCTOR:        '/medico/fila',
      OPERATOR:      '/consultorio',
      COMPANY_ADMIN: '/empresa',
      ADMIN:         '/admin',
    };
    router.push(routes[result.role] ?? '/');
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Erro ao fazer login');
  } finally {
    setLoading(false);
  }
};
```

**2. Atualizar `apiLogin` em `api.ts`:**

```typescript
export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}
```

#### Critério de aceite

- Login com credenciais corretas salva `accessToken` em `localStorage` e redireciona para a rota da role.
- Login com credenciais incorretas exibe mensagem de erro.
- Token é um JWT válido decodificável com `role` e `profileId`.

---

### FF-4C-02 — Token Bearer em todas as chamadas autenticadas

**Prioridade:** 🔴 Crítico  
**Arquivo:** `app/lib/api.ts` e todos os `page.tsx` com chamadas diretas a `fetch`

#### Contexto

Com o guard JWT global ativado (TASK-4D-01), toda chamada a endpoint protegido precisa incluir `Authorization: Bearer <token>`. Atualmente nenhuma chamada inclui o token.

#### O que implementar

**1. Criar helper de fetch autenticado em `api.ts`:**

```typescript
function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

// Helper genérico:
async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...(options.headers ?? {}) },
  });
  if (res.status === 401) {
    // Token expirado — limpar sessão e redirecionar para login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      window.location.href = '/';
    }
    throw new Error('Sessão expirada');
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

**2. Refatorar todas as funções de `api.ts` para usar `apiFetch`:**

```typescript
// Exemplo — antes:
export async function apiGetQueue(doctorId: string) {
  const res = await fetch(`${BACKEND_URL}/api/queue?doctorId=${...}`);
  ...
}

// Depois:
export async function apiGetQueue(doctorId: string) {
  return apiFetch(`/api/queue?doctorId=${encodeURIComponent(doctorId)}`);
}
```

**3. Auditar chamadas `fetch` diretas nos `page.tsx`:**

Buscar por `fetch(\`${BACKEND_URL}` nos arquivos de página e substituir pelas funções de `api.ts` ou incluir os headers de autenticação. Arquivos afetados (verificar cada um):

- `app/medico/consulta/[id]/page.tsx` — `POST /api/signature/generate`, `POST /api/signature/sign`, `POST /api/aso/generate`
- `app/empresa/documentos/page.tsx` — chamadas de upload
- `app/empresa/configuracoes/page.tsx` — GET e PATCH de company
- `app/empresa/page.tsx` — GET de companies, dashboard, invites
- `app/consultorio/check-in/page.tsx` — POST de create-patient, exams, send-to-queue
- `app/p/[token]/*.tsx` — **exceção**: rotas do portal usam `portalToken` do `sessionStorage`, não `accessToken` do `localStorage`. Manter lógica separada.

#### Critério de aceite

- Todas as chamadas a endpoints protegidos incluem `Authorization: Bearer <token>`.
- Token expirado redireciona para a tela de login automaticamente.
- Rotas do portal continuam usando `sessionStorage.getItem('portalToken')` separadamente.

---

### FF-4C-03 — `middleware.ts` para proteção de rotas por role

**Prioridade:** 🔴 Crítico  
**Arquivo:** `middleware.ts` (criar na raiz do projeto Next.js)

#### Contexto

O arquivo não existe. Sem middleware, qualquer usuário pode acessar `/medico`, `/empresa` ou `/admin` sem estar autenticado. Com o guard JWT do backend ativo, as chamadas de API falharão com 401, mas a UI carregará mesmo assim.

#### O que implementar

```typescript
// middleware.ts (raiz do projeto, ao lado de next.config.js)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Mapeamento de prefixo de rota → role permitida
const ROUTE_ROLES: Record<string, string> = {
  '/medico':    'DOCTOR',
  '/empresa':   'COMPANY_ADMIN',
  '/consultorio': 'OPERATOR',
  '/admin':     'ADMIN',
};

// Rotas públicas — nunca redirecionar
const PUBLIC_PREFIXES = ['/p/', '/colaboradores/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas passam livremente
  if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Página de login passa livremente
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Verificar token (cookies são mais seguros que localStorage, mas para
  // compatibilidade com a implementação atual, verificar cookie espelhado)
  const token = request.cookies.get('accessToken')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Verificar role para a rota acessada
  for (const [prefix, requiredRole] of Object.entries(ROUTE_ROLES)) {
    if (pathname.startsWith(prefix)) {
      try {
        // Decodificar payload sem verificar assinatura (verificação fica no backend)
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role !== requiredRole) {
          return NextResponse.redirect(new URL('/', request.url));
        }
      } catch {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

**Nota importante:** O middleware do Next.js lê cookies, não `localStorage`. Ao salvar o token no login, além de `localStorage`, também salvar em cookie:

```typescript
// Em handleLogin (app/page.tsx), após salvar no localStorage:
document.cookie = `accessToken=${result.accessToken}; path=/; SameSite=Strict; max-age=86400`;
```

#### Critério de aceite

- Acessar `/medico` sem token redireciona para `/`.
- Acessar `/empresa` com token de DOCTOR redireciona para `/`.
- Rotas `/p/*` e `/colaboradores/*` são acessíveis sem token.
- Logout deve limpar tanto `localStorage` quanto o cookie.

---

## SPRINT 4D — Operação e escala

---

### FF-4D-01 — Módulo Admin (`/admin/*`)

**Prioridade:** 🟡 Alto  
**Arquivo:** `app/admin/` (criar estrutura completa)  
**Backend pronto:** `GET /api/admin/*` com endpoints de gestão (TASK-4D-06)

#### Contexto

A tela de login (`app/page.tsx`) já referencia `/admin` como rota do perfil ADMIN, mas a rota não existe. Ao selecionar o perfil Admin e acessar, haveria um 404.

#### Estrutura de rotas a criar

```
app/admin/
  layout.tsx              — sidebar + autenticação de role ADMIN
  page.tsx                — dashboard com métricas globais
  empresas/
    page.tsx              — listagem de todas as empresas
    [id]/page.tsx         — detalhes + aprovar/bloquear empresa
  clinicas/
    page.tsx              — listagem de clínicas
  medicos/
    page.tsx              — listagem de médicos + verificar CRM
```

#### Especificação de cada tela

**`app/admin/layout.tsx`** — sidebar com itens: Dashboard, Empresas, Clínicas, Médicos.

**`app/admin/page.tsx`** — Dashboard Admin:
- Cards de métricas: total de empresas, total de pacientes, total de solicitações, total de ASOs emitidos.
- Fonte: `GET /api/admin/stats`.

**`app/admin/empresas/page.tsx`** — Lista de empresas:
- Tabela: razão social, CNPJ, status, documentação, data de cadastro.
- Badge colorido por `CompanyStatus`.
- Botão "Ver detalhes" por empresa.
- Filtro por status.
- Fonte: `GET /api/admin/companies`.

**`app/admin/empresas/[id]/page.tsx`** — Detalhes da empresa:
- Dados completos da empresa.
- Histórico de solicitações.
- Botões de ação:
  - "Aprovar" → `PATCH /api/admin/companies/:id/status` com `{ status: 'LIBERADA' }`
  - "Bloquear" → mesmo endpoint com `{ status: 'CADASTRO_INCOMPLETO' }`
- Confirmação antes de ação destrutiva.

**`app/admin/clinicas/page.tsx`** — Lista de clínicas:
- Tabela: nome, cidade, estado, capacidade.
- Botão "Cadastrar nova clínica" → modal com formulário.
- Fonte: `GET /api/admin/clinics`, `POST /api/admin/clinics`.

**`app/admin/medicos/page.tsx`** — Lista de médicos:
- Tabela: nome, CRM, status, cidade/estado.
- Botão "Verificar CRM" → `POST /api/admin/doctors/verify`.
- Fonte: `GET /api/admin/doctors`.

#### Adicionar em `api.ts`

```typescript
export async function apiAdminStats() {
  return apiFetch('/api/admin/stats');
}
export async function apiAdminListCompanies(filters = {}) {
  const params = new URLSearchParams(filters as Record<string, string>);
  return apiFetch(`/api/admin/companies?${params.toString()}`);
}
export async function apiAdminUpdateCompanyStatus(id: string, status: string) {
  return apiFetch(`/api/admin/companies/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
export async function apiAdminListClinics() {
  return apiFetch('/api/admin/clinics');
}
export async function apiAdminCreateClinic(data: object) {
  return apiFetch('/api/admin/clinics', { method: 'POST', body: JSON.stringify(data) });
}
export async function apiAdminListDoctors() {
  return apiFetch('/api/admin/doctors');
}
```

#### Critério de aceite

- Perfil Admin consegue acessar `/admin` após login.
- Dashboard exibe métricas reais do banco.
- Admin consegue aprovar/bloquear uma empresa.
- Qualquer outra role que acesse `/admin` é redirecionada para `/`.

---

### FF-4D-02 — Exportar CSV de solicitações da empresa

**Prioridade:** 🟢 Médio  
**Arquivo:** `app/empresa/solicitacoes/page.tsx`  
**Backend pronto:** `GET /api/company/:id/relatorio?formato=csv` (TASK-4D-07)

#### O que implementar

Adicionar botão "Exportar CSV" na barra de ação da página:

```tsx
const handleExportCsv = async () => {
  const companyId = localStorage.getItem('companyId') ?? '';
  const params = new URLSearchParams({ formato: 'csv' });
  // Adicionar filtros de data se existirem
  const url = `${BACKEND_URL}/api/company/${companyId}/relatorio?${params.toString()}`;
  
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) { alert('Erro ao gerar relatório.'); return; }
  
  const blob = await res.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `relatorio-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  document.body.removeChild(link);
};

// Botão na UI:
<button className="btn btn-secondary" onClick={handleExportCsv}>
  <ArrowDownTrayIcon className="icon" />
  Exportar CSV
</button>
```

#### Critério de aceite

- Botão "Exportar CSV" dispara download de arquivo `.csv`.
- CSV contém: nome, CPF, função (CBO), tipo de exame, data, decisão ASO, validade ASO.

---

### FF-4D-03 — Paginação nas listagens

**Prioridade:** 🟢 Médio  
**Arquivos:** `empresa/solicitacoes/page.tsx`, `medico/historico/page.tsx`, outros  
**Backend pronto:** Paginação em `GET /api/solicitacoes`, `GET /api/medicos` (TASK-4D-05)

#### O que implementar

Padrão de paginação a aplicar em todas as listagens longas:

```typescript
// Interface de resposta paginada
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Atualizar chamadas para incluir page/limit:
export async function apiListSolicitacoes(
  filters: { status?: string; companyId?: string } = {},
  page = 1,
  limit = 20
) {
  const params = new URLSearchParams();
  if (filters.status)    params.set('status', filters.status);
  if (filters.companyId) params.set('companyId', filters.companyId);
  params.set('page',  String(page));
  params.set('limit', String(limit));
  return apiFetch(`/api/solicitacoes?${params.toString()}`);
}
```

**Componente de paginação reutilizável:**

```tsx
// components/ui/Pagination.tsx
interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        {total} resultado{total !== 1 ? 's' : ''}
      </span>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn btn-ghost" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          ← Anterior
        </button>
        <span style={{ alignSelf: 'center', fontSize: '13px' }}>
          {page} / {totalPages}
        </span>
        <button className="btn btn-ghost" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          Próxima →
        </button>
      </div>
    </div>
  );
}
```

**Telas a atualizar:** `empresa/solicitacoes/page.tsx`, `medico/historico/page.tsx`, `admin/empresas/page.tsx`, `admin/medicos/page.tsx`.

#### Critério de aceite

- Listagens com mais de 20 itens exibem controle de paginação.
- Navegar entre páginas carrega o intervalo correto do backend.
- Contador "X resultados" reflete o total real.

---

## Ordem de execução recomendada

### Bloco 1 — Críticos imediatos (fazem o fluxo básico funcionar)

```
FF-4A-01  → Dropdown de médicos na fila
FF-4A-02  → Check-in multi-exame
FF-4A-03  → decision + restrictionNotes no PATCH
FF-4A-04  → validUntil no upload de documentos
FF-4A-05  → Endpoint correto de documentos com isValid
FF-4A-06  → PATCH + campos completos em configurações
FF-4B-01  → Botão criar sala de teleconsulta
```

### Bloco 2 — Auth (ativar apenas quando backend ligar o guard global)

> ⚠️ Ativar o guard JWT no backend (TASK-4D-01) antes de implementar FF-4C-01/02/03 pode quebrar o ambiente de desenvolvimento. Coordenar com o backend qual é o momento de ativação.

```
FF-4C-01  → Login JWT real
FF-4C-02  → Bearer token em todas as chamadas
FF-4C-03  → middleware.ts de proteção de rotas
```

### Bloco 3 — Features completas do backend visíveis no frontend

```
FF-4A-07  → Preview do convite antes de autenticar
FF-4A-08  → Status-check + checklist
FF-4A-09  → Modo leitura na consulta
FF-4A-10  → Item Histórico na sidebar
FF-4A-11  → Filtros no histórico
FF-4A-12  → Indicador visual de valores
FF-4B-02  → Tela de boas-vindas do portal
FF-4D-01  → Módulo Admin
```

### Bloco 4 — Polimento e operação

```
FF-4B-03  → Link Google Maps
FF-4D-02  → Exportar CSV
FF-4D-03  → Paginação
```

---

## Funções novas necessárias em `api.ts`

| Função | Endpoint |
|--------|----------|
| `apiGetExamTypes()` | `GET /api/exams/types` |
| `apiGetRequiredExams(cboCode)` | `GET /api/exams/required?cboCode=` |
| `apiGetDocumentos(companyId)` | `GET /api/company/:id/documentos` |
| `apiUploadDocumento(companyId, formData)` | `POST /api/company/:id/documentos` |
| `apiGetCompanyStatusCheck(companyId)` | `GET /api/company/:id/status-check` |
| `apiCreateVideoRoom(examRequestId, doctorId)` | `POST /api/teleconsultation/create-room` |
| `apiAdminStats()` | `GET /api/admin/stats` |
| `apiAdminListCompanies(filters)` | `GET /api/admin/companies` |
| `apiAdminUpdateCompanyStatus(id, status)` | `PATCH /api/admin/companies/:id/status` |
| `apiAdminListClinics()` | `GET /api/admin/clinics` |
| `apiAdminCreateClinic(data)` | `POST /api/admin/clinics` |
| `apiAdminListDoctors()` | `GET /api/admin/doctors` |
| `apiFetch(path, options)` | helper autenticado interno |
| `getAuthHeaders()` | helper interno |

---

## Novos arquivos a criar

| Arquivo | Descrição |
|---------|-----------|
| `middleware.ts` | Proteção de rotas por role |
| `app/admin/layout.tsx` | Layout do módulo admin |
| `app/admin/page.tsx` | Dashboard admin |
| `app/admin/empresas/page.tsx` | Lista de empresas |
| `app/admin/empresas/[id]/page.tsx` | Detalhes e aprovação de empresa |
| `app/admin/clinicas/page.tsx` | Lista e cadastro de clínicas |
| `app/admin/medicos/page.tsx` | Lista de médicos |
| `components/ui/Pagination.tsx` | Componente de paginação reutilizável |
