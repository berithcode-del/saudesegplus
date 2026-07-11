# F6 — Portal de Processo do Funcionário

**Prioridade:** 🔴 Crítico  
**Frentes:** Backend + Frontend  
**Complexidade:** Complex  
**Substitui:** `D1-F6-app-paciente.md` (questões em aberto resolvidas pela decisão de produto)

---

## Decisão de Produto (D1 — Resolvida)

O documento de produto define claramente o modelo: **Portal de Processo**, não aplicativo convencional.

| Questão | Decisão |
|---------|---------|
| Canal | Web responsivo (sem app nativo) — link abre no browser do celular |
| Login/senha | **Não existe** — acesso via token no link + validação de identidade (CPF + data nascimento) |
| Navegação | **Não existe** — uma tela única de "próxima ação" |
| Notificação | WhatsApp / SMS / e-mail com link direto (canal a definir por integração; link é o mecanismo central) |
| Videochamada | Link externo gerado pela plataforma (Whereby, Daily.co ou similar) embutido no passo de teleconsulta |
| Anamnese | Etapa obrigatória do fluxo, antes dos exames, conduzida pelo próprio portal |
| Histórico | Fora do escopo — o processo é pontual, não tem conta permanente |

---

## Modelo Central: Processo

Cada solicitação de exame (`ExamRequest`) **é** o processo. Todo o portal do funcionário orbita em torno de um único `ExamRequest.id`.

O funcionário **nunca escolhe** qual processo ver — o link já aponta para o processo correto.

### Estados do Processo (mapeamento para `ExamRequest.status`)

| Status no banco | Significado para o funcionário | Próxima ação exibida |
|----------------|-------------------------------|----------------------|
| `AGUARDANDO_COLETA` | Processo iniciado | Confirmar dados pessoais |
| `DOCUMENTOS_PENDENTES` | Documentos faltando | Enviar documentos |
| `QUESTIONARIO_PENDENTE` | Anamnese pendente | Responder questionário |
| `AGUARDANDO_EXAMES` | Aguardando exames presenciais | Comparecer à clínica / laboratório |
| `EM_COLETA` | Exames sendo coletados | Aguardar resultados |
| `NA_FILA_MEDICA` | Fila de avaliação médica | Aguardar médico |
| `EM_ATENDIMENTO_MEDICO` | Médico disponível | Entrar na teleconsulta |
| `CONCLUIDO` | Processo finalizado | Baixar ASO |

> **Nota:** Novos status (`DOCUMENTOS_PENDENTES`, `QUESTIONARIO_PENDENTE`, `AGUARDANDO_EXAMES`) precisam ser adicionados ao enum `ExamRequestStatus` (ver GAPS-E-RISCOS G06). O enum atual cobre apenas parte do fluxo.

---

## Fluxo de Acesso (sem login)

```
1. Empresa cria ExamInvite → sistema gera token UUID
2. Link: https://app.dominio.com.br/p/{token}
3. Funcionário abre link no celular
4. Tela de validação de identidade: CPF + data de nascimento
5. Backend valida contra ExamInvite.expectedCpf + Patient.birthDate
6. Se válido: emite SessionToken temporário (JWT curta duração, ex: 4h)
7. Frontend salva SessionToken em sessionStorage (não localStorage — expira ao fechar o browser)
8. Todas as requisições subsequentes usam o SessionToken
9. SessionToken carrega: { processId: ExamRequest.id, patientId: string }
```

O `token` do link identifica o **convite**; o `SessionToken` identifica a **sessão do processo** após validação.

---

## Requisitos de Backend

### Autenticação do Portal (sem senha)

**F6-B-REQ-001** — Nova rota pública `POST /api/portal/auth`:
```ts
// Request
{ token: string, cpf: string, birthDate: string } // birthDate: ISO date

// Response 200
{ sessionToken: string, processId: string }

// Response 401
{ message: 'Dados não conferem ou link expirado.' }
```

Lógica:
1. Buscar `ExamInvite` por `{ token, status: { not: 'EXPIRADO' } }`
2. Validar `invite.expectedCpf === cpf` (sem formatação)
3. Buscar `Patient` vinculado ao invite e validar `birthDate`
4. Buscar ou criar `ExamRequest` vinculado ao invite
5. Emitir JWT com payload `{ sub: patientId, processId: ExamRequest.id, role: 'PORTAL' }`, `expiresIn: '4h'`
6. Atualizar `ExamInvite.status = 'ABERTO'` e criar evento `LINK_ABERTO` na timeline

