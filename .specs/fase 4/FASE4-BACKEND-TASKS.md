# Fase 4 — Backend: Tasks de Execução

**Pré-condição:** Todos os BUGs e FIXes da `REVISAO-BACKEND.md` foram resolvidos.

---

## SPRINT 4A — Fechar gaps da Fase 3

> Pendências diretas herdadas da Fase 3 que bloqueiam o fluxo completo.

---

### TASK-4A-01 — `GET /api/exams/types` e `GET /api/exams/required`

**Arquivo:** `src/exams/exams.controller.ts`, `src/exams/exams.service.ts`

**O que fazer:**

Adicionar em `exams.service.ts`:
```ts
async findTypes() {
  return this.prisma.examType.findMany({
    select: { id: true, name: true, category: true, requiresEquipment: true, canBeRemoteReview: true },
    orderBy: { name: 'asc' },
  });
}

async findRequiredByCbo(cboCode: string) {
  const risk = await this.prisma.occupationalRisk.findUnique({ where: { cboCode } });
  if (!risk) return { requiredExams: [], riskGrade: 'desconhecido', requiresInPerson: false };
  return {
    requiredExams: risk.requiredExams,
    riskGrade: risk.riskGrade,
    requiresInPerson: risk.requiresInPerson,
  };
}
```

Adicionar em `exams.controller.ts` — **antes** de qualquer `@Post()`:
```ts
@Get('types')
async getTypes() {
  return { success: true, data: await this.examsService.findTypes() };
}

@Get('required')
async getRequired(@Query('cboCode') cboCode: string) {
  return { success: true, data: await this.examsService.findRequiredByCbo(cboCode) };
}
```

**Gate:** `GET /api/exams/types` retorna os 4 tipos do seed. `GET /api/exams/required?cboCode=7232-10` retorna `requiredExams` não vazio.

---

### TASK-4A-02 — `POST /api/exams` aceitar array de resultados

**Arquivo:** `src/exams/exams.controller.ts`, `src/exams/exams.service.ts`

**O que fazer:**

Manter compatibilidade com formato antigo (single). Adicionar suporte ao novo (array):

```ts
// exams.controller.ts
@Post()
async create(@Body() body: {
  examRequestId: string;
  examType?: string;
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

**Gate:** `POST /api/exams` com `{ examRequestId, results: [{...}, {...}] }` cria múltiplos `ExamResult`. Formato antigo continua funcionando.

---

### TASK-4A-03 — Template HTML do ASO (`libs/pdf-template-aso.html`)

**Arquivo:** `libs/pdf-template-aso.html` (criar)

**O que fazer:**

Criar template completo e válido para ASO ocupacional. Deve conter todos os `{{placeholders}}` que `aso.service.ts` já substitui:

```
{{patientName}}, {{patientCpf}}, {{companyName}}, {{examPurpose}},
{{examDate}}, {{decision}}, {{restrictionNotes}},
{{doctorCrm}}, {{signatureDate}}
```

Template mínimo aceitável para MVP:
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; margin: 40px; color: #222; }
    h1 { text-align: center; font-size: 16px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    td { padding: 6px 8px; border: 1px solid #ccc; }
    .decision { font-size: 18px; font-weight: bold; text-align: center; padding: 20px;
                border: 2px solid #000; margin: 24px 0; }
    .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #555; }
  </style>
</head>
<body>
  <h1>Atestado de Saúde Ocupacional — ASO</h1>
  <table>
    <tr><td><strong>Trabalhador</strong></td><td>{{patientName}}</td></tr>
    <tr><td><strong>CPF</strong></td><td>{{patientCpf}}</td></tr>
    <tr><td><strong>Empresa</strong></td><td>{{companyName}}</td></tr>
    <tr><td><strong>Tipo de Exame</strong></td><td>{{examPurpose}}</td></tr>
    <tr><td><strong>Data</strong></td><td>{{examDate}}</td></tr>
  </table>
  <div class="decision">{{decision}}</div>
  {{#if restrictionNotes}}
  <p><strong>Restrições:</strong> {{restrictionNotes}}</p>
  {{/if}}
  <p>Médico Responsável: {{doctorCrm}}</p>
  <p>Assinado em: {{signatureDate}}</p>
  <div class="footer">
    Documento gerado pela plataforma SaúdeSeg+. Válido conforme NR-07.
  </div>
</body>
</html>
```

