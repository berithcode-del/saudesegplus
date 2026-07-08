# Relatório de Revisão — Fase 4 Frontend

**Data:** 28/06/2026
**Escopo:** Todas as features do spec `FASE4-FRONTEND-SPECS.md` + validação against o código implementado
**Metodologia:** Agentes de revisão independentes por área, comparando código real vs especificação

---

## Sumário Executivo

| Area | Status | Gaps |
|------|--------|------|
| F1 + F2 (Médico) | ⚠️ 8 gaps | fila dropdown, ASO re-emissão, decisão link, decision payload, status filters, doctorId fallback |
| F3 (Check-in) | ⚠️ 6 gaps | peso_altura/glicemia, required exams alert, pré-marcação, endpoint, validação, normalização response |
| F4 + F5 (Empresa) | ⚠️ 1 gap | checklist sem links |
| Portal + Auth | ⚠️ 7 gaps | endpoint preview, expirado, flag boas-vindas, Maps link, cookie flags, 401 handler, cookie cleanup |
| Admin | ⚠️ 1 gap | semântica "Bloquear" com CADASTRO_INCOMPLETO |

**Total: 23 gaps acionáveis**

---

## F1 + F2 — Médico (Fila, Consulta, Histórico)

### 🔴 Crítico

#### GAP-001 — "Emitir ASO" não bloqueado quando `status === 'CONCLUIDO'`
**Arquivo:** `app/medico/consulta/[id]/page.tsx`
**Spec:** FF-4A-09

O botão "Emitir ASO" só verifica `!decision` ou `signing`. Não verifica `solicitacao.status`.

```tsx
// Atual (linha ~370)
disabled={!decision || signing || (decision === 'APTO_COM_RESTRICAO' && !restriction)}

// Esperado: adicionar check de status
disabled={!decision || signing || solicitacao.status === 'CONCLUIDO'}
```

**Critério:** `F2-AC-004`

---

#### GAP-002 — `decision` e `restrictionNotes` não são retry se `apiUpdateSolicitacao` falhar
**Arquivo:** `app/medico/consulta/[id]/page.tsx` — `handleSign`
**Spec:** FF-4A-03

Se `apiUpdateSolicitacao` falhar, o backend não recebe `decision`/`restrictionNotes`. A chamada está depois da geração de ASO, mas deveria ser antes para garantir persistência.

```tsx
// Mover apiUpdateSolicitacao PARA ANTES de:
// 1. POST /api/signature/generate
// 2. POST /api/signature/sign/:id
// 3. POST /api/aso/generate
```

---

### 🟡 Alto

#### GAP-003 — Dropdown não persiste seleção de volta no localStorage
**Arquivo:** `app/medico/fila/page.tsx`
**Spec:** FF-4A-01

`handleSaveDoctorId` salva o ID em localStorage, mas o dropdown não mostra o valor selecionado ao recarregar. Ao recarregar, o dropdown mostra "Selecione" mas o `doctorId` do localStorage está lá — mismatch.

**Fix:** Ao montar, se `doctorId` existe no localStorage, definir como valor padrão do select. Melhor: ao selecionar, salvar ID no localStorage E já selecionar o item correspondente no dropdown visualmente.

---

#### GAP-004 — Leitura do ASO existente não permite download
**Arquivo:** `app/medico/consulta/[id]/page.tsx`
**Spec:** FF-4A-09

Quando `status === 'CONCLUIDO'`, a decisão é exibida mas sem link para o PDF. Deveria haver link para `aso.pdfUrl` com texto "Baixar ASO".

---

#### GAP-005 — Filtros de status com valores incorretos
**Arquivo:** `app/medico/historico/page.tsx`
**Spec:** FF-4A-11

Os valores do filtro de status são `EM_ATENDIMENTO_MEDICO` e `AGUARDANDO_MEDICO`. Verificar se o backend retorna esses valores — podem não existir no enum do backend. Valores comuns são `CONCLUIDO`, `EM_ANDAMENTO`, `AGUARDANDO`.

