# D1 + F6 — App do Paciente: Definição de Lógica e Fluxo

**Prioridade:** 🔴 Crítico (decisão necessária antes de implementar)  
**Frentes:** Decisão de produto → Frontend → Backend  
**Complexidade:** Complex (alto grau de ambiguidade)

---

## Contexto

Não existe nenhuma tela para o paciente/colaborador além de:
- `/colaboradores/signup` — cadastro via convite
- `/colaboradores/status` — ver status da própria solicitação

O que o paciente vê depois de se cadastrar? O que ele faz no aplicativo? Isso não está definido.

---

## Perguntas em Aberto (D1 — Discussão necessária)

### 1. Canal do paciente: web ou mobile nativo?

**Opção A** — Continuar no Next.js (web responsivo, PWA)  
**Opção B** — App nativo (React Native, Expo)  
**Opção C** — Híbrido: web para esta fase, nativo no futuro

**Impacto:** A escolha define a complexidade técnica. Para Fase 3, recomendamos **Opção A** (web responsivo com PWA) para manter velocidade de entrega.

---

### 2. O que o paciente acessa no app?

Listar e decidir o que entra na Fase 3:

| Funcionalidade | Necessidade | Decisão |
|---------------|-------------|---------|
| Ver status da solicitação de exame | 🔴 Essencial | ✅ já existe em `/colaboradores/status` (incompleto) |
| Receber notificação quando exame for concluído | 🔴 Essencial | ❓ a definir |
| Baixar o ASO gerado | 🔴 Essencial | ❓ a definir |
| Fazer anamnese antes da consulta | 🟡 Importante | ❓ a definir |
| Entrar na sala de vídeo (teleconsulta) | 🟡 Importante | ❓ a definir |
| Ver histórico de exames anteriores | 🟢 Desejável | Fase 4 |
| Agendar consulta | 🟢 Desejável | Fase 4 |
| Chat com médico | 🟢 Desejável | Fase 4 |

---

### 3. Como o paciente entra na sala de vídeo?

Atualmente o médico tem um botão "Iniciar Chamada de Vídeo" mas é simulação (sem WebRTC real).

**Opções:**
- A: Link gerado pelo médico, enviado por SMS/email ao paciente → paciente abre no browser
- B: Sala WebRTC na própria plataforma (médico e paciente entram pelo app)
- C: Integração com plataforma externa (Whereby, Daily.co, Zoom SDK)

**Para Fase 3:** Definir qual opção. Se C, qual provedor?

---

### 4. Notificações ao paciente

Quando o exame for concluído ou o ASO estiver disponível, como o paciente é avisado?

- A: Email (já tem campo `expectedEmail` no convite)
- B: SMS
- C: Push notification (requer PWA ou app nativo)
- D: Apenas polling na tela do status

**Para Fase 3:** Opção A (email) ou D (polling) são mais simples.

---

### 5. Fluxo de anamnese pelo paciente

Se o paciente preenche a anamnese antes da consulta:
- Quando? Logo após o cadastro? Ou ao ser chamado para atendimento?
- Quais campos? (ver B4 — lista de campos proposta)
- A anamnese pré-preenchida pelo paciente pode ser editada pelo médico durante a consulta?

---

## Requisitos (assumindo decisões mínimas para começar)

Assumindo: **web responsivo + polling de status + email de notificação + anamnese pelo paciente + link de vídeo por URL**

### Backend (extensões)

**F6-B-REQ-001** — `GET /api/paciente/me` (requer auth, role PATIENT) — retorna dados do paciente logado, solicitações ativas e histórico.

**F6-B-REQ-002** — `POST /api/anamnese` (B4) deve aceitar `collectedByPatient: true` para distinguir anamnese preenchida pelo paciente vs. operador/médico.

**F6-B-REQ-003** — `GET /api/paciente/me/aso` — retorna ASO mais recente com `pdfUrl` (quando disponível).

**F6-B-REQ-004** — Envio de email quando `AsoDocument` é criado com status `decision` preenchido. (Usar Nodemailer ou integração com SendGrid — a definir.)

**F6-B-REQ-005** — `GET /api/paciente/me/sala-video` — retorna URL da sala de vídeo (quando solicitação está em `EM_ATENDIMENTO_MEDICO` e há `Teleconsultation.videoSessionId` preenchido).

### Frontend

**F6-F-REQ-001** — Área do paciente em `/paciente/*` com layout próprio (diferente do médico e empresa).

**F6-F-REQ-002** — `/paciente/status` — tela principal do paciente após login:
- Card de status da solicitação atual com timeline visual
- Quando status = `EM_ATENDIMENTO_MEDICO`: botão "Entrar na consulta" com link para sala de vídeo
- Quando status = `CONCLUIDO`: botão "Baixar ASO"

**F6-F-REQ-003** — `/paciente/anamnese` — formulário de anamnese a ser preenchido pelo paciente antes da consulta (campos de B4).

**F6-F-REQ-004** — `/paciente/sala` — página com iframe ou link externo para a sala de vídeo.

---

## Critérios de Aceite

| ID | Critério |
|----|---------|
| F6-AC-001 | Paciente logado vê o status atualizado da própria solicitação |
| F6-AC-002 | Paciente com solicitação CONCLUIDA consegue baixar o PDF do ASO |
| F6-AC-003 | Paciente com solicitação EM_ATENDIMENTO_MEDICO vê botão de entrar na consulta |
| F6-AC-004 | Formulário de anamnese salva dados vinculados à solicitação ativa |
| F6-AC-005 | Área do paciente é inacessível para outros roles (OPERATOR, DOCTOR, COMPANY_ADMIN) |

---

## ⚠️ AÇÃO NECESSÁRIA ANTES DE IMPLEMENTAR

**Esta spec deve ser revisada e as decisões abaixo tomadas antes de qualquer código:**

1. [ ] Canal: web responsivo (PWA) ou nativo?
2. [ ] Videochamada: link externo, WebRTC próprio, ou plataforma terceira? Se terceira, qual?
3. [ ] Notificação: email, SMS, push, ou só polling?
4. [ ] Anamnese: paciente preenche antes? Quando exatamente no fluxo?
5. [ ] Quais funcionalidades entram na Fase 3 vs. Fase 4?

---

## Arquivos afetados (após decisões)

### Backend
- `src/paciente/` — novo módulo
- `src/anamnese/` — módulo de B4 (já especificado)
- `src/teleconsultation/` — futuro módulo para sala de vídeo

### Frontend
- `app/paciente/` — nova área com layout próprio
- `app/paciente/status/page.tsx`
- `app/paciente/anamnese/page.tsx`
- `app/paciente/sala/page.tsx`
- `middleware.ts` — proteger `/paciente/*` com role PATIENT

