# API Client Specification

## Problem Statement
Eliminar a duplicação da camada HTTP entre `web` (hoje em `apps/web/app/lib/api.ts`) e o futuro `mobile`. Centralizar wrapper `fetch` com `Authorization: Bearer`, tratamento de erros padronizado, e hooks de Socket.IO (`useQueue`) em `packages/api-client`, com injeção de dependência para storage (`localStorage` no web, `Capacitor Preferences` no mobile).

## Goals
- [ ] `packages/api-client` existe e exporta `apiFetch`, `useQueue`, helpers de auth
- [ ] Storage abstraído via interface (`StorageAdapter`) — não hardcode de `localStorage`
- [ ] `web` migra para `@repo/api-client` sem quebrar funcionalidades (CRITÉRIO BLOQUEANTE)
- [ ] Base URL configurável por env (`NEXT_PUBLIC_BACKEND_URL` no web, `VITE_BACKEND_URL` no mobile)

## Out of Scope
| Feature | Reason |
|---------|--------|
| Geração automática de client via OpenAPI | Escopo futuro (Passo 1 menciona `openapi-typescript`) |
| Validação runtime com `zod` | Escopo de `api-types` |

---

## Assumptions & Open Questions
| Assumption / decision | Chosen default | Rationale | Confirmed? |
|-----------------------|----------------|-----------|-----------|
| Storage via injeção de dependência | `StorageAdapter` interface | Mobile usa `Capacitor Preferences`, web usa `localStorage` | y |
| `useQueue` extrato puro (sem SSR) | Hook React genérico | Mobile não tem SSR | y |
| Base URL por env var | Sim, configurável | Evita hardcode de URL de produção | y |

---

## User Stories

### P1: Wrapper HTTP Genérico ⭐ MVP
**User Story**: Como desenvolvedor, quero um wrapper `fetch` com auth e tratamento de erros padronizado, para que `web` e `mobile` compartilhem a mesma camada HTTP.

**Acceptance Criteria**:
1. WHEN `apiFetch(path, options)` é chamado THEN adiciona `Authorization: Bearer <token>` do storage injetado
2. WHEN response é 401 THEN limpa token do storage e retorna shape vazio (compat com comportamento atual)
3. WHEN response não é ok THEN lança `Error` com mensagem do body
4. WHEN base URL é configurada por env THEN usa-a para paths relativos

**Independent Test**: Mock de fetch + storage, verificar headers e tratamento de 401.

### P2: Socket.IO Hook Extraído
**User Story**: Como desenvolvedor, quero `useQueue` extraído para `@repo/api-client` para reuso mobile.

**Acceptance Criteria**:
1. WHEN `useQueue()` é chamado THEN conecta via Socket.IO com auth do storage injetado
2. WHEN socket recebe `queue_update` THEN adiciona evento à lista
3. WHEN componente desmonta THEN desconecta socket
4. WHEN socket.io-client não está disponível THEN fallback graceful (não crash)

**Independent Test**: Mock de socket.io-client, verificar eventos e cleanup.

### P3: Storage Abstraído
**User Story**: Como desenvolvedor mobile, quero injetar `Capacitor Preferences` como storage sem mudar o `api-client`.

**Acceptance Criteria**:
1. WHEN `StorageAdapter` interface é definida THEN tem `getItem`, `setItem`, `removeItem`
2. WHEN web usa `api-client` THEN injeta `LocalStorageAdapter`
3. WHEN mobile usa `api-client` THEN injeta `CapacitorPreferencesAdapter`

**Independent Test**: Mock de adapter, verificar chamadas.

---

## Edge Cases
- WHEN `window` é undefined (SSR no web) THEN storage adapter retorna null graceful
- WHEN token é malformado THEN `getProfileIdFromToken` retorna null (não crash)

---

## Requirement Traceability
| Requirement ID | Story | Phase | Status |
|----------------|-------|-------|--------|
| REQ-API-CLIENT-001 | P1: Wrapper HTTP | Specify | Pending |
| REQ-API-CLIENT-002 | P1: Wrapper HTTP | - | Pending |
| REQ-API-CLIENT-003 | P1: Wrapper HTTP | - | Pending |
| REQ-API-CLIENT-004 | P1: Wrapper HTTP | - | Pending |
| REQ-API-CLIENT-005 | P2: Socket.IO | - | Pending |
| REQ-API-CLIENT-006 | P2: Socket.IO | - | Pending |
| REQ-API-CLIENT-007 | P2: Socket.IO | - | Pending |
| REQ-API-CLIENT-008 | P2: Socket.IO | - | Pending |
| REQ-API-CLIENT-009 | P3: Storage | - | Pending |
| REQ-API-CLIENT-010 | P3: Storage | - | Pending |
| REQ-API-CLIENT-011 | P3: Storage | - | Pending |

**IDs format**: `REQ-API-CLIENT-NNN`

---

## Success Criteria
- [ ] `web` migra para `@repo/api-client` sem quebrar funcionalidades
- [ ] `packages/api-client` exporta `apiFetch`, `useQueue`, `StorageAdapter`
- [ ] Storage é injetado (não hardcoded)
