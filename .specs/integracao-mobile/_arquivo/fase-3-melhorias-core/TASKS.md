# ⚠️ Nota de Ambiente — Teste Local em Rede (LAN)

> Esta nota é específica para o ciclo de testes da Fase 3E (Portal do Funcionário).  
> O link do paciente (`/p/{token}`) precisa funcionar no celular do funcionário real via rede local.

## O problema

Por padrão o frontend roda em `localhost:3000` e o backend em `localhost:3001`.  
Esses endereços só existem dentro do próprio computador de desenvolvimento — um celular na mesma rede não consegue acessá-los.

## A solução para dev local: IP da máquina na rede

Não é necessária nenhuma ferramenta externa. Basta usar o IP local da máquina de desenvolvimento.

### Passo 1 — Descobrir o IP local

```bash
# macOS / Linux
ipconfig getifaddr en0        # macOS Wi-Fi
ip route get 1 | awk '{print $7; exit}'  # Linux

# Windows
ipconfig | findstr "IPv4"
```

Exemplo de resultado: `192.168.1.42`

---

### Passo 2 — Subir o frontend acessível na rede

Alterar o script `dev` no `web/package.json` para expor em todas as interfaces:

```json
// web/package.json — scripts
"dev": "next dev --port 3000 --hostname 0.0.0.0"
```

Ou rodar diretamente:

```bash
npx next dev --port 3000 --hostname 0.0.0.0
```

O frontend passa a responder em: `http://192.168.1.42:3000`

---

### Passo 3 — Subir o backend acessível na rede

O NestJS já escuta em `0.0.0.0` por padrão quando porta é passada via `listen(3001)`.  
Não requer alteração. Confirmar que firewall local não bloqueia a porta 3001.

---

### Passo 4 — Atualizar as variáveis de ambiente

**`web/.env.local`** — apontar o frontend para o backend pelo IP real:

```env
# Substituir localhost pelo IP da máquina de dev
NEXT_PUBLIC_BACKEND_URL=http://192.168.1.42:3001
```

Reiniciar o servidor Next.js após alterar o `.env.local`.

---

### Passo 5 — Liberar o CORS no backend para o novo origin

Em `src/main.ts`, adicionar o origin com o IP da rede local:

```ts
app.enableCors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8081',
    'http://10.0.2.2:3000',
    'http://192.168.1.42:3000',  // ← adicionar (trocar pelo IP real)
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
});
```

Para não precisar editar esse arquivo a cada troca de IP, aceitar todos os origins em dev via variável de ambiente:

```ts
// main.ts — versão flexível para desenvolvimento
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:8081'];

app.enableCors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
});
```

```env
# backend/.env
CORS_ORIGINS=http://localhost:3000,http://192.168.1.42:3000
```

---

### Passo 6 — Gerar o link do portal com o IP correto

O link enviado ao funcionário (`/p/{token}`) deve usar o IP da rede:

```
http://192.168.1.42:3000/p/{token}
```

Ao registrar o invite no banco, garantir que o campo de "base URL" do link usa `NEXT_PUBLIC_BACKEND_URL` (ou uma variável `APP_BASE_URL` dedicada) em vez de `localhost` hardcoded.

Se houver geração de link no backend (ex: corpo do e-mail/SMS), adicionar variável:

```env
# backend/.env
APP_BASE_URL=http://192.168.1.42:3000
```

E usar no serviço de convite:

```ts
const link = `${process.env.APP_BASE_URL}/p/${invite.token}`;
```

---

### Resumo de arquivos a alterar para testes LAN

| Arquivo | Alteração |
|---------|-----------|
| `web/package.json` | `"dev": "next dev --port 3000 --hostname 0.0.0.0"` |
| `web/.env.local` | `NEXT_PUBLIC_BACKEND_URL=http://{SEU_IP}:3001` |
| `backend/.env` | `CORS_ORIGINS=http://localhost:3000,http://{SEU_IP}:3000` |
| `backend/.env` | `APP_BASE_URL=http://{SEU_IP}:3000` |
| `backend/src/main.ts` | Ler `CORS_ORIGINS` da env em vez de lista fixa |

> **Importante:** Substituir `192.168.1.42` pelo IP real da máquina a cada sessão de desenvolvimento (o IP pode mudar ao reconectar ao Wi-Fi). Uma alternativa mais estável é reservar IP fixo para a máquina de dev no roteador via DHCP.

---

# Fase 3 — Tasks de Execução

**Ordenação:** por dependência técnica e prioridade de produto.  
**Convenção de commit:** `feat(escopo): descrição` por task. Um commit por task.  
**Gate:** cada task tem critério de verificação antes de avançar.

---

## Fase 3 — Mapa de Fases

```
FASE 3A — Fundação (sem isso, nada roda certo)
  └── Correções críticas de banco + seed

FASE 3B — Fluxo Core do Médico (teleconsulta de ponta a ponta)
  └── Dados reais na consulta + ASO persistido

FASE 3C — Clínica completa (check-in multi-exame + anamnese)
  └── Multi-exame + modelo de anamnese

FASE 3D — Empresa completa (documentos + configurações)
  └── Upload PCMSO/PPRA + configs

FASE 3E — Portal do Funcionário (fluxo guiado)
  └── Acesso por token + jornada guiada

FASE 3F — Autenticação
  └── JWT para todos os outros atores (médico, empresa, clínica)
```

---

## FASE 3A — Fundação

> Pré-requisito para qualquer outra fase. Corrige os gaps G01–G08 que quebram fluxos em produção.

---

### TASK-001 — Criar enum `ExamRequestStatus` no schema Prisma

**Spec:** GAPS-E-RISCOS G06  
**Arquivo:** `prisma/schema.prisma` + migration

**O que fazer:**
1. Substituir `status String` em `ExamRequest` por `status ExamRequestStatus`
2. Criar enum:
```prisma
enum ExamRequestStatus {
  AGUARDANDO_COLETA
  DOCUMENTOS_PENDENTES
  QUESTIONARIO_PENDENTE
  EM_COLETA
  AGUARDANDO_EXAMES
  NA_FILA_MEDICA
  EM_ATENDIMENTO_MEDICO
  CONCLUIDO
}
```
3. Rodar `npx prisma migrate dev --name add-exam-request-status-enum`
4. Substituir todas as strings soltas nos services pelos valores do enum importado do Prisma client

