# Fase  6 — Fechamento do Fluxo para Primeira Rodada de Testes

**Objetivo:** Tornar a aplicação 100% funcional de ponta a ponta para a primeira fase de testes reais, sem mocks, sem campos manuais, sem fluxos quebrados.

**Pré-requisito:** Backend e frontend da versão atual (Back.zip + Front.zip) com os bugs da REVISAO-BACKEND.md corrigidos.

---

## Diagnóstico do estado atual

### O problema central que você descreveu

> "Quando cria um novo pedido de paciente/funcionário, ele fica aguardando que o paciente abra o sistema dele através do link — mas o paciente não aparece para os médicos."

**A causa raiz identificada no código:**

O fluxo via convite (`source: 'convite_empresa'`) funciona assim hoje:

```
Empresa cria invite → ExamInvite criado, status ENVIADO
  ↓
Funcionário recebe link por e-mail
  ↓
Funcionário acessa /p/{token} → valida CPF+nascimento → POST /api/portal/auth
  ↓  [portal.service.ts: auth()]
  ↓  status do invite muda para ABERTO
  ↓  ExamRequest já existe (criado pelo colaborador.service.ts no signup)
  ↓  
Funcionário responde questionário → POST /api/portal/questionario
  ↓  [portal.service.ts: responderQuestionario()]
  ↓  status muda para NA_FILA_MEDICA ou AGUARDANDO_EXAMES
  ↓
SE NA_FILA_MEDICA:
  ↓  ← AQUI ESTÁ O BURACO ❌
  ↓  QueueEntry NÃO é criado pelo portal.service.ts
  ↓  O médico chama GET /api/queue?doctorId=X
  ↓  Filtra QueueEntry com status WAITING — que não existe
  ↓  Médico não vê ninguém na fila
```

O `portal.service.ts` atualiza o `ExamRequest.status` para `'NA_FILA_MEDICA'` mas **nunca cria o `QueueEntry`**. Sem `QueueEntry`, o médico não vê o paciente.

**Segundo problema:** O fluxo de check-in direto (`source: 'direto'`) na clínica também tem lacuna: após salvar os exames em `/consultorio/exames/:id`, o operador precisa clicar em "Enviar para fila" manualmente — mas a tela `/consultorio/exames/:id` envia `valueJson: {}` (vazio) e não coleta os campos do `ExamForm`.

**Terceiro problema:** A tela de teleconsulta do médico exige que `videoRoomUrl` exista para habilitar o botão "Emitir ASO" — mas não há endpoint de criação de sala implementado (`POST /api/teleconsultation/create-room` retorna 404). O botão fica permanentemente desabilitado.

---

## Mapa de todos os fluxos e seus status

| Fluxo | Trecho quebrado | Impacto |
|-------|----------------|---------|
| Convite → Portal → Fila médica | `QueueEntry` não criado após questionário | Médico não vê paciente |
| Check-in direto → Fila | `ExamForm` não coleta dados reais; `valueJson: {}` enviado | Exame salvo sem valores |
| Médico aceita → Teleconsulta | `POST /api/teleconsultation/create-room` não existe | Botão de ASO desabilitado |
| Médico emite ASO → Paciente baixa | `pdfUrl` retornado como path local `/uploads/aso/...` | Funciona se `useStaticAssets` estiver OK; verificar |
| Empresa vê status em tempo real | WebSocket `join_company` com namespace `/company` — frontend não emite `join_company` | Painel não atualiza em tempo real |
| Portal: upload de documento | Frontend envia arquivo para `/api/upload/document` + URL para `/api/portal/documentos` — dois passos não coordenados na tela de documentos | Upload não reflete na verificação de docs obrigatórios |
| Portal: `linkSala` no processo | `teleconsulta.linkSala` vem de `teleconsultations[0].videoSessionId` — sem sala criada, sempre null | Tela de teleconsulta mostra "preparando..." eternamente |

---

## Tasks da Fase 6

---

### TASK-6-01 — Backend: criar `QueueEntry` ao avançar para `NA_FILA_MEDICA` no portal

**Arquivo:** `src/portal/portal.service.ts`  
**Prioridade:** 🔴 Crítico — sem isso o fluxo principal não funciona

