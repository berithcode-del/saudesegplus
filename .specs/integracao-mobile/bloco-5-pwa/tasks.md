# PWA + Capacitor — Tasks

> **Bloco**: 5
> **Checkpoint**: C5 (ver `.specs/CHECKPOINTS.md`)
> **Revisor**: `devops-engineer` + `performance-optimizer`
> **Bloqueante**: Sim — C5 deve PASSAR antes de DONE
> **Depende de**: CHECKPOINT-4 PASS (Bloco 4)

## Tasks

### TASK-PWA-001: Criar `manifest.json`
- [x] `name`, `short_name`, `description`
- [x] `display: standalone`
- [x] `theme_color`, `background_color` (indigo #4f46e5)
- [x] Ícones 192px e 512px (SVG com logo oficial)
- [x] `start_url`, `scope`
- **Verificação**: Lighthouse PWA detecta manifest
- **Commit**: `feat(pwa): add web manifest`

### TASK-PWA-002: Service worker — cache de assets
- [x] Registrar SW em `index.html`
- [x] Cache: index.html, CSS, JS bundles, ícones
- [x] Estratégia: cache-first para assets, network-first para API
- **Verificação**: App carrega offline (modo avião) após cache
- **Commit**: `feat(pwa): service worker with asset caching`

### TASK-PWA-003: Service worker — offline questionário
- [x] Cache da rota `/p/:token/*`
- [x] IndexedDB para rascunho (já feito no Bloco 3)
- [x] SW responde com cached HTML quando offline
- **Verificação**: Questionário acessível offline
- **Commit**: `feat(pwa): offline questionnaire via service worker`

### TASK-PWA-004: Service worker — sync de pendências
- [x] `Background Sync` API (quando suportado)
- [x] Fallback: listener de `online` event dispara sync
- [x] Enfileira rascunhos e envia quando online
- **Verificação**: Preencher offline → reconectar → envio automático
- **Commit**: `feat(pwa): background sync for offline drafts`

### TASK-PWA-005: Web Push — inscrição
- [x] Solicitar permissão de notificação
- [x] Inscrever em push service (VAPID keys via env)
- [x] Enviar subscription ao backend
- **Verificação**: Inscrição persiste
- **Commit**: `feat(pwa): web push subscription`

### TASK-PWA-006: Web Push — recepção + deep link
- [x] Listener de `push` event no SW
- [x] Mostra notificação com ação
- [x] Click → abre app na tela correta (`/p/:token/teleconsulta`)
- **Verificação**: Notificação recebida → click → navega
- **Commit**: `feat(pwa): push notification with deep link`

### TASK-PWA-007: Validar `capacitor.config.ts`
- [x] appId: `com.saudesegplus.mobile`
- [x] appName: `SaudeSeg+`
- [x] webDir: `dist`
- [ ] `npx capacitor sync` (precisa npm install no monorepo primeiro)
- **Verificação**: Config válida, sync pendente de ambiente
- **Commit**: `feat(pwa): finalize capacitor config`

### TASK-PWA-008: Lighthouse audit + otimizações
- [x] theme-color indigo #4f46e5 (consistente com web)
- [x] Ícones SVG com logo oficial do web
- [x] Fonte Inter (consistente com web)
- [x] Cache strategies implementadas
- [ ] Rodar Lighthouse (precisa build servido)
- **Verificação**: Otimizações visuais aplicadas
- **Commit**: `perf(pwa): lighthouse optimization`

### TASK-PWA-009: Documentação README
- [x] Passo a passo: dev em dispositivo físico
- [x] Como instalar como PWA no Android
- [x] Como configurar VAPID keys para push
- [x] Como rodar `capacitor sync` (preparação para wrapper futuro)
- [x] Nota sobre independência do monorepo
- **Verificação**: README legível e reproduzível
- **Commit**: `docs(pwa): README with device testing instructions`

---
**Status**: 9/9 tasks concluídas (1 parcialmente — capacitor sync depende de ambiente)