**Fix:** Verificar resposta de `apiGetMedicoSolicitacoes` para confirmar valores de status e alinhar os options do select.

---

#### GAP-006 — Sem fallback se localStorage vazio
**Arquivos:** `app/medico/fila/page.tsx`, `app/medico/historico/page.tsx`

Se `localStorage` não tem `doctorId`, a UI deveria automaticamente selecionar o primeiro médico da lista em vez de deixar vazio.

---

### 🔵 api.ts — F1/F2 related

#### GAP-007 — `apiUpdateSolicitacao` — `decision` não é `required` no tipo
**Arquivo:** `app/lib/api.ts`
**Spec:** FF-4A-03

O tipo atual do body não exige `decision`, mas o backendatomicamente cria `AsoDocument` com `decision`. Se não for passado, fica `null`.

```typescript
// Atual
export async function apiUpdateSolicitacao(id: string, body: {
  status: string;
  laudoTexto?: string;
  decision?: string;
  restrictionNotes?: string;
})

// Recomendado: documentar que decision é obrigatório para status=CONCLUIDO
```

---

## F3 — Check-in

### 🔴 Crítico

#### GAP-008 — Endpoint de submissão errado
**Arquivo:** `app/consultorio/check-in/page.tsx`
**Spec:** FF-4A-02

Submissão chama `/api/exams/batch` mas o spec diz para chamar `/api/exams` com `{ examRequestId, results: [...] }`.

```tsx
// Atual
const examRes = await fetch(`${BACKEND_URL}/api/exams/batch`, ...)

// Esperado (ou confirmar com backend qual endpoint aceita results[])
const examRes = await fetch(`${BACKEND_URL}/api/exams`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ examRequestId, results }),
});
```

---

#### GAP-009 — Sem validação de campos obrigatórios antes da submissão
**Arquivo:** `app/consultorio/check-in/page.tsx`
**Spec:** FF-4A-02

Campos podem ser vazios e enviados como `valueJson: {}`. O backend pode rejeitar ou criar resultado sem dados.

**Fix:** Antes de enviar, verificar que todos os campos dos tipos selecionados têm valor. Se algum obrigatório vazio, exibir erro inline.

---

### 🟡 Alto

#### GAP-010 — Tipos `peso_altura` e `glicemia` não validados contra resposta do backend
**Arquivo:** `app/consultorio/check-in/page.tsx`
**Spec:** FF-4A-02

`DEFAULT_EXAM_TYPES` tem `peso_altura` com campos `peso`/`altura` e `glicemia` com `valor_glicemia`. Se o backend retornar IDs diferentes (ex: `peso_quilo`, `glicemia_valor`), os campos não são capturados.

---

#### GAP-011 — Alerta de required exams usa `setError` (vermelho)
**Arquivo:** `app/consultorio/check-in/page.tsx`
**Spec:** FF-4A-02

`setError('Esta função requer: ...')` é styled como erro (vermelho), mas é apenas informativo. Usar estilo de alerta neutro (amarelo/informativo).

---

#### GAP-012 — Required exams podem não ser pré-marcados se `examTypes` carrega depois
**Arquivo:** `app/consultorio/check-in/page.tsx`
**Spec:** FF-4A-02

O `useEffect` de `requiredExams` roda antes de `examTypes` estar carregado. Se o backend for lento, os exames obrigatórios não são pré-selecionados.

**Fix:** Adicionar `examTypes.length > 0` como condição no effect de requiredExams.

---

#### GAP-013 — `apiGetExamTypes` e `apiGetRequiredExams` não normalizam resposta
**Arquivo:** `app/lib/api.ts`
**Spec:** FF-4A-02

Se backend retornar `{ types: [...] }` em vez de `{ data: [...] }`, o código falha silenciosamente e usa fallback.

