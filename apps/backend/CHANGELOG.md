# Pacote de Atualização — Fase 2 (Backend)

Cole estes arquivos nos mesmos caminhos da sua pasta `backend/` original
(sobrescrevendo os existentes). Arquivos novos: `src/exam-request/*`.

## Problemas críticos corrigidos

1. **Token do convite trocado pelo `id` (quebrava 100% dos cadastros via link)**
   `ColaboradorService.validateInviteAndRegister` buscava o convite com
   `where: { id: token }`, mas o token enviado ao colaborador é o campo
   `token` do `ExamInvite` (um UUID diferente do `id`). Qualquer link real
   gerado pela empresa resultava em "convite não encontrado".
   → Corrigido para `where: { token }` (busca e updates).

2. **Cadastro do colaborador nunca criava a Solicitação (ExamRequest)**
   O fluxo criava `UserAccount`, `Patient` e o vínculo com a empresa, mas
   nunca o `ExamRequest` — ou seja, depois do cadastro não existia
   "solicitação" nenhuma para o médico atender, nem para empresa/colaborador
   acompanharem. Isso quebrava o fluxo ponta a ponta descrito na F2-REQ-003
   e no `design.md`. Agora o `ExamRequest` é criado com
   `status: 'AGUARDANDO_COLETA'`, vinculado ao convite, paciente e clínica.

3. **Painel da empresa não recebia nada em tempo real**
   `ColaboradorService` nunca chamava o `CompanyGateway`; `CompanyService`
   também criava o evento de timeline do convite sem emitir nada via
   WebSocket. A empresa só veria qualquer atualização com F5. Agora os dois
   serviços emitem `timeline_update` / `invite_status_change` no
   `CompanyGateway`. O `QueueService.acceptPatient` foi ajustado para
   atualizar e propagar o status do `ExamRequest` (antes só atualizava a
   fila, e o status da solicitação nunca mudava — quebrando F2-REQ-014).

4. **Colisão de rotas em `CompanyController`**
   `@Get('solicitacoes')` estava declarado depois de `@Get(':id')`. No
   Nest/Express, rotas são casadas na ordem de declaração, então qualquer
   chamada a `GET /api/company/solicitacoes` caía em `getCompany('solicitacoes')`
   em vez de `listAllInvites()`. Reordenado: rotas estáticas antes das
   parametrizadas.

5. **`GET /api/queue` esperava dados em `@Body()`**
   Requisições GET não devem (e na prática a maioria dos clientes HTTP não
   consegue) enviar corpo. `doctorId` agora vem via query string
   (`@Query('doctorId')`).

6. **Nenhum endpoint real de Solicitações existia**
   `exams`, `aso` e `signature` eram totalmente mocados (`if (id !== '1')`,
   sem tocar o Prisma). O `design.md` pede `GET /solicitacoes` e
   `PATCH /solicitacoes/:id` com persistência real — eles simplesmente não
   existiam. Criado o módulo `src/exam-request/` com:
   - `GET /api/solicitacoes` (filtros: `status`, `companyId`, `patientId`)
   - `GET /api/solicitacoes/:id`
   - `PATCH /api/solicitacoes/:id` (atualiza status + laudo simplificado em
     texto, F2-REQ-013, e propaga via WebSocket)

7. **Nenhuma validação de entrada nos DTOs**
   Nenhum DTO tinha decorators de `class-validator`, e não havia
   `ValidationPipe` global — qualquer payload incompleto só falhava (ou
   pior, passava) dentro do service, na hora de gravar no banco. Adicionado
   `class-validator`/`class-transformer` ao `package.json` e
   `app.useGlobalPipes(new ValidationPipe(...))` no `main.ts`, com
   decorators em `ValidateInviteDto`, `CreateCompanyDto`, `CreateInviteDto`.

8. **Erros de "convite não encontrado" virando 400 em vez de 404**
   O controller de colaborador capturava qualquer exceção e relançava como
   `BadRequestException`. Removido o `try/catch` redundante — o filtro
   global de exceções do Nest já devolve o status correto de cada exceção
   lançada pelo service (`NotFoundException` → 404).

9. **Endpoint ausente: colaborador ver a própria solicitação (F2-REQ-015)**
   Adicionado `GET /api/colaboradores/:id/solicitacoes`.

## Não alterado (fora do escopo deste pacote)

- `exams`, `aso` e `signature` continuam mocados como estavam — eles tratam
  de upload/laudo/assinatura, que a própria spec.md exclui explicitamente
  da Fase 2. Não toquei neles para não me antecipar à Fase 3.
- Não há módulo dedicado de "Médico" (CRUD de `Doctor`/`Clinic`) — o
  `queue.service.ts` já consulta `Doctor` para a fila, mas criar/editar
  médicos via API ainda não existe. Vale como próximo item de
  `fase-2-implementacao.md` se ainda não estiver coberto lá.
- Não roda `npm install && npm run build` neste ambiente (sem acesso à
  rede do projeto), então recomendo rodar os testes localmente antes do
  deploy. Os tipos do Prisma usados (`InviteStatus`, `Role`, campos do
  `ExamRequest`) foram conferidos contra o `schema.prisma` e o
  `seed-mock.ts` enviados.

## Arquivos neste pacote

```
package.json                                 (deps: class-validator, class-transformer)
src/main.ts                                  (ValidationPipe global)
src/app.module.ts                            (registra ExamRequestModule)
src/colaborador/colaborador.service.ts       (token, ExamRequest, WebSocket)
src/colaborador/colaborador.controller.ts    (DTO + status HTTP correto)
src/colaborador/colaborador.module.ts        (importa CompanyModule)
src/colaborador/dto/validate-invite.dto.ts   (validação)
src/company/company.controller.ts            (ordem de rotas corrigida)
src/company/company.service.ts               (emite WebSocket ao criar convite)
src/company/dto/create-company.dto.ts        (validação)
src/company/dto/create-invite.dto.ts         (validação)
src/queue/queue.controller.ts                (GET via query, não body)
src/queue/queue.service.ts                   (atualiza status do ExamRequest)
src/exam-request/exam-request.module.ts      (novo)
src/exam-request/exam-request.controller.ts  (novo)
src/exam-request/exam-request.service.ts     (novo)
```
