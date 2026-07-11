# Revisão do Backend — Comparativo com Specs Fase 3

**Data:** 28/06/2026  
**Versão analisada:** Back.zip (entrega pós-Fase 2 com avanços de Fase 3)

---

## Resumo executivo

O backend avançou significativamente além do escopo da Fase 2. Vários módulos da Fase 3 já foram implementados. A tabela abaixo mostra o estado real de cada task.

| Fase | Task | Spec | Status Real |
|------|------|------|-------------|
| 3A | TASK-001 | Enum `ExamRequestStatus` | ⚠️ Parcial |
| 3A | TASK-002 | Enum `QueueEntryStatus` + Timeline | ✅ Feito |
| 3A | TASK-003 | Seed auditado e corrigido | ✅ Feito |
| 3A | TASK-004 | Ordem de rotas + mock `signature` | ✅ Feito |
| 3A | TASK-005 | try/catch nos emits WebSocket | ❌ Pendente |
| 3A | TASK-006 | Deduplicar QueueEntry | ⚠️ Parcial |
| 3B | TASK-007 | `GET /api/solicitacoes/:id` enriquecido | ⚠️ Parcial |
| 3B | TASK-008 | `GET /api/medicos` | ✅ Feito |
| 3B | TASK-009 | Frontend consulta dados reais | ❌ Pendente (frontend) |
| 3B | TASK-010 | Frontend fila com dropdown | ❌ Pendente (frontend) |
| 3B | TASK-011 | ASO persiste `AsoDocument` | ✅ Feito |
| 3B | TASK-012 | ASO gera PDF com dados reais | ✅ Feito |
| 3B | TASK-013 | Frontend modo leitura na consulta | ❌ Pendente (frontend) |
| 3B | TASK-014 | Frontend histórico do médico | ❌ Pendente (frontend) |
| 3C | TASK-015 | `GET /api/exams/types` e `/required` | ❌ Pendente |
| 3C | TASK-016 | Módulo Anamnese | ⚠️ Parcial |
| 3C | TASK-017 | Exams aceita múltiplos resultados | ❌ Pendente |
| 3C | TASK-018 | Frontend check-in multi-exame | ❌ Pendente (frontend) |
| 3D | TASK-019 | Upload PCMSO/PPRA | ⚠️ Parcial |
| 3D | TASK-020 | `PATCH /company/:id` + status-check | ⚠️ Parcial |
| 3D | TASK-021 | Frontend documentos empresa | ❌ Pendente (frontend) |
| 3D | TASK-022 | Frontend config empresa | ❌ Pendente (frontend) |
| 3E | TASK-023 | Portal: auth por token | ✅ Feito |
| 3E | TASK-024 | Portal: `getProcesso` + próxima ação | ✅ Feito |
| 3E | TASK-025 | Portal: confirmar dados + docs | ✅ Feito |
| 3E | TASK-026 | Portal: questionário + roteamento | ✅ Feito |
| 3E | TASK-027 | Frontend: validação de identidade | ❌ Pendente (frontend) |
| 3E | TASK-028 | Frontend: tela principal do processo | ❌ Pendente (frontend) |
| 3E | TASK-029 | Frontend: etapas do portal | ❌ Pendente (frontend) |
| 3F | TASK-030 | Auth JWT backend | ✅ Feito |
| 3F | TASK-031 | Frontend: login + proteção de rotas | ❌ Pendente (frontend) |

---

## Detalhamento por task

---

### ✅ TASK-002 — Enums de status + Timeline

`TimelineEventType` já tem todos os valores especificados incluindo os novos do portal:
`DADOS_CONFIRMADOS`, `DOCUMENTOS_ENVIADOS`, `QUESTIONARIO_RESPONDIDO`, `TELECONSULTA_INICIADA`.  
`QueueEntry.status` continua como `String`, não enum — mas os valores `'WAITING'` e `'IN_PROGRESS'` estão sendo usados de forma consistente no código. Risco baixo, melhoria postergável.

---