```typescript
// Atual: assume { data: [...] }
setExamTypes(Array.isArray(r.data) ? r.data : [])

// Melhor: normalizar
const arr = r.data ?? r.types ?? r ?? [];
setExamTypes(Array.isArray(arr) ? arr : []);
```

---

## F4 + F5 — Empresa (Documentos, Configurações)

### 🔴 Crítico

Nenhum gap crítico encontrado. FF-4A-04, FF-4A-05, FF-4A-06, FF-4A-08, FF-4D-02, FF-4D-03 estão corretamente implementados.

### 🟡 Alto

#### GAP-014 — Checklist de status sem links de navegação
**Arquivo:** `app/empresa/configuracoes/page.tsx`
**Spec:** FF-4A-08

O spec diz: "com links para documentos quando cabível". O checklist exibe ✅/❌ com texto mas sem `<Link>` para `/empresa/documentos`.

**Fix:** Adicionar `<Link href="/empresa/documentos">Resolver →</Link>` para itens de checklist não satisfeitos.

---

## Portal + Auth

### 🔴 Crítico

#### GAP-015 — Endpoint errado de preview do convite
**Arquivo:** `app/p/[token]/page.tsx`
**Spec:** FF-4A-07

O `useEffect` chama `/api/portal/invite/${params.token}` em vez de `/api/portal/preview/${params.token}`.

```tsx
// Atual
const res = await fetch(`${BACKEND_URL}/api/portal/invite/${params.token}`);

// Esperado
const res = await fetch(`${BACKEND_URL}/api/portal/preview/${params.token}`);
```

---

#### GAP-016 — Sem verificação de `expirado` no preview
**Arquivo:** `app/p/[token]/page.tsx`
**Spec:** FF-4A-07

A resposta de `/portal/preview/:token` inclui `expirado`. Se `expirado === true`, o formulário deve ser ocultado e mensagem de "link expirado" exibida. Nenhum tratamento existe.

---

### 🟡 Alto

#### GAP-017 — Flag de boas-vindas com nome diferente
**Arquivo:** `app/p/[token]/processo/page.tsx`
**Spec:** FF-4B-02

O código usa `welcomeShown`/`welcomeShown` mas o spec define `primeiroAcessoConcluido`.

```tsx
// Atual
sessionStorage.getItem('welcomeShown') // e seta 'welcomeShown'

// Esperado
sessionStorage.getItem('primeiroAcessoConcluido') // e seta 'primeiroAcessoConcluido'
```

---

#### GAP-018 — Google Maps link não aparece para `COMPARECER_CLINICA`
**Arquivo:** `app/p/[token]/processo/page.tsx`
**Spec:** FF-4B-03

Quando `proximaAcao.tipo === 'COMPARECER_CLINICA'`, a UI mostra "Acompanhando..." (pois está na lista de `isCtaClickable` como false). O Maps link está dentro do bloco CTA que também é bloqueado. O resultado é que o endereço aparece mas sem o link para Maps.

**Fix:** `COMPARECER_CLINICA` deve exibir o endereço com link Google Maps, mesmo sem botão de CTA clicável. Renderizar o card de clínica com Maps fora do bloco `isCtaClickable`.

---

#### GAP-019 — Cookie sem `httpOnly` e `Secure`
**Arquivo:** `app/page.tsx`
**Spec:** FF-4C-01

```tsx
// Atual
document.cookie = `accessToken=${result.accessToken}; path=/; SameSite=Strict; max-age=86400`;

// Recomendado (mas see note)
document.cookie = `accessToken=${result.accessToken}; path=/; SameSite=Strict; max-age=86400; httpOnly; Secure`;
```

**Nota:** `httpOnly` impede JS de ler o cookie (segurança contra XSS), mas middleware Next.js precisa ler o cookie via `request.cookies.get()`. Se usar `httpOnly`, o middleware consegue ler? **Sim — cookies httpOnly são enviados na request mas inacessíveis via `document.cookie`.** Para `Secure`, precisa HTTPS. Em dev localhost sem HTTPS, pode causar problemas. Recomendação: usar `httpOnly; SameSite=Strict; max-age=86400` em produção e testar middleware localmente sem `Secure`.