**O que está errado:**
```ts
// portal.service.ts — responderQuestionario() — linha atual:
await this.prisma.examRequest.update({
  where: { id: processId },
  data: { status: nextStatus },  // nextStatus pode ser 'NA_FILA_MEDICA'
});
// QueueEntry NUNCA é criado aqui
```

**O que fazer:**

Injetar `QueueService` em `PortalModule` e chamar `enqueue()` quando o status for `NA_FILA_MEDICA`:

```ts
// portal.module.ts — adicionar QueueModule nos imports:
imports: [JwtModule.register({ ... }), QueueModule],

// portal.service.ts — adicionar no constructor:
constructor(
  private readonly prisma: PrismaService,
  private readonly jwtService: JwtService,
  private readonly queueService: QueueService,  // ← adicionar
) {}

// portal.service.ts — responderQuestionario() — substituir o bloco final:
await this.prisma.examRequest.update({
  where: { id: processId },
  data: { status: nextStatus },
});

if (nextStatus === 'NA_FILA_MEDICA') {
  // Verificar se QueueEntry já existe (idempotência)
  const existingEntry = await this.prisma.queueEntry.findUnique({
    where: { requestId: processId },
  });
  if (!existingEntry) {
    await this.queueService.enqueue(processId);
  }
}

return { success: true, status: nextStatus };
```

**Gate:** Após `POST /api/portal/questionario` com CBO sem exames obrigatórios, `GET /api/queue?doctorId={id}` retorna o paciente na lista. `QueueEntry` com `status: 'WAITING'` existe no banco.

---

### TASK-6-02 — Backend: criar `QueueEntry` ao avançar de `AGUARDANDO_EXAMES` para `NA_FILA_MEDICA`

**Arquivo:** `src/exams/exams.service.ts`  
**Prioridade:** 🔴 Crítico — fluxo B (com exames presenciais)

**Contexto:** Quando o operador finaliza a coleta de exames e clica "Enviar para fila" (`POST /api/exams/:id/send-to-queue`), o `sendToMedicalQueue()` já usa `upsert` para criar o `QueueEntry`. Este trecho **está correto**. 

**Porém:** quando o portal avança o processo de `AGUARDANDO_EXAMES` de volta para `NA_FILA_MEDICA` (cenário em que exames foram coletados na clínica e o operador envia para fila), o `QueueEntry` precisa existir. Verificar se o operador usa a rota `POST /api/exams/:id/send-to-queue` ou se existe lacuna.

**O que fazer:**

Adicionar verificação no `sendToMedicalQueue` para registrar evento na timeline via convite, quando existir:
```ts
// exams.service.ts — sendToMedicalQueue() — já usa upsert, OK
// Verificar: o convite está associado ao ExamRequest?
// request.invite pode ser null para pacientes de check-in direto
// Nesse caso não há timeline de empresa — isso é esperado.
```

**Ação concreta:** Confirmar em teste que `POST /api/exams/{id}/send-to-queue` para um ExamRequest de check-in direto (sem invite) não lança erro quando `request.invite` é `null`. Adicionar guarda:

```ts
if (request.invite) {
  // já existe — OK
  await this.prisma.examTimelineEvent.create({ ... });
  this.companyGateway.emitInviteStatusChange( ... );
}
// Se não tiver invite, apenas cria QueueEntry e atualiza status — sem emitir evento
```

**Gate:** Check-in direto → salvar exames → enviar para fila → médico vê paciente na fila. Sem erro 500 por `request.invite` null.

---

### TASK-6-03 — Backend: endpoint de teleconsulta (sala de vídeo simulada para testes)

**Arquivo:** `src/` — novo módulo `teleconsultation/` ou adicionar ao `queue/`  
**Prioridade:** 🔴 Crítico — sem isso o botão "Emitir ASO" fica permanentemente desabilitado

**Contexto:** A tela do médico tem:
```tsx
disabled={!decision || signing || ... || !videoRoomUrl}
```
`videoRoomUrl` vem de `solicitacao.teleconsultations[0].hostRoomUrl`. Se não existir `Teleconsultation` no banco com `videoSessionId` preenchido, o botão nunca habilita.

**Para testes (sem integração real):** Criar endpoint que gera uma sala simulada com URL fixa ou usando Whereby Free (sem API key, basta gerar URL):