**Arquivos afetados:**
- `prisma/schema.prisma`
- `src/exams/exams.service.ts` (3 ocorrências de status string)
- `src/queue/queue.service.ts` (1 ocorrência)
- `src/exam-request/exam-request.service.ts` (1 ocorrência)
- `src/colaborador/colaborador.service.ts` (1 ocorrência)

**Gate:** `npx prisma validate` passa. Build TypeScript compila sem erro. Todas as referências a `status: 'AGUARDANDO_COLETA'` (e similares) usam o enum.

---

### TASK-002 — Criar enum `QueueEntryStatus` e `TimelineEventType` completo

**Spec:** GAPS-E-RISCOS G07 + F6 (novos eventos de timeline)  
**Arquivo:** `prisma/schema.prisma` + migration

**O que fazer:**
1. Substituir `status String` em `QueueEntry` por `status QueueEntryStatus`
2. Criar enum:
```prisma
enum QueueEntryStatus {
  WAITING
  IN_PROGRESS
  COMPLETED
}
```
3. Adicionar ao enum `TimelineEventType` os novos valores necessários para o portal:
```prisma
// Adicionar aos existentes:
DADOS_CONFIRMADOS
DOCUMENTOS_ENVIADOS
QUESTIONARIO_RESPONDIDO
TELECONSULTA_INICIADA
```
4. Migration: `npx prisma migrate dev --name add-queue-status-timeline-events`
5. Substituir strings nos services pelos valores do enum

**Arquivos afetados:**
- `prisma/schema.prisma`
- `src/queue/queue.service.ts`

**Gate:** Build TypeScript compila. Enum `TimelineEventType` inclui todos os novos valores.

---

### TASK-003 — Auditar e corrigir o seed

**Spec:** GAPS-E-RISCOS G01, G02, G12  
**Arquivo:** `prisma/seed-mock.ts`

**O que fazer:**
1. Verificar se existe `Operator` criado com id fixo. Se `collectedById: 'system'` for usado em `exams.service.ts`, garantir que o seed cria um `Operator` cujo `userId` tem um `UserAccount` com `id = 'system'` — OU alterar o service para buscar o operador padrão da clínica (preferível)
2. Verificar se `ExamType` é criado com os nomes reais usados pelo check-in:
```ts
// Garantir que existem no seed:
{ name: 'pa', category: 'biometria' }
{ name: 'acuidade_visual', category: 'oftalmologia' }
{ name: 'audiometria', category: 'otologia' }
{ name: 'peso_altura', category: 'biometria' }
{ name: 'glicemia', category: 'laboratorial' }
```
3. Garantir que `OccupationalRisk` tem ao menos 4 CBOs comuns:
```ts
{ cboCode: '4110-05', functionName: 'Auxiliar Administrativo', riskGrade: 'I', requiresInPerson: false, requiredExams: [] }
{ cboCode: '7171-10', functionName: 'Pedreiro', riskGrade: 'III', requiresInPerson: true, requiredExams: ['audiometria'] }
{ cboCode: '3513-05', functionName: 'Técnico de Informática', riskGrade: 'I', requiresInPerson: false, requiredExams: [] }
{ cboCode: '5142-05', functionName: 'Faxineiro', riskGrade: 'II', requiresInPerson: true, requiredExams: ['pa', 'peso_altura'] }
```
4. Garantir que `Doctor` do seed tem `city` e `state` preenchidos (necessário para prioridade geográfica da fila)
5. Corrigir `collectedById` no service: em vez de `'system'`, buscar o primeiro `Operator` da clínica do `ExamRequest`:
```ts
const operator = await this.prisma.operator.findFirst({ where: { clinicId: request.clinicId } });
// fallback: se não achar, lançar erro descritivo
```

**Arquivos afetados:**
- `prisma/seed-mock.ts`
- `src/exams/exams.service.ts` (corrigir `collectedById`)

**Gate:** `npx prisma db seed` roda sem erro. `npx prisma studio` mostra ExamType, OccupationalRisk e Operator com dados corretos.

---

### TASK-004 — Corrigir ordem de rotas em `ExamsController` e `SignatureService`

**Spec:** GAPS-E-RISCOS G03, G04  
**Arquivos:** `src/exams/exams.controller.ts`, `src/signature/signature.service.ts`

**O que fazer:**
1. Em `exams.controller.ts`, reordenar rotas para que estáticas venham antes das parametrizadas:
```ts
@Post('create-patient')   // PRIMEIRO — rota estática
@Post()                   // SEGUNDO
@Post(':id/send-to-queue') // TERCEIRO — rota parametrizada
```
2. Em `signature.service.ts`, remover a guarda `examRequestId !== '1'` (mock desnecessário que bloqueia qualquer ID real)
3. Verificar e criar `libs/pdf-template-aso.html` se não existir no repositório. Template mínimo:
```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>ASO</title></head>
<body>
  <h1>Atestado de Saúde Ocupacional</h1>
  <p><strong>Paciente:</strong> {{patientName}}</p>
  <p><strong>CPF:</strong> {{patientCpf}}</p>
  <p><strong>Empresa:</strong> {{companyName}}</p>
  <p><strong>Tipo de Exame:</strong> {{examPurpose}}</p>
  <p><strong>Data:</strong> {{examDate}}</p>
  <p><strong>Decisão:</strong> {{decision}}</p>
  <p><strong>Restrições:</strong> {{restrictionNotes}}</p>
  <p><strong>Médico:</strong> {{doctorName}} — {{doctorCrm}}</p>
  <p><strong>Válido até:</strong> {{validUntil}}</p>
</body>
</html>
```

**Gate:** `POST /api/exams/create-patient` não é interceptado por outra rota. `POST /api/signature/generate` com qualquer UUID retorna sem erro de "ExamRequest inválido".

---

### TASK-005 — Adicionar try/catch nos WebSocket emits

**Spec:** GAPS-E-RISCOS G08  
**Arquivos:** `src/company/company.gateway.ts`, `src/queue/queue.gateway.ts`

**O que fazer:**
Wrapping de todos os métodos `emit*` em try/catch para que falha de WebSocket não propague exception e não quebre a transação principal:
```ts
emitTimelineUpdate(companyId: string, payload: unknown) {
  try {
    this.server.to(`company:${companyId}`).emit('timeline_update', payload);
  } catch (err) {
    console.error('[Gateway] Falha ao emitir timeline_update:', err);
  }
}
```

**Gate:** Nenhum método de emit pode lançar exceção não tratada.

---

### TASK-006 — Corrigir duplicação de QueueEntry (G05)

**Spec:** GAPS-E-RISCOS G05  
**Arquivos:** `src/exams/exams.service.ts`, `src/queue/queue.service.ts`