**Gate:** `POST /api/aso/generate` com um `examRequestId` válido retorna `pdfUrl` e o PDF abre no browser com os dados reais do paciente.

---

### TASK-4A-04 — `PATCH /api/solicitacoes/:id` criar `AsoDocument` atomicamente

**Arquivo:** `src/exam-request/exam-request.service.ts`, `src/exam-request/exam-request.controller.ts`

**O que fazer:**

Atualizar `updateStatus` para aceitar `decision` e `restrictionNotes`, e criar o `AsoDocument` na mesma transação quando `decision` estiver presente:

```ts
// exam-request.service.ts
async updateStatus(id: string, body: {
  status: string;
  laudoTexto?: string;
  decision?: string;
  restrictionNotes?: string;
  doctorId?: string;
}) {
  const existing = await this.prisma.examRequest.findUnique({
    where: { id },
    include: { invite: true },
  });
  if (!existing) throw new NotFoundException('Solicitação não encontrada');

  const updated = await this.prisma.$transaction(async (tx) => {
    const req = await tx.examRequest.update({
      where: { id },
      data: { status: body.status },
    });

    if (body.decision) {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);
      await tx.asoDocument.create({
        data: {
          requestId: id,
          doctorId: body.doctorId ?? existing.invite?.companyId ?? 'system',
          decision: body.decision,
          restrictionNotes: body.restrictionNotes ?? null,
          validUntil,
        },
      });
    }

    if (body.laudoTexto && existing.invite) {
      await tx.examTimelineEvent.create({
        data: {
          inviteId: existing.invite.id,
          examRequestId: id,
          eventType: 'CONCLUIDO',
          metadata: body.laudoTexto,
        },
      });
    }
    return req;
  });

  if (existing.invite) {
    this.companyGateway.emitInviteStatusChange(existing.invite.companyId, {
      inviteId: existing.invite.id,
      status: existing.invite.status,
      examStatus: body.status,
    });
  }

  return updated;
}
```

Atualizar `ExamRequestController.update` para receber os novos campos no body.

**Gate:** `PATCH /api/solicitacoes/:id` com `{ status: 'CONCLUIDO', decision: 'APTO', doctorId: '...' }` cria `AsoDocument` no banco na mesma operação.

---

### TASK-4A-05 — `GET /api/portal/preview/:token`

**Arquivo:** `src/portal/portal.controller.ts`, `src/portal/portal.service.ts`

**O que fazer:**

Endpoint público (sem `PortalSessionGuard`):
```ts
// portal.service.ts
async preview(token: string) {
  const invite = await this.prisma.examInvite.findUnique({
    where: { token },
    include: { company: true },
  });
  if (!invite) return { expirado: true, empresaNome: null, tipoExame: null };
  return {
    expirado: invite.status === 'EXPIRADO' || invite.expiresAt < new Date(),
    empresaNome: invite.company.nomeFantasia ?? invite.company.razaoSocial,
    tipoExame: invite.examType,
  };
}

// portal.controller.ts
@Get('preview/:token')
async preview(@Param('token') token: string) {
  return this.portalService.preview(token);
}
```

**Gate:** `GET /api/portal/preview/{token-valido}` retorna `{ empresaNome, tipoExame, expirado: false }` sem precisar de sessionToken.

---

### TASK-4A-06 — Upload empresa: completar validação + atualizar Company + mudar status

**Arquivo:** `src/upload/upload.service.ts`, `src/upload/upload.controller.ts`

**O que fazer:**