**F6-B-REQ-002** — `GET /api/portal/processo` (requer SessionToken com role PORTAL):

Retorna o processo completo do funcionário:
```ts
{
  id: string,                    // ExamRequest.id
  status: string,                // status atual
  proximaAcao: ProximaAcao,      // calculada pelo backend
  progresso: ProgressoItem[],    // etapas e estado de cada uma
  empresa: { nome: string },
  tipoExame: string,             // examPurpose
  cargo: string,                 // functionCboCode do patient
  prazoAte: string | null,       // ExamInvite.expiresAt
  paciente: { nome: string, cpf: string },
  documentos: DocumentoStatus[], // quais docs foram enviados e quais faltam
  questionario: { respondido: boolean },
  teleconsulta: { disponivel: boolean, linkSala: string | null },
  aso: { disponivel: boolean, pdfUrl: string | null },
  timeline: TimelineEvent[],     // histórico de eventos do processo
}
```

**F6-B-REQ-003** — Cálculo de `proximaAcao` no backend (não no frontend):

```ts
type ProximaAcao = {
  tipo: 'CONFIRMAR_DADOS' | 'ENVIAR_DOCUMENTOS' | 'RESPONDER_QUESTIONARIO'
       | 'COMPARECER_CLINICA' | 'AGUARDAR_RESULTADOS' | 'AGUARDAR_MEDICO'
       | 'ENTRAR_TELECONSULTA' | 'BAIXAR_ASO' | 'CONCLUIDO',
  titulo: string,        // ex: "Compareça à clínica"
  descricao: string,     // instrução detalhada
  cta: string | null,    // texto do botão principal, null se não há ação ativa
  ctaUrl: string | null, // URL para ação externa (ex: link da sala de vídeo)
  endereco: string | null, // clínica/laboratório, quando aplicável
}
```

A lógica de cálculo segue a ordem:
1. Se `status = AGUARDANDO_COLETA` e dados não confirmados → `CONFIRMAR_DADOS`
2. Se documentos pendentes → `ENVIAR_DOCUMENTOS`
3. Se questionário não respondido → `RESPONDER_QUESTIONARIO`
4. Se `status = AGUARDANDO_EXAMES` → `COMPARECER_CLINICA` (com endereço da clínica)
5. Se `status = EM_COLETA` → `AGUARDAR_RESULTADOS`
6. Se `status = NA_FILA_MEDICA` → `AGUARDAR_MEDICO`
7. Se `status = EM_ATENDIMENTO_MEDICO` e `videoSessionId` preenchido → `ENTRAR_TELECONSULTA`
8. Se `status = CONCLUIDO` e `pdfUrl` preenchido → `BAIXAR_ASO`
9. Se `status = CONCLUIDO` → `CONCLUIDO`

**F6-B-REQ-004** — `POST /api/portal/confirmar-dados`:
```ts
// Request (apenas campos que o funcionário pode corrigir)
{ phone?: string, email?: string }
// Atualiza Patient e avança status se necessário
```

**F6-B-REQ-005** — `POST /api/portal/documentos` (multipart):
```ts
{ tipo: 'rg' | 'cpf' | 'cnh' | 'foto' | 'outro', file: File }
```
Salva o documento e registra no processo. Se todos os documentos obrigatórios foram enviados, avança o status do processo.

**F6-B-REQ-006** — `POST /api/portal/questionario`:
```ts
{
  queixas?: string,
  doencasPrevias?: string,
  medicamentosEmUso?: string,
  alergiasConhecidas?: string,
  exposicoesOcupacionais?: string,
  cirurgiasPrevias?: string,
  observacoes?: string
}
```
Chama internamente `POST /api/anamnese` (B4). Avança status para `AGUARDANDO_EXAMES` ou `NA_FILA_MEDICA` dependendo do fluxo determinado pelo `OccupationalRisk` do CBO.

**F6-B-REQ-007** — Lógica de roteamento de fluxo (Fluxo A / B / C do documento de produto):

