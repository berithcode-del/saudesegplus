# Gaps, Riscos e Inconsistências Identificadas na Análise do Código

Este documento registra problemas encontrados na análise do código atual que precisam ser tratados, independente da feature a que pertencem.

---

## 🔴 Críticos (bloqueiam fluxos em produção)

### G01 — `collectedById` hardcoded como `'system'`
**Arquivo:** `src/exams/exams.service.ts`  
**Problema:** `ExamResult` é criado com `collectedById: 'system'`, mas a constraint de FK no Prisma (`collectedBy Operator @relation(...)`) vai falhar se não existir um `Operator` com ID `'system'`.  
**Verificar:** Se o seed cria um Operator com id `'system'` ou se o Prisma está com FK desabilitada.  
**Solução:** Receber `clinicId` no check-in e buscar operador padrão da clínica, ou tornar o campo opcional.

### G02 — `ExamType.id = 'default'` não existe no banco
**Arquivo:** `src/exams/exams.service.ts`  
**Linha:** `typeId: examTypeRecord?.id ?? 'default'`  
**Problema:** Fallback `'default'` é uma string que não existe como ID em `ExamType`. FK vai falhar.  
**Solução:** Criar `ExamType` padrão no seed OU usar `upsert` para criar se não existir.

### G03 — `POST /api/exams/create-patient` — rota estática depois de `POST /`?
**Arquivo:** `src/exams/exams.controller.ts`  
**Problema:** `@Post()` e `@Post('create-patient')` — verificar se o NestJS processa na ordem correta. Semelhante ao bug de `company.controller.ts` corrigido na Fase 2. `POST /api/exams/create-patient` pode ser capturado por `@Post(':id/send-to-queue')` se a ordem estiver errada.  
**Verificar:** Ordem de declaração dos decorators no controller.

### G04 — `AsoService` usa caminho relativo para template HTML
**Arquivo:** `src/aso/aso.service.ts`  
**Linha:** `path.join(__dirname, '../../../../libs/pdf-template-aso.html')`  
**Problema:** Este caminho assume uma estrutura de monorepo que pode não existir. O arquivo `libs/pdf-template-aso.html` **não está nos arquivos enviados**.  
**Ação:** Confirmar existência do arquivo no repositório original. Se não existir, criar.

---

## 🟡 Altos (degradam funcionalidade)

### G05 — Duplicação de entrada na fila
**Arquivos:** `src/exams/exams.service.ts` (`sendToMedicalQueue`) e `src/queue/queue.service.ts` (`enqueue`)  
**Problema:** Dois métodos diferentes criam `QueueEntry` para o mesmo `ExamRequest`. `POST /api/exams/:id/send-to-queue` chama `ExamsService.sendToMedicalQueue()` que cria QueueEntry. `POST /api/queue/enqueue` chama `QueueService.enqueue()` que também cria QueueEntry. Se ambos forem chamados para o mesmo ExamRequest, vai falhar na constraint `@unique` de `QueueEntry.requestId`. Ou duplicar entradas na fila se a constraint não existir.  
**Solução:** Unificar em um único serviço ou usar `upsert`.

### G06 — `ExamRequest.status` é `String` sem enum
**Arquivo:** `prisma/schema.prisma`  
**Problema:** `status` em `ExamRequest` é tipo `String` livre, não um enum. Os valores usados no código (`AGUARDANDO_COLETA`, `EM_COLETA`, `NA_FILA_MEDICA`, `EM_ATENDIMENTO_MEDICO`, `CONCLUIDO`) estão dispersos como strings nos services sem validação central.  
**Solução (Fase 3):** Criar enum `ExamRequestStatus` no Prisma schema + migration.

### G07 — `QueueEntry.status` também é String livre
**Mesmo problema que G06.** Valores `WAITING`, `IN_PROGRESS` hardcoded.

### G08 — Nenhum tratamento de erro nos WebSocket emits
**Arquivos:** `company.gateway.ts`, `queue.gateway.ts`  
**Problema:** `emitTimelineUpdate`, `emitInviteStatusChange` não têm try/catch. Falha de emit pode propagar exception e quebrar a transaction principal.  
**Solução:** Wrapping em try/catch nos métodos de emit.

### G09 — `apiGetMedicoSolicitacoes` em `api.ts` não é usada em lugar nenhum
**Arquivo:** `app/lib/api.ts`  
**Problema:** Função existe mas nenhuma tela chama. Será necessária para F2 (histórico do médico).  
**Ação:** Usar em F2.

---

## 🟢 Médios (melhorias de qualidade)

### G10 — Sem paginação em nenhuma listagem
Os endpoints `GET /api/solicitacoes`, `GET /api/queue`, `GET /api/medicos/:id/solicitacoes` retornam todos os registros sem paginação. Em produção isso vai escalar mal.  
**Solução:** Adicionar `?page=&limit=` em todos os endpoints de listagem (Fase 3 ou Fase 4).

### G11 — `teleconsultation` model não tem integração ativa
O modelo `Teleconsultation` existe no Prisma com `videoSessionId`, `recordingUrl`, `clinicalNotes`. Nenhum service cria registros nele. O campo `videoActive` na tela de consulta é local sem persistência.

### G12 — Seed mock provavelmente não cria todos os dados necessários
`collectedById: 'system'` (G01), `typeId: 'default'` (G02), CBOs para `OccupationalRisk` (B3) — o seed deve ser auditado para garantir que os dados de referência necessários existem antes de rodar testes.

---

## Ações imediatas recomendadas (antes de começar qualquer feature)

1. **Auditar o seed** — garantir que cria Operator com id utilizável, ExamType com nomes reais, OccupationalRisk com CBOs
2. **Criar enum `ExamRequestStatus`** — migration simples, elimina dezenas de strings soltas
3. **Verificar existência de `pdf-template-aso.html`** no repositório original
4. **Verificar ordem de rotas em `exams.controller.ts`** (G03)

