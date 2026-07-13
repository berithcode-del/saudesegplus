# Fase 4 — Backend: Visão Geral e Roadmap

**Pré-requisito:** Fase 3 concluída com todos os fixes aplicados (BUG-001 a BUG-008 da REVISAO-BACKEND.md resolvidos).

---

## Estado do backend ao entrar na Fase 4

Ao fim da Fase 3, o backend terá:

| Módulo | Estado esperado |
|--------|----------------|
| Auth JWT | ✅ Implementado (sem guard global — frontend não consome ainda) |
| Portal do funcionário | ✅ Completo (auth por token, processo, questionário, roteamento A/B/C) |
| Fila médica | ✅ Completo (prioridade geográfica, WebSocket) |
| ASO + PDF | ✅ Geração real com Puppeteer |
| Anamnese | ✅ Por paciente (divergência de design aceita) |
| Upload de documentos | ⚠️ Parcial — salva arquivo mas não atualiza campos da empresa |
| Multi-exame no check-in | ❌ Ainda não implementado (`GET /exams/types`, array de resultados) |
| Assinatura digital | 🔶 Mock funcional (cria AsoDocument, simula assinatura) |
| Teleconsulta (vídeo) | 🔶 Modelo existe, sem integração real |
| Notificações externas | ❌ Não existe (e-mail, SMS, WhatsApp) |
| Admin/backoffice | ❌ Não existe |
| Multi-tenancy / isolamento | ❌ Não existe (todos veem todos os dados) |
| Escalabilidade / jobs | ❌ Não existe (sem scheduler, sem filas de processamento) |

---

## O que a Fase 4 resolve

A Fase 4 transforma o backend de um sistema funcional para um produto operacional. Quatro eixos principais:

```
EIXO 1 — Completar o fluxo clínico
  └── Multi-exame, template ASO, assinatura real

EIXO 2 — Comunicação externa
  └── E-mail, SMS/WhatsApp para funcionário e empresa

EIXO 3 — Segurança e isolamento
  └── Guard global JWT, roles por endpoint, multi-tenancy

EIXO 4 — Operação e escala
  └── Jobs agendados, expiração de convites, relatórios, admin
```

---

## Features da Fase 4 — Backend

### EIXO 1 — Fluxo clínico completo

| ID | Feature | Depende de |
|----|---------|-----------|
| F4B-01 | `GET /api/exams/types` e `GET /api/exams/required` | Seed com ExamType corretos (FIX-001) |
| F4B-02 | `POST /api/exams` aceitar array de resultados | F4B-01 |
| F4B-03 | Template HTML do ASO (`libs/pdf-template-aso.html`) real e completo | — |
| F4B-04 | Assinatura digital real (Clicksign ou similar) | F4B-03 |
| F4B-05 | `PATCH /api/solicitacoes/:id` criar AsoDocument atomicamente | — |
| F4B-06 | `GET /api/portal/preview/:token` (endpoint público) | — |
| F4B-07 | Teleconsulta: geração de link de sala (Whereby / Daily.co) | Decisão de provedor |

### EIXO 2 — Comunicação externa

| ID | Feature | Depende de |
|----|---------|-----------|
| F4B-08 | Envio de e-mail ao criar convite (link ao funcionário) | Nodemailer / SendGrid |
| F4B-09 | Envio de e-mail quando ASO é gerado | F4B-08 |
| F4B-10 | Notificação WhatsApp / SMS ao funcionário | Evolution API ou Twilio |
| F4B-11 | Lembretes automáticos para convites não abertos (job diário) | F4B-08 + scheduler |

### EIXO 3 — Segurança e isolamento

| ID | Feature | Depende de |
|----|---------|-----------|
| F4B-12 | Guard JWT global (`APP_GUARD`) + decorator `@Public()` | Auth já implementado |
| F4B-13 | `RolesGuard` por endpoint | F4B-12 |
| F4B-14 | `profileId` no payload do JWT | F4B-12 |
| F4B-15 | Scoping de dados por empresa (company admin só vê seus dados) | F4B-13 |
| F4B-16 | Rate limiting nos endpoints públicos (portal, auth) | `@nestjs/throttler` |

### EIXO 4 — Operação e escala

