# Mobile Scaffold Specification

## Problem Statement
Criar o scaffold do `apps/mobile` em Vite + React (SPA), preparando a estrutura de pastas, routing, providers, e configuração para desenvolvimento mobile-first (PWA-ready, Capacitor-ready). Não incluir telas funcionais ainda — apenas a fundação.

## Goals
- [ ] `apps/mobile` existe e builda com `npm run build --workspace mobile`
- [ ] Estrutura de pastas espelha PLANO-APP-MOBILE.md Passo 3
- [ ] `react-router` configurado com rotas `/p/:token/*` (com alias `/portal/:token/*`) e `/medico/*`
- [ ] `vite.config.ts` com `server.host: true` (LAN para dispositivo real)
- [ ] `capacitor.config.ts` criado (preparação, sem build nativo)
- [ ] Mobile Design attrs: Material Design 3, Roboto, touch targets ≥ 48dp

## Out of Scope
| Feature | Reason |
|---------|--------|
| Telas funcionais | Bloco 3+ |
| Service worker / PWA completo | Bloco 5 |
| Build nativo Capacitor | Bloco 5+ |

## Assumptions
| Assumption | Default | Rationale | Confirmed? |
|------------|---------|-----------|------------|
| Vite + React (SPA) | Sim | AD-003 | y |
| react-router v6+ | Sim | Padrão de mercado | y |
| Tailwind CSS | Sim | Igual ao web para reuso @repo/ui | y |
| Material Design 3 | Sim | AD-011, platform-android.md | y |

## User Stories

### P1: Scaffold + Build ⭐ MVP
**AC**:
1. WHEN `npm run dev --workspace mobile` THEN servidor sobe em `http://0.0.0.0:5173` (LAN)
2. WHEN `npm run build --workspace mobile` THEN builda sem erros
3. WHEN navegador acessa `/p/:token` THEN rota renderiza placeholder

### P2: Estrutura de Pastas
**AC**:
1. WHEN estrutura é criada THEN tem: src/app, src/routes/portal/[token], src/routes/medico, src/components, src/hooks, src/lib
2. WHEN `capacitor.config.ts` é criado THEN existe na raiz de apps/mobile

### P3: Providers + Theme
**AC**:
1. WHEN app inicializa THEN ApiClient provider injeta storage adapter
2. WHEN theme é aplicado THEN Material Design 3 (tokens de cor, tipografia Roboto)
3. WHEN viewport meta THEN tem `viewport-fit=cover` e `width=device-width`

## Requirement Traceability
| ID | Story | Status |
|----|-------|--------|
| REQ-MOBILE-SCAFFOLD-001 | P1: Scaffold | In review |
| REQ-MOBILE-SCAFFOLD-002 | P1: Build | Blocked (env) |
| REQ-MOBILE-SCAFFOLD-003 | P1: Rotas | In review |
| REQ-MOBILE-SCAFFOLD-004 | P2: Pastas | In review |
| REQ-MOBILE-SCAFFOLD-005 | P2: Capacitor config | In review |
| REQ-MOBILE-SCAFFOLD-006 | P3: ApiClient provider | In review |
| REQ-MOBILE-SCAFFOLD-007 | P3: M3 theme | In review |
| REQ-MOBILE-SCAFFOLD-008 | P3: Viewport meta | In review |