1. Validar mimetype do arquivo no controller:
```ts
if (file.mimetype !== 'application/pdf') {
  return { success: false, message: 'Apenas arquivos PDF são aceitos' };
}
```
2. Após salvar `CompanyDocument`, atualizar os campos da empresa:
```ts
const updateData: any = {};
const validUntilDate = new Date(validUntil); // vem do body

if (type === 'PCMSO') {
  updateData.pcmsoDocumentUrl = fileUrl;
  updateData.pcmsoValidUntil = validUntilDate;
} else if (type === 'PPRA') {
  updateData.ppraDocumentUrl = fileUrl;
  updateData.ppraValidUntil = validUntilDate;
}
await this.prisma.company.update({ where: { id: companyId }, data: updateData });
```
3. Verificar se ambos os documentos estão válidos e atualizar status:
```ts
const company = await this.prisma.company.findUnique({ where: { id: companyId } });
const now = new Date();
const pcmsoOk = company.pcmsoValidUntil && company.pcmsoValidUntil > now;
const ppraOk = company.ppraValidUntil && company.ppraValidUntil > now;
if (pcmsoOk && ppraOk && company.status !== 'LIBERADA') {
  await this.prisma.company.update({
    where: { id: companyId },
    data: { status: 'LIBERADA' },
  });
}
```
4. Adicionar campo `validUntil` ao body do upload (`@Body('validUntil') validUntil: string`)

**Gate:** Upload de PCMSO com `validUntil` futuro atualiza `Company.pcmsoDocumentUrl` e `pcmsoValidUntil`. Quando ambos válidos, `Company.status` muda para `LIBERADA`.

---

### TASK-4A-07 — `GET /api/company/:id/status-check`

**Arquivo:** `src/company/company.controller.ts`, `src/company/company.service.ts`

**O que fazer:**
```ts
// company.service.ts
async getStatusCheck(companyId: string) {
  const company = await this.prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new NotFoundException('Empresa não encontrada');
  const now = new Date();
  return {
    hasRazaoSocial: !!company.razaoSocial,
    hasPcmso: !!company.pcmsoDocumentUrl,
    hasPpra: !!company.ppraDocumentUrl,
    pcmsoValid: !!company.pcmsoValidUntil && company.pcmsoValidUntil > now,
    ppraValid: !!company.ppraValidUntil && company.ppraValidUntil > now,
    hasClinicAssigned: !!company.clinicId,
    status: company.status,
  };
}

// company.controller.ts — antes de @Get(':id')
@Get(':id/status-check')
async statusCheck(@Param('id') id: string) {
  const data = await this.companyService.getStatusCheck(id);
  return { success: true, data };
}
```

**Gate:** `GET /api/company/:id/status-check` retorna checklist com valores corretos para empresa com documentos válidos.

---

### TASK-4A-08 — Mensagem de erro genérica no portal auth

**Arquivo:** `src/portal/portal.service.ts`

**O que fazer:**

Substituir mensagens específicas por uma genérica:
```ts
// Antes:
throw new UnauthorizedException('CPF não corresponde ao convite');
// ...
throw new UnauthorizedException('Data de nascimento não confere');

// Depois (ambos):
throw new UnauthorizedException('Dados não conferem');
```

**Gate:** `POST /api/portal/auth` com CPF errado e com nascimento errado retornam exatamente a mesma mensagem e o mesmo status 401.

---

## SPRINT 4B — Comunicação externa

---

### TASK-4B-01 — Módulo de e-mail (`src/mail/`)

**O que fazer:**

1. Instalar: `npm install @nestjs-modules/mailer nodemailer`
2. Criar `src/mail/mail.module.ts` com `MailerModule.forRoot(...)` lendo da env:
```env
# backend/.env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=noreply@saudeseg.com
MAIL_PASS=...
MAIL_FROM="SaúdeSeg+ <noreply@saudeseg.com>"
```
3. Criar `src/mail/mail.service.ts` com método `sendInviteLink(to, empresa, link, expiresAt)` e `sendAsoReady(to, patientName, pdfUrl)`
4. Templates de e-mail como strings HTML inline (sem sistema de templates externo por ora)

**Gate:** `MailService.sendInviteLink(...)` envia e-mail real para o endereço de teste sem lançar exceção.

---

### TASK-4B-02 — Disparar e-mail ao criar convite

**Arquivo:** `src/company/company.service.ts`

**O que fazer:**

Em `createInvite`, após criar o `ExamInvite`, construir o link e disparar e-mail:
```ts
const link = `${process.env.APP_BASE_URL}/p/${invite.token}`;
if (dto.expectedEmail) {
  await this.mailService.sendInviteLink(dto.expectedEmail, invite.company.razaoSocial, link, invite.expiresAt);
}
```

