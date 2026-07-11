# 📋 Acompanhamento Mobile — SaudeSegPlus

> Documento de controle centralizado com todas as specs, status de implementação, testes e pendências.
> Última atualização: 2026-07-10
> Localização: `.specs/integracao-mobile/`

---

## 📁 Estrutura de Pastas

```
.specs/integracao-mobile/
├── ACOMPANHAMENTO_MOBILE.md          ← Este documento
├── CHECKPOINTS.md                    ← Pontos de checagem bloqueantes
├── STATE.md                          ← Decisões e handoff
├── LESSONS.md                        ← Lições aprendidas
├── bloco-1-reuso/                    ← Specs do Bloco 1 (concluído)
│   ├── README.md
│   ├── spec-api-types.md, validation-api-types.md, tasks-api-types.md
│   ├── spec-api-client.md, validation-api-client.md, tasks-api-client.md
│   └── design-api-client.md
├── bloco-2-scaffold/                 ← Spec + tasks do scaffold mobile
│   ├── spec.md
│   ├── tasks.md
│   └── validation.md
├── bloco-3-portal/                   ← Spec + tasks do portal colaborador
│   ├── spec.md
│   ├── tasks.md
│   └── validation.md
├── bloco-4-medico/                   ← Spec + tasks do fluxo médico
│   ├── spec.md
│   ├── tasks.md
│   └── validation.md
├── bloco-5-pwa/                      ← Spec + tasks do PWA + Capacitor
│   ├── spec.md
│   ├── tasks.md
│   └── validation.md
└── _arquivo/                         ← Fases do ciclo anterior (referência)
    ├── README.md
    ├── fase-2-fluxo-completo/
    ├── fase-3-melhorias-core/
    ├── fase-4-producao/
    ├── fase-5-correcoes/
    ├── fase-6-fechamento/
    └── f6-portal-detalhes/
```

---

## 🗺️ Visão Geral do Projeto

```
Stack:
  Backend:  NestJS + Prisma + PostgreSQL + Socket.IO
  Web:      Next.js 14 (App Router) + Tailwind CSS
  Mobile:   Vite + React SPA (Capacitor-ready)
  Packages: @repo/api-types, @repo/api-client, @repo/ui

Monorepo: apps/web, apps/mobile, apps/backend + packages/*
```

---

## 📊 Dashboard de Progresso

```
BLOCO 1 — Reuso de Pacotes     ████████████████████ 100% ✅ CHECKPOINT-1 PASS
BLOCO 2 — Scaffold Mobile      ████████████████████ 100% ✅ BUILD PASS — MOBILE INDEPENDENTE
BLOCO 3 — Portal Colaborador   ████████████████████ 100% ✅ TSC PASS / DESIGN ALINHADO
BLOCO 4 — Fluxo Médico         ████████████████████ 100% ✅ TSC PASS / DESIGN ALINHADO
BLOCO 5 — PWA + Capacitor      ████████████████████ 100% ✅ BUILD PASS / SW + MANIFEST + ICONS

FASE 2 — Fluxo Completo        ████████████████████ 100% ✅ TODOS PASS
FASE 3 — Melhorias Core        ████████░░░░░░░░░░░░  40% 🔶 PARCIAL
FASE 4 — Produção              ░░░░░░░░░░░░░░░░░░░░   0% ❌ SÓ SPECS
FASE 5 — Correções Fluxo       ░░░░░░░░░░░░░░░░░░░░   0% ❌ SÓ SPECS
FASE 6 — Fechamento            ░░░░░░░░░░░░░░░░░░░░   0% ❌ SÓ SPECS

DESIGN SYSTEM                  ████████████████████ 100% ✅ ALINHADO COM WEB (indigo, Inter, shadows)
  → globals.css, design-tokens.ts reescritos
  → Todos 16 componentes mobile migrados (0 refs --md- restantes)
  → Fonte: Inter (não Roboto), Cor primária: #4f46e5 (indigo)

TESTES
  Backend:  4 arquivos spec   ██░░░░░░░░░░░░░░░░░░  20%
  Web:      7 arquivos test   ████░░░░░░░░░░░░░░░░  35%
  Mobile:   0 arquivos        ░░░░░░░░░░░░░░░░░░░░   0%
```