Após questionário respondido, o backend determina o caminho com base em `OccupationalRisk`:
- `requiresInPerson = true` OU `requiredExams` não vazios → status `AGUARDANDO_EXAMES` (vai para clínica)
- `requiresInPerson = false` E `requiredExams` vazio → status `NA_FILA_MEDICA` (vai direto para teleconsulta)

Registrar a decisão de roteamento como evento na timeline.

**F6-B-REQ-008** — `GET /api/portal/aso` — retorna o PDF do ASO quando disponível. Redireciona para `pdfUrl` ou serve o arquivo.

**F6-B-REQ-009** — Documentos obrigatórios por tipo de exame: definir lista mínima. Por ora, fixo no backend:
```ts
const docsObrigatorios = ['rg', 'foto'];
// CNH apenas quando CBO exige (definir lista de CBOs no futuro)
```

**F6-B-REQ-010** — `ExamInvite` sem `ExamRequest` vinculado: o fluxo atual de `colaborador.service.ts` já cria o `ExamRequest` ao validar o invite. Verificar que o portal reutiliza o `ExamRequest` existente (não cria novo).

---

## Requisitos de Frontend

### Estrutura de rotas

```
/p/[token]                → Ponto de entrada — validação de identidade
/p/[token]/processo       → Tela principal do processo (única tela real)
/p/[token]/confirmar      → Etapa: confirmar/corrigir dados
/p/[token]/documentos     → Etapa: envio de documentos
/p/[token]/questionario   → Etapa: anamnese
/p/[token]/teleconsulta   → Etapa: sala de vídeo (embed ou redirect)
/p/[token]/aso            → Etapa: download do ASO
```

> Todas as rotas `/p/*` são públicas (sem auth middleware padrão) mas requerem SessionToken no `sessionStorage`.

**F6-F-REQ-001 — Tela de validação de identidade** (`/p/[token]`):

- Exibe logo da plataforma + nome da empresa (carregado do token, sem autenticar)
- Campos: CPF (com máscara) + Data de nascimento
- Botão "Confirmar minha identidade"
- Mensagem de erro clara quando dados não batem: "CPF ou data de nascimento não conferem."
- Mensagem quando link expirado: "Este link não está mais disponível. Entre em contato com a empresa."
- Sem campos de e-mail ou senha em lugar nenhum

**F6-F-REQ-002 — Boas-vindas** (primeira visita após auth, antes de ir para `/processo`):

Modal ou tela simples com:
- Nome do funcionário
- Empresa
- Tipo do exame
- Prazo para conclusão
- Botão único: "Iniciar processo"

**F6-F-REQ-003 — Tela principal do processo** (`/p/[token]/processo`):

Esta é a tela central e quase única do portal. Composição:

**Topo:** barra de progresso visual com as etapas:
```
● Cadastro  ● Documentos  ● Questionário  ● Exames  ● Médico  ○ ASO
```
Etapas concluídas em roxo sólido, etapa atual pulsando, futuras em cinza.

**Card de próxima ação (central, destaque):**
- Ícone grande ilustrativo
- Título da ação (ex: "Compareça à clínica")
- Descrição detalhada com instruções
- Endereço da clínica/laboratório quando aplicável (mapa estático ou link Google Maps)
- Botão CTA principal (ex: "Entrar na teleconsulta", "Baixar ASO") — visível apenas quando há ação ativa
- Quando status é de espera: sem botão, apenas mensagem informativa e animação de "aguardando"

**Timeline colapsável (abaixo do card):**
- Lista de eventos do processo em ordem cronológica
- Colapsada por padrão; abrir ao clicar em "Ver histórico"

**F6-F-REQ-004 — Tela de confirmação de dados** (`/p/[token]/confirmar`):

- Exibe dados vindos do backend (nome, CPF, nascimento, telefone, e-mail) — somente leitura para os campos sensíveis
- Campos editáveis: telefone, e-mail
- Botão "Confirmar dados" — avança o processo
- Botão "Solicitar correção" — exibe instruções para contato com a empresa (não abre ticket automaticamente nesta fase)

**F6-F-REQ-005 — Tela de envio de documentos** (`/p/[token]/documentos`):