```ts
// src/teleconsultation/teleconsultation.controller.ts
@Post('create-room')
async createRoom(@Body() body: { examRequestId: string; doctorId: string }) {
  const existingRoom = await this.prisma.teleconsultation.findFirst({
    where: { requestId: body.examRequestId },
  });
  if (existingRoom) return { success: true, data: existingRoom };

  // Para testes: gerar sala Whereby sem API (URL pública gratuita)
  // OU usar URL fixa de teste
  const roomName = `saudeseg-${body.examRequestId.slice(0, 8)}`;
  const videoSessionId = `https://whereby.com/${roomName}`;
  const hostRoomUrl = `${videoSessionId}?skipMediaPermissionPrompt`;

  const teleconsultation = await this.prisma.teleconsultation.create({
    data: {
      requestId: body.examRequestId,
      doctorId: body.doctorId,
      videoSessionId,       // URL do paciente
      hostRoomUrl,          // URL do médico (com parâmetro de host)
      startedAt: new Date(),
    },
  });

  // Atualizar status para EM_ATENDIMENTO_MEDICO
  await this.prisma.examRequest.update({
    where: { id: body.examRequestId },
    data: { status: 'EM_ATENDIMENTO_MEDICO' },
  });

  return { success: true, data: teleconsultation };
}
```

Registrar no `AppModule`. Marcar como `@Public()`.

**Verificar schema:** O modelo `Teleconsultation` tem `hostRoomUrl String?`? Se não existir, adicionar o campo via migration:
```prisma
model Teleconsultation {
  // ...campos existentes...
  hostRoomUrl   String?    // URL com controles de host (médico)
}
```

**Gate:** `POST /api/teleconsultation/create-room` com `examRequestId` e `doctorId` válidos cria registro no banco e retorna `hostRoomUrl`. `GET /api/solicitacoes/:id` retorna `teleconsultations[0].hostRoomUrl` preenchido. Botão "Emitir ASO" fica habilitado após criar sala.

---

### TASK-6-04 — Backend: `GET /api/solicitacoes/:id` incluir `hostRoomUrl` nas teleconsultas

**Arquivo:** `src/exam-request/exam-request.service.ts`  
**Prioridade:** 🔴 Crítico (depende de TASK-5-03)

**O que fazer:**

O `findOne()` já inclui `teleconsultations`. Verificar que `hostRoomUrl` está sendo retornado (campo novo no schema). Se adicionado na migration de TASK-5-03, não precisa alterar o service — o Prisma inclui automaticamente todos os campos do modelo. Apenas confirmar.

**Gate:** `GET /api/solicitacoes/:id` retorna `teleconsultations[0].hostRoomUrl` quando existe sala criada.

---

### TASK-6-05 — Backend: `GET /api/portal/processo` retornar `linkSala` correto

**Arquivo:** `src/portal/portal.service.ts`  
**Prioridade:** 🔴 Crítico (depende de TASK-5-03)

**Contexto:** `getProcesso()` retorna:
```ts
teleconsulta: {
  disponivel: !!(teleconsulta?.videoSessionId),
  linkSala: teleconsulta?.videoSessionId ?? null,  // URL do paciente ✅
},
```

O campo `videoSessionId` é a URL pública do paciente — isso está correto. O médico usa `hostRoomUrl`. Não há alteração necessária aqui além de confirmar que o include de `teleconsultations` no `getProcesso()` funciona após a migration.

**Gate:** Após sala criada via TASK-5-03, `GET /api/portal/processo` retorna `teleconsulta.linkSala` com URL da sala.

---

### TASK-6-06 — Backend: CORS para rede local

**Arquivo:** `src/main.ts`  
**Prioridade:** 🔴 Crítico para testes LAN (ver nota no TASKS.md)

**O que fazer:**

Substituir lista fixa de origins por variável de ambiente:
```ts
// main.ts — substituir:
app.enableCors({
  origin: ['http://localhost:3000', 'http://localhost:8081', 'http://10.0.2.2:3000'],
  // ...
});

// Por:
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:8081'];

