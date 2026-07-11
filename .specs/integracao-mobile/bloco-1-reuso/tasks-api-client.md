# API Client — Tasks

> **Bloco**: 1 (Reuso de Pacotes)
> **Checkpoint**: C1 (ver `.specs/CHECKPOINTS.md`)
> **Revisor**: `code-archaeologist`
> **Bloqueante**: Sim — C1 deve PASSAR antes do Bloco 2

## Tasks

### TASK-API-CLIENT-001: Criar estrutura do `packages/api-client`
- [ ] Criar `packages/api-client/package.json` (name: `@repo/api-client`)
- [ ] Criar `packages/api-client/tsconfig.json` (extends `@repo/typescript-config`)
- [ ] Criar `packages/api-client/src/index.ts`
- [ ] Adicionar ao workspace (pnpm-workspace ou package.json root)
- **Verificação**: `pnpm install` passa e `@repo/api-client` resolve
- **Commit**: `feat(api-client): scaffold package structure`

### TASK-API-CLIENT-002: Implementar `StorageAdapter` interface + `LocalStorageAdapter`
- [ ] Criar `src/storage/types.ts` com interface `StorageAdapter`
- [ ] Criar `src/storage/localStorage.ts` com `LocalStorageAdapter`
- [ ] Métodos: `getItem`, `setItem`, `removeItem`
- **Verificação**: Teste unitário do adapter
- **Commit**: `feat(api-client): add StorageAdapter and LocalStorageAdapter`

### TASK-API-CLIENT-003: Implementar `config.ts` (base URL por env)
- [ ] Ler `NEXT_PUBLIC_BACKEND_URL` ou `VITE_BACKEND_URL`
- [ ] Fallback para localhost:3001 em dev
- [ ] Exportar `getBaseUrl()`
- **Verificação**: Teste unitário com mock de env
- **Commit**: `feat(api-client): add env-based base URL config`

### TASK-API-CLIENT-004: Implementar `apiFetch` (wrapper HTTP)
- [ ] Migrar lógica de `apps/web/app/lib/api.ts:87-109` (apiFetch)
- [ ] Usar `StorageAdapter` injetado para token
- [ ] Tratar 401 (limpa storage, retorna shape vazio)
- [ ] Tratar erro (lança Error com mensagem do body)
- **Verificação**: Teste unitário com mock de fetch + storage
- **Commit**: `feat(api-client): implement apiFetch wrapper with DI`

### TASK-API-CLIENT-005: Implementar `useQueue` hook (Socket.IO)
- [ ] Migrar lógica de `apps/web/app/lib/api.ts:12-61` (useQueue)
- [ ] Usar `StorageAdapter` injetado para token de auth
- [ ] Lazy-import de `socket.io-client`
- [ ] Cleanup no unmount
- **Verificação**: Teste unitário com mock de socket
- **Commit**: `feat(api-client): extract useQueue hook with DI`

### TASK-API-CLIENT-006: Implementar helpers de auth
- [ ] Migrar `getAuthToken` e `getProfileIdFromToken` (`api.ts:71-86`)
- [ ] Usar `StorageAdapter` injetado
- **Verificação**: Teste unitário
- **Commit**: `feat(api-client): add auth helpers with DI`

### TASK-API-CLIENT-007: Re-exportar endpoints de `api.ts` (thin re-export)
- [ ] Migrar `apiGetQueue`, `apiEnqueue`, `apiAcceptPatient`, `apiLogin`, etc.
- [ ] Usar `apiFetch` interno
- **Verificação**: Teste de regressão manual
- **Commit**: `feat(api-client): migrate endpoint helpers`

### TASK-API-CLIENT-008: Migrar `web` para `@repo/api-client`
- [ ] Em `apps/web`, criar `LocalStorageAdapter` e instanciar `ApiClient`
- [ ] Substituir imports de `./lib/api` por `@repo/api-client`
- [ ] Manter `app/lib/api.ts` como thin re-export durante transição
- **Verificação**: `pnpm --filter web build` passa + smoke test do web
- **Commit**: `refactor(web): migrate to @repo/api-client`

### TASK-API-CLIENT-009: Remover `app/lib/api.ts` (após migração completa)
- [ ] Confirmar que nenhum arquivo importa diretamente de `app/lib/api`
- [ ] Deletar `apps/web/app/lib/api.ts`
- **Verificação**: `pnpm --filter web build` passa sem warnings de import
- **Commit**: `refactor(web): remove deprecated api.ts`

---
**Após TASK-009**: Disparar revisor `code-archaeologist` para CHECKPOINT-1.