**Atenção:** O disparo deve ser em `try/catch` — falha de e-mail não deve reverter a criação do convite.

**Gate:** Criar um convite com `expectedEmail` válido resulta em e-mail recebido com o link `/p/{token}`.

---

### TASK-4B-03 — Disparar e-mail quando ASO for gerado

**Arquivo:** `src/aso/aso.service.ts`

**O que fazer:**

Após `generatePdf`, buscar o e-mail do paciente e enviar:
```ts
const patientUser = await this.prisma.userAccount.findUnique({
  where: { id: request.patient.userId },
});
if (patientUser?.email && !patientUser.email.endsWith('@walkin.temp')) {
  await this.mailService.sendAsoReady(patientUser.email, request.patient.name, pdfUrl);
}
```

**Gate:** Processo concluído via `POST /api/aso/generate` dispara e-mail ao paciente (quando e-mail real existir).

---

### TASK-4B-04 — Job scheduler: expiração de convites

**O que fazer:**

1. Instalar: `npm install @nestjs/schedule`
2. Registrar `ScheduleModule.forRoot()` em `app.module.ts`
3. Criar `src/jobs/jobs.module.ts` e `src/jobs/jobs.service.ts`
4. Job diário às 00h00:
```ts
@Cron('0 0 * * *')
async expirarConvitesVencidos() {
  const resultado = await this.prisma.examInvite.updateMany({
    where: {
      status: { in: ['ENVIADO', 'ABERTO'] },
      expiresAt: { lt: new Date() },
    },
    data: { status: 'EXPIRADO' },
  });
  this.logger.log(`Convites expirados: ${resultado.count}`);
}
```

**Gate:** Convites com `expiresAt` no passado têm `status = 'EXPIRADO'` após execução do job.

---

### TASK-4B-05 — Job scheduler: verificação de validade PCMSO/PPRA

**Arquivo:** `src/jobs/jobs.service.ts`

**O que fazer:**

Job diário às 01h00:
```ts
@Cron('0 1 * * *')
async verificarDocumentosVencidos() {
  const now = new Date();
  const empresasVencidas = await this.prisma.company.findMany({
    where: {
      status: 'LIBERADA',
      OR: [
        { pcmsoValidUntil: { lt: now } },
        { ppraValidUntil: { lt: now } },
      ],
    },
  });

  for (const empresa of empresasVencidas) {
    await this.prisma.company.update({
      where: { id: empresa.id },
      data: { status: 'DOCUMENTACAO_VENCIDA' },
    });
    this.companyGateway.emitDashboardStats(empresa.id, /* stats recalculados */);
  }
  this.logger.log(`Empresas com documentação vencida: ${empresasVencidas.length}`);
}
```

**Gate:** Empresa com `pcmsoValidUntil` no passado e `status = 'LIBERADA'` muda para `DOCUMENTACAO_VENCIDA` após execução do job.

---

## SPRINT 4C — Teleconsulta real + assinatura

---

### TASK-4C-01 — Integração de videochamada (Whereby ou Daily.co)

**Decisão prévia necessária:** Q3 (provedor de vídeo).

**O que fazer (exemplo com Whereby):**

1. Instalar: `npm install axios`
2. Criar `src/teleconsultation/teleconsultation.service.ts`:
```ts
async createRoom(examRequestId: string, doctorId: string): Promise<string> {
  const response = await axios.post(
    'https://api.whereby.dev/v1/meetings',
    { endDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), fields: ['hostRoomUrl'] },
    { headers: { Authorization: `Bearer ${process.env.WHEREBY_API_KEY}` } }
  );
  const { roomUrl, hostRoomUrl } = response.data;

  await this.prisma.teleconsultation.create({
    data: { requestId: examRequestId, doctorId, videoSessionId: roomUrl },
  });

  return hostRoomUrl; // URL para o médico (com controles de host)
}
```
3. Endpoint: `POST /api/teleconsultation/create-room` (requer `examRequestId`, `doctorId`)
4. O `videoSessionId` salvo é a URL pública do paciente; o `hostRoomUrl` é retornado apenas para o médico

**Gate:** `POST /api/teleconsultation/create-room` cria sala real, salva URL no banco. `GET /api/portal/processo` retorna `teleconsulta.linkSala` com a URL real.

