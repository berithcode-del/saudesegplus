# CHECKPOINTS.md — Pontos de Checagem Bloqueantes

> **REGRA DE OURO**: Nenhum bloco avança para o próximo sem PASS do revisor designado. Falha = bloqueio.
> O revisor é um agente independente (author ≠ verifier). Documenta veredito em `validation.md` da feature.

## Visão Geral dos Blocos

```
Bloco 1: Reuso de Pacotes (api-types + api-client)
   │
   ▼ [CHECKPOINT-1 — BLOQUEANTE]
Bloco 2: Scaffold Mobile (Vite + React + router)
   │
   ▼ [CHECKPOINT-2 — BLOQUEANTE]
Bloco 3: Fluxo Colaborador (portal-flow /p/:token/*)
   │
   ▼ [CHECKPOINT-3 — BLOQUEANTE]
Bloco 4: Fluxo Médico (doctor-flow: fila + consulta)
   │
   ▼ [CHECKPOINT-4 — BLOQUEANTE]
Bloco 5: PWA + Capacitor (instalável + preparação nativa)
   │
   ▼ [CHECKPOINT-FINAL — BLOQUEANTE]
DONE: App Mobile pronto
```

---

## CHECKPOINT-1: Reuso de Pacotes (Breque entre Bloco 1 → Bloco 2)

**Bloco**: 1 (api-types + api-client)
**Revisor designado**: `code-archaeologist` (agente especialista em refatoração/legado)

### Critérios de Aprovação (todos devem PASS)

| ID | Critério | Como verificar | Blocking? |
|----|----------|----------------|-----------|
| C1.1 | `packages/api-types` existe e exporta tipos de auth, colaborador, medicos, portal, teleconsultation, aso, anamnese | `tsc --noEmit` em packages/api-types | YES |
| C1.2 | `web` consome `@repo/api-types` sem erros de compilação | `pnpm --filter web build` passa | YES |
| C1.3 | `packages/api-client` existe com wrapper fetch genérico + injeção de storage | Revisão de código do revisor | YES |
| C1.4 | `apiFetch` do web migra para `@repo/api-client` sem quebrar funcionalidades | `pnpm --filter web build` + smoke test manual | YES |
| C1.5 | `useQueue` extraído para `@repo/api-client` sem perder eventos | Revisão de código + teste de socket | YES |
| C1.6 | Storage abstraído via interface (não hardcoded `localStorage`) | Revisão de código do revisor | YES |
| C1.7 | Commit atômico por task no bloco (um commit por task) | `git log --oneline` | YES |
| C1.8 | Nenhum `console.log` de debug deixado | `grep -r "console.log"` em código novo | YES |

### Output do Revisor

O revisor deve preencher `.specs/features/api-client/validation.md` com:
- Veredito: PASS / FAIL
- Evidência por critério (C1.1 a C1.8)
- Gaps identificados (se FAIL → viram tasks de correção)
- Sensor de discriminação: injetar 1 fault em scratch state, confirmar que testes detectam

**Se FAIL**: Bloco 2 NÃO inicia. Tasks de correção são criadas e executadas antes de re-verificação.

---

## CHECKPOINT-2: Scaffold Mobile (Breque entre Bloco 2 → Bloco 3)

**Bloco**: 2 (mobile-scaffold)
**Revisor designado**: `frontend-specialist` (arquiteto React)

### Critérios de Aprovação

| ID | Critério | Como verificar | Blocking? |
|----|----------|----------------|-----------|
| C2.1 | `apps/mobile` existe com estrutura: src/app, src/routes, src/components, src/hooks, src/lib | Estrutura de pastas verificada | YES |
| C2.2 | Vite configurado com `server.host: true` (LAN para dispositivo real) | `vite.config.ts` | YES |
| C2.3 | `react-router` configurado com rotas `/p/:token/*` (com alias `/portal/:token/*`) e `/medico/*` | Smoke test de rotas | YES |
| C2.4 | `apps/mobile` consome `@repo/ui`, `@repo/api-client`, `@repo/api-types` | `package.json` + `npm ls --workspace mobile --depth=0` | YES |
| C2.5 | `npm run build --workspace mobile` passa sem erros | CI | NO |
| C2.6 | `capacitor.config.ts` criado (mesmo sem build nativo no início) | Arquivo existe | YES |
| C2.7 | Touch audit: botões/links ≥ 48px em telas existentes | `node scripts/mobile_audit.mjs apps/mobile` | YES |
| C2.8 | Commit atômico por task | `git log --oneline` | YES |

**Se FAIL**: Bloco 3 NÃO inicia.

### Observação Operacional

- Se C2.5 falhar por dependência ausente de bundling (`esbuild`) ou lockfile inconsistente, tratar como bloqueio de ambiente. O scaffold só recebe PASS final depois que o workspace voltar a instalar e buildar corretamente.
- Diagnóstico atual: `package-lock.json` tinha entrada vazia para `apps/web/node_modules/@heroicons/react` e `apps/web/.npmrc` usava hoist local incompatível com o fluxo atual de `npm`.

---

## CHECKPOINT-3: Fluxo Colaborador (Breque entre Bloco 3 → Bloco 4)

**Bloco**: 3 (portal-flow)
**Revisor designado**: `test-engineer` (pirâmide de testes)

### Critérios de Aprovação

