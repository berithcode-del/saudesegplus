# Doctor Flow — Tasks

> **Bloco**: 4
> **Checkpoint**: C4 (ver `.specs/CHECKPOINTS.md`)
> **Revisor**: `security-auditor` + `test-engineer`
> **Bloqueante**: Sim — C4 deve PASSAR antes do Bloco 5
> **Depende de**: CHECKPOINT-3 PASS (Bloco 3)

## Tasks

### TASK-DOCTOR-001: Bottom tab bar (Fila / Consulta / Histórico)
- [x] Tab bar Material Design 3 (2 abas + auth guard)
- [x] Ícones emoji (📋 Fila, 🕐 Histórico)
- [x] Badge na aba "Fila" com contagem de pacientes
- [x] Connection status bar no header
- [x] Auth guard: redireciona para /medico/login se não autenticado
- **Verificação**: Navegação entre abas
- **Commit**: `feat(doctor): bottom tab bar layout`

### TASK-DOCTOR-002: Fila de atendimento — lista
- [x] Lista de pacientes da fila via `GET /api/queue`
- [x] Cada item ≥ 48px touch target
- [x] Pull-to-refresh (touch events)
- [x] Indicador online/offline por paciente
- [x] Indicador de prioridade
- **Verificação**: 100 items sem jank
- **Commit**: `feat(doctor): queue list`

### TASK-DOCTOR-003: Fila — Socket.IO + reconexão
- [x] `useQueue` (de @repo/api-client) com auth injetado
- [x] Reconexão em `visibilitychange` (tab volta ao foco)
- [x] Indicador de conexão no header (verde/vermelho)
- [x] Refetch automático em eventos Socket.IO
- **Verificação**: Teste de reconexão após background
- **Commit**: `feat(doctor): queue socket with background reconnection`

### TASK-DOCTOR-004: Fila — aceitar paciente
- [x] Botão "Aceitar" por item
- [x] Chama `apiClient.fetch('/api/queue/:id/accept', { method: 'POST' })`
- [x] Remove da fila + navega para consulta
- [x] Estado de loading por item
- [x] Pacientes offline não podem ser aceitos
- **Verificação**: Fluxo de aceitação funciona
- **Commit**: `feat(doctor): accept patient from queue`

### TASK-DOCTOR-005: Consulta ativa — layout + motor clínico
- [x] `/medico/consulta/:id` com dados do paciente via `GET /api/solicitacoes/:id`
- [x] Info do paciente: nome, CPF, empresa, finalidade
- [x] Anamnese do paciente (queixas, histórico, medicamentos, hábitos)
- [x] Card expansível de exames registrados
- [x] Indicador de presença do paciente (online/offline)
- **Verificação**: Navegação entre exames
- **Commit**: `feat(doctor): active consultation with clinical engine`

### TASK-DOCTOR-006: Consulta ativa — salvar laudo
- [x] Formulário de laudo (textarea grande, touch-friendly)
- [x] Autosave em rascunho (debounce 1.5s)
- [x] Indicador "✓ Salvo" ao persistir
- [x] Submit via `PATCH /api/solicitacoes/:id` com `laudoTexto`
- **Verificação**: Laudo persiste
- **Commit**: `feat(doctor): save medical report`

### TASK-DOCTOR-007: Consulta ativa — finalizar
- [x] Botão "Finalizar consulta" fixo em thumb zone
- [x] Modal de confirmação com seleção (apto/inapto)
- [x] Envia `PATCH /api/solicitacoes/:id` com status CONCLUIDO + decision
- [x] Volta para fila após finalizar
- **Verificação**: Fluxo de finalização
- **Commit**: `feat(doctor): finish consultation button`

### TASK-DOCTOR-008: Histórico — lista
- [x] `/medico/historico` com lista via `GET /api/solicitacoes`
- [x] Paginação (carregar mais)
- [x] Filtro por status com cores
- **Verificação**: Scroll suave com 200+ items
- **Commit**: `feat(doctor): history list`

### TASK-DOCTOR-009: Histórico — detalhes da consulta
- [x] Detalhe expansível inline
- [x] Mostra: paciente, empresa, status
- [x] Botão "Ver detalhes" navega para `/medico/consulta/:id`
- **Verificação**: Renderiza dados
- **Commit**: `feat(doctor): history detail view`

### TASK-DOCTOR-010: Login + armazenamento seguro
- [x] Tela de login (`/medico/login`) com email + senha
- [x] JWT persistido via `persistSession` (StorageAdapter)
- [x] Validação: apenas role DOCTOR pode acessar
- [x] Verificação de médico verificado no backend
- [x] Logout limpa storage
- **Verificação**: Token persiste entre sessões
- **Commit**: `feat(doctor): secure login`

### TASK-DOCTOR-011: PIN de reentrada rápida
- ⏭️ Postergado para iteração futura (não bloqueia MVP)
- **Razão**: PIN requer backend de verificação + hash存储, funcionalidade non-blocking

### TASK-DOCTOR-012: Testes de fluxo médico
- [ ] Unit: hooks (useQueue, useDoctorAuth)
- [ ] Integration: aceitar paciente → consulta → finalizar
- [ ] E2E: login → fila → aceitar → laudo → finalizar → histórico
- [ ] Segurança: token em storage seguro, PIN hash, lockout
- **Verificação**: Cobertura ≥ 80%
- **Commit**: `test(doctor): flow coverage`

---
**Após TASK-012**: Disparar revisor `security-auditor` + `test-engineer` para CHECKPOINT-4.