**O que fazer:**
`ExamsService.sendToMedicalQueue()` e `QueueService.enqueue()` ambos criam `QueueEntry`. Unificar: `ExamsService.sendToMedicalQueue()` deve **delegar** para `QueueService.enqueue()` em vez de criar o `QueueEntry` diretamente. Isso centraliza a lógica de fila em um único lugar.

```ts
// exams.service.ts
async sendToMedicalQueue(examRequestId: string) {
  // ... atualiza status do ExamRequest ...
  await this.queueService.enqueue(examRequestId); // delega, não duplica
}
```

Injetar `QueueService` em `ExamsModule` (cuidado com dependência circular — usar `forwardRef` se necessário).

**Gate:** Chamar `POST /api/exams/:id/send-to-queue` e depois `GET /api/queue` mostra exatamente 1 entrada para o `ExamRequest`. Chamadas duplicadas fazem `upsert` em vez de falhar.

---

## FASE 3B — Fluxo Core do Médico

> Fecha o fluxo de teleconsulta de ponta a ponta: médico vê dados reais, emite ASO real.

---

### TASK-007 — Enriquecer `GET /api/solicitacoes/:id` com todos os dados necessários

**Spec:** B1-REQ-001, B1-REQ-002  
**Arquivo:** `src/exam-request/exam-request.service.ts`

**O que fazer:**
Atualizar `findOne()` para incluir:
```ts
include: {
  patient: true,
  clinic: true,
  invite: { include: { company: true } },
  results: { include: { type: true } },
  asoDocuments: { include: { doctor: true } },
  teleconsultations: true,
  queueEntry: true,
}
```
Parsear `ExamResult.valueJson` (string) → objeto antes de retornar:
```ts
results: request.results.map(r => ({
  ...r,
  valueJson: JSON.parse(r.valueJson),
}))
```

**Gate:** `GET /api/solicitacoes/:id` para uma solicitação com resultados retorna `results[0].valueJson` como objeto (não string). Campo `asoDocuments` presente no retorno.

---

### TASK-008 — Adicionar `GET /api/medicos` (listagem de médicos)

**Spec:** B1-REQ-004  
**Arquivos:** `src/medicos/medicos.controller.ts`, `src/medicos/medicos.service.ts`

**O que fazer:**
```ts
// medicos.service.ts
async findAll() {
  return this.prisma.doctor.findMany({
    select: { id: true, name: true, crmNumber: true, crmState: true, status: true, city: true, state: true },
    orderBy: { name: 'asc' },
  });
}

// medicos.controller.ts
@Get()
async findAll() {
  const data = await this.medicosService.findAll();
  return { success: true, data };
}
```

**Gate:** `GET /api/medicos` retorna array com ao menos o médico do seed.

---

### TASK-009 — Frontend: tela de consulta com dados reais

**Spec:** F1-REQ-001, F1-REQ-002, F1-REQ-003, F1-REQ-004  
**Arquivo:** `app/medico/consulta/[id]/page.tsx`

**O que fazer:**
1. Adicionar `apiGetSolicitacao` em `api.ts` se necessário (já existe — apenas usar)
2. Chamar `apiGetSolicitacao(params.id)` no mount com `useEffect`
3. Substituir `MOCK_EXAMS` pelo mapeamento de `solicitacao.results`:
```ts
const exams = solicitacao.results.map(r => ({
  label: r.type.name,
  values: r.valueJson, // objeto com chave→valor
  collectedAt: r.collectedAt,
}))
```
4. Substituir dados hardcoded do cabeçalho (`Carlos Mendes`, CPF fixo) pelos dados do paciente real
5. Aba Anamnese: exibir `solicitacao.anamnese` quando existir (campo adicionado em TASK-016); por ora mostrar "Anamnese não coletada"
6. States: `loading` (spinner), `error` (mensagem legível)
7. Regra de indicação de atenção para valores numéricos:
```ts
const isAtencao = (label: string, value: string) => {
  if (label === 'pressao_sistolica' && Number(value) > 140) return true;
  if (label === 'pressao_diastolica' && Number(value) > 90) return true;
  return false;
};
```

**Gate:** Acessar `/medico/consulta/{id-real}` mostra o nome do paciente vindo do banco. Exames reais aparecem. Mock `MOCK_EXAMS` não existe mais no arquivo.

---

### TASK-010 — Frontend: fila do médico com dropdown de seleção

**Spec:** F1-REQ-005  
**Arquivos:** `app/medico/fila/page.tsx`, `app/lib/api.ts`

**O que fazer:**
1. Adicionar em `api.ts`:
```ts
export async function apiListMedicos() {
  const res = await fetch(`${BACKEND_URL}/api/medicos`);
  if (!res.ok) throw new Error('Falha ao buscar médicos');
  return res.json();
}
```
2. Na fila: substituir `<input id="doctor-id" />` por `<select>` carregado com `apiListMedicos()`
3. Manter salvamento em `localStorage` do `doctorId` selecionado
4. Ao selecionar médico no dropdown, carregar fila imediatamente

**Gate:** Dropdown exibe médicos do banco. Selecionar um médico carrega sua fila sem precisar colar ID manualmente.

---

### TASK-011 — ASO: persistir `AsoDocument` no banco

**Spec:** B2-REQ-001, B2-REQ-002  
**Arquivos:** `src/exam-request/exam-request.service.ts`, `src/exam-request/exam-request.controller.ts`

**O que fazer:**
1. Atualizar `PATCH /api/solicitacoes/:id` para aceitar novos campos no body:
```ts
body: { status: string; laudoTexto?: string; decision?: string; restrictionNotes?: string; doctorId?: string }
```
2. Quando `decision` estiver presente, criar `AsoDocument` atomicamente:
```ts
if (body.decision) {
  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 1);
  await this.prisma.asoDocument.create({
    data: {
      requestId: id,
      doctorId: body.doctorId ?? 'system',
      decision: body.decision,
      restrictionNotes: body.restrictionNotes,
      validUntil,
    },
  });
}
```
3. Atualizar `PATCH` no frontend (`app/medico/consulta/[id]/page.tsx`) para enviar `decision` e `restrictionNotes`:
```ts
await apiUpdateSolicitacao(params.id, {
  status: 'CONCLUIDO',
  decision,
  restrictionNotes: restriction,
  laudoTexto: decision === 'APTO_COM_RESTRICAO' ? restriction : decision,
});
```