---

### TASK-4C-02 — Assinatura digital real (Clicksign)

**Decisão prévia necessária:** Q4 (provedor de assinatura).

**O que fazer (exemplo com Clicksign):**

1. Criar conta Clicksign e obter API Key
2. Reescrever `src/signature/signature.service.ts`:
```ts
async generateLink(asoDocumentId: string) {
  const aso = await this.prisma.asoDocument.findUnique({
    where: { id: asoDocumentId },
    include: { request: { include: { patient: { include: { user: true } } } }, doctor: true },
  });

  // Upload do PDF para Clicksign
  const pdfBuffer = fs.readFileSync(path.join(process.cwd(), aso.pdfUrl));
  const uploadResponse = await clicksignClient.uploadDocument(pdfBuffer, `aso-${asoDocumentId}.pdf`);

  // Adicionar signatários (médico)
  await clicksignClient.addSigner(uploadResponse.documentKey, {
    name: aso.doctor.name,
    email: aso.doctor.user.email,
    sign_as: 'sign',
  });

  // Atualizar AsoDocument com ID do provedor
  await this.prisma.asoDocument.update({
    where: { id: asoDocumentId },
    data: { signatureProviderId: uploadResponse.documentKey },
  });

  return { url: uploadResponse.signerUrl };
}
```
3. Webhook `POST /api/signature/webhook` já existe — conectar ao evento real do Clicksign

**Gate:** `POST /api/signature/generate` cria documento no Clicksign. Webhook recebe evento de assinatura e atualiza `AsoDocument.signedAt`.

---

## SPRINT 4D — Segurança e operação

---

### TASK-4D-01 — Guard JWT global + `@Public()`

**Arquivo:** `src/auth/`, `src/app.module.ts`

**O que fazer:**

1. Criar `src/auth/decorators/public.decorator.ts`:
```ts
export const Public = () => SetMetadata('isPublic', true);
```
2. Atualizar `JwtAuthGuard` para verificar o metadata:
```ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) { super(); }
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(), context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```
3. Registrar como `APP_GUARD` em `app.module.ts`:
```ts
{ provide: APP_GUARD, useClass: JwtAuthGuard }
```
4. Decorar com `@Public()` todas as rotas que devem ser abertas:
   - `POST /api/auth/login`
   - `POST /api/colaboradores` (cadastro por convite)
   - `GET /api/portal/preview/:token`
   - `POST /api/portal/auth`
   - `GET /api/portal/*` (rotas com `PortalSessionGuard` próprio)
   - `POST /api/portal/*`

**Gate:** `GET /api/queue` sem token retorna 401. Com token de DOCTOR retorna 200. `POST /api/portal/auth` sem token retorna 200 (pública).

---

### TASK-4D-02 — `profileId` no payload do JWT

**Arquivo:** `src/auth/auth.service.ts`

**O que fazer:**

Adicionar `profileId` ao payload do token:
```ts
// Após validar senha:
let profileId: string | null = null;
if (user.role === 'DOCTOR') profileId = user.doctorProfile?.id ?? null;
else if (user.role === 'COMPANY_ADMIN') profileId = user.companyAdminProfile?.companyId ?? null;
else if (user.role === 'OPERATOR') profileId = user.operatorProfile?.id ?? null;

const payload = { sub: user.id, email: user.email, role: user.role, profileId };
```

Atualizar `JwtPayload` interface:
```ts
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  profileId: string | null;
}
```

**Gate:** Token decodificado contém `profileId` com o ID correto para a role do usuário.

---

### TASK-4D-03 — Scoping de dados por empresa

**Arquivo:** `src/exam-request/exam-request.service.ts`, `src/company/company.service.ts`

**O que fazer:**

Quando o usuário logado é `COMPANY_ADMIN`, filtrar automaticamente pelos dados da sua empresa. Criar helper para extrair `companyId` do request:
```ts
// Nos services que listam dados:
async list(filters: { status?: string; companyId?: string }, user: JwtPayload) {
  // Se for COMPANY_ADMIN, forçar o companyId do próprio token
  const effectiveCompanyId = user.role === 'COMPANY_ADMIN'
    ? user.profileId   // profileId = companyId para COMPANY_ADMIN
    : filters.companyId;
  // ...
}
```