### ✅ TASK-003 — Seed corrigido e completo

O seed foi completamente reescrito. Pontos positivos:
- 10 pacientes com dados realistas (nome, CPF, CBO, cidade, estado)
- 2 empresas, 1 clínica, 2 médicos, 1 operador, 2 admins
- `ExamType` com 4 tipos criados (PA, Audiometria, Acuidade Visual, Espirometria)
- `OccupationalRisk` com 10 CBOs, `requiresInPerson` e `requiredExams` preenchidos
- `collectedById` agora usa o `operator.id` real (não `'system'`)
- Seed com modo `--clean`, `--errors` e geração de `MOCKS.md`

**Gap encontrado:** Os nomes dos `ExamType` no seed (`'Exame Clínico (PA)'`, `'Audiometria'`) não batem com os nomes usados em `exams.service.ts` (`'pa'`, `'audiometria'`). O service faz `findFirst({ where: { name: examType } })` — se o CBO passa `'pa'` e no banco está `'Exame Clínico (PA)'`, o `typeId` vai retornar `null` e cair no fallback `'default'`, que não existe como ID. **Isso é um bug ativo** que vai quebrar a coleta de exames.

**Correção necessária (TASK-003-FIX):** Alinhar os nomes. Opções:
- A: Alterar o seed para usar nomes curtos: `'pa'`, `'audiometria'`, `'acuidade_visual'`, `'espirometria'`
- B: Alterar o service para buscar pelo `name` com `contains` ou um mapeamento
- **Recomendação: Opção A** — mais simples, sem tocar lógica.

---

### ✅ TASK-004 — Ordem de rotas corrigida

`company.controller.ts` já tem o comentário explicativo e a rota estática `@Get('solicitacoes')` antes de `@Get(':id')`. O `signature.service.ts` não tem mais o guard `id !== '1'`.

**Gap encontrado em `exams.controller.ts`:** A ordem das rotas **ainda está errada**. `@Post('create-patient')` está declarado **depois** de `@Post(':id/send-to-queue')`. Embora `create-patient` seja `@Post` sem parâmetro e `send-to-queue` seja `@Post(':id/...')`, o problema é diferente do de GET: `POST /api/exams/create-patient` pode ser capturado por `@Post()` (sem parâmetro) se houver ambiguidade. **Verificar em teste se `POST /api/exams/create-patient` funciona corretamente.**

---

### ⚠️ TASK-001 — Enum `ExamRequestStatus` parcialmente implementado

O schema ainda usa `status String` em `ExamRequest` e `QueueEntry` — não foram convertidos para enum Prisma.

**O que foi feito:** Os status do seed estão alinhados e consistentes. Os services usam strings literais de forma uniforme.

**O que falta:** O schema Prisma não tem o enum, então não há type-safety em tempo de compilação. Um typo em qualquer status (`'EM_ATENDIMENTO'` vs `'EM_ATENDIMENTO_MEDICO'`) passa silenciosamente. O seed inclusive usa `'EM_ATENDIMENTO'` (sem `_MEDICO`) para o paciente 7, enquanto os services usam `'EM_ATENDIMENTO_MEDICO'`. **Isso é um bug de inconsistência de status** — o paciente 7 no seed nunca vai aparecer corretamente nas queries que filtram por `'EM_ATENDIMENTO_MEDICO'`.

**Correção necessária (TASK-001-FIX):** No seed, trocar `'EM_ATENDIMENTO'` por `'EM_ATENDIMENTO_MEDICO'` na linha de `EXAM_REQUEST_STATUSES[6]`. E criar o enum no schema na próxima janela de migration.

---

### ⚠️ TASK-006 — Deduplicação de QueueEntry parcial

`ExamsService.sendToMedicalQueue()` e `QueueService.enqueue()` **ainda criam `QueueEntry` independentemente**. `sendToMedicalQueue` cria diretamente; `enqueue` também cria. Não houve delegação.