app.enableCors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
});
```

Adicionar ao `backend/.env`:
```env
CORS_ORIGINS=http://localhost:3000,http://192.168.1.X:3000
APP_BASE_URL=http://192.168.1.X:3000
```

**Gate:** Frontend acessado pelo IP da rede (`http://192.168.1.X:3000`) consegue chamar o backend sem erro de CORS.

---

### TASK-6-07 — Frontend: tela de documentos do portal — coordenar upload + registro

**Arquivo:** `app/p/[token]/documentos/page.tsx`  
**Prioridade:** 🔴 Crítico

**Contexto atual:** A tela faz o upload do arquivo mas a coordenação com `/api/portal/documentos` não está completa — `GET /api/portal/documentos` busca os documentos mas o endpoint correto no backend é `getStatusDocumentos`.

**O que fazer:**

1. Verificar que `GET /api/portal/documentos` existe no `PortalController` (não está visível no código lido — apenas `POST`). Se não existir, adicionar:

```ts
// portal.controller.ts
@Public()
@Get('documentos')
@UseGuards(PortalSessionGuard)
async getDocumentos(@Req() req: Request) {
  const user = (req as any).user as PortalUser;
  return { success: true, data: await this.portalService.getStatusDocumentos(user.patientId, user.processId) };
}
```

2. O upload no frontend deve seguir o fluxo:
   - `POST /api/upload/document` com `FormData` → recebe `{ fileUrl }`
   - `POST /api/portal/documentos` com `{ tipo, fileUrl }` → registra no processo

A tela atual (`documentos/page.tsx`) faz upload mas não está claro se chama o segundo passo. Verificar e adicionar:

```ts
// documentos/page.tsx — handleUpload()
const uploadRes = await fetch(`${BACKEND_URL}/api/upload/document`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${portalToken}` },
  body: formData,
});
const uploadData = await uploadRes.json();

