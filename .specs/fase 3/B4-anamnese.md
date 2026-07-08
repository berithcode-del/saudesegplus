# B4 — Anamnese: Modelo de Dados e Endpoint

**Prioridade:** 🟡 Alto  
**Frente:** Backend  
**Complexidade:** Medium

---

## Contexto

A aba "Anamnese" na tela de consulta médica exibe dados mock (`Queixas: Nenhuma relatada`). Não existe modelo de anamnese no banco nem endpoint para salvar/buscar.

A anamnese ocupacional coleta histórico clínico relevante para o exame: queixas, doenças prévias, uso de medicamentos, exposições ocupacionais passadas.

---

## Decisão de Modelo

**Opção A — Campo JSON livre** (flexível, sem migração futura)
```prisma
model Anamnese {
  id            String      @id @default(uuid())
  requestId     String      @unique
  collectedById String      // Operator ou Doctor
  collectedAt   DateTime    @default(now())
  fieldsJson    String      // JSON com respostas
  request       ExamRequest @relation(...)
}
```

**Opção B — Campos tipados** (mais queryável, mas rigidez de schema)

**Recomendação: Opção A** — `fieldsJson` como JSON string, com schema de campos definido no nível da aplicação. Compatível com a abordagem já usada em `ExamResult.valueJson`.

---

## Requisitos

**B4-REQ-001** — Adicionar migration com modelo `Anamnese` (Opção A acima) ao schema Prisma.

**B4-REQ-002** — `POST /api/anamnese` — cria ou substitui anamnese de uma solicitação:
```ts
{
  requestId: string,
  fields: {
    queixas?: string,
    doencasPrevias?: string,
    medicamentosEmUso?: string,
    alergiasConhecidas?: string,
    exposicoesOcupacionais?: string,
    cirurgiasPrevias?: string,
    observacoes?: string
  }
}
```
- Se já existir anamnese para o `requestId`, **substituir** (upsert).
- Retorna o registro criado/atualizado.

**B4-REQ-003** — `GET /api/anamnese/:requestId` — retorna anamnese da solicitação.  
- 404 se não existir (não erro de servidor).
- `fieldsJson` deve ser retornado já parseado como objeto.

**B4-REQ-004** — `GET /api/solicitacoes/:id` (endpoint de B1) deve incluir a anamnese no retorno: `{ ..., anamnese: AnamneseFields | null }`.

**B4-REQ-005** — Quem coleta a anamnese? Por ora: tanto o operador da clínica (pré-consulta) quanto o médico (durante consulta) podem registrar. Campo `collectedById` guarda o ID do usuário que coletou. Sem controle de role por hora.

---

## Critérios de Aceite

| ID | Critério |
|----|---------|
| B4-AC-001 | `POST /api/anamnese` cria registro no banco para requestId válido |
| B4-AC-002 | Segundo `POST` para mesmo requestId sobrescreve o anterior (upsert) |
| B4-AC-003 | `GET /api/anamnese/:requestId` retorna campos parseados ou 404 |
| B4-AC-004 | `GET /api/solicitacoes/:id` inclui campo `anamnese` (null se não houver) |

---

## Impacto no Frontend

Após B4 estar pronto, a aba "Anamnese" na tela de consulta (`F1-REQ-003`) deve:
- Exibir os campos da anamnese quando `anamnese !== null`
- Exibir "Anamnese não coletada" quando `null`
- **Futuramente (Fase 4):** permitir que o médico edite/adicione durante a consulta

---

## Arquivos afetados

### Backend
- `prisma/schema.prisma` — adicionar model `Anamnese`
- `prisma/migrations/` — nova migration
- `src/` — novo módulo `anamnese/` (controller, service, module)
- `src/exam-request/exam-request.service.ts` — incluir anamnese no `findOne`
- `src/app.module.ts` — registrar `AnamneseModule`

