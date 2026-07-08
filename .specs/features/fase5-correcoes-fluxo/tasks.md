# Fase 5 - Correções de Fluxo e Furos Lógicos Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow.

---

**Design**: N/A (Ajustes aplicados na UI existente)
**Status**: Draft 

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec — confirm before Execute. Guidelines found: none — strong defaults applied.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Frontend UI/Pages | none | Manual/Build Gate Only | `apps/web/**/*.tsx` | `npm run lint` |
| API Integration | none | Validate inputs via types | `apps/web/src/lib/api.ts` | `npm run lint` |

## Parallelism Assessment

> Generated from codebase — confirm before Execute.

| Test Type | Parallel-Safe? | Isolation Model | Evidence |
| --------- | -------------- | --------------- | -------- |
| Lint/Types | Yes | Stateless static analysis | Standard ESLint/TSC |

## Gate Check Commands

> Generated from codebase — confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After logic changes | `cd apps/web && npm run lint` |
| Full | After visual changes | `cd apps/web && npm run lint` |
| Build | After phase completion | `cd apps/web && npm run build` |

---

## Execution Plan

### Phase 1: Correções de Frontend Empresarial e Portal (Parallel OK)
```text
  T1 [P]
  T2 [P]
```

### Phase 2: Correções no Check-in da Clínica (Sequential)
```text
  T3
```

### Phase 3: Correções na Consulta Médica (Parallel OK)
```text
  T4 [P]
  T5 [P]
```

---

## Task Breakdown

### T1: [Exibir link copiável ao criar convite] [P]

**What**: Adicionar modal com o link `/p/:token` gerado e botão "Copiar" após sucesso na criação do convite.
**Where**: `apps/web/src/app/empresa/solicitacoes/page.tsx`
**Depends on**: None
**Reuses**: Componentes UI existentes
**Requirement**: FEAT-501

**Tools**:
- MCP: `filesystem`

**Done when**:
- [x] Link é gerado no client ou retornado pela API.
- [x] Link é mostrado em modal na tela com botão Copiar área de transferência.
- [x] Gate check passes: `cd apps/web && npm run lint`

**Tests**: none
**Gate**: quick

---

### T2: [Corrigir rota de preview no portal] [P]

**What**: Ajustar chamada para `GET /api/portal/preview/:token` em vez do endpoint inexistente.
**Where**: `apps/web/src/app/p/[token]/page.tsx` (ou arquivo equivalente do portal)
**Depends on**: None
**Reuses**: API clients existentes
**Requirement**: FEAT-502

**Tools**:
- MCP: `filesystem`

**Done when**:
- [x] Chamada de API ajustada para `/preview`.
- [x] Nome da empresa e informações exibidas antes da validação.
- [x] Gate check passes: `cd apps/web && npm run lint`

**Tests**: none
**Gate**: quick

---

### T3: [Adicionar busca por CPF no Check-in]

**What**: Modificar tela de check-in para buscar `ExamInvite` pelo CPF antes de registrar um `Patient`.
**Where**: `apps/web/src/app/consultorio/check-in/page.tsx`
**Depends on**: None
**Reuses**: Campos de busca
**Requirement**: FEAT-503

**Tools**:
- MCP: `filesystem`

**Done when**:
- [x] Campo CPF inclui botão de "Buscar Convite".
- [x] Resultado preenche os dados em tela e repassa o `inviteId` na criação.
- [x] Gate check passes: `cd apps/web && npm run lint`

**Tests**: none
**Gate**: quick

---

### T4: [Enviar decision e restrictions ao salvar consulta] [P]

**What**: Garantir que o envio da conclusão (`PATCH`) inclua os valores capturados de `decision` e `restrictionNotes`.
**Where**: `apps/web/src/app/medico/consulta/[id]/page.tsx` e `apps/web/src/lib/api.ts`
**Depends on**: None
**Reuses**: Funções API existentes
**Requirement**: FEAT-504

**Tools**:
- MCP: `filesystem`

**Done when**:
- [ ] `apiUpdateSolicitacao` aceita e envia decision/restrictionNotes.
- [ ] Componente da consulta envia os campos corretamente no submit.
- [ ] Gate check passes: `cd apps/web && npm run lint`

**Tests**: none
**Gate**: quick

---

### T5: [Botão para Criar Sala de Teleconsulta] [P]

**What**: Renderizar botão "Criar Sala de Vídeo" se a modalidade for teleconsulta, consumindo `/api/teleconsultation/create-room`.
**Where**: `apps/web/src/app/medico/consulta/[id]/page.tsx`
**Depends on**: None
**Reuses**: UI base de botões
**Requirement**: FEAT-505

**Tools**:
- MCP: `filesystem`

**Done when**:
- [ ] Botão renderiza com base no tipo de exame (se for remoto).
- [ ] Chamada `POST /api/teleconsultation/create-room` é efetuada ao clicar.
- [ ] Gate check passes: `cd apps/web && npm run lint`

**Tests**: none
**Gate**: quick