- Lista os documentos obrigatórios com status: ✅ enviado / ❌ pendente
- Upload por item (foto ou PDF, max 10MB)
- Preview após upload (miniatura para imagem, ícone para PDF)
- Possibilidade de reenviar
- Botão "Continuar" ativo somente quando todos os obrigatórios foram enviados

**F6-F-REQ-006 — Tela de questionário** (`/p/[token]/questionario`):

- Formulário passo a passo (um campo ou grupo por tela, estilo wizard) — não tudo numa página só
- Linguagem simples, sem jargão médico. Ex: "Você tem alguma doença?" em vez de "Comorbidades"
- Barra de progresso do próprio questionário (pergunta X de Y)
- Botão "Voltar" entre perguntas
- Botão "Finalizar questionário" na última pergunta → salva e retorna ao processo

**F6-F-REQ-007 — Tela de teleconsulta** (`/p/[token]/teleconsulta`):

- Instrução clara: "O médico está pronto para te atender"
- Botão "Entrar na consulta" → abre `linkSala` em nova aba ou embed (iFrame com allow camera/microphone)
- Dicas de preparação: "Use fones de ouvido", "Certifique-se de estar num lugar tranquilo"
- Quando `linkSala = null` e status = `EM_ATENDIMENTO_MEDICO`: mostrar "Preparando sua sala, aguarde..."

**F6-F-REQ-008 — Tela do ASO** (`/p/[token]/aso`):

- Mensagem de conclusão com ícone comemorativo
- Dados do ASO: data, decisão (APTO/INAPTO/RESTRIÇÃO), validade
- Botão "Baixar ASO (PDF)"
- Instrução: "Guarde este documento — você pode precisar apresentá-lo à empresa."

**F6-F-REQ-009 — Comportamento de polling:**

A tela principal (`/processo`) deve verificar atualizações a cada **30 segundos** via `GET /api/portal/processo`. Quando o status muda, recarregar a `proximaAcao` e atualizar a barra de progresso sem recarregar a página (substituição de estado React).

**F6-F-REQ-010 — Layout e identidade visual:**

- Layout completamente diferente das outras áreas (médico/empresa/clínica)
- Mobile-first: o funcionário acessa pelo celular
- Fundo claro, card central com sombra suave
- Fonte grande e legível (min 16px body)
- Botão CTA ocupa largura total no mobile
- Sem sidebar, sem header complexo — apenas logo + nome do processo no topo

**F6-F-REQ-011 — Estados de erro e expiração:**

- Token expirado: tela informativa com instruções de contato, sem botão de "tentar novamente"
- SessionToken expirado (4h): redirecionar para `/p/[token]` para revalidar identidade
- Erro de rede: mensagem "Sem conexão — tente novamente" com botão de retry

---

## Fluxos completos

### Fluxo A — Direto para teleconsulta (sem exames presenciais)

```
Link → Validação → Boas-vindas → Confirmar dados
→ Enviar documentos → Questionário → [backend roteia: sem exames]
→ NA_FILA_MEDICA → EM_ATENDIMENTO_MEDICO
→ Teleconsulta → CONCLUIDO → Baixar ASO
```

### Fluxo B — Com exames laboratoriais

```
Link → Validação → Boas-vindas → Confirmar dados
→ Enviar documentos → Questionário → [backend roteia: com exames]
→ AGUARDANDO_EXAMES → (paciente vai à clínica presencialmente)
→ EM_COLETA → (operador lança resultados) → NA_FILA_MEDICA
→ EM_ATENDIMENTO_MEDICO → Teleconsulta → CONCLUIDO → Baixar ASO
```

### Fluxo C — Com exames ocupacionais especializados

```
Igual ao Fluxo B, porém com múltiplos tipos de exame
na etapa de coleta (audiometria, espirometria, etc.)
```

---

## Critérios de Aceite

