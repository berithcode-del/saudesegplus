# STATE.md — Plano App Mobile SaudeSegPlus

## Decisions

<!-- Format: AD-NNN: Descrição (Referência: arquivo/commit) -->

- **AD-001**: Extração de `packages/api-types` (DTOs e enums) para reuso entre `web` e `mobile`. (Ref: PLANO Passo 1, `.specs/features/api-types/spec.md`)
- **AD-002**: Extração de `packages/api-client` (HTTP + Socket.IO) com injeção de dependência de storage. (Ref: PLANO Passo 1, `.specs/features/api-client/spec.md`)
- **AD-003**: Stack escolhida: **Vite + React SPA** (não Next.js `output: export`) — boot menor, fricção nativa menor com Capacitor. (Ref: PLANO Passo 0 decisão)
- **AD-004**: Priorização de perfis mobile: **Colaborador (P1) → Médico (P2) → Consultório (P3)**. Admin/Operador/Empresa fora do escopo mobile. (Ref: PLANO Passo 2)
- **AD-005**: UI construída do zero (não port do web), reusando apenas tipos/DTOs/client HTTP. (Ref: PLANO Passo 4)
- **AD-006**: Auth colaborador por token-link + CPF + nascimento, persistido via abstração de storage (`Capacitor Preferences` pronto). (Ref: PLANO Passo 5)
- **AD-007**: Socket.IO adaptado ao ciclo de vida mobile: reconexão em `visibilitychange`/`resume`, Web Push como PWA. (Ref: PLANO Passo 6)
- **AD-008**: Distribuição faseada: PWA primeiro (M4) → Capacitor quando push/câmera nativa forem requisito duro (M5). Sem Expo/RN. (Ref: PLANO Passo 7)
- **AD-009**: Backend está em `apps/backend` (não `/backend` na raiz). Monorepo usa apps/web, apps/mobile, apps/backend + packages/@repo/*.
- **AD-010**: Checkpoints **bloqueantes** entre blocos de tasks: agente revisor designado deve aprovar (PASS) antes de avançar ao próximo bloco. Falha bloqueia progressão. (Ref: `.specs/CHECKPOINTS.md`)
- **AD-011**: Mobile target: **Android** (PWA-first, Material Design 3, Roboto, touch targets ≥ 48dp). (Ref: skill mobile-design, platform-android.md)

## Handoff

<!-- Format: FEAT-NNN: [status] Descrição (Branch: <branch>, Commit: <hash>) -->

- **FEAT-001**: [completed] api-types — extração de DTOs/enums (Branch: `main`, Commit: `d66bdcb`)
- **FEAT-002**: [completed] api-client — wrapper HTTP + Socket.IO + injeção de storage (Branch: `main`, Commit: `b4a3145`)
- **FEAT-003**: [completed] web migration — refatoração para @repo/api-client (Branch: `main`, Commit: `7f39358`)
- **FEAT-004**: [pending] mobile-scaffold — Vite + React + estrutura de pastas + router (código e validações estruturais concluídos; ambiente em correção após lockfile inconsistente no workspace web) (Branch: `feat/mobile-scaffold`, Commit: —)
- **FEAT-005**: [in-progress] portal-flow — fluxo Colaborador `/p/:token/*` completo (Branch: `feat/portal-flow`, Commit: —)
- **FEAT-006**: [in-progress] doctor-flow — fluxo Médico: fila, consulta ativa, histórico (Branch: `feat/doctor-flow`, Commit: —)
- **FEAT-007**: [pending] pwa-capacitor — PWA instalável + preparação Capacitor (Branch: `feat/pwa-capacitor`, Commit: —)

## Active Block

<!-- Qual bloco está em execução agora -->

- Bloco atual: **Bloco 3 — Portal do Colaborador** → **EM IMPLEMENTAÇÃO (~80% código pronto)**
- CHECKPOINT-1: **PASS** (ver `validation.md` de api-types e api-client)
- Bloqueio atual: instalação do npm ainda instável no Windows após correção da causa raiz inicial (`package-lock.json` com entrada vazia de `@heroicons/react` + hoist local em `apps/web/.npmrc`)
- Tasks concluídas: 14/15 (faltam testes E2E)
- Próximo passo: estabilizar instalação limpa do workspace, confirmar `npm run build --workspace mobile`, depois retomar E2E e CHECKPOINT-3