**Por que não quebra agora:** O campo `requestId` em `QueueEntry` tem `@unique`, então a segunda inserção vai dar erro de constraint. Mas isso significa que chamar os dois endpoints para o mesmo `ExamRequest` retorna erro 500 em vez de idempotência.

**Correção recomendada (TASK-006-FIX):** Em `sendToMedicalQueue`, substituir o `queueEntry.create` por chamada ao `QueueService.enqueue()`. Ou converter para `upsert`:
```ts
await this.prisma.queueEntry.upsert({
  where: { requestId: examRequestId },
  create: { requestId: examRequestId, city, state, status: 'WAITING' },
  update: {},
});
```

---

### ⚠️ TASK-007 — `GET /api/solicitacoes/:id` parcialmente enriquecido

`findOne` inclui `patient.anamneses` (via relation), `clinic`, `invite.company`, `results.type`, `asoDocuments`. Bom.

**Gaps em relação à spec B1-REQ-001 e B1-REQ-002:**

1. **`valueJson` não é parseado antes de retornar.** O service retorna o JSON como string. O frontend vai precisar fazer `JSON.parse()` para cada resultado — ou o backend deve parsear. A spec recomendava o backend parsear.

2. **`teleconsultations` não está no include.** A tela de consulta precisa saber se há `videoSessionId` para o botão de chamada. Adicionar ao `findOne`:
```ts
teleconsultations: { orderBy: { startedAt: 'desc' }, take: 1 }
```

3. **`anamnese` vinculada ao `patientId`, não ao `requestId`.** O modelo `Anamnese` usa `patientId` como FK — não há vínculo com `ExamRequest`. Isso significa que `GET /api/solicitacoes/:id` retorna todas as anamneses do paciente (não a específica daquele processo). Isso pode causar confusão quando um paciente tem múltiplas solicitações. (Divergência de design entre a spec B4 e o que foi implementado — veja seção Anamnese abaixo.)

---

### ✅ TASK-008 — `GET /api/medicos` implementado

`MedicosController` tem `@Get()` com filtros `search`, `city`, `state`. Retorna médicos com `status: 'online'` — **atenção:** se todos os médicos do seed tiverem `status: 'online'`, funciona. Se alguém mudar o status para `'offline'` o médico some da listagem. Verificar se isso é intencional para o dropdown de seleção (que deveria mostrar todos, não só os online). Para o dropdown da fila faz sentido filtrar só online; mas para seleção histórica do médico pode ser melhor retornar todos.

---

### ⚠️ TASK-016 — Módulo Anamnese: divergência de design

O módulo `anamnese` foi implementado com uma diferença crítica em relação à spec **B4**:

| Aspecto | Spec B4 | Implementado |
|---------|---------|--------------|
| FK principal | `requestId` (`@unique`) | `patientId` |
| Busca | `GET /api/anamnese/:requestId` | `GET /api/anamnese/:patientId` |
| Campos | `fieldsJson` (JSON livre) | Colunas tipadas: `queixas`, `historicoOcupacional`, `historicoMedico`, `medicamentos`, `habitos` |
| Vínculo | Por processo/solicitação | Por paciente (um paciente, muitas solicitações, uma anamnese) |

**Impacto:** A anamnese atual é global por paciente, não por solicitação. Isso significa que se um paciente fizer 3 exames ao longo do tempo, todos compartilham a mesma anamnese (a mais recente). A spec especificava vínculo por `requestId` para que cada processo tenha sua própria anamnese (evolução clínica ao longo do tempo).

**Decisão necessária:** Manter a abordagem de "anamnese por paciente" (mais simples) ou migrar para "anamnese por processo" (mais correto clinicamente)?

**Para manter compatibilidade imediata** (sem migration): aceitar a abordagem atual. O portal já usa essa lógica e funciona. A UI do médico vai mostrar a anamnese mais recente do paciente, que provavelmente é a relevante.

**Para corrigir (se necessário):** Adicionar `requestId String?` à `Anamnese` e criar index. Não é breaking change.

---

### ✅ TASK-011 + TASK-012 — ASO real implementado