| ID | Critério |
|----|---------|
| F6-AC-001 | `POST /api/portal/auth` com CPF+nascimento corretos retorna SessionToken |
| F6-AC-002 | `POST /api/portal/auth` com dados errados retorna 401 sem vazar qual campo está errado |
| F6-AC-003 | `POST /api/portal/auth` com token expirado retorna 401 com mensagem específica |
| F6-AC-004 | `GET /api/portal/processo` retorna `proximaAcao` calculada de acordo com o status atual |
| F6-AC-005 | Após responder questionário, `status` avança para `AGUARDANDO_EXAMES` ou `NA_FILA_MEDICA` conforme CBO |
| F6-AC-006 | Tela de validação não tem campo de senha em nenhuma hipótese |
| F6-AC-007 | Barra de progresso reflete o estado correto do processo em cada status |
| F6-AC-008 | Polling de 30s atualiza `proximaAcao` sem recarregar a página |
| F6-AC-009 | Quando status = `EM_ATENDIMENTO_MEDICO` e `linkSala` preenchido, botão "Entrar na consulta" fica visível |
| F6-AC-010 | Quando status = `CONCLUIDO`, botão de download do ASO aparece e o PDF é acessível |
| F6-AC-011 | SessionToken expirado redireciona para revalidação de identidade (não para login com senha) |
| F6-AC-012 | Layout é funcional em mobile (375px) sem scroll horizontal |
| F6-AC-013 | Documentos enviados ficam visíveis como "✅ enviado" na lista de documentos |
| F6-AC-014 | Empresa vê eventos do portal na timeline em tempo real via WebSocket (LINK_ABERTO, QUESTIONARIO_RESPONDIDO, etc.) |

---

## Impacto em outros módulos

### ExamRequest — novos status necessários
Adicionar ao enum `ExamRequestStatus` (migration):
- `DOCUMENTOS_PENDENTES`
- `QUESTIONARIO_PENDENTE`
- `AGUARDANDO_EXAMES`

### ExamInvite — novo evento de timeline
Adicionar ao enum `TimelineEventType`:
- `DADOS_CONFIRMADOS`
- `DOCUMENTOS_ENVIADOS`
- `QUESTIONARIO_RESPONDIDO`
- `TELECONSULTA_INICIADA`

### CompanyGateway — emitir eventos do portal
Todos os avanços de etapa devem emitir `timeline_update` para que o painel da empresa reflita em tempo real.

### Médico — link de sala de vídeo
O médico precisa de um botão "Gerar link de sala" na tela de consulta que popule `Teleconsultation.videoSessionId`. Sem isso, o campo `linkSala` do portal fica `null` e o funcionário vê "Preparando sua sala...". Esta integração é dependente da decisão de provedor de videochamada (Whereby / Daily.co / outro).

---

## Questões ainda em aberto (para próxima discussão)

| ID | Questão | Impacto |
|----|---------|---------|
| Q1 | Qual provedor de videochamada? (Whereby, Daily.co, Zoom) | Define como `linkSala` é gerado e o custo |
| Q2 | Canal de envio do link ao funcionário (WhatsApp API, SMS, e-mail)? | Define integrações externas necessárias |
| Q3 | Lista completa de documentos obrigatórios por tipo de exame e CBO? | Define `docsObrigatorios` no backend |
| Q4 | Revalidação de identidade após 4h: aceitar sem reabrir câmera? Ou apenas CPF+data de novo? | UX da sessão expirada |

---

## Arquivos afetados

### Backend
- `prisma/schema.prisma` — enum `ExamRequestStatus`, enum `TimelineEventType` (novos valores)
- `src/portal/` — novo módulo (portal.controller, portal.service, portal.module, portal-session.guard)
- `src/portal/dto/` — `AuthPortalDto`, `ConfirmarDadosDto`, `QuestionarioDto`, `UploadDocumentoDto`
- `src/queue/queue.service.ts` — emitir `TELECONSULTA_INICIADA` quando médico aceita
- `src/exam-request/exam-request.service.ts` — calcular `proximaAcao` (extrair em helper)
- `src/company/company.gateway.ts` — adicionar novos tipos de evento

### Frontend
- `app/p/[token]/page.tsx` — validação de identidade
- `app/p/[token]/processo/page.tsx` — tela principal (polling)
- `app/p/[token]/confirmar/page.tsx`
- `app/p/[token]/documentos/page.tsx`
- `app/p/[token]/questionario/page.tsx`
- `app/p/[token]/teleconsulta/page.tsx`
- `app/p/[token]/aso/page.tsx`
- `app/p/layout.tsx` — layout mobile-first do portal
- `middleware.ts` — rotas `/p/*` fora da proteção de role padrão