---

#### GAP-020 — 401 usa `window.location.href` em vez de router
**Arquivo:** `app/lib/api.ts`
**Spec:** FF-4C-02

```typescript
// Atual (linha ~81)
window.location.href = '/';

// Esperado
if (typeof window !== 'undefined') { window.location.replace('/'); }
```

`replace()` é melhor que `href = '/'` (evita histórico). Alternativamente, usar `useRouter` mas api.ts não tem acesso ao router — `window.location.replace('/')` é aceitável.

---

#### GAP-021 — 401 não limpa o cookie de auth
**Arquivo:** `app/lib/api.ts`
**Spec:** FF-4C-02

Quando token expira (401), localStorage é limpo mas o cookie `accessToken` permanece. Navegações subsequentes ainda leem o cookie expirado no middleware.

```typescript
// Adicionar ao handler de 401:
document.cookie = 'accessToken=; path=/; max-age=0';
```

---

## Admin

### 🟡 Alto

#### GAP-022 — "Bloquear" empresa define status `CADASTRO_INCOMPLETO`
**Arquivo:** `app/admin/empresas/[id]/page.tsx`
**Spec:** FF-4D-01

"Bloquear" semanticamente deveria suspender/bloquear a empresa. `CADASTRO_INCOMPLETO` significa cadastro incompleto, não bloqueado. Usar `DOCUMENTACAO_VENCIDA` ou `BLOQUEADA` conforme o backend suporte.

```tsx
// Atual
<button className="btn btn-danger" onClick={() => handleStatusChange('CADASTRO_INCOMPLETO')}>

// Verificar com backend qual status representa "bloqueio"
// Provavelmente: 'BLOQUEADA' ou 'SUSPENSA'
```

---

## Tabela Consolidada de Gaps

| # | Prioridade | Feature | Spec | Arquivo | Descrição |
|---|-----------|---------|------|---------|-----------|
| GAP-001 | 🔴 | F2 Consulta | FF-4A-09 | `medico/consulta/[id]/page.tsx` | "Emitir ASO" não bloqueado quando CONCLUIDO |
| GAP-002 | 🔴 | F2 Consulta | FF-4A-03 | `medico/consulta/[id]/page.tsx` | decision/restrictionNotes não garantidos se update falhar |
| GAP-008 | 🔴 | F3 Check-in | FF-4A-02 | `consultorio/check-in/page.tsx` | Endpoint de submissão errado (/api/exams/batch) |
| GAP-009 | 🔴 | F3 Check-in | FF-4A-02 | `consultorio/check-in/page.tsx` | Sem validação de campos obrigatórios |
| GAP-015 | 🔴 | Portal | FF-4A-07 | `p/[token]/page.tsx` | Endpoint errado de preview (invite vs preview) |
| GAP-016 | 🔴 | Portal | FF-4A-07 | `p/[token]/page.tsx` | Sem verificação de expirado |
| GAP-003 | 🟡 | F1 Fila | FF-4A-01 | `medico/fila/page.tsx` | Dropdown não persiste visualmente seleção |
| GAP-004 | 🟡 | F2 Consulta | FF-4A-09 | `medico/consulta/[id]/page.tsx` | Link de download do ASO em modo leitura |
| GAP-005 | 🟡 | F2 Histórico | FF-4A-11 | `medico/historico/page.tsx` | Valores de status filter podem não bater com backend |
| GAP-006 | 🟡 | F1+F2 | — | `medico/fila/page.tsx`, `medico/historico/page.tsx` | Sem auto-seleção do primeiro médico se localStorage vazio |
| GAP-010 | 🟡 | F3 Check-in | FF-4A-02 | `consultorio/check-in/page.tsx` | peso_altura/glicemia podem não bater com backend |
| GAP-011 | 🟡 | F3 Check-in | FF-4A-02 | `consultorio/check-in/page.tsx` | Alerta de required exams styled como erro |
| GAP-012 | 🟡 | F3 Check-in | FF-4A-02 | `consultorio/check-in/page.tsx` | Required exams podem não pré-marcar se examTypes lento |
| GAP-013 | 🟡 | F3 Check-in | FF-4A-02 | `api.ts` | apiGetExamTypes/GetRequiredExams sem normalização |
| GAP-014 | 🟡 | F5 Config | FF-4A-08 | `empresa/configuracoes/page.tsx` | Checklist sem links para /empresa/documentos |
| GAP-017 | 🟡 | Portal | FF-4B-02 | `p/[token]/processo/page.tsx` | Flag welcomeShown vs primeiroAcessoConcluido |
| GAP-018 | 🟡 | Portal | FF-4B-03 | `p/[token]/processo/page.tsx` | Google Maps link não aparece para COMPARECER_CLINICA |
| GAP-019 | 🟡 | Login | FF-4C-01 | `app/page.tsx` | Cookie sem httpOnly; Secure opcional |
| GAP-020 | 🟡 | Auth | FF-4C-02 | `api.ts` | 401 usa window.location.href em vez de replace |
| GAP-021 | 🟡 | Auth | FF-4C-02 | `api.ts` | 401 não limpa o cookie de auth |
| GAP-022 | 🟡 | Admin | FF-4D-01 | `admin/empresas/[id]/page.tsx` | "Bloquear" usa CADASTRO_INCOMPLETO em vez de BLOQUEADA |
| GAP-007 | 🔵 | api.ts | FF-4A-03 | `api.ts` | decision não é required no tipo de apiUpdateSolicitacao |