// Segundo passo: registrar no processo
await fetch(`${BACKEND_URL}/api/portal/documentos`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${portalToken}`,
  },
  body: JSON.stringify({ tipo, fileUrl: uploadData.fileUrl }),
});

// Recarregar lista
await fetchDocumentos();
```

**Gate:** Upload de RG marca o item como "✅ enviado" na lista. Após enviar RG e foto, o processo avança para `QUESTIONARIO_PENDENTE`.

---

### TASK-6-08 — Frontend: tela de exames do consultório — capturar valores reais do ExamForm

**Arquivo:** `app/consultorio/exames/[id]/page.tsx`  
**Prioridade:** 🔴 Crítico

**Problema:** A página envia `valueJson: {}` ao backend. O `ExamForm` existe como componente mas seus valores não são capturados:

```ts
// Estado atual — handleSaveExams():
body: JSON.stringify({
  examRequestId: params.id,
  examType,
  valueJson: {},  // ← VAZIO
}),
```

**O que fazer:**

1. Adicionar estado `examValues` que recebe os dados do `ExamForm` via callback:
```tsx
const [examValues, setExamValues] = useState<Record<string, string>>({});

// No ExamForm:
<ExamForm
  examType={examType}
  onChange={(values) => setExamValues(values)}
  onValidChange={(valid) => setIsFormValid(valid)}
/>
```

2. Usar `examValues` no submit:
```ts
body: JSON.stringify({
  examRequestId: params.id,
  examType,
  valueJson: examValues,  // ← valores reais
}),
```

3. Verificar o componente `ExamForm` (`components/ExamForm.tsx`) — se não tiver `onChange` prop, adicionar.

**Gate:** Após preencher pressão sistólica e diastólica no ExamForm e salvar, o banco contém `ExamResult.valueJson = {"pressao_sistolica":"120","pressao_diastolica":"80"}`. A tela do médico exibe os valores corretos.

---

### TASK-6-09 — Frontend: WebSocket — emitir `join_company` ao carregar painel da empresa

**Arquivo:** `app/empresa/page.tsx`  
**Prioridade:** 🟡 Alto

**Problema:** O `CompanyGateway` usa namespace `/company` e espera que o cliente emita `join_company` com `companyId` para entrar no room. O frontend atualmente conecta via WebSocket (`useQueue` em `api.ts`) mas não emite `join_company` com o namespace correto.

**O que fazer:**

Adicionar hook ou lógica de WebSocket específica para o painel da empresa. Como o frontend não tem `accessToken` ainda, usar `companyId` do localStorage ou da primeira empresa retornada pela API:

```ts
// app/empresa/page.tsx — após obter companyId:
useEffect(() => {
  if (!companyId) return;
  import('socket.io-client').then(({ io }) => {
    const socket = io(`${BACKEND_URL}/company`, {
      transports: ['websocket', 'polling'],
    });
    socket.on('connect', () => {
      socket.emit('join_company', { companyId });
    });
    socket.on('timeline_update', (payload) => {
      // Recarregar convites e stats
      fetchDashboard();
    });
    socket.on('invite_status_change', (payload) => {
      fetchDashboard();
    });
    return () => socket.disconnect();
  });
}, [companyId]);
```

**Gate:** Criar um convite na empresa e, sem recarregar a página do painel, ver o novo convite aparecer na tabela em até 2 segundos.

---

### TASK-6-10 — Frontend: tela do médico — criar sala antes de emitir ASO

**Arquivo:** `app/medico/consulta/[id]/page.tsx`  
**Prioridade:** 🔴 Crítico

**Problema:** O botão "Criar Sala de Teleconsulta" chama `apiCreateVideoRoom` — a função existe em `api.ts` mas o endpoint ainda não existia. Com TASK-5-03 implementado, apenas garantir que o fluxo frontend está correto:

```ts
// Verificar handleCreateRoom() na página — deve existir:
const handleCreateRoom = async () => {
  setCreatingRoom(true);
  try {
    const result = await apiCreateVideoRoom(params.id, doctorId);
    if (result.data?.hostRoomUrl) {
      setVideoRoomUrl(result.data.hostRoomUrl);
    }
  } catch {
    alert('Falha ao criar sala.');
  } finally {
    setCreatingRoom(false);
  }
};
```

Se o botão de criar sala não estiver visível na tela atual do médico quando não há sala, adicionar:

```tsx
{!videoRoomUrl && !isConcluido && (
  <button
    className="btn btn-secondary"
    onClick={handleCreateRoom}
    disabled={creatingRoom || !doctorId}
    style={{ width: '100%', justifyContent: 'center', marginBottom: '12px' }}
  >
    {creatingRoom ? 'Criando sala...' : '📹 Criar Sala de Teleconsulta'}
  </button>
)}
{videoRoomUrl && (
  <a
    href={videoRoomUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="btn btn-secondary"
    style={{ width: '100%', justifyContent: 'center', marginBottom: '12px', textDecoration: 'none' }}
  >
    <VideoCameraIcon className="icon" /> Entrar na Sala
  </a>
)}
```

**Gate:** Médico clica "Criar Sala" → sala é criada → link aparece → médico entra na sala → botão "Emitir ASO" é habilitado → médico emite ASO → ASO aparece no portal do paciente.

---

### TASK-6-11 — Frontend: portal — tela de processo lê campo correto para etapa atual

**Arquivo:** `app/p/[token]/processo/page.tsx`  
**Prioridade:** 🟡 Alto

**Problema:** A barra de progresso usa `data?.etapaAtual` para calcular o índice, mas o backend retorna `progresso[]` (array de steps com `concluido`/`ativo`) — não retorna `etapaAtual` como string. O frontend está esperando um campo que não existe no shape atual.

**O que fazer:**

Adaptar o cálculo do índice para usar o array `progresso`:

```ts
// Substituir:
const etapaIndex = getEtapaAtualIndex(data?.etapaAtual);

// Por:
const progresso = (data as any)?.progresso ?? [];
const etapaIndex = progresso.findIndex((s: any) => s.ativo && !s.concluido);
// Se todos concluídos, mostra o último
const resolvedIndex = etapaIndex >= 0 ? etapaIndex : progresso.length - 1;
```

Usar `resolvedIndex` no lugar de `etapaIndex` no JSX.

**Gate:** Barra de progresso mostra o step correto para cada status do processo (ex: status `NA_FILA_MEDICA` → step "Médico" ativo).

---

### TASK-6-12 — Frontend: portal — questionário envia campos no formato correto

**Arquivo:** `app/p/[token]/questionario/page.tsx`  
**Prioridade:** 🔴 Crítico

**Problema:** O frontend envia:
```ts
body: JSON.stringify({ processId, respostas })
```

Mas o backend espera o `QuestionarioDto` com campos diretos (`queixas`, `doencasPrevias`, `medicamentosEmUso`, etc.) — não um objeto `respostas` aninhado.

**O que fazer:**

```ts
// Substituir:
body: JSON.stringify({ processId, respostas }),

// Por:
body: JSON.stringify({
  queixas: respostas.queixas ?? '',
  doencasPrevias: respostas.doencasPrevias ?? '',
  medicamentosEmUso: respostas.medicamentosEmUso ?? '',
  alergiasConhecidas: respostas.alergiasConhecidas ?? '',
  cirurgiasPrevias: respostas.cirurgiasPrevias ?? '',
  observacoes: respostas.observacoes ?? '',
}),
```

O `processId` **não deve ser enviado no body** — o backend extrai o `processId` do `SessionToken` via `PortalSessionGuard`.

**Gate:** `POST /api/portal/questionario` com as respostas retorna `{ success: true, status: 'NA_FILA_MEDICA' }` ou `AGUARDANDO_EXAMES`. Sem erro 400 de validação.

---

### TASK-5-13 — Backend: `POST /api/portal/auth` retornar campos extras para o frontend

**Arquivo:** `src/portal/portal.service.ts`  
**Prioridade:** 🟡 Alto

**Contexto:** O frontend tenta salvar `companyName`, `patientName` e `examPurpose` do response de `auth`:

```ts
sessionStorage.setItem('companyName', data.data?.companyName ?? '');
sessionStorage.setItem('patientName', data.data?.patientName ?? '');
sessionStorage.setItem('examPurpose', data.data?.examPurpose ?? '');
```

Mas o `auth()` retorna apenas `{ sessionToken, processId }` — sem esses campos.

**O que fazer:**

```ts
// portal.service.ts — auth() — retorno:
return {
  sessionToken,
  processId: examRequest.id,
  patientName: patient.name,
  companyName: invite.company?.nomeFantasia ?? invite.company?.name ?? '',
  examPurpose: invite.examType,
};
```

**Gate:** Tela de boas-vindas (`processo/page.tsx`) exibe o nome do paciente, nome da empresa e tipo de exame corretos após o login.

---

### TASK-6-14 — Backend: verificar `ExamType` para ExamResult sem type

**Arquivo:** `src/exams/exams.service.ts`  
**Prioridade:** 🟡 Alto

**Problema (BUG-001 da revisão):** O service busca `ExamType` pelo `name` mas o seed pode ter nomes diferentes dos usados pelo service. Se `typeId = 'default'` for salvo, o `ExamResult` não tem FK válida.

**O que fazer:**

Substituir o fallback `'default'` por um `upsert` do ExamType:

```ts
// exams.service.ts — createExam():
let examTypeRecord = await this.prisma.examType.findFirst({
  where: { name: examType },
});

if (!examTypeRecord) {
  // Criar automaticamente se não existir
  examTypeRecord = await this.prisma.examType.create({
    data: {
      name: examType,
      category: 'outros',
      requiresEquipment: false,
      canBeRemoteReview: true,
      validityDays: 365,
    },
  });
}

const result = await this.prisma.examResult.create({
  data: {
    requestId: examRequestId,
    typeId: examTypeRecord.id,  // nunca mais 'default'
    valueJson: JSON.stringify(valueJson),
    collectedById: 'system',
    source: 'manual',
  },
});
```

**Gate:** `POST /api/exams` com qualquer `examType` (mesmo sem registro no seed) cria o `ExamResult` sem erro de FK.

---

## Fluxos completos após a Fase 6

### Fluxo A — Convite → Portal → Teleconsulta direta

```
1. Empresa cria convite → e-mail enviado ao funcionário com link /p/{token}
2. Funcionário abre link → digita CPF + data de nascimento
3. POST /api/portal/auth → sessionToken salvo no sessionStorage
4. Funcionário confirma dados → POST /api/portal/confirmar-dados
5. Funcionário envia documentos (RG + foto) → upload + POST /api/portal/documentos
6. Funcionário responde questionário → POST /api/portal/questionario
   → CBO sem exames obrigatórios → status: NA_FILA_MEDICA
   → QueueEntry criado (TASK-5-01) ← FIX PRINCIPAL
7. Médico vê paciente na fila → GET /api/queue?doctorId=X
8. Médico clica "Atender" → POST /api/queue/:id/accept
   → ExamRequest.status = EM_ATENDIMENTO_MEDICO
9. Médico cria sala → POST /api/teleconsultation/create-room
   → Teleconsultation criada com videoSessionId e hostRoomUrl
10. Portal do funcionário polling detecta EM_ATENDIMENTO_MEDICO + linkSala
    → tela mostra "Entrar na teleconsulta"
11. Funcionário e médico entram na sala de vídeo
12. Médico seleciona decisão → clica "Emitir ASO"
    → POST /api/aso/generate → AsoDocument + PDF criado
    → ExamRequest.status = CONCLUIDO
13. Portal do funcionário: próxima ação = BAIXAR_ASO
14. Funcionário baixa o PDF
```

### Fluxo B — Check-in direto na clínica → Fila

```
1. Operador faz check-in → POST /api/exams/create-patient
   → Patient + ExamRequest (status: AGUARDANDO_COLETA)
2. Operador acessa /consultorio/exames/:id
3. Operador preenche ExamForm com valores reais (TASK-5-08)
4. Operador clica "Salvar Exames" → POST /api/exams com valueJson real
   → ExamRequest.status = EM_COLETA
5. Operador clica "Enviar para Fila" → POST /api/exams/:id/send-to-queue
   → ExamRequest.status = NA_FILA_MEDICA
   → QueueEntry criado (já funciona via upsert)
6. Médico vê paciente → mesmo fluxo do passo 7 em diante do Fluxo A
```

---

## Resumo das tasks por prioridade

| Task | Descrição | Frente | Prioridade |
|------|-----------|--------|-----------|
| 5-01 | Criar QueueEntry após questionário no portal | Backend | 🔴 Crítico |
| 5-03 | Endpoint de criação de sala de teleconsulta | Backend | 🔴 Crítico |
| 5-06 | CORS para rede local (LAN) | Backend | 🔴 Crítico |
| 5-08 | ExamForm capturar valores reais | Frontend | 🔴 Crítico |
| 5-10 | Botão criar sala na tela do médico | Frontend | 🔴 Crítico |
| 5-12 | Questionário: formato correto do body | Frontend | 🔴 Crítico |
| 5-02 | Guarda null no invite ao enviar para fila | Backend | 🔴 Crítico |
| 5-04 | Incluir hostRoomUrl no findOne | Backend | 🔴 Crítico |
| 5-07 | Documentos: dois passos coordenados | Frontend | 🔴 Crítico |
| 5-13 | auth() retornar patientName/companyName | Backend | 🟡 Alto |
| 5-14 | ExamType upsert ao criar ExamResult | Backend | 🟡 Alto |
| 5-05 | Confirmar linkSala no getProcesso | Backend | 🟡 Alto |
| 5-09 | WebSocket join_company no painel empresa | Frontend | 🟡 Alto |
| 5-11 | Barra de progresso usar array progresso[] | Frontend | 🟡 Alto |

---

## Checklist de verificação pré-teste

Antes de iniciar os testes com usuários reais, verificar:

- [ ] `npx prisma db seed` roda sem erro (senhas hasheadas, ExamType com nomes corretos, OccupationalRisk com CBOs)
- [ ] `libs/pdf-template-aso.html` existe no repositório
- [ ] `backend/.env` tem `JWT_SECRET`, `APP_BASE_URL`, `CORS_ORIGINS` configurados com o IP da rede local
- [ ] `web/.env.local` tem `NEXT_PUBLIC_BACKEND_URL` apontando para o IP da rede local (não localhost)
- [ ] `next dev --hostname 0.0.0.0` está sendo usado para expor o frontend na rede
- [ ] Criar um convite pelo painel da empresa → link chega no e-mail (ou copiar o token do banco)
- [ ] Abrir o link no celular → validar identidade → completar o fluxo até "Aguardar médico"
- [ ] No computador do médico, ver o paciente na fila → atender → criar sala → emitir ASO
- [ ] No celular, ver a notificação de teleconsulta disponível → entrar na sala → após encerrar, ver "Baixar ASO"