**Gate:** Após clicar "Emitir ASO" com decisão APTO, existe registro em `AsoDocument` no banco com `decision = 'APTO'` e `validUntil` ~1 ano no futuro.

---

### TASK-012 — ASO: gerar PDF com dados reais

**Spec:** B2-REQ-003, B2-REQ-004, B2-REQ-005, B2-REQ-006  
**Arquivo:** `src/aso/aso.service.ts`

**O que fazer:**
1. Reescrever `generatePdf(asoDocumentId)`:
```ts
async generatePdf(asoDocumentId: string) {
  const aso = await this.prisma.asoDocument.findUnique({
    where: { id: asoDocumentId },
    include: {
      request: { include: { patient: true, clinic: true, invite: { include: { company: true } } } },
      doctor: true,
    },
  });
  if (!aso) throw new NotFoundException('AsoDocument não encontrado');

  const templatePath = path.join(process.cwd(), 'libs', 'pdf-template-aso.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  const fields = {
    patientName: aso.request.patient.name,
    patientCpf: aso.request.patient.cpf,
    companyName: aso.request.invite?.company?.razaoSocial ?? '—',
    examPurpose: aso.request.examPurpose,
    examDate: new Date().toLocaleDateString('pt-BR'),
    decision: aso.decision,
    restrictionNotes: aso.restrictionNotes ?? 'Nenhuma',
    doctorName: aso.doctor.name,
    doctorCrm: `CRM/${aso.doctor.crmState} ${aso.doctor.crmNumber}`,
    validUntil: aso.validUntil?.toLocaleDateString('pt-BR') ?? '—',
  };

  Object.entries(fields).forEach(([key, value]) => {
    html = html.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value);
  });

  const outputDir = path.join(process.cwd(), 'uploads', 'aso');
  fs.mkdirSync(outputDir, { recursive: true });
  const pdfPath = path.join(outputDir, `aso-${asoDocumentId}.pdf`);

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({ path: pdfPath, format: 'A4' });
  await browser.close();

  const pdfUrl = `/uploads/aso/aso-${asoDocumentId}.pdf`;
  await this.prisma.asoDocument.update({ where: { id: asoDocumentId }, data: { pdfUrl } });

  return { pdfUrl };
}
```
2. Adicionar `GET /api/aso/:id` para servir o PDF:
```ts
@Get(':id')
async getPdf(@Param('id') id: string, @Res() res: Response) {
  const aso = await this.prisma.asoDocument.findUnique({ where: { id } });
  if (!aso?.pdfUrl) throw new NotFoundException('PDF não disponível');
  res.sendFile(path.join(process.cwd(), aso.pdfUrl));
}
```
3. Configurar `ServeStaticModule` ou `app.useStaticAssets` para servir a pasta `uploads/`
4. Remover a guarda `asoDocumentId !== '1'` e `examRequestId !== '1'` do `SignatureService`

**Injetar `PrismaService` em `AsoService`** (adicionar no constructor e no module).

**Gate:** Chamar `POST /api/aso/generate` com um `asoDocumentId` real retorna `pdfUrl` preenchido. `GET /api/aso/:id` retorna o PDF. O PDF contém o nome real do paciente (não "Carlos Mendes").

---

### TASK-013 — Frontend: modo leitura na consulta para exames CONCLUIDO

**Spec:** F2-REQ-003  
**Arquivo:** `app/medico/consulta/[id]/page.tsx`

**O que fazer:**
Após TASK-009 (dados reais), adicionar lógica de modo leitura:
```ts
const isConcluido = solicitacao?.status === 'CONCLUIDO';
const asoExistente = solicitacao?.asoDocuments?.[0];
```
- Se `isConcluido`: desabilitar botão "Emitir ASO", mostrar card com decisão já registrada e data
- Se `asoExistente.pdfUrl`: exibir link "Baixar ASO" apontando para `GET /api/aso/:id`
- Botões de decisão (APTO/INAPTO/RESTRIÇÃO) ficam desabilitados quando `isConcluido`

**Gate:** Acessar consulta de uma solicitação com status CONCLUIDO não mostra botão "Emitir ASO" ativo. Mostra a decisão registrada. Link de download aparece quando `pdfUrl` preenchido.

---

### TASK-014 — Tela de histórico do médico

**Spec:** F2-REQ-001, F2-REQ-002, F2-REQ-004, F2-REQ-005  
**Arquivos:** `app/medico/historico/page.tsx` (novo), `app/medico/layout.tsx`

**O que fazer:**
1. Criar `app/medico/historico/page.tsx`:
   - Chama `apiGetMedicoSolicitacoes(doctorId)` no mount
   - Tabela com: nome do paciente, tipo de exame, data (`assignedAt`), decisão (`asoDocuments[0].decision ?? 'Pendente'`), status
   - Filtro client-side por status (dropdown: Todos / Concluído / Em Atendimento)
   - Botão "Ver detalhes" → `router.push(/medico/consulta/${request.id})`
2. Adicionar item "Histórico" na nav do `app/medico/layout.tsx`
3. `doctorId`: usar o mesmo de `localStorage` já salvo pela tela da fila

**Gate:** `/medico/historico` lista atendimentos reais. Filtro por "Concluído" mostra somente os com status CONCLUIDO.

---

## FASE 3C — Clínica Completa

> Multi-tipo de exame no check-in + modelo de anamnese.

---

### TASK-015 — Backend: endpoints de tipos de exame e CBO

**Spec:** B3-REQ-001, B3-REQ-002  
**Arquivos:** `src/exams/exams.controller.ts`, `src/exams/exams.service.ts`

**O que fazer:**
```ts
// exams.service.ts
async findTypes() {
  return this.prisma.examType.findMany({
    select: { id: true, name: true, category: true, requiresEquipment: true, canBeRemoteReview: true },
    orderBy: { name: 'asc' },
  });
}

async findRequiredByCbo(cboCode: string) {
  const risk = await this.prisma.occupationalRisk.findUnique({ where: { cboCode } });
  if (!risk) return { requiredExams: [], riskGrade: 'desconhecido', requiresInPerson: false };
  return { requiredExams: risk.requiredExams, riskGrade: risk.riskGrade, requiresInPerson: risk.requiresInPerson };
}

// exams.controller.ts (ANTES de @Post() e @Post(':id/...'))
@Get('types')
async getTypes() {
  return { success: true, data: await this.examsService.findTypes() };
}

@Get('required')
async getRequired(@Query('cboCode') cboCode: string) {
  return { success: true, data: await this.examsService.findRequiredByCbo(cboCode) };
}
```