`AsoService.generatePdf()` está completo:
- Cria `AsoDocument` se não existir
- Lê dados reais do paciente, empresa, médico
- Renderiza template HTML (via substituição de `{{variavel}}`)
- Gera PDF com Puppeteer
- Salva em `uploads/aso/`
- Atualiza `pdfUrl` no banco
- Atualiza `ExamRequest.status = 'CONCLUIDO'`

**Gap encontrado:** O template `libs/pdf-template-aso.html` ainda **precisa ser criado** (o path é `__dirname/../../../libs/pdf-template-aso.html`). Se não existir, o `generatePdf` vai lançar erro de `ENOENT` ao tentar ler o arquivo. A spec TASK-004 listava isso como item de verificação — confirmar se o arquivo existe no repositório antes de testar.

**Gap no controller:** `AsoController` tem apenas `POST /api/aso/generate`. A spec pedia também `GET /api/aso/:id` para servir o PDF. Como `main.ts` já configura `useStaticAssets('/uploads')`, o PDF em `uploads/aso/aso-{id}.pdf` é acessível via `GET /uploads/aso/aso-{id}.pdf` diretamente — não precisa de endpoint dedicado. Isso é aceitável.

**Gap no PATCH de solicitações:** `PATCH /api/solicitacoes/:id` aceita apenas `{ status, laudoTexto }`. Não aceita `decision` nem `restrictionNotes` para criar o `AsoDocument`. O frontend precisa chamar `POST /api/aso/generate` separadamente para criar o ASO — o fluxo tem dois passos (PATCH status + POST ASO). A spec B2-REQ-002 pedia que o `AsoDocument` fosse criado atomicamente no `PATCH`. Isso ainda não foi feito.

---

### ✅ TASK-023 a TASK-026 — Portal do Funcionário completo no backend

Todos os endpoints do portal estão implementados:
- `POST /api/portal/auth` — valida token + CPF + data de nascimento, emite SessionToken JWT com role `'PORTAL'`
- `GET /api/portal/processo` — retorna processo completo com `proximaAcao` calculada no backend
- `POST /api/portal/confirmar-dados` — atualiza phone, avança status
- `POST /api/portal/documentos` — recebe `{ tipo, fileUrl }` (não multipart — veja gap abaixo)
- `POST /api/portal/questionario` — salva anamnese, faz roteamento A/B/C
- `GET /api/portal/aso` — retorna ASO do processo

**`PortalSessionGuard`** implementado corretamente: valida JWT com `role === 'PORTAL'`, injeta `patientId` e `processId` no request.

**`calcularProximaAcao`** implementada com todos os estados da spec.

**`calcularProgresso`** retorna array de steps com `concluido` e `ativo`.

**Gap 1 — `POST /api/portal/documentos` recebe `fileUrl` (string), não arquivo:**
```ts
// Implementado:
async enviarDocumento(..., dto: EnviarDocumentoDto) // { tipo, fileUrl }

// Spec pedia multipart com arquivo real
```
O upload real do arquivo precisa passar pelo `UploadModule` (`POST /api/upload/document`). O portal atualmente espera que o frontend já tenha feito o upload e passe apenas a URL. **Isso requer coordenação com o frontend**: a tela de documentos precisa primeiro fazer `POST /api/upload/document` (com `multer`) e depois `POST /api/portal/documentos` com a URL retornada. Ou unificar em um endpoint só.

**Gap 2 — `GET /api/portal/preview/:token` não existe:**
A spec TASK-027 pedia este endpoint público para mostrar o nome da empresa antes da validação de identidade. Sem ele, a tela de validação não consegue mostrar "Empresa: Tech Corp" antes do funcionário digitar CPF+nascimento. Endpoint simples de adicionar:
```ts
@Get('preview/:token')
async preview(@Param('token') token: string) {
  const invite = await this.prisma.examInvite.findUnique({
    where: { token },
    include: { company: true },
  });
  if (!invite) return { expirado: true };
  return {
    empresaNome: invite.company.nomeFantasia ?? invite.company.razaoSocial,
    tipoExame: invite.examType,
    expirado: invite.expiresAt < new Date() || invite.status === 'EXPIRADO',
  };
}
```

