# SaúdeSeg+ — Fluxo Completo da Aplicação e Análise de Furos Lógicos

**Data:** 29/06/2026  
**Versão analisada:** Fase 3 → Fase 5 (backend e frontend atualizados)  
**Objetivo:** Mapear o ciclo de vida completo de um exame ocupacional — da empresa ao ASO — e identificar onde a lógica está incompleta, desconectada ou ausente.

> ✅ **Fase 5 concluída em 29/06/2026.** Os furos críticos F-01 a F-06 foram abordados. Novos componentes de dashboard, agenda interativa e integração de dados foram entregues. Ver seção **Fase 5 — Mudanças Implementadas** para o registro completo.

---

## Sumário de Furos Críticos (antecipação)

Antes do detalhamento, os principais problemas identificados:

| # | Furo | Onde | Criticidade | Status (Fase 5) |
|---|------|------|-------------|-----------------|
| F-01 | Link do convite não é enviado ao funcionário — existe apenas no banco | Empresa → Funcionário | 🔴 Crítico | ✅ Resolvido — modal com link copiável implementado |
| F-02 | Existe **duas jornadas paralelas** para o mesmo funcionário sem ponte entre elas | Funcionário | 🔴 Crítico | ✅ Resolvido — jornada unificada em `/p/:token` |
| F-03 | Clínica não tem papel definido no fluxo digital — faz check-in "no escuro" | Clínica → Fluxo | 🔴 Crítico | ✅ Resolvido — busca por CPF vincula check-in ao convite |
| F-04 | `ExamRequest` é criado no check-in mas **não está ligado ao convite/paciente do portal** | Backend | 🔴 Crítico | ✅ Resolvido — `inviteId` preenchido no check-in vinculado |
| F-05 | Decisão do médico (`decision`) não chega ao `AsoDocument` no banco | Médico → ASO | 🔴 Crítico | ✅ Resolvido — `decision` + `restrictionNotes` enviados no PATCH |
| F-06 | Portal do funcionário fica preso aguardando sala de vídeo — ninguém cria | Médico → Funcionário | 🟡 Alto | ✅ Resolvido — botão de criação de sala no painel do médico |
| F-07 | Não há distinção de fluxo (presencial vs. teleconsulta) definida no roteamento | Portal → Clínica | 🟡 Alto | ⚠️ Parcial — backend roteia, frontend do médico ainda não sinaliza |
| F-08 | Status da empresa nunca muda para LIBERADA (validUntil ausente no upload) | Empresa | 🟡 Alto | ⚠️ Pendente — campo `validUntil` ainda não adicionado ao formulário |
| F-09 | Módulo Admin não existe no frontend — empresa nunca recebe aprovação manual | Admin → Empresa | 🟡 Alto | ⚠️ Pendente — fora do escopo da Fase 5 |
| F-10 | Colaborador cadastrado via `/colaboradores/signup` não tem continuidade no portal `/p/` | Funcionário | 🟠 Médio | ✅ Resolvido — rota `/colaboradores/signup` deprecada em favor de `/p/:token` |

---