**Gate:** `GET /api/exams/types` retorna array de tipos. `GET /api/exams/required?cboCode=7171-10` retorna `requiredExams` com pelo menos `audiometria`.

---

### TASK-016 — Backend: módulo de anamnese

**Spec:** B4-REQ-001 – B4-REQ-005  
**Arquivos:** `prisma/schema.prisma` + novo módulo `src/anamnese/`

**O que fazer:**
1. Adicionar ao schema Prisma:
```prisma
model Anamnese {
  id            String      @id @default(uuid())
  requestId     String      @unique
  collectedById String?
  collectedAt   DateTime    @default(now())
  fieldsJson    String
  source        String      @default("operador") // "operador" | "medico" | "paciente"
  request       ExamRequest @relation(fields: [requestId], references: [id])
}
```
Adicionar `anamnese Anamnese?` em `ExamRequest`.
2. Migration: `npx prisma migrate dev --name add-anamnese`
3. Criar módulo `src/anamnese/` com:
   - `POST /api/anamnese` — upsert por `requestId`
   - `GET /api/anamnese/:requestId` — retorna com `fieldsJson` parseado
4. Atualizar `exam-request.service.ts` `findOne()` para incluir `anamnese: true`

**Gate:** `POST /api/anamnese` cria registro. Segundo `POST` para mesmo `requestId` substitui. `GET /api/solicitacoes/:id` retorna campo `anamnese` (objeto ou null).

---

### TASK-017 — Backend: aceitar múltiplos resultados em `POST /api/exams`

**Spec:** B3-REQ-003  
**Arquivo:** `src/exams/exams.service.ts`, `src/exams/exams.controller.ts`

**O que fazer:**
Manter compatibilidade com formato antigo, adicionar suporte ao novo:
```ts
// controller
@Post()
async create(@Body() body: {
  examRequestId: string;
  examType?: string;        // formato antigo (single)
  valueJson?: Record<string, any>;
  results?: Array<{ examType: string; valueJson: Record<string, any> }>;
}) {
  const items = body.results ?? [{ examType: body.examType!, valueJson: body.valueJson! }];
  const created = await Promise.all(
    items.map(item => this.examsService.createExam(body.examRequestId, item.examType, item.valueJson))
  );
  return { success: true, data: created };
}
```

**Gate:** `POST /api/exams` com `results: [...]` cria múltiplos `ExamResult`. `POST /api/exams` com `examType/valueJson` (formato antigo) continua funcionando.

---

### TASK-018 — Frontend: check-in com seleção e campos dinâmicos de exame

**Spec:** F3-REQ-001 – F3-REQ-005  
**Arquivo:** `app/consultorio/check-in/page.tsx`

**O que fazer:**
1. Adicionar em `api.ts`:
```ts
export async function apiGetExamTypes() { ... }
export async function apiGetRequiredExams(cboCode: string) { ... }
```
2. Refatorar o stepper: `'patient' → 'exames-selecao' → 'exames-coleta' → 'confirm'`
3. Ao preencher `functionCboCode`, chamar `apiGetRequiredExams(cbo)` e exibir alerta com exames obrigatórios
4. Tela `exames-selecao`: checkboxes com todos os tipos (`apiGetExamTypes()`); exames obrigatórios pré-marcados e não desabilitáveis
5. Tela `exames-coleta`: renderizar campos dinamicamente por tipo selecionado:

```ts
const EXAM_FIELD_MAP: Record<string, { id: string; label: string; type: string }[]> = {
  pa: [
    { id: 'pressao_sistolica', label: 'Pressão Sistólica (mmHg)', type: 'number' },
    { id: 'pressao_diastolica', label: 'Pressão Diastólica (mmHg)', type: 'number' },
  ],
  acuidade_visual: [
    { id: 'od', label: 'Acuidade Visual OD', type: 'text' },
    { id: 'oe', label: 'Acuidade Visual OE', type: 'text' },
  ],
  audiometria: [
    { id: 'via_aerea_od', label: 'Via Aérea OD', type: 'text' },
    { id: 'via_aerea_oe', label: 'Via Aérea OE', type: 'text' },
  ],
  peso_altura: [
    { id: 'peso', label: 'Peso (kg)', type: 'number' },
    { id: 'altura', label: 'Altura (cm)', type: 'number' },
  ],
  glicemia: [
    { id: 'valor', label: 'Glicemia (mg/dL)', type: 'number' },
  ],
};
```
6. Submissão: enviar `{ examRequestId, results: [{ examType, valueJson }] }` (formato novo)

**Gate:** Ao inserir CBO `7171-10`, audiometria aparece como obrigatória. Campos de coleta mudam conforme seleção. Submissão cria múltiplos `ExamResult` no banco.

---

## FASE 3D — Empresa Completa

> Upload de documentos reais + configurações editáveis.

---

### TASK-019 — Backend: upload de documentos PCMSO/PPRA

**Spec:** B7-REQ-001 – B7-REQ-005  
**Arquivo:** `src/company/company.controller.ts`, `src/company/company.service.ts`

**O que fazer:**
1. Verificar/adicionar `multer` e `@types/multer` em `package.json`
2. Configurar `MulterModule` no `AppModule`:
```ts
MulterModule.register({ dest: './uploads/documentos' })
```
3. Adicionar endpoints em `CompanyController`:
```ts
@Post(':id/documentos')
@UseInterceptors(FileInterceptor('file'))
async uploadDocumento(
  @Param('id') companyId: string,
  @UploadedFile() file: Express.Multer.File,
  @Body() body: { tipo: 'pcmso' | 'ppra'; validUntil: string }
) { ... }

@Get(':id/documentos')
async getDocumentos(@Param('id') companyId: string) { ... }
```
4. Service: validar mimetype (`application/pdf`), salvar path, atualizar campos da empresa, verificar se ambos válidos e mudar `status → LIBERADA`

**Gate:** Upload de PDF via `multipart/form-data` atualiza `Company.pcmsoDocumentUrl`. Empresa com ambos os documentos válidos tem `status = LIBERADA`.

---

### TASK-020 — Backend: atualização de dados da empresa + status check

**Spec:** B8-REQ-001 – B8-REQ-004  
**Arquivo:** `src/company/company.controller.ts`, `src/company/company.service.ts`