**Gap 3 — Mensagens de erro do auth revelam qual campo falhou:**
```ts
if (invite.expectedCpf !== cpf) throw new UnauthorizedException('CPF não corresponde ao convite');
// ...
throw new UnauthorizedException('Data de nascimento não confere');
```
A spec (F6-AC-002) pede que a mensagem seja genérica (`'Dados não conferem'`) para não revelar qual campo está errado. Risco baixo para MVP, mas corrigir antes de ir para produção.

---

### ✅ TASK-030 — Auth JWT implementado

`AuthModule` completo com `@nestjs/jwt`, `passport-jwt`, `bcrypt`.

**Gaps em relação à spec:**

1. **`JWT_SECRET` hardcoded como fallback:** `'fallback-secret'` no `JwtModule` e `'saudeseg_secret_key_2026'` no `PortalModule`. Os dois módulos usam segredos diferentes. O `PortalSessionGuard` verifica com `process.env.JWT_SECRET ?? 'saudeseg_secret_key_2026'`, mas o `AuthModule` registra com `process.env.JWT_SECRET || 'fallback-secret'`. Se `JWT_SECRET` não estiver definido na env, os segredos são diferentes e o guard vai **rejeitar tokens emitidos pelo AuthModule**. Verificar se o `.env` tem `JWT_SECRET` definido — sim, tem: `JWT_SECRET="saude-seg-plus-jwt-secret-key-2024"`. **Mas em desenvolvimento sem o `.env`, vai quebrar.** Unificar o fallback.

2. **`profileId` não está no payload do JWT:** O payload emitido por `AuthService.login` é `{ sub, email, role }` — não inclui `profileId` (ID do `Doctor`, `Operator`, etc.). A spec B5-REQ-001 pedia `profileId` no payload para que o frontend possa usar `decodeToken().profileId` em vez de campos manuais. O `GET /api/auth/me` retorna os profiles completos, mas requer uma request extra a cada sessão.

3. **Sem `APP_GUARD` global:** O `JwtAuthGuard` não está registrado como guard global. Cada endpoint que precisa de auth usa `@UseGuards(JwtAuthGuard)` individualmente — o que significa que **qualquer endpoint sem o decorator está publicamente acessível**. A spec pedia guard global com `@Public()` para rotas abertas. Risco alto para produção. Para MVP, aceitável se os endpoints sensíveis estiverem todos decorados.

4. **Senha do seed não usa bcrypt:** O seed usa `passwordHash: 'mock_hash_placeholder'` — não é um hash bcrypt válido. Qualquer login com as credenciais do seed vai falhar em `bcrypt.compare`. **Isso bloqueia qualquer teste de auth com dados do seed.** Adicionar ao seed:
```ts
import * as bcrypt from 'bcrypt';
const PASSWORD_HASH = await bcrypt.hash('Senha123!', 10);
```

---

### ⚠️ TASK-019 — Upload de documentos da empresa: parcialmente implementado

`UploadModule` existe com `POST /api/upload/document` e `GET /api/upload/documents/:companyId`.

**Gaps em relação à spec B7:**
1. Não valida que o arquivo é PDF (apenas recebe qualquer arquivo)
2. Não atualiza `Company.pcmsoDocumentUrl` / `ppraDocumentUrl` nem `validUntil` — salva em `CompanyDocument` mas não reflete nos campos da empresa
3. Não verifica se ambos os documentos estão válidos para mudar status para `LIBERADA`
4. Rota diferente da spec: spec pedia `POST /api/company/:id/documentos`; implementado em `POST /api/upload/document` com `companyId` no body

---

### ⚠️ TASK-020 — Configurações de empresa parcialmente implementadas

`CompanyService.updateCompany` e `PUT /api/company/:id` existem.

