# API Types — Tasks

> **Bloco**: 1 (Reuso de Pacotes)
> **Checkpoint**: C1 (ver `.specs/CHECKPOINTS.md`)
> **Revisor**: `code-archaeologist`
> **Bloqueante**: Sim — C1 deve PASSAR antes do Bloco 2

## Tasks

### TASK-API-TYPES-001: Criar estrutura do `packages/api-types`
- [ ] Criar `packages/api-types/package.json` (name: `@repo/api-types`)
- [ ] Criar `packages/api-types/tsconfig.json` (extends `@repo/typescript-config`)
- [ ] Criar `packages/api-types/src/index.ts`
- [ ] Adicionar ao workspace
- **Verificação**: `pnpm install` passa e `@repo/api-types` resolve
- **Commit**: `feat(api-types): scaffold package`

### TASK-API-TYPES-002: Extrair enums do Prisma
- [ ] Espelhar `Role` (ADMIN, OPERATOR, DOCTOR, PATIENT, COMPANY_ADMIN, CLINIC)
- [ ] Espelhar `CompanyStatus` (CADASTRO_INCOMPLETO, EM_ANALISE, LIBERADA, DOCUMENTACAO_VENCIDA)
- [ ] Espelhar `InviteStatus` (ENVIADO, ABERTO, EXPIRADO, CONCLUIDO)
- [ ] Espelhar `TimelineEventType`
- [ ] Espelhar `FinancialType`
- **Verificação**: `tsc --noEmit` em `packages/api-types`
- **Commit**: `feat(api-types): export Prisma enums`

### TASK-API-TYPES-003: Extrair DTOs de `auth`
- [ ] Migrar `apps/backend/src/auth/dto/login.dto.ts` → `src/auth/login.dto.ts`
- [ ] Tipos de request/response
- **Verificação**: `tsc --noEmit`
- **Commit**: `feat(api-types): add auth DTOs`

### TASK-API-TYPES-004: Extrair DTOs de `colaborador`
- [ ] Migrar `apps/backend/src/colaborador/dto/validate-invite.dto.ts`
- [ ] Tipos de request/response
- **Commit**: `feat(api-types): add colaborador DTOs`

### TASK-API-TYPES-005: Extrair DTOs de `portal`
- [ ] Migrar `auth-portal.dto.ts`, `confirmar-dados.dto.ts`, `enviar-documento.dto.ts`, `questionario.dto.ts`
- **Commit**: `feat(api-types): add portal DTOs`

### TASK-API-TYPES-006: Extrair DTOs de `medicos`, `teleconsultation`, `aso`, `anamnese`
- [ ] `update-doctor-profile.dto.ts` (medicos)
- [ ] Tipos de teleconsultation (create-room request/response)
- [ ] Tipos de ASO e anamnese
- **Commit**: `feat(api-types): add medicos, teleconsultation, aso, anamnese DTOs`

### TASK-API-TYPES-007: Criar tipos de fila (queue) e eventos Socket.IO
- [ ] `QueueEvent` type (`ENQUEUED`, `ACCEPTED`, `COMPLETED`, `DOCTOR_STATUS`, `TELECONSULTA_INICIADA`, `DOCTOR_VIEWING_PATIENT`)
- [ ] `QueueEntry` type (espelhar model do Prisma)
- [ ] Payload types para cada evento
- **Commit**: `feat(api-types): add queue and Socket.IO event types`

### TASK-API-TYPES-008: Migrar `web` para consumir `@repo/api-types`
- [ ] Em `apps/web`, substituir tipos inline por imports de `@repo/api-types`
- [ ] Confirmar que não há tipos duplicados
- **Verificação**: `pnpm --filter web build` passa
- **Commit**: `refactor(web): consume @repo/api-types`

---
**Após TASK-008**: Disparar revisor `code-archaeologist` para CHECKPOINT-1 (combinado com api-client).
