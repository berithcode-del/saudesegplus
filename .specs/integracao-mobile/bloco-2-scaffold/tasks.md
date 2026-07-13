# Mobile Scaffold — Tasks

> **Bloco**: 2
> **Checkpoint**: C2 (ver `.specs/CHECKPOINTS.md`)
> **Revisor**: `frontend-specialist`
> **Bloqueante**: Sim — C2 deve PASSAR antes do Bloco 3
> **Depende de**: CHECKPOINT-1 PASS (Bloco 1)

## Tasks

### TASK-MOBILE-SCAFFOLD-001: Criar projeto Vite + React
- [x] Criar `apps/mobile` em Vite + React (workspace já materializado)
- [x] Configurar `package.json`: name `mobile`, deps `@repo/ui`, `@repo/api-client`, `@repo/api-types`
- [x] Garantir registro do app no workspace atual
- **Verificação**: `npm ls --workspace mobile --depth=0`
- **Commit**: `feat(mobile): scaffold Vite + React project`

### TASK-MOBILE-SCAFFOLD-002: Configurar `vite.config.ts`
- [x] `server.host: true` e `server.port: 5173`
- [x] Alias `@` → `src/`
- [x] Plugin React
- **Verificação**: `npm run dev --workspace mobile` sobe em `0.0.0.0:5173`
- **Commit**: `feat(mobile): configure vite for LAN dev`

### TASK-MOBILE-SCAFFOLD-003: Criar estrutura de pastas
- [x] `src/app/` (bootstrap, providers, router)
- [x] `src/routes/portal/[token]/` (questionario, teleconsulta, documentos, confirmar, processo, aso)
- [x] `src/routes/medico/` (fila, consulta/[id], historico)
- [x] `src/routes/consultorio/` (check-in placeholder)
- [x] `src/components/` (mobile-first)
- [x] `src/hooks/` (useQueue, useAuthToken, useCamera, useOfflineQueue)
- [x] `src/lib/` (storage scaffold criado; push/deep-link seguem para blocos seguintes)
- **Verificação**: Estrutura criada
- **Commit**: `feat(mobile): create directory structure`

### TASK-MOBILE-SCAFFOLD-004: Configurar react-router
- [x] Rotas: `/`, `/p/:token/*` + alias `/portal/:token/*`, `/medico/*`, `/consultorio/*`
- [x] Layout para cada perfil
- [x] Placeholder pages para cada rota
- **Verificação**: Navegação entre rotas funciona
- **Commit**: `feat(mobile): setup react-router with profile routes`

### TASK-MOBILE-SCAFFOLD-005: Configurar providers (ApiClient + theme)
- [x] `AppProvider` que injeta `ApiClient` com adapter centralizado do mobile
- [x] Theme/tokens Material Design 3 via CSS variables
- [x] Fonte: Roboto (importar)
- **Verificação**: `ApiClient` disponível via context + tema M3 aplicado
- **Commit**: `feat(mobile): add app providers and M3 theme`

### TASK-MOBILE-SCAFFOLD-006: Configurar viewport + viewport-fit
- [x] `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- [x] safe-area-insets no CSS
- **Verificação**: Não há notch overlap em dispositivo com notch
- **Commit**: `feat(mobile): add viewport meta and safe-area`

### TASK-MOBILE-SCAFFOLD-007: Criar `capacitor.config.ts`
- [x] Config básica (appId, appName, webDir: `dist`)
- [x] Sem build nativo ainda (preparação)
- **Verificação**: Arquivo válido
- **Commit**: `feat(mobile): add capacitor config stub`

### TASK-MOBILE-SCAFFOLD-008: Criar hooks placeholders
- [x] `useAuthToken` (wrapper de storage adapter)
- [x] `useOfflineQueue` (placeholder)
- [x] `useCamera` (placeholder para Capacitor Camera)
- **Verificação**: Hooks exportam sem erro
- **Commit**: `feat(mobile): add placeholder hooks`

### TASK-MOBILE-SCAFFOLD-009: Configurar `.env` e documentação README
- [x] `.env.example` com `VITE_BACKEND_URL`
- [x] `apps/mobile/README.md` com passo a passo de dev em dispositivo físico (LAN)
- **Verificação**: README legível
- **Commit**: `docs(mobile): add README and env example`

---
**Situação atual**: pronto para CHECKPOINT-2, com bloqueio remanescente apenas no bundling (`esbuild` ausente no workspace).