**Gaps:**
1. `UpdateCompanyDto` existe mas campos disponíveis são apenas `nomeFantasia`, `cep`, `city`, `state` — faltam `razaoSocial` e `address` da spec
2. `GET /api/company/:id/status-check` não existe (spec B8-REQ-004)

---

### ❌ TASK-005 — try/catch nos emits WebSocket ainda ausente

`CompanyGateway.emitTimelineUpdate` e `emitInviteStatusChange` não têm try/catch. Uma falha no emit propaga exception para cima. Risco real quando socket.io não tem clientes conectados.

---

### ❌ TASK-015 — Endpoints de tipos de exame e CBO não existem

`GET /api/exams/types` e `GET /api/exams/required?cboCode=` não foram implementados. O `ExamsController` tem apenas `POST /`, `POST 'create-patient'` e `POST ':id/send-to-queue'`.

---

### ❌ TASK-017 — Multi-resultados em `POST /api/exams`

O endpoint ainda aceita apenas um resultado por vez (`{ examRequestId, examType, valueJson }`). Array `results[]` não implementado.

---

## Bugs ativos identificados na análise

| ID | Severidade | Local | Descrição |
|----|-----------|-------|-----------|
| BUG-001 | 🔴 Crítico | `seed-mock.ts` + `exams.service.ts` | Nome do ExamType no seed (`'Exame Clínico (PA)'`) não casa com o nome buscado no service (`'pa'`). Coleta de exames sempre cai no fallback `'default'` (inexistente), causando erro de FK |
| BUG-002 | 🔴 Crítico | `seed-mock.ts` | Status `'EM_ATENDIMENTO'` no seed (paciente 7) vs `'EM_ATENDIMENTO_MEDICO'` nos services. Paciente 7 nunca aparece nas queries filtradas por status |
| BUG-003 | 🔴 Crítico | `seed-mock.ts` | `passwordHash: 'mock_hash_placeholder'` não é hash bcrypt. Qualquer login com credenciais do seed falha em `bcrypt.compare` |
| BUG-004 | 🟡 Alto | `portal.service.ts` | Mensagens de erro distintas por campo (`'CPF não corresponde'` vs `'Data de nascimento não confere'`) violam F6-AC-002 |
| BUG-005 | 🟡 Alto | `auth.module.ts` vs `portal.module.ts` | Fallback do JWT_SECRET diferente entre módulos (`'fallback-secret'` vs `'saudeseg_secret_key_2026'`). Tokens cross-module rejeitados sem `JWT_SECRET` definido |
| BUG-006 | 🟡 Alto | `exams.service.ts` | `sendToMedicalQueue` cria `QueueEntry` diretamente em vez de delegar para `QueueService`. Chamadas duplicadas retornam erro 500 em vez de idempotência |
| BUG-007 | 🟢 Médio | `exam-request.service.ts` | `findOne` não inclui `teleconsultations` nem parseia `valueJson`. Frontend da consulta não terá dados de vídeo e precisará parsear JSON manualmente |
| BUG-008 | 🟢 Médio | `exams.controller.ts` | Verificar se `POST /api/exams/create-patient` está sendo capturado por `@Post()` antes de chegar na rota correta |

---

## Tarefas de correção imediata (antes de testar o portal)

Estas correções devem ser feitas antes de qualquer teste do fluxo:

### FIX-001 — Corrigir nomes de ExamType no seed (**BUG-001**)
```ts
// seed-mock.ts — trocar:
{ name: 'Exame Clínico (PA)', ... }    →  { name: 'pa', ... }
{ name: 'Audiometria', ... }           →  { name: 'audiometria', ... }
{ name: 'Acuidade Visual', ... }       →  { name: 'acuidade_visual', ... }
{ name: 'Espirometria', ... }          →  { name: 'espirometria', ... }
```

### FIX-002 — Corrigir status `'EM_ATENDIMENTO'` (**BUG-002**)
```ts
// seed-mock.ts — linha de EXAM_REQUEST_STATUSES:
'EM_ATENDIMENTO',   →  'EM_ATENDIMENTO_MEDICO',
```

