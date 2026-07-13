# Portal Flow — Tasks

> **Bloco**: 3
> **Checkpoint**: C3 (ver `.specs/CHECKPOINTS.md`)
> **Revisor**: `test-engineer`
> **Bloqueante**: Sim — C3 deve PASSAR antes do Bloco 4
> **Depende de**: CHECKPOINT-2 PASS (Bloco 2)

## Tasks

### TASK-PORTAL-001: Tela de entrada por token (`/p/:token`)
- [x] Validar token via `apiClient.fetch('/api/portal/auth', { token })`
- [x] Tela de boas-vindas + consentimento LGPD (checkbox obrigatório)
- [x] Estado: loading, success, error (token inválido/expirado)
- [x] Touch targets ≥ 48px, CTA em thumb zone
- [x] Corrigido field names do preview (empresaNome/tipoExame)
- **Verificação**: Teste unitário do hook `useTokenValidation`
- **Commit**: `feat(portal): token validation + LGPD consent screen`

### TASK-PORTAL-002: Tela de confirmação de dados (`/p/:token/confirmar`)
- [x] Mostrar dados: nome, CPF, data nascimento, CBO
- [x] Permitir correção inline de cada campo
- [x] Botão "Confirmar dados" → persiste via api-client → avança
- [x] Botão em thumb zone (fixo no rodapé)
- **Verificação**: Teste de fluxo de confirmação
- **Commit**: `feat(portal): confirm data screen`

### TASK-PORTAL-003: Questionário — estrutura do wizard (`/p/:token/questionario`)
- [x] Componente `WizardLayout` (etapa X/N, barra de progresso)
- [x] Uma pergunta por tela (tela cheia)
- [x] Botão "Avançar" fixo em thumb zone
- [x] Botão "Voltar" acessível
- [x] Corrigido TS error: step possibly undefined
- **Verificação**: Lógica de navegação entre etapas
- **Commit**: `feat(portal): wizard layout for questionnaire`

### TASK-PORTAL-004: Questionário — rascunho local (IndexedDB)
- [x] Configurar `localforage` para IndexedDB
- [x] Salvar resposta a cada mudança (debounce 300ms)
- [x] Recarregar rascunho ao reabrir app
- [x] Limpar rascunho após envio confirmado
- [x] Adicionado type declaration para localforage
- **Verificação**: Teste offline (fechar app, reabrir, verificar rascunho)
- **Commit**: `feat(portal): local draft for questionnaire (IndexedDB)`

### TASK-PORTAL-005: Questionário — envio (online/offline queue)
- [x] Envio ao backend quando online
- [x] Enfileirar em `useOfflineQueue` quando offline
- [x] Feedback: "salvo localmente, enviando quando internet voltar"
- [x] Indicador de pendências visível (badge no header)
- **Verificação**: Teste de envio em modo avião → reconexão
- **Commit**: `feat(portal): offline-first questionnaire submission`

### TASK-PORTAL-006: Documentos — listagem (`/p/:token/documentos`)
- [x] Listar documentos pendentes (via api-client)
- [x] Card por documento com status (pendente/enviado)
- [x] Touch target do card ≥ 48px
- **Verificação**: Lista renderiza com dados mock
- **Commit**: `feat(portal): document list screen`

### TASK-PORTAL-007: Documentos — câmera nativa
- [x] Implementar `useCamera` com `navigator.mediaDevices.getUserMedia` (web API)
- [x] Preview antes de confirmar
- [x] Reenvio antes de upload final
- [x] Consentimento LGPD antes de abrir câmera (modal explicativo)
- [x] Adapter pronto para Capacitor Camera (lazy import em build nativo)
- **Verificação**: Captura funciona em dispositivo Android
- **Commit**: `feat(portal): native camera capture with LGPD consent`

### TASK-PORTAL-008: Documentos — upload
- [x] Upload via `apiClient.fetchWithFormData('/api/upload/file', FormData)`
- [x] Barra de progresso de upload
- [x] Retry em caso de falha
- [x] Atualizar status do card após upload
- **Verificação**: Upload completa 
- **Commit**: `feat(portal): document upload with progress`

### TASK-PORTAL-009: Teleconsulta — sala de espera (`/p/:token/teleconsulta`)
- [x] Conectar via polling do `usePortalProcess` (5s interval)
- [x] Indicador de conexão persistente no header (verde/vermelho/reconectando)
- [x] Estado: "Aguardando médico...", "Médico conectando..."
- [x] Reconexão automática em `visibilitychange`
- **Verificação**: Indicador reage a queda de rede
- **Commit**: `feat(portal): teleconsultation waiting room`

### TASK-PORTAL-010: Teleconsulta — vídeo embedded
- [x] Embed de iframe da sala (link via `processo.teleconsulta.linkSala`)
- [x] State error + botão reconectar
- [x] Full screen no mobile
- **Verificação**: Vídeo carrega 
- **Commit**: `feat(portal): teleconsultation video embed`

### TASK-PORTAL-011: Teleconsulta — finalização → ASO
- [x] Após teleconsulta, redirecionar para `/p/:token/aso`
- [x] Tela de "Teleconsulta finalizada" com confirmação
- **Verificação**: Navegação pós-teleconsulta
- **Commit**: `feat(portal): post-teleconsultation redirect`

### TASK-PORTAL-012: ASO — preview e assinatura (`/p/:token/aso`)
- [x] Mostrar ASO gerado (PDF preview ou texto formatado)
- [x] Botão "Baixar ASO" (download do PDF via GET /api/portal/aso)
- [x] Botão "Assinar ASO" (canvas signature pad)
- [x] Confirmação final do fluxo completo
- **Verificação**: ASO renderiza e assinatura persiste
- **Commit**: `feat(portal): ASO preview and signature`

### TASK-PORTAL-013: Indicador de conexão global (componente reutilizável)
- [x] `ConnectionStatus` component (toaster/badge persistente)
- [x] Verde (conectado), Amarelo (reconectando), Vermelho (offline)
- [x] Visível em todas as telas do portal (via PortalLayout)
- **Verificação**: Reage a eventos de rede
- **Commit**: `feat(portal): global connection status indicator`

### TASK-PORTAL-014: Erros amigáveis mobile (error boundary + fallbacks)
- [x] PortalErrorBoundary por rota
- [x] Fallback UI: ícone + mensagem + botão retry
- [x] Mensagens específicas por contexto (rede, auth, validação)
- **Verificação**: Erro 401 mostra mensagem amigável, não stack trace
- **Commit**: `feat(portal): mobile-friendly error boundaries`

### TASK-PORTAL-015: Testes E2E do fluxo completo
- [ ] E2E: token → confirmar → questionário → documentos → teleconsulta → ASO
- [ ] E2E offline: preencher questionário sem rede → reconectar → verificar envio
- [ ] E2E: token expirado mostra erro
- **Verificação**: Cobertura ≥ 80% do fluxo
- **Commit**: `test(portal): E2E flow coverage`

---
**Após TASK-015**: Disparar revisor `test-engineer` para CHECKPOINT-3.