| ID | Critério | Como verificar | Blocking? |
|----|----------|----------------|-----------|
| C3.1 | Tela `/p/:token` valida token via `@repo/api-client` | Teste de integração | YES |
| C3.2 | Fluxo completo: token → confirmar → questionário → documentos → teleconsulta → ASO | E2E em dispositivo real | YES |
| C3.3 | Questionário NR-07 em etapas (wizard 1/N) com rascunho local (IndexedDB/localforage) | Revisão de código + teste offline | YES |
| C3.4 | Câmera nativa (não `<input type="file">`) com preview e reenvio | Revisão de código | YES |
| C3.5 | Indicador de conexão persistente (Socket.IO status visível) | Revisão de UI | YES |
| C3.6 | Touch targets ≥ 48px, CTAs em thumb zone, Material Design 3 | `mobile_audit.py` | YES |
| C3.7 | Erros amigáveis mobile ("sem conexão, salvo localmente") | Revisão de UX | YES |
| C3.8 | Consentimento LGPD explícito antes de câmera/documentos | Revisão de tela | YES |
| C3.9 | Testes: unit (hooks) + integration (fluxo) + E2E (smoke) | Cobertura ≥ 80% do fluxo | YES |
| C3.10 | Commit atômico por task | `git log --oneline` | YES |

**Se FAIL**: Bloco 4 NÃO inicia.

---

## CHECKPOINT-4: Fluxo Médico (Breque entre Bloco 4 → Bloco 5)

**Bloco**: 4 (doctor-flow)
**Revisor designado**: `security-auditor` + `test-engineer`

### Critérios de Aprovação

| ID | Critério | Como verificar | Blocking? |
|----|----------|----------------|-----------|
| C4.1 | Fila de atendimento carrega via Socket.IO (`useQueue`) com reconexão em background | Teste de ciclo de vida mobile | YES |
| C4.2 | Lista da fila otimizada (FlatList-equivalente / virtualização + React.memo) | Revisão de performance | YES |
| C4.3 | Pull-to-refresh funcional | Teste em dispositivo | YES |
| C4.4 | Consulta ativa com card lateral do motor clínico (exames) na mesma aba | Revisão de UI | YES |
| C4.5 | Botão "Finalizar consulta" fixo em thumb zone | `mobile_audit.py` | YES |
| C4.6 | PIN de reentrada rápida (não substitui JWT, só UX) | Revisão de segurança | YES |
| C4.7 | Tokens (JWT) em storage seguro (não `localStorage` cru) via abstração | Revisão de segurança | YES |
| C4.8 | Histórico de consultas com virtualização | Revisão de performance | YES |
| C4.9 | Testes: unit + integration + E2E do fluxo médico | Cobertura ≥ 80% | YES |
| C4.10 | Commit atômico por task | `git log` | YES |

**Se FAIL**: Bloco 5 NÃO inicia.

---

## CHECKPOINT-5: PWA + Capacitor (Breque entre Bloco 5 → DONE)

**Bloco**: 5 (pwa-capacitor)
**Revisor designado**: `devops-engineer` + `performance-optimizer`

### Critérios de Aprovação

| ID | Critério | Como verificar | Blocking? |
|----|----------|----------------|-----------|
| C5.1 | `manifest.json` válido (ícone, splash, theme, display standalone) | Lighthouse PWA audit | YES |
| C5.2 | Service worker registra e cacheia assets + questionário offline | Teste offline real (modo avião) | YES |
| C5.3 | Web Push funcional (Feliz path: inscrição + recepção) | Teste de push em Android | YES |
| C5.4 | `capacitor.config.ts` pronto para wrapper nativo (sem build ainda) | Revisão de config | YES |
| C5.5 | Lighthouse PWA score ≥ 90 | Lighthouse | YES |
| C5.6 | Lighthouse Performance score ≥ 80 em dispositivo mid-range | Lighthouse em/device | YES |
| C5.7 | README do `apps/mobile` documenta teste em dispositivo físico via LAN | Revisão de doc | YES |
| C5.8 | Commit atômico por task | `git log` | YES |

**Se FAIL**: DONE não declarado.

---

## CHECKPOINT-FINAL: Verificação Independente (Após Bloco 5)

**Revisor designado**: Verifier independente (agente novo, author ≠ verifier — regra TLC)

### Critérios

| ID | Critério | Como verificar | Blocking? |
|----|----------|----------------|-----------|
| CF.1 | Todos os checkpoints C1-C5 com PASS documentado em `validation.md` de cada feature | Revisão de todos os `validation.md` | YES |
| CF.2 | Spec-anchored outcome check: cada AC das specs tem evidência de teste | Revisão cruzada spec ↔ teste | YES |
| CF.3 | Sensor de discriminação: faults injetados em scratch state são detectados por testes | Mutação em scratch | YES |
| CF.4 | Sem `console.log` em código de produção | `grep` em build final | YES |
| CF.5 | Sem tokens/chaves hardcoded | `grep` + security audit | YES |
| CF.6 | `STATE.md` atualizado com todas as decisões e handoff | Revisão de doc | YES |
| CF.7 | `LESSONS.md` preenchido com lições aprendidas do projeto | Revisão de doc | YES |

**Se FAIL**: Correções necessárias antes de declarar DONE.

---

## Regras de Execução dos Checkpoints

1. **Bloqueio absoluto**: Nenhum bloco inicia sem PASS do checkpoint anterior. Sem exceções.
2. **Revisor independente**: O revisor não é quem implementou (author ≠ verifier).
3. **Evidência obrigatória**: Cada critério precisa de evidência (comando, arquivo, teste). "Acho que está bom" não conta.
4. **Documentação**: Veredito é escrito em `validation.md` da feature correspondente.
5. **Loop de correção**: FAIL → tasks de correção → re-verificação. Máximo 3 iterações antes de escalar.
6. **Lições**: Toda falha em checkpoint vira lição em `LESSONS.md` via `scripts/lessons.py`.
