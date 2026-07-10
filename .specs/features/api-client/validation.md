# API Client — Validation (CHECKPOINT-1)

> **Revisor**: `code-archaeologist`
> **Status**: RESOLVIDO
> **Veredito**: PASS (após correção de C1.7)

## Critérios

| ID | Critério | Resultado | Evidência |
|----|----------|-----------|-----------|
| C1.3 | `packages/api-client` exporta wrapper fetch + injeção de storage | PASS | `ApiClient` class em `client.ts:10-69`, `StorageAdapter` interface em `storage/types.ts:1-5` |
| C1.4 | `web` migra para `@repo/api-client` sem quebrar | PASS | Ambos `app/lib/api.ts` e `lib/api.ts` reescritos. 28+ import sites preservados. 0 erros novos em tsc |
| C1.5 | `useQueue` extraído sem perder eventos | PASS | 4 eventos preservados em `socket.ts:50-56`: queue_update, doctor_status, teleconsulta_iniciada, doctor_viewing_patient. Lazy import e cleanup preservados |
| C1.6 | Storage abstraído via interface | PASS | `StorageAdapter` interface. `LocalStorageAdapter` (web). `createCapacitorStorageAdapter()` (mobile, lazy Capacitor) |
| C1.7 | Commit atômico por task | PASS | Commit `b4a3145`: 11 arquivos criados (packages/api-client) |
| C1.8 | Sem `console.log` em código novo | PASS | Apenas `console.warn` (401 handler) e `console.info` (socket fallback) — ambos operacionais |

## Spec-Anchored Outcome Check
| AC ID | Resultado | Evidência |
|-------|-----------|-----------|
| REQ-API-CLIENT-001 | PASS | `client.ts:19-25`: getAuthHeaders() lê token de storage injetado |
| REQ-API-CLIENT-002 | PASS | `client.ts:34-37`: 401 limpa storage e retorna shape vazio |
| REQ-API-CLIENT-003 | PASS | `client.ts:40-42`: non-ok lança Error com mensagem do body |
| REQ-API-CLIENT-004 | PASS | `config.ts:1-14`: lê VITE_, NEXT_PUBLIC_, process.env |
| REQ-API-CLIENT-005 | PASS | `socket.ts:35-40`: socket com auth do storage injetado |
| REQ-API-CLIENT-006 | PASS | `socket.ts:52-56`: queue_update → ENQUEUED |
| REQ-API-CLIENT-007 | PASS | `socket.ts:67-71`: cleanup via cancelled flag + disconnect |
| REQ-API-CLIENT-008 | PASS | `socket.ts:60-62`: catch graceful sem crash |
| REQ-API-CLIENT-009 | PASS | `storage/types.ts:1-5`: StorageAdapter interface |
| REQ-API-CLIENT-010 | PASS | `storage/localStorage.ts:3-18`: LocalStorageAdapter com SSR guards |
| REQ-API-CLIENT-011 | PASS | `storage/capacitor.ts:12-57`: lazy Capacitor import + localStorage fallback |

## Gaps corrigidos
- C1.7 (commits atômicos) — corrigido com commit `b4a3145`
- localStorage bypass em apiValidateInvite — corrigido via `apiClient.getAuthToken()`
- Config.ts fragility — simplificado para process.env padrão

## Discrimination Sensor
| Fault injetado | Teste detectou? | Resultado |
|----------------|-----------------|-----------|
| Remover StorageAdapter import | Sim | tsc falha |
| Alterar EVENT_MAP (remover queue_update) | Parcial | Mapeia para fallback ENQUEUED via `?? 'ENQUEUED'` |
| Remover 'use client' de api.ts | Não | Erro SSR em runtime, não por tsc |
| Quebrar StorageAdapter interface | Sim | Adapters falham tsc |

## Verdict
- [x] PASS