### FIX-003 — Gerar hash bcrypt no seed (**BUG-003**)
```ts
// seed-mock.ts — no topo do arquivo:
import * as bcrypt from 'bcrypt';
// No início de generateValidData():
const PASSWORD_HASH = await bcrypt.hash('Saudeseg@2026', 10);
```
Documentar credenciais no `MOCKS.md`: email do médico, do operador, do admin.

### FIX-004 — Unificar fallback JWT_SECRET (**BUG-005**)
```ts
// auth.module.ts e portal.module.ts — usar o mesmo fallback:
secret: process.env.JWT_SECRET ?? 'saudeseg-dev-secret',
```

### FIX-005 — Adicionar `GET /api/portal/preview/:token` (**TASK-027**)
Endpoint público, 5 linhas. Necessário para a tela de validação mostrar o nome da empresa.

### FIX-006 — Parsear `valueJson` em `findOne` e incluir `teleconsultations` (**BUG-007**)
```ts
// exam-request.service.ts — findOne():
results: request.results.map(r => ({ ...r, valueJson: JSON.parse(r.valueJson) })),
// e adicionar ao include:
teleconsultations: { orderBy: { startedAt: 'desc' }, take: 1 },
```

### FIX-007 — CORS para rede local (**Nota do TASKS.md**)
```ts
// main.ts — já tem a nota, mas precisa ser configurado para testes LAN:
// Adicionar ao array de origins ou usar variável CORS_ORIGINS da env
```

---

## Tasks que permanecem pendentes (só backend)

| Task | O que falta |
|------|------------|
| TASK-005 | try/catch nos emits do `CompanyGateway` |
| TASK-006 | `sendToMedicalQueue` delegar para `QueueService` / usar upsert |
| TASK-015 | `GET /api/exams/types` e `GET /api/exams/required` |
| TASK-017 | `POST /api/exams` aceitar array `results[]` |
| TASK-019 (complemento) | Upload validar PDF + atualizar campos `Company.pcmsoDocumentUrl` + mudar status |
| TASK-020 (complemento) | `GET /api/company/:id/status-check` + campos `razaoSocial`/`address` no UpdateDto |

---

## Tasks completamente pendentes (frontend)

TASK-009, TASK-010, TASK-013, TASK-014, TASK-018, TASK-021, TASK-022, TASK-027, TASK-028, TASK-029, TASK-031 — todas as tasks de frontend permanecem sem implementação. O backend está na frente.

---

## ⚠️ Nota de contexto de testes — Login no frontend suspenso

> **Decisão:** Para agilizar o ciclo de testes da Fase 3, o frontend **não terá tela de login nem proteção de rotas por enquanto** (TASK-031 suspensa). Os IDs de médico, empresa e operador continuarão sendo informados manualmente nas telas (campo de texto ou hardcode local) durante este período.
>
> A LLM de implementação do frontend deve **ignorar qualquer referência a `auth.ts`, `middleware.ts`, `getToken()`, `decodeToken()`, `Authorization header` e redirecionamento para `/login`** nas specs B5 e TASK-031 ao gerar código de frontend. Esses itens serão implementados em fase posterior quando o fluxo de telas estiver mais maduro.
>
> O backend de auth (TASK-030) já está implementado e permanece intacto — apenas o frontend não o consome por ora.

---

## O que pode ser testado agora (com os fixes acima aplicados)

Após aplicar FIX-001 a FIX-007:

1. **Fluxo do portal do funcionário (backend):** `POST /api/portal/auth` → `GET /api/portal/processo` → `POST /api/portal/confirmar-dados` → `POST /api/portal/questionario` → verificar roteamento de fluxo A/B/C
2. **ASO:** `POST /api/aso/generate` com dados reais — requer o arquivo `libs/pdf-template-aso.html` criado
3. **Auth JWT (backend only):** `POST /api/auth/login` pode ser testado via Postman/Insomnia — o frontend não o consome ainda