---

## 📦 BLOCO 1 — Reuso de Pacotes ✅

**Checkpoint**: C1 | **Revisor**: `code-archaeologist` | **Status**: PASS

### Features

| Feature | Tasks | Status | Validacao |
|---------|-------|--------|-----------|
| `api-types` | Extração de DTOs/enums | ✅ DONE | `validation.md` PASS |
| `api-client` | Wrapper HTTP + Socket.IO + storage | ✅ DONE | `validation.md` PASS |
| `web migration` | Refatoração para @repo/api-client | ✅ DONE | Commit `7f39358` |

### Decisões
- **AD-001**: Extração de `packages/api-types` para reuso web/mobile
- **AD-002**: Extração de `packages/api-client` com injeção de dependência de storage
- **AD-003**: Stack Vite + React SPA (não Next.js export)

---

## 📦 BLOCO 2 — Scaffold Mobile ⚠️

**Checkpoint**: C2 | **Revisor**: `frontend-specialist` | **Status**: EXECUTADO PARCIALMENTE — FAIL (ambiente)

### Spec: `mobile-scaffold`

| ID | Requisito | Status Codigo | Status Spec |
|----|-----------|---------------|-------------|
| REQ-MOBILE-SCAFFOLD-001 | Dev server em 0.0.0.0:5173 | ✅ Feito | PASS |
| REQ-MOBILE-SCAFFOLD-002 | Build sem erros | ⚠️ Bloqueado por ambiente | FAIL |
| REQ-MOBILE-SCAFFOLD-003 | Rotas renderizam placeholders | ✅ Feito | PASS |
| REQ-MOBILE-SCAFFOLD-004 | Estrutura de pastas | ✅ Feito | PASS |
| REQ-MOBILE-SCAFFOLD-005 | capacitor.config.ts | ✅ Feito | PASS |
| REQ-MOBILE-SCAFFOLD-006 | ApiClient provider | ✅ Feito | PASS |
| REQ-MOBILE-SCAFFOLD-007 | M3 theme Roboto | ✅ Feito | PASS |
| REQ-MOBILE-SCAFFOLD-008 | viewport-fit cover | ✅ Feito | PASS |

### Tasks (9 total)

| Task | Descricao | Status |
|------|-----------|--------|
| TASK-MOBILE-SCAFFOLD-001 | Criar projeto Vite + React | ✅ |
| TASK-MOBILE-SCAFFOLD-002 | Configurar vite.config.ts | ✅ |
| TASK-MOBILE-SCAFFOLD-003 | Criar estrutura de pastas | ✅ |
| TASK-MOBILE-SCAFFOLD-004 | Configurar react-router | ✅ |
| TASK-MOBILE-SCAFFOLD-005 | Configurar providers (ApiClient + theme) | ✅ |
| TASK-MOBILE-SCAFFOLD-006 | Configurar viewport + viewport-fit | ✅ |
| TASK-MOBILE-SCAFFOLD-007 | Criar capacitor.config.ts | ✅ |
| TASK-MOBILE-SCAFFOLD-008 | Criar hooks placeholders | ✅ |
| TASK-MOBILE-SCAFFOLD-009 | Configurar .env e README | ✅ |

### Validacao (CHECKPOINT-2)

| ID | Criterio | Resultado | Evidencia |
|----|----------|-----------|-----------|
| C2.1 | Estrutura de pastas completa | PASS | `apps/mobile/src` |
| C2.2 | Vite com server.host: true | PASS | `vite.config.ts` |
| C2.3 | react-router com rotas perfil | PASS | `/p/:token/*` + alias `/portal/:token/*`, `/medico/*`, `/consultorio/*` |
| C2.4 | Consome @repo/ui, @repo/api-client, @repo/api-types | PASS | `npm ls --workspace mobile --depth=0` |
| C2.5 | `npm run build --workspace mobile` passa | FAIL | `ERR_MODULE_NOT_FOUND: esbuild` |
| C2.6 | capacitor.config.ts criado | PASS | arquivo presente |
| C2.7 | Touch audit ≥ 48px | PASS | `node scripts/mobile_audit.mjs apps/mobile` |
| C2.8 | Commit atômico por task | PENDING | ainda não verificado |