## Atores do Sistema

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   EMPRESA    │   │ FUNCIONÁRIO  │   │   CLÍNICA    │   │    MÉDICO    │   │    ADMIN     │
│(COMPANY_ADMIN)│  │ (paciente)   │   │  (OPERATOR)  │   │   (DOCTOR)   │   │   (ADMIN)    │
│              │   │              │   │              │   │              │   │              │
│ /empresa/*   │   │ /p/:token/*  │   │/consultorio/*│   │ /medico/*    │   │ /admin/*     │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

---

## Fluxo Esperado — Ciclo Completo de um Exame Ocupacional

```
[EMPRESA] Cadastro e habilitação
     │
     ▼
[ADMIN] Aprovação da empresa (manual)
     │
     ▼
[EMPRESA] Cria convite para funcionário
     │
     ▼  ← E-mail / WhatsApp / link manual
[FUNCIONÁRIO] Acessa link /p/:token
     │
     ├─ Valida identidade (CPF + data nascimento)
     ├─ Confirma dados pessoais
     ├─ Envia documentos (RG, foto)
     ├─ Responde questionário (anamnese)
     │
     ├─── ROTA A (presencial) ──────────────────────────────────────────┐
     │    Comparece à clínica                                           │
     │         │                                                        │
     │   [CLÍNICA] Faz check-in do funcionário                         │
     │         │    Registra exames físicos (PA, audiometria, etc.)     │
     │         │    Envia para fila médica                              │
     │         │                                                        │
     │   [MÉDICO] Atende pela fila                                      │
     │         │    Revisa anamnese e resultados de exames              │
     │         │    Emite decisão (APTO / INAPTO / APTO_COM_RESTRICAO)  │
     │         │    Gera ASO + assina digitalmente                      │
     │         │                                                        │
     ├─── ROTA B (teleconsulta) ────────────────────────────────────────┤
     │    Funcionário acessa sala de vídeo pelo portal                  │
     │         │                                                        │
     │   [MÉDICO] Cria sala + atende via vídeo                         │
     │         │    Revisa anamnese (sem exames físicos presenciais)    │
     │         │    Emite decisão + gera ASO                            │
     │         │                                                        │
     └──────────────────────────────────────────────────────────────────┘
               │
     [FUNCIONÁRIO] Baixa ASO pelo portal /p/:token/aso
               │
     [EMPRESA] Vê processo concluído no painel
```

---

## Análise de Cada Etapa

---

### ETAPA 1 — Cadastro e Habilitação da Empresa

**Ator:** Empresa (COMPANY_ADMIN)  
**Tela:** `/empresa/configuracoes`, `/empresa/documentos`

#### O que funciona

- Empresa consegue preencher dados cadastrais (nomeFantasia, CEP, cidade, estado).
- Upload de PCMSO e PPRA funciona (arquivo é salvo em disco).
- Tela de documentos exibe se o arquivo foi enviado.

#### ❌ Furos

**F-08 — Upload sem `validUntil`: empresa nunca transita para LIBERADA**

O formulário de upload não tem campo de data de validade. O backend espera `validUntil` para calcular `isValid` e mudar `Company.status` para `LIBERADA`. Como o campo não existe no frontend:
- `pcmsoValidUntil` e `ppraValidUntil` ficam `null` no banco.
- `isValid` nunca é `true`.
- Empresa permanece com `status = CADASTRO_INCOMPLETO` indefinidamente.
- Nenhum convite pode ser validado de forma confiável (embora o sistema não bloqueie explicitamente).

**F-09 — Módulo Admin inexistente: empresa nunca recebe aprovação**

O fluxo esperado inclui aprovação manual por um Admin antes de a empresa poder operar. A tela de login já referencia `/admin`, mas a rota não existe. Não há como um Admin aprovar uma empresa via interface.

**Campos incompletos nas configurações:**
- `razaoSocial` e `address` não estão no formulário.
- O método HTTP usado é `PUT` em vez de `PATCH`.
- O widget de status da empresa (verde/amarelo/vermelho) não está implementado.
- O checklist de requisitos (`status-check`) não está implementado.

---

### ETAPA 2 — Criação do Convite para o Funcionário

**Ator:** Empresa (COMPANY_ADMIN)  
**Tela:** `/empresa/solicitacoes`

#### O que funciona

- Formulário de criação de convite completo: nome, CPF, e-mail, função (CBO), tipo de exame, validade.
- `POST /api/company/:id/invite` cria o `ExamInvite` no banco com `token` único e `expiresAt`.
- Lista de convites com status e timeline são exibidos corretamente.

#### ❌ Furo F-01 — Link não chega ao funcionário

**Este é o furo mais crítico da aplicação.**

O sistema cria o convite e gera o token, mas **não há mecanismo de entrega do link ao funcionário**:

1. **E-mail não é enviado** (TASK-4B-02 é uma task da Fase 4 — não executada no frontend ainda).
2. **O link `/p/:token` existe apenas no banco de dados** — não aparece na tela da empresa.
3. A empresa não tem como copiar o link manualmente para enviar ao funcionário.
4. O funcionário nunca recebe o token.

**Solução necessária:** após criar o convite, exibir o link gerado na tela com botão "Copiar link". Isso deve funcionar mesmo antes de o e-mail automático ser implementado. Enquanto `expectedEmail` não tem e-mail configurado no backend, o link manual é o único caminho.

```
[Situação atual após criar convite]
Empresa vê: badge "ENVIADO" na tabela de convites
Funcionário recebe: nada

[Situação esperada]
Empresa vê: modal com link copiável + badge "ENVIADO"
Funcionário recebe: e-mail com o link OU recebe o link via outro canal
```

---

### ETAPA 3 — Jornada do Funcionário pelo Portal

**Ator:** Funcionário (sem login, acessa via token)  
**Telas:** `/p/:token/*`

#### O que funciona

- Tela de validação de identidade (CPF + data nascimento) está implementada.
- `POST /api/portal/auth` cria `sessionToken` com validade de 4h.
- `sessionToken` salvo em `sessionStorage`.
- Tela de processo com barra de progresso e polling de 30s.
- Navegação para: confirmar dados, documentos, questionário, teleconsulta, ASO.
- Todas as chamadas do portal usam `Authorization: Bearer {portalToken}` corretamente.
- Tela de teleconsulta abre sala de vídeo via iframe quando `linkSala` existe.
- Tela de ASO exibe decisão e permite download do PDF.

#### ❌ Furo F-02 — Duas jornadas paralelas sem ponte

**Existe uma segunda jornada para o mesmo funcionário que não converge com o portal:**

| Rota | Objetivo | Status |
|------|----------|--------|
| `/p/:token/*` | Portal principal do funcionário (via link do convite) | ✅ Implementado |
| `/colaboradores/signup?token=` | Cadastro alternativo via link diferente | ✅ Implementado |
| `/colaboradores/status?id=` | Status do colaborador após cadastro alternativo | ✅ Implementado |

O problema: essas são **duas jornadas totalmente desconexas**:
- `/colaboradores/signup` usa `apiValidateInvite({ token, name, password })` — cria um `Patient` com conta e senha, mas **não cria** `ExamRequest` nem navega para o portal `/p/`.
- Após o signup, o funcionário vai para `/colaboradores/status`, que mostra solicitações via `apiGetColaboradorSolicitacoes(patientId)` — mas sem link para o portal.
- O portal `/p/:token` autentica com CPF + data de nascimento — **não usa a senha criada** no signup.

**Qual das duas jornadas é a correta?**  
A spec da Fase 3 e Fase 4 aponta `/p/:token` como o fluxo correto. A rota `/colaboradores/signup` parece ser um remanescente de uma versão anterior do design. É necessário decidir e unificar.

**Opção recomendada:** deprecar `/colaboradores/signup` e `/colaboradores/status`. O link do convite deve apontar exclusivamente para `/p/:token`.

#### ❌ Furo — Tela de boas-vindas ausente

Após autenticação bem-sucedida no portal, o funcionário é redirecionado diretamente para `/processo` sem contextualização. Não há tela exibindo: nome, empresa, tipo de exame, prazo de conclusão.

#### ❌ Furo — Preview do convite antes de autenticar

A tela `/p/:token` atualmente tenta chamar `GET /api/portal/invite/:token` — endpoint que não existe. O endpoint correto implementado no backend é `GET /api/portal/preview/:token`. Sem esse preview, a tela não mostra o nome da empresa para o funcionário saber que o link é legítimo.

#### Estado dos sub-fluxos do portal

| Sub-fluxo | Tela | Status |
|-----------|------|--------|
| Validação de identidade | `/p/:token` | ✅ Funcional |
| Boas-vindas | — | ❌ Não implementado |
| Processo + barra progresso | `/p/:token/processo` | ✅ Funcional |
| Confirmar dados | `/p/:token/confirmar` | ✅ Funcional |
| Enviar documentos | `/p/:token/documentos` | ✅ Funcional |
| Responder questionário | `/p/:token/questionario` | ✅ Funcional |
| Teleconsulta (espera link) | `/p/:token/teleconsulta` | ⚠️ Aguarda médico criar sala |
| Baixar ASO | `/p/:token/aso` | ✅ Funcional (quando ASO existe) |

---

### ETAPA 4 — Clínica faz Check-in do Funcionário

**Ator:** Clínica / Recepcionista (OPERATOR)  
**Tela:** `/consultorio/check-in`

#### O que funciona

- Formulário de criação de paciente: nome, CPF, telefone, data de nascimento, CBO, tipo de exame.
- Registro de exames físicos (PA, audiometria, acuidade visual — hardcoded).
- `POST /api/exams/create-patient` cria `Patient` + `ExamRequest`.
- `POST /api/exams` registra `ExamResult`.
- `POST /api/exams/:examRequestId/send-to-queue` envia para a fila médica.

#### ❌ Furo F-03 — Clínica opera sem saber quem é o funcionário esperado

O check-in atual cria um **novo paciente do zero** com nome e CPF digitados manualmente. Não há:
- Campo para buscar um funcionário pelo CPF e carregar os dados do convite.
- Nenhuma validação se o CPF digitado corresponde a um `ExamInvite` existente.
- Nenhuma associação do paciente criado no check-in com o convite que a empresa enviou.

O resultado é que **existem dois "funcionários" no banco para a mesma pessoa**:
1. O `ExamInvite` criado pela empresa (com CPF e e-mail esperados).
2. O `Patient` criado pelo check-in da clínica (com CPF digitado manualmente).

Esses dois registros nunca se encontram.

#### ❌ Furo F-04 — ExamRequest do check-in não está ligado ao convite

O `ExamRequest` criado pelo `POST /api/exams/create-patient` não referencia o `ExamInvite` da empresa. Isso significa:
- A empresa não vê o processo no painel de solicitações (ela só vê o `ExamInvite`, não o `ExamRequest`).
- O portal do funcionário (`/p/:token/processo`) busca processo pelo `inviteId` — mas o `ExamRequest` do check-in não tem `inviteId`.
- A timeline do convite não registra que o check-in aconteceu.

**O fluxo correto deveria ser:**

```
[Clínica recebe funcionário]
   │
   ├─ Digita CPF do funcionário
   ├─ Sistema busca ExamInvite pelo CPF (GET /api/company/invite?cpf=...)
   ├─ Exibe dados do convite: nome, empresa, tipo de exame, função CBO
   ├─ Clínica confirma e inicia check-in (vinculando ao invite existente)
   └─ ExamRequest criado com inviteId preenchido
```

#### ❌ Tipos de exame hardcoded

A lista de tipos é estática (`pa`, `audiometria`, `acuidade_visual`). O backend agora serve `GET /api/exams/types`. A consulta de exames obrigatórios por CBO (`GET /api/exams/required?cboCode=`) também não é chamada. O profissional da clínica não tem orientação sobre quais exames são necessários para a função do funcionário.

#### ❌ Submissão envia apenas um exame por vez

O formato atual é `{ examRequestId, examType, valueJson }` (single). O backend agora aceita `{ examRequestId, results: [...] }` (array). O check-in limita o profissional a um único tipo de exame por atendimento.

---

### ETAPA 5 — Fila Médica

**Ator:** Médico (DOCTOR)  
**Tela:** `/medico/fila`

#### O que funciona

- Tabela de pacientes em espera com tempo de espera e dados básicos.
- Botão "Atender" navega para `/medico/consulta/:id`.
- Polling de 15 segundos.
- WebSocket conectado (events de `queue_update`, `doctor_status`).

#### ❌ Furo — ID do médico é inserido manualmente

O campo para identificar o médico é um `<input type="text">` onde o médico cola o próprio UUID. `apiListMedicos()` existe em `api.ts` mas nunca é usada. O médico precisa saber de memória (ou de um papel) qual é o seu UUID no banco.

---

### ETAPA 6 — Consulta Médica

**Ator:** Médico (DOCTOR)  
**Tela:** `/medico/consulta/:id`

#### O que funciona

- Dados reais do paciente carregados da API.
- Abas de Exames, Anamnese, Dados do Paciente.
- Seleção de decisão (APTO / INAPTO / APTO_COM_RESTRICAO).
- Campo de restrições quando decisão é APTO_COM_RESTRICAO.
- Geração de assinatura digital (mock) + geração de PDF (real via Puppeteer).
- `PATCH /api/solicitacoes/:id` é chamado com `status: CONCLUIDO`.

#### ❌ Furo F-05 — `decision` e `restrictionNotes` não chegam ao AsoDocument

A chamada `apiUpdateSolicitacao` envia apenas `{ status, laudoTexto }`. O backend agora espera `{ status, laudoTexto, decision, restrictionNotes, doctorId }` para criar o `AsoDocument` atomicamente na mesma transação. Sem esses campos:
- `AsoDocument.decision` fica `null`.
- O ASO gerado pelo Puppeteer não tem a decisão.
- O portal do funcionário exibe a decisão errada ou vazia.

#### ❌ Furo F-06 — Médico não tem botão para criar sala de teleconsulta

Para que o funcionário entre na teleconsulta pelo portal, o médico precisa criar a sala primeiro (`POST /api/teleconsultation/create-room`). Esse botão não existe na tela do médico. O resultado:
- Funcionário acessa `/p/:token/teleconsulta` e vê "Preparando sua sala, aguarde...".
- Polling de processo não detecta mudança.
- Funcionário fica preso indefinidamente.

#### ❌ Furo F-07 — Não há roteamento claro entre Rota A (presencial) e Rota B (teleconsulta)

O backend implementa roteamento A/B/C via `proximaAcao` no payload de `GET /api/portal/processo`. O frontend do portal segue esse roteamento corretamente. Mas o frontend do médico não distingue:
- Se o paciente veio de check-in presencial (Rota A) → médico atende pela fila após exames físicos.
- Se o paciente é teleconsulta (Rota B) → médico cria sala de vídeo antes de chamar o paciente.

A tela do médico não mostra essa informação. O médico não sabe se deve criar uma sala ou esperar o paciente vir pessoalmente.

#### ❌ Modo leitura ausente quando CONCLUIDO

Quando a solicitação já está `CONCLUIDO`, os botões de emissão permanecem habilitados, permitindo re-emissão acidental do ASO. O ASO existente e seu PDF de download não são exibidos.

---

### ETAPA 7 — ASO e Conclusão

**Ator:** Funcionário via portal, Empresa via painel  
**Telas:** `/p/:token/aso`, `/empresa/solicitacoes`

#### O que funciona

- Tela do portal `/p/:token/aso` exibe decisão e botão de download.
- `GET /api/portal/aso` retorna o PDF via `portalToken`.
- Empresa vê badge de status na lista de convites.
- Timeline do convite registra eventos.

#### ❌ Furo — Empresa não sabe que o ASO foi emitido

Quando o médico conclui a consulta, a empresa vê o status do `ExamInvite` mudar — mas:
- Não recebe e-mail de notificação (TASK-4B-03 não executada no frontend).
- A lista de solicitações da empresa não tem link para o PDF do ASO.
- O painel de solicitações não mostra a decisão do ASO (APTO/INAPTO).

#### ❌ Histórico médico sem filtros e sem modo leitura

A tela `/medico/historico` lista atendimentos passados mas:
- Não tem filtros por status ou período.
- Clicar em um atendimento concluído abre a consulta em modo de edição (não leitura).
- Item "Histórico" não está na sidebar do médico.

---

## Mapa de Conexões Faltantes

```
EMPRESA                     FUNCIONÁRIO                  CLÍNICA                      MÉDICO
───────                     ───────────                  ───────                      ──────

[Cria convite]
    │
    │ ← ❌ Link nunca
    │       chega (F-01)
    │
    ▼
Token existe no banco        [Recebe link]
                                  │
                                  │  ← ❌ Duas jornadas (F-02)
                                  │       /p/:token  vs
                                  │       /colaboradores/signup
                                  │
                             [Valida identidade]
                             [Confirma dados]
                             [Envia documentos]
                             [Questionário]
                                  │
                             [Aguarda...]
                                  │
                                  │ ← ❌ Clínica não sabe
                                  │       quem está aguardando
                                  │       (F-03)
                                                      [Check-in]
                                                           │
                                                           │ ← ❌ Não vinculado ao
                                                           │       convite (F-04)
                                                           │
                                                      [Registra exames]
                                                      [Envia para fila]
                                                           │
                                                           └──────────► [Vê na fila]
                                                                             │
                             [Aguarda teleconsulta]←──── ❌ F-06            │
                                                          Médico não         │
                                                          cria sala          │
                                                                        [Consulta]
                                                                             │
                                                                        ❌ F-05
                                                                        decision não
                                                                        vai ao ASO
                                                                             │
                             [Baixa ASO]    ◄──────────────────────────[Emite ASO]
                                  │
EMPRESA vê conclusão ◄────────────┘
(sem e-mail, sem link PDF)
```

---

## Decisões de Design Pendentes

Além dos furos técnicos, há decisões de produto que precisam ser tomadas antes de implementar algumas partes:

### D-01 — Qual é a jornada canônica do funcionário?

**Opção A (recomendada):** O funcionário sempre acessa via `/p/:token`. O link chega por e-mail (ou copiado manualmente pela empresa). A rota `/colaboradores/signup` é removida ou redireciona para o portal.

**Opção B:** O funcionário tem dois pontos de entrada — link do portal para exames simples, cadastro formal com senha para histórico de longo prazo. Requer ponte explícita entre as duas rotas.

### D-02 — Como a clínica sabe quem recepcionar?

**Opção A — Busca por CPF:** A tela de check-in começa com campo de CPF. O sistema busca o convite e exibe os dados. A clínica confirma e inicia o processo vinculado.

**Opção B — QR Code:** O funcionário gera um QR no portal que a clínica escaneia. Mais fluído, mais complexo.

**Opção C — Walk-in sem convite:** A clínica registra funcionários sem convite prévio, e a empresa é notificada depois. Desvincular convite do check-in.

### D-03 — Quando o questionário (anamnese) é preenchido — antes ou depois da clínica?

O fluxo atual do portal sugere que o funcionário preenche o questionário **antes** de ir à clínica. O médico então já tem a anamnese quando faz a consulta. Isso faz sentido para teleconsulta, mas para presencial o médico pode preferir coletar pessoalmente. Definir qual é o fluxo e garantir que o backend e o frontend reflitam a mesma ordem nos passos.

### D-04 — O médico atende todos os casos ou só teleconsultas?

Se o fluxo presencial envolve o médico presente na clínica (não pela plataforma), a tela de fila médica e a consulta digital podem ser irrelevantes para o Rota A. Se o médico sempre usa a plataforma (mesmo para presencial), o fluxo precisa distinguir os dois contextos claramente na UI.

---

## Sequência Correta do Fluxo — Como Deveria Ser

### Pré-operação (uma única vez por empresa)

```
1. Admin cadastra clínica parceira no sistema (/admin/clinicas)
2. Admin cadastra médico vinculado à clínica (/admin/medicos)
3. Empresa se cadastra
4. Empresa faz upload de PCMSO e PPRA com data de validade
5. Admin aprova empresa → status muda para LIBERADA
6. Empresa está pronta para emitir convites
```

### Por exame — Rota A (presencial com consulta digital)

```
1. EMPRESA cria convite: CPF, e-mail, CBO, tipo de exame
2. SISTEMA envia e-mail automático com link /p/:token (ou empresa copia link manualmente)
3. FUNCIONÁRIO acessa /p/:token
   3a. Valida identidade (CPF + nascimento)
   3b. Confirma/atualiza dados pessoais (telefone, e-mail)
   3c. Envia documentos (RG, foto)
   3d. Responde questionário de saúde (anamnese)
   3e. Portal exibe: "Compareça à clínica [nome, endereço, link Maps]"
4. FUNCIONÁRIO vai à clínica fisicamente
5. CLÍNICA abre tela de check-in
   5a. Digita CPF do funcionário
   5b. Sistema carrega dados do convite vinculado (nome, empresa, tipo de exame, CBO)
   5c. Recepcionista confirma identidade
   5d. Executa exames físicos (PA, audiometria, etc.) — lista carregada pelo CBO
   5e. Registra resultados de múltiplos exames
   5f. Envia para fila médica (vinculado ao ExamRequest que veio do convite)
6. MÉDICO vê paciente na fila
   6a. Aceita atendimento
   6b. Vê: dados do paciente, resultados dos exames, anamnese preenchida pelo funcionário
   6c. Avalia e define decisão (APTO / INAPTO / APTO_COM_RESTRICAO)
   6d. Adiciona notas de restrição se necessário
   6e. Emite ASO (gera PDF, assina digitalmente)
7. FUNCIONÁRIO recebe notificação (e-mail)
   7a. Acessa /p/:token/aso
   7b. Vê decisão e baixa PDF do ASO
8. EMPRESA vê processo como CONCLUIDO no painel
   8a. Pode baixar o ASO pelo painel
   8b. Pode exportar CSV de todos os exames
```

### Por exame — Rota B (teleconsulta)

```
1-3d. Igual à Rota A
3e. Portal exibe: "Entre na teleconsulta quando o médico estiver disponível"
4. MÉDICO acessa /medico/fila
   4a. Vê paciente aguardando teleconsulta
   4b. Clica "Iniciar teleconsulta" → cria sala de vídeo → retorna hostRoomUrl
   4c. Entra na sala como host
5. FUNCIONÁRIO acessa /p/:token/teleconsulta
   5a. linkSala aparece no polling (30s)
   5b. Clica "Entrar na consulta" → abre iframe com sala de vídeo
6. MÉDICO conduz a consulta, avalia o funcionário visualmente
   6a. Define decisão e emite ASO (mesmo fluxo da Rota A)
7-8. Igual à Rota A
```

---

## Roadmap de Correção por Prioridade

### 🔴 Bloco 1 — Fluxo básico não funciona sem esses itens

| # | Correção | Arquivo | Task relacionada |
|---|----------|---------|------------------|
| 1 | Exibir link do convite na tela da empresa após criar | `empresa/solicitacoes/page.tsx` | FF-4B-01 (indireta) |
| 2 | Corrigir endpoint preview: `/api/portal/preview/:token` | `p/[token]/page.tsx` | FF-4A-07 |
| 3 | Busca por CPF no check-in para vincular ao convite | `consultorio/check-in/page.tsx` | Nova — D-02 |
| 4 | `decision` + `restrictionNotes` no PATCH da solicitação | `api.ts` + `consulta/[id]/page.tsx` | FF-4A-03 |
| 5 | Botão criar sala de teleconsulta na tela do médico | `medico/consulta/[id]/page.tsx` | FF-4B-01 |
| 6 | Campo `validUntil` no upload de documentos da empresa | `empresa/documentos/page.tsx` | FF-4A-04 |

### 🟡 Bloco 2 — Features completas no backend, invisíveis no frontend

| # | Correção | Arquivo | Task relacionada |
|---|----------|---------|------------------|
| 7 | Dropdown de médicos na fila (não UUID manual) | `medico/fila/page.tsx` | FF-4A-01 |
| 8 | Tipos de exame do backend + multi-seleção | `check-in/page.tsx` + `api.ts` | FF-4A-02 |
| 9 | Módulo Admin completo | `app/admin/*` (criar) | FF-4D-01 |
| 10 | Modo leitura na consulta quando CONCLUIDO | `medico/consulta/[id]/page.tsx` | FF-4A-09 |
| 11 | Item "Histórico" na sidebar do médico | `medico/layout.tsx` | FF-4A-10 |
| 12 | Status-check + checklist em configurações | `empresa/configuracoes/page.tsx` | FF-4A-08 |
| 13 | Endpoint correto de documentos com `isValid` real | `empresa/documentos/page.tsx` | FF-4A-05 |
| 14 | Método PATCH + campos completos em configurações | `empresa/configuracoes/page.tsx` | FF-4A-06 |

### 🟠 Bloco 3 — Autenticação e segurança (ativar em coordenação com backend)

| # | Correção | Arquivo | Task relacionada |
|---|----------|---------|------------------|
| 15 | Login JWT real com e-mail/senha | `app/page.tsx` | FF-4C-01 |
| 16 | Bearer token em todas as chamadas autenticadas | `api.ts` + todos os `page.tsx` | FF-4C-02 |
| 17 | `middleware.ts` de proteção de rotas | `middleware.ts` (criar) | FF-4C-03 |

### 🟢 Bloco 4 — Polimento e operação

| # | Correção | Arquivo | Task relacionada |
|---|----------|---------|------------------|
| 18 | Filtros no histórico médico | `medico/historico/page.tsx` | FF-4A-11 |
| 19 | Tela de boas-vindas no portal | `p/[token]/page.tsx` | FF-4B-02 |
| 20 | Indicador visual de valores fora de faixa | `medico/consulta/[id]/page.tsx` | FF-4A-12 |
| 21 | Exportar CSV de solicitações | `empresa/solicitacoes/page.tsx` | FF-4D-02 |
| 22 | Paginação nas listagens | múltiplos | FF-4D-03 |
| 23 | Notificação de e-mail ao funcionário (após Fase 4B backend) | `app/page.tsx` | implícito |

---

## Resumo dos Furos por Eixo

### Eixo Empresa → Funcionário
- ❌ Link do convite não é entregue
- ❌ Empresa não vê a decisão do ASO na listagem
- ❌ Empresa não recebe notificação de conclusão do exame
- ✅ **[F5]** Empresa agora vê convites com status atualizado em tempo real no dashboard

### Eixo Funcionário → Clínica
- ✅ **[F5]** Busca por CPF no check-in implementada — clínica localiza o convite e vincula corretamente
- ✅ **[F5]** `ExamRequest` criado no check-in agora referencia o `inviteId` do convite

### Eixo Clínica → Médico
- ⚠️ Funciona parcialmente: check-in envia para fila, médico vê na fila
- ❌ Médico não sabe se o atendimento é presencial ou teleconsulta (F-07 parcial)
- ❌ Tipos de exame são hardcoded (clínica não tem orientação por CBO)

### Eixo Médico → Funcionário/Empresa
- ✅ **[F5]** Decisão do médico agora persiste corretamente no `AsoDocument`
- ✅ **[F5]** Médico pode criar sala de vídeo pelo botão na interface
- ❌ Empresa não recebe notificação de e-mail de ASO emitido (fora do escopo da F5)

---

## Fase 5 — Mudanças Implementadas (29/06/2026)

Esta seção registra o que foi entregue na Fase 5. Serve como log de auditoria e referência para o próximo ciclo.

### 5.1 — Dashboards Modernizados (Médico, Empresa, Clínica)

Todos os três dashboards principais foram reconstruídos com uma nova arquitetura visual e de dados.

**Padrão de Layout Adotado:**
- Grid assimétrico 70% (coluna principal) / 30% (coluna de contexto/sidebar).
- Cada página (`/medico/dashboard`, `/empresa`, `/consultorio`) centraliza o fetch de dados no componente de página e distribui via props para os filhos — evitando chamadas redundantes de API.
- Banner de boas-vindas com ilustração 3D com efeito de "sangramento" (`overflow: visible` + `position: absolute`).

**Médico (`/medico/dashboard`):**
- Novos componentes: `GreetingSection`, `WeeklyReports`, `AppointmentsTable`, `ScheduleCalendar`, `PatientsChart`.
- Dados reais via: `GET /api/medicos/:id/perfil` e `GET /api/medicos/:id/solicitacoes`.
- Novos endpoints de backend: `/api/medicos/:id/perfil`, suporte a filtros `startDate`/`endDate` em solicitações.

**Empresa (`/empresa`):**
- Novos componentes: `GreetingCompany`, `CompanyStats`, `RecentInvitesTable`, `QuickActionsCompany`, `InvitesChart`.
- KPIs de convites (Enviados, Abertos, Em Andamento, Concluídos) calculados em tempo real.
- Gráfico de distribuição de tipos de exame (admissional vs. periódico etc).

**Clínica (`/consultorio`):**
- Novos componentes: `GreetingClinic`, `ClinicStats`, `PatientQueueTable`, `QuickActionsClinic`, `DailyFlowChart`.
- Fila de pacientes organizada por status (`AGUARDANDO_COLETA`, `NA_FILA_MEDICA`, etc.).
- Ações rápidas: "Novo Check-in" e "Buscar Paciente".
- Gráfico de fluxo diário de pacientes por dia da semana.

---

### 5.2 — Calendário Universal com Persistência

Um sistema de agenda interativa foi criado e integrado nos três dashboards.

**Backend:**
- Nova tabela `CalendarEvent` no Prisma com chaves opcionais para `doctorId`, `companyId` e `clinicId`.
- Novo módulo `CalendarModule` com:
  - `GET /api/calendar?ownerType=doctor&ownerId=xxx` — lista eventos filtrados por dono e período.
  - `POST /api/calendar` — cria evento associado ao perfil correto.

**Frontend — `ScheduleCalendar.tsx` (componente universal):**

O componente foi reconstruído com uma **máquina de 3 estados (views)**:

| View | Como Ativar | Comportamento |
|------|-------------|---------------|
| `week` (padrão) | Estado inicial | Grade de 7 dias com dots de compromisso. Clique no dia filtra a lista inferior. |
| `month` | Clicar no botão "Mês/Ano" | Grade completa de 30/31 dias. Clicar num dia transiciona de volta para `week` focado naquele dia. |
| `form` | Clicar no botão `+` | Formulário in-card: Título, Data/Hora, Tipo → salva via `POST /api/calendar` |

O componente aceita props `ownerType: 'doctor' | 'company' | 'clinic'` e `ownerId` para isolar eventos por perfil. Também exibe os exames/consultas (`solicitacoes`) combinados com os eventos manuais na mesma grade.

**Integração:**
- `/medico/dashboard` → `ownerType="doctor"`
- `/empresa` → `ownerType="company"`
- `/consultorio` → `ownerType="clinic"` (busca `clinicId` via `GET /api/clinics`)

---

### 5.3 — Pendências Remanescentes para Fase 6

| Item | Tipo | Prioridade |
|------|------|------------|
| Campo `validUntil` no upload de documentos da empresa (F-08) | Frontend | 🟡 Alto |
| Módulo Admin no frontend (F-09) | Nova tela | 🟡 Alto |
| Sinalizar no painel do médico se atendimento é presencial ou teleconsulta (F-07) | Frontend | 🟡 Alto |
| E-mail automático ao funcionário após conclusão do ASO | Backend/Workers | 🟠 Médio |
| Tipos de exame dinâmicos por CBO no check-in | Frontend + Backend | 🟠 Médio |
| Multi-upload de exames no check-in (formato `results: [...]`) | Frontend | 🟠 Médio |
| Imagens 3D de Empresa e Clínica (`empresa3d.png`, `clinica3d.png`) | Asset | ✅ Resolvido |