**Gate:** COMPANY_ADMIN só vê solicitações da própria empresa, mesmo passando `companyId` diferente na query.

---

### TASK-4D-04 — Rate limiting nos endpoints públicos

**O que fazer:**

1. Instalar: `npm install @nestjs/throttler`
2. Configurar em `app.module.ts`:
```ts
ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]) // 10 req/min por IP
```
3. Aplicar `@SkipThrottle()` nos endpoints internos (autenticados)
4. Limites específicos para endpoints sensíveis:
   - `POST /api/portal/auth` → 5 tentativas/min por IP
   - `POST /api/auth/login` → 5 tentativas/min por IP

**Gate:** Mais de 10 chamadas em 1 minuto para `POST /api/portal/auth` resulta em 429.

---

### TASK-4D-05 — Paginação em endpoints de listagem

**Arquivos:** `exam-request`, `medicos`, `company`, `queue`

**O que fazer:**

Padrão de paginação a adotar:
```ts
// Query params: ?page=1&limit=20
// Response:
{
  data: [...],
  pagination: { page: 1, limit: 20, total: 150, totalPages: 8 }
}
```

Implementar em:
- `GET /api/solicitacoes`
- `GET /api/medicos`
- `GET /api/company`
- `GET /api/medicos/:id/solicitacoes`

**Gate:** `GET /api/solicitacoes?page=2&limit=5` retorna 5 itens da segunda página e `pagination.total` correto.

---

### TASK-4D-06 — Módulo Admin (`/api/admin/*`)

**O que fazer:**

Criar `src/admin/` com endpoints protegidos por `role: 'ADMIN'`:

```
GET  /api/admin/companies          — listar todas as empresas
GET  /api/admin/clinics            — listar e gerenciar clínicas
POST /api/admin/clinics            — cadastrar clínica
GET  /api/admin/doctors            — listar todos os médicos
POST /api/admin/doctors/verify     — verificar credencial CRM
GET  /api/admin/stats              — métricas globais da plataforma
PATCH /api/admin/companies/:id/status — aprovar/bloquear empresa
```

**Gate:** `GET /api/admin/stats` com token de ADMIN retorna contagens de empresas, pacientes, solicitações e ASOs emitidos. Com token de DOCTOR retorna 403.

---

### TASK-4D-07 — Relatórios CSV por empresa

**Arquivo:** `src/company/company.controller.ts`, `src/company/company.service.ts`

**O que fazer:**

```ts
// GET /api/company/:id/relatorio?formato=csv&de=2026-01-01&ate=2026-06-30
@Get(':id/relatorio')
async relatorio(@Param('id') id: string, @Query() query, @Res() res: Response) {
  const dados = await this.companyService.gerarRelatorio(id, query.de, query.ate);
  res.header('Content-Type', 'text/csv; charset=utf-8');
  res.header('Content-Disposition', `attachment; filename="relatorio-${id}.csv"`);
  res.send(this.toCsv(dados));
}
```

Campos do CSV: `Nome`, `CPF`, `Função (CBO)`, `Tipo de Exame`, `Data`, `Decisão ASO`, `Validade ASO`.

**Gate:** `GET /api/company/:id/relatorio?formato=csv` retorna arquivo `.csv` com dados reais das solicitações da empresa.

---

## Resumo de ordem de execução da Fase 4

```
4A — TASK-4A-01 → 4A-02 → 4A-03 → 4A-04 → 4A-05 → 4A-06 → 4A-07 → 4A-08
4B — TASK-4B-01 → 4B-02 → 4B-03 → 4B-04 → 4B-05
4C — TASK-4C-01 → 4C-02   (após decisão Q3 e Q4)
4D — TASK-4D-01 → 4D-02 → 4D-03 → 4D-04 → 4D-05 → 4D-06 → 4D-07
```

**Paralelismo possível:**
- 4A e 4B podem rodar em paralelo (sem dependência entre si)
- 4C depende de 4A-03 (template ASO) estar completo
- 4D-01 (guard global) deve ser a última tarefa de segurança — ativar antes pode bloquear endpoints de desenvolvimento ainda sem auth no frontend

**Total: 20 tasks de backend**