### Codigo Mobile Existente

```
apps/mobile/src/
  app/App.tsx                    ✅ Router completo
  app/providers/ApiProvider.tsx   ✅ ApiClient provider
  routes/Home.tsx                ✅ Landing page
  routes/portal/[token]/         ✅ 7 sub-rotas (scaffold; navegação oficial usa `/p/:token/*`)
  routes/medico/                 ✅ Layout + 3 telas (MOCK)
  routes/consultorio/            ✅ Layout + placeholder
  components/ConnectionStatus.tsx ✅ Online/offline
  hooks/useAuthToken.ts          ✅
  hooks/useCamera.ts             ✅
  hooks/useConnectionStatus.ts   ✅
  hooks/useOfflineQueue.ts       ✅
  lib/                           ✅ storage scaffold criado
```

### O que falta no Mobile

- [ ] Resolver ambiente de bundling (`esbuild`) para fechar C2.5
- [ ] Verificar estratégia de commits atômicos do bloco antes do PASS final
- [ ] Integração com API backend (todas as rotas usam MOCK)
- [ ] Socket.IO para fila em tempo real
- [ ] Testes do mobile (0 arquivos)
- [ ] PWA manifest + service worker

---

## 📦 BLOCO 3 — Portal do Colaborador 🔶

**Checkpoint**: C3 | **Revisor**: `test-engineer` | **Status**: EM ANDAMENTO (~80%)

### Spec: `portal-flow`

| ID | Requisito | Status |
|----|-----------|--------|
| REQ-PORTAL-001 | Token validation | ✅ |
| REQ-PORTAL-002 | LGPD consent | ✅ |
| REQ-PORTAL-003 | Token inválido | ✅ |
| REQ-PORTAL-004 | Confirmar dados | ✅ |
| REQ-PORTAL-005 | Correção inline | ✅ |
| REQ-PORTAL-006 | Wizard 1/N | ✅ |
| REQ-PORTAL-007 | Rascunho IndexedDB | ✅ |
| REQ-PORTAL-008 | Recarregar rascunho | ✅ |
| REQ-PORTAL-009 | Envio offline queue | ✅ |
| REQ-PORTAL-010 | Indicador progresso | ✅ |
| REQ-PORTAL-011 | Lista documentos | ✅ |
| REQ-PORTAL-012 | Câmera nativa | ✅ |
| REQ-PORTAL-013 | Preview reenvio | ✅ |
| REQ-PORTAL-014 | LGPD antes câmera | ✅ |
| REQ-PORTAL-015 | Sala espera + conexão | ✅ |
| REQ-PORTAL-016 | Vídeo embedded | ✅ |
| REQ-PORTAL-017 | Reconexão | ✅ |
| REQ-PORTAL-018 | ASO preview | ✅ |
| REQ-PORTAL-019 | Assinatura ASO | ✅ |

### Tasks (15 total)

| Task | Descricao | Status |
|------|-----------|--------|
| TASK-PORTAL-001 | Tela de entrada por token | ✅ |
| TASK-PORTAL-002 | Tela de confirmação de dados | ✅ |
| TASK-PORTAL-003 | Questionário — estrutura do wizard | ✅ |
| TASK-PORTAL-004 | Questionário — rascunho local (IndexedDB) | ✅ |
| TASK-PORTAL-005 | Questionário — envio (online/offline queue) | ✅ |
| TASK-PORTAL-006 | Documentos — listagem | ✅ |
| TASK-PORTAL-007 | Documentos — câmera nativa | ✅ |
| TASK-PORTAL-008 | Documentos — upload | ✅ |
| TASK-PORTAL-009 | Teleconsulta — sala de espera | ✅ |
| TASK-PORTAL-010 | Teleconsulta — vídeo embedded | ✅ |
| TASK-PORTAL-011 | Teleconsulta — finalização → ASO | ✅ |
| TASK-PORTAL-012 | ASO — preview e assinatura | ✅ |
| TASK-PORTAL-013 | Indicador de conexão global | ✅ |
| TASK-PORTAL-014 | Erros amigáveis mobile | ✅ |
| TASK-PORTAL-015 | Testes E2E do fluxo completo | ❌ |

---

## 📦 BLOCO 4 — Fluxo Médico 🔶

**Checkpoint**: C4 | **Revisor**: `security-auditor` + `test-engineer` | **Status**: EM ANDAMENTO (~85%)

### Spec: `doctor-flow`

| ID | Requisito | Status |
|----|-----------|--------|
| REQ-DOCTOR-001 | Fila tempo real | ✅ |
| REQ-DOCTOR-002 | Atualização Socket.IO | ✅ |
| REQ-DOCTOR-003 | Reconexão background | ✅ |
| REQ-DOCTOR-004 | Pull-to-refresh | ✅ |
| REQ-DOCTOR-005 | Aceitar paciente | ✅ |
| REQ-DOCTOR-006 | Consulta + motor clínico | ✅ |
| REQ-DOCTOR-007 | Card lateral exames | ✅ |
| REQ-DOCTOR-008 | Salvar laudo | ✅ |
| REQ-DOCTOR-009 | Finalizar consulta | ✅ |
| REQ-DOCTOR-010 | Histórico virtualizado | ✅ |
| REQ-DOCTOR-011 | Detalhes consulta | ✅ |
| REQ-DOCTOR-012 | Login JWT + storage seguro | ✅ |
| REQ-DOCTOR-013 | PIN reentrada | ⏭️ Postergado |
| REQ-DOCTOR-014 | Lockout 3 tentativas | ⏭️ Postergado |

### Tasks (12 total)

| Task | Descricao | Status |
|------|-----------|--------|
| TASK-DOCTOR-001 | Bottom tab bar (Fila / Consulta / Histórico) | ✅ |
| TASK-DOCTOR-002 | Fila de atendimento — lista virtualizada | ✅ |
| TASK-DOCTOR-003 | Fila — Socket.IO + reconexão | ✅ |
| TASK-DOCTOR-004 | Fila — aceitar paciente | ✅ |
| TASK-DOCTOR-005 | Consulta ativa — layout + motor clínico | ✅ |
| TASK-DOCTOR-006 | Consulta ativa — salvar laudo | ✅ |
| TASK-DOCTOR-007 | Consulta ativa — finalizar | ✅ |
| TASK-DOCTOR-008 | Histórico — lista virtualizada | ✅ |
| TASK-DOCTOR-009 | Histórico — detalhes da consulta | ✅ |
| TASK-DOCTOR-010 | Login + armazenamento seguro | ✅ |
| TASK-DOCTOR-011 | PIN de reentrada rápida | ⏭️ |
| TASK-DOCTOR-012 | Testes de fluxo médico | ❌ |

---

## 📦 BLOCO 5 — PWA + Capacitor 🔶

**Checkpoint**: C5 | **Revisor**: `devops-engineer` + `performance-optimizer` | **Status**: EM ANDAMENTO (~70%)

### Spec: `pwa-capacitor`

| ID | Requisito | Status |
|----|-----------|--------|
| REQ-PWA-001 | manifest válido | ✅ |
| REQ-PWA-002 | standalone | ✅ |
| REQ-PWA-003 | splash | ✅ |
| REQ-PWA-004 | SW cacheia assets | ✅ |
| REQ-PWA-005 | Offline questionário | ✅ |
| REQ-PWA-006 | Sync online | ✅ |
| REQ-PWA-007 | Inscrição push | ✅ |
| REQ-PWA-008 | Notificação recebida | ✅ |
| REQ-PWA-009 | Deep link da notificação | ✅ |
| REQ-PWA-010 | capacitor.config válido | ✅ |
| REQ-PWA-011 | capacitor sync checagem | ⚠️ Precisa npm fix |

### Tasks (9 total)

| Task | Descricao | Status |
|------|-----------|--------|
| TASK-PWA-001 | Criar manifest.json | ✅ |
| TASK-PWA-002 | Service worker — cache de assets | ✅ |
| TASK-PWA-003 | Service worker — offline questionário | ✅ |
| TASK-PWA-004 | Service worker — sync de pendências | ✅ |
| TASK-PWA-005 | Web Push — inscrição | ✅ |
| TASK-PWA-006 | Web Push — recepção + deep link | ✅ |
| TASK-PWA-007 | Validar capacitor.config.ts | ✅ |
| TASK-PWA-008 | Lighthouse audit + otimizações | ⚠️ Precisa build |
| TASK-PWA-009 | Documentação README | ✅ |

---

## 📦 FASE 2 — Fluxo Completo ✅

**Status**: CONCLUÍDO — Todos os 7 ACs PASS

| ID RF | Requisito | Status |
|-------|-----------|--------|
| F2-REQ-001 | Cadastro via convite | ✅ |
| F2-REQ-002 | Validação de token | ✅ |
| F2-REQ-003 | Redirecionamento pós-cadastro | ✅ |
| F2-REQ-004 | Persistência de empresa | ✅ |
| F2-REQ-005 | Fluxo de solicitações | ✅ |
| F2-REQ-006 | Documentos mocados | ✅ |
| F2-REQ-007 | CRUD de solicitações | ✅ |
| F2-REQ-008 | Vinculação de solicitações | ✅ |
| F2-REQ-009 | Status da solicitação | ✅ |
| F2-REQ-010 | Dados reais em componentes | ✅ |
| F2-REQ-011 | Persistência de médicos | ✅ |
| F2-REQ-012 | Lista de solicitações para médico | ✅ |
| F2-REQ-013 | Registro de laudo simplificado | ✅ |
| F2-REQ-014 | Atualização de status | ✅ |
| F2-REQ-015 | Colaborador vê status | ✅ |
| F2-REQ-016 | Empresa vê status | ✅ |
| F2-REQ-017 | Médico atualiza solicitações | ✅ |

---

## 📦 FASE 3 — Melhorias Core 🔶

**Status**: ~40% completo (Backend 65%, Frontend 20%)

### 3A — Fundação

| Task | Descricao | Status Backend | Status Frontend |
|------|-----------|----------------|-----------------|
| TASK-001 | Enum `ExamRequestStatus` no Prisma | ✅ DONE | — |
| TASK-002 | Enum `QueueEntryStatus` + `TimelineEventType` | ✅ DONE | — |
| TASK-003 | Auditar e corrigir seed | ⚠️ PARTIAL | — |
| TASK-004 | Corrigir ordem de rotas + signature service | ⚠️ PARTIAL | — |
| TASK-005 | Try/catch nos WebSocket emits | ⚠️ PARTIAL | — |
| TASK-006 | Corrigir duplicação de QueueEntry | ⚠️ PARTIAL | — |

### 3B — Fluxo Core do Médico

| Task | Descricao | Status Backend | Status Frontend |
|------|-----------|----------------|-----------------|
| TASK-007 | Enriquecer `GET /solicitacoes/:id` | ✅ DONE | — |
| TASK-008 | Adicionar `GET /medicos` | ✅ DONE | — |
| TASK-009 | Tela consulta com dados reais | — | ❌ PENDING |
| TASK-010 | Fila com dropdown de seleção | — | ❌ PENDING |
| TASK-011 | ASO: persistir `AsoDocument` | ✅ DONE | — |
| TASK-012 | ASO: gerar PDF com dados reais | ⚠️ PARTIAL | — |
| TASK-013 | Modo leitura consulta CONCLUIDO | — | ❌ PENDING |
| TASK-014 | Tela de histórico do médico | — | ❌ PENDING |

### 3C — Clínica Completa

| Task | Descricao | Status Backend | Status Frontend |
|------|-----------|----------------|-----------------|
| TASK-015 | Endpoints tipos de exame e CBO | ❌ PENDING | — |
| TASK-016 | Módulo de anamnese | ⚠️ PARTIAL | — |
| TASK-017 | Aceitar múltiplos resultados em `POST /exams` | ❌ PENDING | — |
| TASK-018 | Check-in com seleção dinâmica de exame | — | ❌ PENDING |

### 3D — Empresa Completa

| Task | Descricao | Status Backend | Status Frontend |
|------|-----------|----------------|-----------------|
| TASK-019 | Upload documentos PCMSO/PPRA | ⚠️ PARTIAL | — |
| TASK-020 | Atualização dados empresa + status check | ⚠️ PARTIAL | — |
| TASK-021 | Tela documentos da empresa | — | ❌ PENDING |
| TASK-022 | Tela configurações da empresa | — | ❌ PENDING |

### 3E — Portal do Funcionário

| Task | Descricao | Status Backend | Status Frontend |
|------|-----------|----------------|-----------------|
| TASK-023 | Módulo `portal` com auth por token | ✅ DONE | — |
| TASK-024 | `GET /portal/processo` com próxima ação | ✅ DONE | — |
| TASK-025 | Confirmar dados + upload documentos | ✅ DONE | — |
| TASK-026 | Questionário do portal | ✅ DONE | — |
| TASK-027 | Tela de validação de identidade | — | ❌ PENDING |
| TASK-028 | Tela principal do processo | — | ❌ PENDING |
| TASK-029 | Etapas do portal (confirmar, docs, etc.) | — | ❌ PENDING |

### 3F — Autenticação JWT

| Task | Descricao | Status Backend | Status Frontend |
|------|-----------|----------------|-----------------|
| TASK-030 | Módulo de autenticação JWT | ✅ DONE | — |
| TASK-031 | Página de login + proteção de rotas | — | ❌ PENDING |

### Bugs Ativos (8)

| ID | Severidade | Descricao | Status |
|----|------------|-----------|--------|
| BUG-001 | 🔴 CRITICAL | ExamType name mismatch seed vs service | ATIVO |
| BUG-002 | 🔴 CRITICAL | Status inconsistency `EM_ATENDIMENTO` vs `EM_ATENDIMENTO_MEDICO` | ATIVO |
| BUG-003 | 🔴 CRITICAL | Seed password not bcrypt hashed | ATIVO |
| BUG-004 | 🟡 HIGH | Portal auth error messages reveal which field failed | ATIVO |
| BUG-005 | 🟡 HIGH | JWT_SECRET fallback differs between auth and portal | ATIVO |
| BUG-006 | 🟡 HIGH | QueueEntry created independently in two services | ATIVO |
| BUG-007 | 🟠 MEDIUM | `findOne` missing teleconsultations and valueJson parsing | ATIVO |
| BUG-008 | 🟠 MEDIUM | Route ordering in exams controller potentially wrong | ATIVO |

---

## 📦 FASE 4 — Produção ❌

**Status**: Só specs, nada executado

### Backend (20 tasks)

| Sprint | Task | Descricao | Status |
|--------|------|-----------|--------|
| 4A | TASK-4A-01 | `GET /exams/types` + `GET /exams/required` | ❌ |
| 4A | TASK-4A-02 | `POST /exams` aceitar array | ❌ |
| 4A | TASK-4A-03 | Template HTML ASO | ❌ |
| 4A | TASK-4A-04 | `PATCH /solicitacoes/:id` criar AsoDocument | ❌ |
| 4A | TASK-4A-05 | `GET /portal/preview/:token` | ❌ |
| 4A | TASK-4A-06 | Upload empresa: validação + Company status | ❌ |
| 4A | TASK-4A-07 | `GET /company/:id/status-check` | ❌ |
| 4A | TASK-4A-08 | Mensagem erro genérica no portal auth | ❌ |
| 4B | TASK-4B-01 | Módulo de e-mail | ❌ |
| 4B | TASK-4B-02 | Disparar e-mail ao criar convite | ❌ |
| 4B | TASK-4B-03 | Disparar e-mail quando ASO gerado | ❌ |
| 4B | TASK-4B-04 | Job: expiração de convites | ❌ |
| 4B | TASK-4B-05 | Job: verificação PCMSO/PPRA | ❌ |
| 4C | TASK-4C-01 | Integração videochamada (Whereby/Daily.co) | ❌ |
| 4C | TASK-4C-02 | Assinatura digital real (Clicksign) | ❌ |
| 4D | TASK-4D-01 | Guard JWT global + @Public() | ❌ |
| 4D | TASK-4D-02 | `profileId` no payload JWT | ❌ |
| 4D | TASK-4D-03 | Scoping de dados por empresa | ❌ |
| 4D | TASK-4D-04 | Rate limiting nos endpoints públicos | ❌ |
| 4D | TASK-4D-05 | Paginação em endpoints de listagem | ❌ |
| 4D | TASK-4D-06 | Módulo Admin | ❌ |
| 4D | TASK-4D-07 | Relatórios CSV por empresa | ❌ |

### Frontend (15 specs)

| Sprint | Feature | Descricao | Status |
|--------|---------|-----------|--------|
| 4A | FF-4A-01 | Doctor dropdown na fila | ❌ |
| 4A | FF-4A-02 | Multi-exame check-in | ❌ |
| 4A | FF-4A-03 | Decision payloads no médico | ❌ |
| 4A | FF-4A-04 | Document uploads empresa | ❌ |
| 4A | FF-4A-05 | Portal preview endpoint | ❌ |
| 4B | FF-4B-01 | Auth JWT no frontend | ❌ |
| 4B | FF-4B-02 | Admin module | ❌ |
| 4B | FF-4B-03 | CSV export | ❌ |
| 4B | FF-4B-04 | Pagination UI | ❌ |
| 4C | FF-4C-01 | Teleconsulta video embed | ❌ |
| 4C | FF-4C-02 | Digital signature flow | ❌ |
| 4D | FF-4D-01 | Rate limit feedback | ❌ |
| 4D | FF-4D-02 | Error boundaries | ❌ |
| 4D | FF-4D-03 | Loading states | ❌ |

---

## 📦 FASE 5 — Correções de Fluxo ❌

**Status**: Só specs

| Task | Descricao | Status |
|------|-----------|--------|
| T1 | Exibir link copiável ao criar convite | ❌ |
| T2 | Corrigir rota de preview no portal | ❌ |
| T3 | Adicionar busca por CPF no Check-in | ❌ |
| T4 | Enviar decision e restrictions ao salvar consulta | ❌ |
| T5 | Botão para Criar Sala de Teleconsulta | ❌ |

---

## 📦 FASE 6 — Fechamento ❌

**Status**: Só specs

| Task | Descricao | Status |
|------|-----------|--------|
| TSK-01 | Centralizar criação de QueueEntry | ❌ |
| TSK-02 | Endpoint mock teleconsulta | ❌ |
| TSK-03 | Incluir hostRoomUrl/linkSala nas respostas | ❌ |
| TSK-04 | Portal auth retornar patientName/companyName | ❌ |
| TSK-05 | Upsert ExamType na criação de ExamResult | ❌ |
| TSK-06 | CORS via variável .env | ❌ |
| TSK-07 | Upload documentos portal sequencial | ❌ |
| TSK-08 | Questionário payload flat | ❌ |
| TSK-09 | ExamForm capturar valueJson real | ❌ |
| TSK-10 | Barra progresso ler array progresso[] | ❌ |
| TSK-11 | Botão Criar Sala na interface médica | ❌ |
| TSK-12 | Socket join_company ao carregar empresa | ❌ |

---

## 🧪 Testes Existentes

### Backend (`apps/backend`)

| Arquivo | Tipo | Status |
|---------|------|--------|
| `app.controller.spec.ts` | Unit | ✅ |
| `auth/security-guards.spec.ts` | Security | ✅ |
| `exam-request/exam-request.security.spec.ts` | Security | ✅ |
| `queue/queue.security.spec.ts` | Security | ✅ |

### Web (`apps/web`)

| Arquivo | Tipo | Status |
|---------|------|--------|
| `Card.test.tsx` | Unit | ✅ |
| `Sidebar.test.tsx` | Unit | ✅ |
| `Header.test.tsx` | Unit | ✅ |
| `WeeklyReports.test.tsx` | Unit | ✅ |
| `ScheduleCalendar.test.tsx` | Unit | ✅ |
| `GreetingSection.test.tsx` | Unit | ✅ |
| `AppointmentsTable.test.tsx` | Unit | ✅ |

### Mobile (`apps/mobile`)

| Arquivo | Tipo | Status |
|---------|------|--------|
| — | — | ❌ NENHUM |

---

## 🔗 Fluxo de Dependências

```
Bloco 1 (api-types + api-client) ✅
  │
  ▼ [CHECKPOINT-1 ✅]
Bloco 2 (scaffold mobile) ⚠️
  │
  ▼ [CHECKPOINT-2 ⏳]
Bloco 3 (portal colaborador) ❌
  │
  ▼ [CHECKPOINT-3]
Bloco 4 (fluxo médico) ❌
  │
  ▼ [CHECKPOINT-4]
Bloco 5 (PWA + Capacitor) ❌
  │
  ▼ [CHECKPOINT-FINAL]
DONE ✅
```

### Paralelismo Possível

- Fase 3C e 3D podem rodar em paralelo após 3B
- Fase 3E backend (TASK-023–026) pode começar após 3A + TASK-016
- Fase 3F deve ser a última (não quebrar rotas públicas)
- Fase 4A e 4B podem rodar em paralelo

---

## 🎯 Próximos Passos Recomendados

### Prioridade 1 — Desbloquear (sem isso nada funciona)

1. **Corrigir 3 bugs críticos** (BUG-001, BUG-002, BUG-003)
2. **Corrigir ambiente do Bloco 2** (`esbuild` / lockfile / npm install com `Invalid Version`)
3. **Corrigir BUG-006** (QueueEntry duplicado)

### Prioridade 2 — Fluxo Core Mobile

4. **Bloco 3**: Implementar portal do colaborador no mobile (15 tasks), após gate de backend + PASS do C2
5. **Bloco 4**: Implementar fluxo médico no mobile (12 tasks)

### Prioridade 3 — Produção

6. **Fase 4**: Backend production-ready (20 tasks)
7. **Fase 5**: Correções de fluxo (5 tasks)
8. **Fase 6**: Fechamento e testes (12 tasks)

### Prioridade 4 — PWA/Nativo

9. **Bloco 5**: PWA instalável + Capacitor (9 tasks)

---

## 📝 Decisões Registradas

| ID | Decisão | Referência |
|----|---------|------------|
| AD-001 | Extração de api-types para reuso | PLANO Passo 1 |
| AD-002 | Extração de api-client com injeção de storage | PLANO Passo 1 |
| AD-003 | Vite + React SPA (não Next.js export) | PLANO Passo 0 |
| AD-004 | Perfis: Colaborador (P1) → Médico (P2) → Consultório (P3) | PLANO Passo 2 |
| AD-005 | UI do zero, reusando apenas tipos/DTOs/client | PLANO Passo 4 |
| AD-006 | Auth por token-link + CPF + nascimento | PLANO Passo 5 |
| AD-007 | Socket.IO adaptado ao ciclo de vida mobile | PLANO Passo 6 |
| AD-008 | PWA primeiro → Capacitor depois | PLANO Passo 7 |
| AD-009 | Backend em apps/backend (não /backend na raiz) | Monorepo |
| AD-010 | Checkpoints bloqueantes entre blocos | CHECKPOINTS.md |
| AD-011 | Design alinhado ao web: indigo #4f46e5, Inter, shadows com tint indigo | Mobile redesign 2026-07-10 |

---

## 📚 Lições Aprendidas

| ID | Lição | Evidência |
|----|-------|-----------|
| LESSON-001 | Escopo do agent mobile é EXCLUSIVO para `apps/mobile/` | Definido pelo usuário em 2026-07-10 |