**O que fazer:**
1. Adicionar `PATCH /api/company/:id`:
```ts
async update(companyId: string, dto: UpdateCompanyDto) {
  // CNPJ nunca é alterado, status nunca é alterado pelo próprio admin
  const { cnpj, status, ...allowedFields } = dto as any;
  return this.prisma.company.update({ where: { id: companyId }, data: allowedFields });
}
```
2. Adicionar `GET /api/company/:id/status-check`:
```ts
async getStatusCheck(companyId: string) {
  const company = await this.prisma.company.findUnique({ where: { id: companyId } });
  const now = new Date();
  return {
    hasRazaoSocial: !!company.razaoSocial,
    hasPcmso: !!company.pcmsoDocumentUrl,
    hasPpra: !!company.ppraDocumentUrl,
    pcmsoValid: company.pcmsoValidUntil ? company.pcmsoValidUntil > now : false,
    ppraValid: company.ppraValidUntil ? company.ppraValidUntil > now : false,
    hasClinicAssigned: !!company.clinicId,
    status: company.status,
  };
}
```
3. Criar `UpdateCompanyDto` com campos permitidos e validações

**Gate:** `PATCH /api/company/:id` com `{ razaoSocial: 'Nova Razão' }` atualiza o banco sem alterar CNPJ. `GET /api/company/:id/status-check` retorna checklist correto.

---

### TASK-021 — Frontend: tela de documentos da empresa

**Spec:** F4-REQ-001 – F4-REQ-004  
**Arquivo:** `app/empresa/documentos/page.tsx`

**O que fazer:**
1. Substituir mock por `apiGetDocumentos(companyId)` no mount
2. Duas seções (PCMSO e PPRA) cada uma com: status badge (válido/expirado/pendente), data de validade, link de download
3. Modal de upload: `<input type="file" accept=".pdf">` + `<input type="date">` para validade + progress bar
4. Após upload bem-sucedido: recarregar status
5. Alerta quando `validUntil` < 30 dias: "⚠️ Vence em X dias"
6. Adicionar em `api.ts`:
```ts
export async function apiGetDocumentos(companyId: string) { ... }
export async function apiUploadDocumento(companyId: string, tipo: string, file: File, validUntil: string) { ... }
```

**Gate:** Upload de PDF via modal atualiza status na tela. Empresa com PCMSO válido mostra badge verde. Alerta aparece para documento próximo de vencer.

---

### TASK-022 — Frontend: configurações da empresa

**Spec:** F5-REQ-001 – F5-REQ-004  
**Arquivo:** `app/empresa/configuracoes/page.tsx`

**O que fazer:**
1. Carregar dados via `GET /api/company/:id` no mount
2. Formulário com campos editáveis: razão social, nome fantasia, endereço, CEP, cidade, estado
3. CNPJ e status: exibidos como somente leitura
4. Widget de status da empresa: cor por `CompanyStatus` (verde=LIBERADA, amarelo=EM_ANALISE, etc.)
5. Checklist de requisitos usando `GET /api/company/:id/status-check`
6. `PATCH /api/company/:id` ao salvar + toast de feedback

**Gate:** Editar razão social e salvar persiste a mudança. Checklist reflete estado real de documentos.

---

## FASE 3E — Portal do Funcionário

> Acesso por token sem senha. Jornada guiada de ponta a ponta.

---

### TASK-023 — Backend: módulo `portal` com autenticação por token

**Spec:** F6-B-REQ-001  
**Arquivo:** `src/portal/` (novo módulo)

**O que fazer:**
Criar estrutura:
```
src/portal/
  portal.module.ts
  portal.controller.ts
  portal.service.ts
  portal-session.guard.ts
  dto/auth-portal.dto.ts
```

`POST /api/portal/auth` (rota pública):
```ts
async auth(dto: { token: string; cpf: string; birthDate: string }) {
  const invite = await this.prisma.examInvite.findUnique({
    where: { token: dto.token },
    include: { examRequest: { include: { patient: true } } },
  });

  if (!invite || invite.status === 'EXPIRADO') {
    throw new UnauthorizedException('Link inválido ou expirado');
  }

  const cpfNormalizado = dto.cpf.replace(/\D/g, '');
  if (invite.expectedCpf !== cpfNormalizado) {
    throw new UnauthorizedException('Dados não conferem');
  }

  const patient = invite.examRequest?.patient;
  if (!patient) throw new UnauthorizedException('Processo não encontrado');

  if (patient.birthDate) {
    const expected = patient.birthDate.toISOString().split('T')[0];
    if (expected !== dto.birthDate) {
      throw new UnauthorizedException('Dados não conferem');
    }
  }

  // Atualizar invite status
  await this.prisma.examInvite.update({
    where: { id: invite.id },
    data: { status: 'ABERTO', openedAt: invite.openedAt ?? new Date() },
  });

  // Emitir evento LINK_ABERTO na timeline
  await this.prisma.examTimelineEvent.create({
    data: { inviteId: invite.id, eventType: 'LINK_ABERTO' }
  });

  const processId = invite.examRequest!.id;
  const sessionToken = this.jwtService.sign(
    { sub: patient.id, processId, role: 'PORTAL' },
    { expiresIn: '4h' }
  );

  return { sessionToken, processId };
}
```

`PortalSessionGuard`: valida JWT com `role = 'PORTAL'`, injeta `req.processId` e `req.patientId`.

**Gate:** `POST /api/portal/auth` com token/CPF/nascimento corretos retorna `sessionToken`. Com dados errados retorna 401 sem diferença de mensagem entre CPF errado e nascimento errado.

---

### TASK-024 — Backend: `GET /api/portal/processo` com próxima ação calculada

**Spec:** F6-B-REQ-002, F6-B-REQ-003, F6-B-REQ-007  
**Arquivo:** `src/portal/portal.service.ts`

**O que fazer:**
```ts
async getProcesso(processId: string) {
  const request = await this.prisma.examRequest.findUnique({
    where: { id: processId },
    include: {
      patient: true,
      clinic: true,
      invite: { include: { company: true } },
      results: true,
      asoDocuments: true,
      teleconsultations: true,
      anamnese: true,
      queueEntry: true,
    },
  });

  const proximaAcao = this.calcProximaAcao(request);
  const progresso = this.calcProgresso(request);

  return {
    id: request.id,
    status: request.status,
    proximaAcao,
    progresso,
    empresa: { nome: request.invite?.company?.razaoSocial ?? '—' },
    tipoExame: request.examPurpose,
    cargo: request.patient.functionCboCode,
    prazoAte: request.invite?.expiresAt ?? null,
    paciente: { nome: request.patient.name, cpf: request.patient.cpf },
    teleconsulta: {
      disponivel: request.teleconsultations.length > 0,
      linkSala: request.teleconsultations[0]?.videoSessionId ?? null,
    },
    aso: {
      disponivel: request.asoDocuments.length > 0,
      pdfUrl: request.asoDocuments[0]?.pdfUrl ?? null,
    },
  };
}
```