---

## Itens que estão CORRETOS (não precisam de ação)

- FF-4A-01: Dropdown médicos funciona com `apiListMedicos`, ID persiste em localStorage ✅
- FF-4A-04: validUntil enviado no upload ✅
- FF-4A-05: Endpoint correto de documentos, isValid exibido, alertas de vencimento ✅
- FF-4A-06: PATCH com campos razaoSocial/address ✅
- FF-4A-08: Widget de status colorido + checklist ✅
- FF-4A-10: Item "Histórico" na sidebar ✅
- FF-4B-02: Boas-vindas funcional (exceto nome da flag) ✅
- FF-4B-03: Google Maps link funciona com coordenadas (exceto COMPARECER_CLINICA) ✅
- FF-4C-02: apiFetch com Bearer token + 401 redirect ✅
- FF-4C-03: Middleware protege todas as rotas por role ✅
- FF-4D-01: Admin module completo com 5 páginas ✅
- FF-4D-02: Export CSV funciona ✅
- FF-4D-03: Paginação implementada ✅

---

## Recomendação de Priorização

**Primeiro batch (bloqueiam fluxo):**
1. GAP-015 + GAP-016 — endpoint preview + expirado (portal não funciona)
2. GAP-008 — endpoint de submissão do check-in (dados não chegam)
3. GAP-001 — re-emissão de ASO (dados inconsistentes no banco)
4. GAP-002 — decision não garantido (ASO sem decisão)

**Segundo batch (funcionalidade parcial):**
5. GAP-017 — flag de boas-vindas (usuário vê tela errada)
6. GAP-018 — Maps link COMPARECER_CLINICA (UX quebrado)
7. GAP-014 — checklist sem links (usuário não sabe ir para documentos)
8. GAP-020 + GAP-021 — 401 handler incompleto (sessão expirada mal tratada)

**Terceiro batch (polimento):**
9. GAP-003, GAP-004, GAP-005, GAP-006, GAP-007, GAP-009, GAP-010, GAP-011, GAP-012, GAP-013, GAP-019, GAP-022