| ID | Feature | Depende de |
|----|---------|-----------|
| F4B-17 | Job de expiração automática de convites vencidos | `@nestjs/schedule` |
| F4B-18 | Job de verificação de validade de documentos PCMSO/PPRA | F4B-17 |
| F4B-19 | Upload de documentos empresa: validar PDF + atualizar campos + mudar status | Upload parcial da F3 |
| F4B-20 | `GET /api/company/:id/status-check` | — |
| F4B-21 | Upload para S3 / Cloudflare R2 (substituir armazenamento local) | Conta cloud |
| F4B-22 | Módulo de admin (`/api/admin/*`) — gestão de clínicas, médicos, empresas | F4B-12, F4B-13 |
| F4B-23 | Relatórios da empresa (exportar CSV de solicitações) | — |
| F4B-24 | Paginação em todos os endpoints de listagem | — |

---

## Ordem de execução recomendada

### Sprint 4A — Fechar gaps da Fase 3 + fluxo clínico

Estas são pendências diretas da Fase 3 que devem ser as primeiras da Fase 4:

```
F4B-01  → GET /api/exams/types e /required
F4B-02  → POST /api/exams com array de resultados
F4B-03  → Template ASO completo (HTML com todos os campos)
F4B-05  → PATCH /api/solicitacoes/:id cria AsoDocument atomicamente
F4B-06  → GET /api/portal/preview/:token
F4B-19  → Upload empresa: validar PDF + atualizar Company + mudar status
F4B-20  → GET /api/company/:id/status-check
```

### Sprint 4B — Comunicação com o mundo externo

```
F4B-08  → E-mail ao criar convite (link do portal ao funcionário)
F4B-09  → E-mail quando ASO concluído (para funcionário e empresa)
F4B-11  → Job de lembrete para convites não abertos
F4B-17  → Job de expiração automática de convites
F4B-18  → Job de verificação de validade PCMSO/PPRA
```

### Sprint 4C — Teleconsulta real + assinatura

```
F4B-07  → Teleconsulta: link de sala real (Whereby/Daily.co)
F4B-04  → Assinatura digital real (Clicksign)
```

### Sprint 4D — Segurança e operação

```
F4B-12  → Guard JWT global
F4B-13  → RolesGuard por endpoint
F4B-14  → profileId no JWT
F4B-15  → Scoping de dados por empresa
F4B-16  → Rate limiting
F4B-21  → Migrar uploads para S3/R2
F4B-22  → Módulo admin
F4B-23  → Relatórios CSV
F4B-24  → Paginação
```

---

## Questões em aberto que precisam de decisão antes da Fase 4

| ID | Questão | Impacto |
|----|---------|---------|
| Q1 | Provedor de e-mail? (SendGrid, AWS SES, Nodemailer+SMTP) | F4B-08, F4B-09, F4B-11 |
| Q2 | Canal de notificação ao funcionário? (e-mail, WhatsApp, SMS) | F4B-10 — define qual API integrar |
| Q3 | Provedor de videochamada? (Whereby, Daily.co, Zoom SDK) | F4B-07 |
| Q4 | Provedor de assinatura digital? (Clicksign, DocuSign, simplificado) | F4B-04 |
| Q5 | Storage de arquivos? (S3, R2, MinIO local, filesystem) | F4B-21 |
| Q6 | A anamnese deve ser migrada para vínculo por `requestId`? | Decisão de design — impacta migration |

---

## Gaps de schema que requerem migration na Fase 4

| Gap | Migration necessária |
|-----|---------------------|
| `ExamRequest.status` como String (não enum) | Adicionar `enum ExamRequestStatus` |
| `QueueEntry.status` como String | Adicionar `enum QueueEntryStatus` |
| `Anamnese` sem `requestId` | Adicionar campo opcional `requestId` (se Q6 decidir migrar) |
| `AsoDocument.decision` como String | Adicionar `enum AsoDecision { APTO, APTO_COM_RESTRICAO, INAPTO }` |
| `Doctor.status` como String | Adicionar `enum DoctorStatus { online, offline, busy }` |
| Sem modelo `Notification` | Criar se F4B-08/10 usarem persistência de notificações enviadas |
| Sem modelo `VideoRoom` | Criar se F4B-07 precisar persistir sessões de vídeo com metadados |