Implementar `calcProximaAcao(request)` seguindo a árvore de decisão da spec F6-B-REQ-003.

Implementar `calcProgresso(request)` retornando array de etapas com estado:
```ts
[
  { id: 'cadastro', label: 'Cadastro', estado: 'concluido' | 'atual' | 'pendente' },
  { id: 'documentos', ... },
  { id: 'questionario', ... },
  { id: 'exames', ... },
  { id: 'medico', ... },
  { id: 'aso', ... },
]
```

Roteamento pós-questionário (F6-B-REQ-007): em `TASK-026`, ao salvar questionário, chamar:
```ts
const risk = await this.prisma.occupationalRisk.findUnique({ where: { cboCode: patient.functionCboCode } });
const novoStatus = (risk?.requiresInPerson || risk?.requiredExams?.length > 0)
  ? ExamRequestStatus.AGUARDANDO_EXAMES
  : ExamRequestStatus.NA_FILA_MEDICA;
```

**Gate:** `GET /api/portal/processo` retorna `proximaAcao.tipo = 'CONFIRMAR_DADOS'` para processo recém-criado. Após anamnese respondida, retorna `AGUARDANDO_EXAMES` ou `NA_FILA_MEDICA` conforme CBO.

---

### TASK-025 — Backend: confirmar dados e upload de documentos do portal

**Spec:** F6-B-REQ-004, F6-B-REQ-005, F6-B-REQ-009  
**Arquivo:** `src/portal/portal.controller.ts`, `src/portal/portal.service.ts`

**O que fazer:**
1. `POST /api/portal/confirmar-dados`: atualiza `Patient.phone` e `Patient.email` (via `UserAccount.email`). Registra evento `DADOS_CONFIRMADOS`. Avança status para próxima etapa.
2. `POST /api/portal/documentos` (multipart): salva arquivo em `uploads/portal/{processId}/`. Registra no banco qual documento foi enviado (campo `metadata` no `ExamTimelineEvent`, ou criar modelo simples). Quando todos os obrigatórios forem enviados, avança status e emite `DOCUMENTOS_ENVIADOS`.
3. Documentos obrigatórios fixos nesta fase: `['rg', 'foto']`.

**Gate:** `POST /api/portal/confirmar-dados` atualiza telefone no banco. Upload de `rg` e `foto` avança o status do processo.

---

### TASK-026 — Backend: questionário do portal

**Spec:** F6-B-REQ-006, F6-B-REQ-007  
**Arquivo:** `src/portal/portal.service.ts`

**O que fazer:**
1. `POST /api/portal/questionario`: recebe campos da anamnese, chama `AnamneseService.upsert()` com `source: 'paciente'`, registra evento `QUESTIONARIO_RESPONDIDO`, executa roteamento de fluxo (A/B/C), atualiza status
2. Se roteado para `NA_FILA_MEDICA`: criar `QueueEntry` via `QueueService.enqueue()`
3. Emitir `timeline_update` para a empresa via WebSocket

**Gate:** Após `POST /api/portal/questionario`, `ExamRequest.status` é `AGUARDANDO_EXAMES` (CBO com exames) ou `NA_FILA_MEDICA` (CBO sem exames). Evento `QUESTIONARIO_RESPONDIDO` aparece na timeline da empresa.

---

### TASK-027 — Frontend: tela de validação de identidade

**Spec:** F6-F-REQ-001  
**Arquivo:** `app/p/[token]/page.tsx` (novo)

**O que fazer:**
1. Criar layout `app/p/layout.tsx` mobile-first (sem sidebar, sem header completo — apenas logo)
2. Tela `/p/[token]`:
   - Carregar preview do convite (nome empresa): `GET /api/portal/preview/:token` — endpoint público que retorna apenas `{ empresaNome, tipoExame, expirado: boolean }` sem autenticar
   - Campos: CPF com máscara + data de nascimento
   - `POST /api/portal/auth` ao submeter
   - Em sucesso: salvar `sessionToken` em `sessionStorage` e redirecionar para `/p/[token]/processo`
   - Em erro 401: mensagem "CPF ou data de nascimento não conferem."
   - Se `invite.expirado`: tela de link expirado sem campos

**Adicionar `GET /api/portal/preview/:token`** no backend (rota pública, retorna dados mínimos sem validar identidade).

**Gate:** Acessar `/p/{token-valido}` exibe nome da empresa. CPF+nascimento corretos redirecionam para o processo. Dados errados mostram mensagem de erro sem revelar qual campo está errado.

---

### TASK-028 — Frontend: tela principal do processo (barra de progresso + próxima ação)

**Spec:** F6-F-REQ-002, F6-F-REQ-003, F6-F-REQ-009  
**Arquivo:** `app/p/[token]/processo/page.tsx` (novo)

**O que fazer:**
1. Carregar `GET /api/portal/processo` com SessionToken no header
2. Boas-vindas: modal na primeira visita (detectado por `sessionStorage.get('visitado')`) com empresa, tipo, prazo e botão "Iniciar processo"
3. Barra de progresso: mapear `progresso[]` em etapas visuais (círculos conectados, mobile-friendly)
4. Card de próxima ação: baseado em `proximaAcao.tipo`:
   - Ícone + título grande + descrição
   - Botão CTA quando `proximaAcao.ctaUrl` ou quando a ação tem rota interna (`/p/[token]/confirmar`, etc.)
   - Para ações de espera: sem botão, animação de loading sutil
5. Timeline colapsável abaixo do card
6. Polling: `setInterval` de 30s rellamando `GET /api/portal/processo` e atualizando estado

**Gate:** A tela renderiza corretamente para cada valor de `proximaAcao.tipo`. Polling muda o card de "Aguardar médico" para "Entrar na teleconsulta" sem reload quando status muda no backend.

---

### TASK-029 — Frontend: etapas do portal (confirmar, documentos, questionário, teleconsulta, ASO)

**Spec:** F6-F-REQ-004 – F6-F-REQ-008, F6-F-REQ-010  
**Arquivos:** telas `/p/[token]/confirmar`, `/documentos`, `/questionario`, `/teleconsulta`, `/aso`

**O que fazer:**

**`/confirmar`:**
- Exibe dados do processo (somente leitura: nome, CPF, nascimento)
- Campos editáveis: telefone, e-mail
- `POST /api/portal/confirmar-dados` ao confirmar → retorna para `/processo`

**`/documentos`:**
- Lista `['rg', 'foto']` com status (enviado/pendente)
- Upload por item, preview
- "Continuar" ativo quando todos enviados

**`/questionario`:**
- Wizard de 7 perguntas (uma por tela), linguagem simples
- Progress bar interna (1/7, 2/7, ...)
- `POST /api/portal/questionario` ao finalizar → retorna para `/processo`

**`/teleconsulta`:**
- "O médico está pronto para te atender"
- Botão "Entrar na consulta" → `window.open(linkSala, '_blank')`
- Dicas de preparação

**`/aso`:**
- Mensagem de conclusão
- Decisão (APTO / INAPTO / COM RESTRIÇÃO), data, validade
- Botão "Baixar ASO" → `GET /api/aso/:asoDocumentId`

**Gate (por tela):**
- Confirmar: dados são salvos no banco após confirmar
- Documentos: lista muda de ❌ para ✅ após upload
- Questionário: `POST /api/portal/questionario` é chamado ao finalizar a última pergunta
- Teleconsulta: botão "Entrar" abre link externo
- ASO: PDF abre/baixa ao clicar

---

## FASE 3F — Autenticação JWT (Médico, Empresa, Clínica)

> Substitui IDs manuais por autenticação real. Não afeta o Portal do Funcionário (que tem fluxo próprio sem senha).

---

### TASK-030 — Backend: módulo de autenticação JWT

**Spec:** B5-REQ-001 – B5-REQ-005  
**Arquivo:** `src/auth/` (novo módulo)

**O que fazer:**
1. Instalar: `npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt`
2. Criar `src/auth/` com: `auth.module.ts`, `auth.controller.ts`, `auth.service.ts`, `jwt.strategy.ts`, `jwt-auth.guard.ts`, `roles.guard.ts`, `decorators/public.decorator.ts`, `decorators/roles.decorator.ts`
3. `POST /api/auth/login`:
```ts
async login(email: string, password: string) {
  const user = await this.prisma.userAccount.findUnique({ where: { email } });
  if (!user) throw new UnauthorizedException();
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new UnauthorizedException();

  // Resolver profileId conforme role
  let profileId: string | null = null;
  if (user.role === 'DOCTOR') {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId: user.id } });
    profileId = doctor?.id ?? null;
  } else if (user.role === 'COMPANY_ADMIN') {
    const admin = await this.prisma.companyAdmin.findUnique({ where: { userId: user.id } });
    profileId = admin?.companyId ?? null;
  } else if (user.role === 'OPERATOR') {
    const operator = await this.prisma.operator.findUnique({ where: { userId: user.id } });
    profileId = operator?.id ?? null;
  }

  return {
    accessToken: this.jwtService.sign({ sub: user.id, role: user.role, profileId }),
    user: { id: user.id, role: user.role, profileId },
  };
}
```
4. `GET /api/auth/me`: retorna dados do usuário logado a partir do token
5. Registrar `JwtAuthGuard` como `APP_GUARD` global; decorar rotas públicas com `@Public()`
6. Rotas públicas: `POST /api/auth/login`, `POST /api/colaboradores`, `POST /api/portal/*`, `GET /api/portal/*`
7. Atualizar seed para gerar senhas com `bcrypt.hash`:
```ts
passwordHash: await bcrypt.hash('Doctor123!', 10)
```

**Gate:** `POST /api/auth/login` com credenciais do seed retorna JWT. `GET /api/queue` sem token retorna 401. `GET /api/queue` com token de DOCTOR retorna 200. `GET /api/queue` com token de OPERATOR retorna 403.

---

### TASK-031 — Frontend: página de login e proteção de rotas

**Spec:** B5-REQ-006 – B5-REQ-009  
**Arquivos:** `app/login/page.tsx` (novo), `middleware.ts`, `app/lib/auth.ts` (novo), `app/lib/api.ts`

**O que fazer:**
1. Criar `app/lib/auth.ts`:
```ts
export const getToken = () => localStorage.getItem('accessToken');
export const setToken = (token: string) => localStorage.setItem('accessToken', token);
export const clearToken = () => localStorage.removeItem('accessToken');
export const decodeToken = (token: string): { role: string; profileId: string } => {
  return JSON.parse(atob(token.split('.')[1]));
};
```
2. Criar `app/login/page.tsx`: campos e-mail + senha, chama `apiLogin`, salva token e redireciona por role (`DOCTOR→/medico/fila`, `COMPANY_ADMIN→/empresa`, `OPERATOR→/consultorio`)
3. Atualizar `middleware.ts`:
```ts
// Rotas protegidas por prefixo → role esperada
const PROTECTED: Record<string, string> = {
  '/medico': 'DOCTOR',
  '/consultorio': 'OPERATOR',
  '/empresa': 'COMPANY_ADMIN',
};
```
Se sem token ou role errada → redirecionar para `/login`
4. Todas as funções em `api.ts` que precisam de auth devem incluir header `Authorization: Bearer ${getToken()}`
5. Remover campo manual de `doctorId` na fila: usar `decodeToken(getToken()).profileId`
6. Remover hardcode de `companyId` no painel da empresa: usar `profileId` do token

**Gate:** Acessar `/medico/fila` sem token redireciona para `/login`. Login com credenciais do seed e role DOCTOR redireciona para `/medico/fila`. Fila carrega sem campo manual de ID.

---

## Resumo: ordem de execução

```
3A — TASK-001 → TASK-002 → TASK-003 → TASK-004 → TASK-005 → TASK-006
3B — TASK-007 → TASK-008 → TASK-009 → TASK-010 → TASK-011 → TASK-012 → TASK-013 → TASK-014
3C — TASK-015 → TASK-016 → TASK-017 → TASK-018
3D — TASK-019 → TASK-020 → TASK-021 → TASK-022
3E — TASK-023 → TASK-024 → TASK-025 → TASK-026 → TASK-027 → TASK-028 → TASK-029
3F — TASK-030 → TASK-031
```

**Total: 31 tasks**  
**Fases com paralelismo possível:**
- 3C e 3D podem rodar em paralelo após 3B estar completa
- 3E pode começar sua parte de backend (TASK-023–026) assim que 3A e TASK-016 (anamnese) estiverem prontas
- 3F deve ser a última (não quebrar rotas públicas que as outras fases dependem para testar)

