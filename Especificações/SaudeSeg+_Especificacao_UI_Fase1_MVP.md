# SaúdeSeg+ — Especificação de Interface (UI) e Técnica das 3 Telas — Fase 1 (MVP)

**Versão:** 1.0
**Baseado em:** "SaúdeSeg+ — Especificação Funcional e Arquitetura Técnica" (v1.0)
**Escopo deste documento:** Detalhamento de UI, funcionalidades e intercomunicação **exclusivamente da Fase 1 (MVP)**, conforme roadmap §11.5 do documento original:
- Tela 1 — Consultório: cadastro, agenda, inserção **manual** de exame.
- Tela 2 — Médico: fila simples + teleconsulta + emissão de ASO com assinatura eletrônica básica.
- Tela 3 — Paciente (App): cadastro + acompanhamento de status.

Fora de escopo na Fase 1 (não detalhado aqui, ver roadmap original): Portal RH, integração semi/automática de equipamentos, backoffice administrativo, ICP-Brasil, priorização avançada de fila.

---

## Sumário
1. Premissas da Fase 1
2. Tela 1 — Consultório: UI e Especificação Técnica
3. Tela 2 — Médico: UI e Especificação Técnica
4. Tela 3 — Paciente (App): UI e Especificação Técnica
5. Intercomunicação entre as Três Telas (Fase 1)
6. Estados e Transições (Máquina de Estados Simplificada)
7. Limitações Conscientes da Fase 1

---

## 1. Premissas da Fase 1

- Banco de dados único (sem multi-região), PostgreSQL + Redis.
- Autenticação por perfil (operador, médico, paciente) via JWT/OAuth2, sem MFA obrigatório ainda (MFA é recomendado para médico desde o MVP, dado o dado sensível — ver §7).
- Fila digital simples: ordenação FIFO por tempo de entrada, sem priorização avançada por SLA/plano.
- Inserção de exames 100% manual (campos estruturados por tipo de exame, não texto livre — já preparando migração futura).
- Assinatura eletrônica via provedor terceiro (ex.: Clicksign/D4Sign/Birdid), não ICP-Brasil.
- Comunicação em tempo real entre as telas via WebSocket (status de fila) + REST para operações transacionais.
- Vídeo chamada via provedor gerenciado WebRTC (ex.: Daily.co/Twilio/Agora).

---

## 2. Tela 1 — Consultório: UI e Especificação Técnica

### 2.1 Objetivo da tela
Ferramenta web (PWA/SPA) usada pelo operador da clínica física para cadastrar pacientes, gerenciar agenda, registrar exames coletados e acompanhar o status do paciente até a emissão do documento final.

### 2.2 Estrutura de navegação (UI)
Layout padrão: barra lateral fixa (sidebar) + área de conteúdo principal.

**Sidebar (menu principal):**
- Dashboard / Painel de Fila da Unidade
- Pacientes (cadastro/busca)
- Agenda
- Documentos emitidos
- Configurações da unidade (perfil do operador logado)

**Cabeçalho superior:** nome da unidade, operador logado, indicador de status de conexão (online/offline em relação ao servidor).

### 2.3 Telas/Componentes de UI

#### 2.3.1 Painel de Fila da Unidade (tela inicial após login)
- Tabela/lista de pacientes da unidade com colunas: Nome, CPF, Empresa, Tipo de exame, Status, Tempo de espera.
- Status exibidos como *badges* coloridos: `Aguardando coleta` (cinza), `Em coleta` (azul), `Na fila médica` (amarelo), `Em atendimento` (laranja), `Concluído` (verde), `Pendência` (vermelho).
- Filtro por status e busca por nome/CPF.
- Atualização em tempo real (via WebSocket) sem necessidade de refresh manual.
- Alerta visual (banner) quando algum paciente excede SLA de espera configurado.

#### 2.3.2 Cadastro de Paciente (formulário)
Campos do formulário, organizados em seções:
- **Dados pessoais:** nome completo, CPF (com validação de dígito verificador em tempo real), data de nascimento, sexo, telefone, e-mail, endereço.
- **Vínculo ocupacional:** empresa contratante (busca/autocomplete), função/cargo (CBO — autocomplete que já traz o grau de risco associado), tipo de exame (admissional/periódico/demissional/mudança de função/retorno).
- **Documentos:** upload opcional de RG/CNH (drag-and-drop ou captura de câmera, se em tablet/celular).
- Botão "Verificar duplicidade" (dispara busca por CPF já existente antes de salvar).
- Ao salvar: paciente criado com status `AGUARDANDO_COLETA`; sistema exibe automaticamente a lista de exames obrigatórios para a função informada (consulta à tabela de grau de risco).

#### 2.3.3 Agenda (calendário)
- Visualização em grade: dia/semana, com slots de horário por sala/equipamento.
- Cores diferenciando origem do agendamento: criado pelo operador, criado pela empresa (Fase 2+), criado pelo paciente via app.
- Ação de arrastar-e-soltar (drag-and-drop) para reagendar, respeitando regra de prazo mínimo (RN4).
- Modal de confirmação ao cancelar, com campo obrigatório de motivo (RN3).

#### 2.3.4 Check-in e Coleta de Exames
- Botão "Check-in" na linha do paciente (muda status para `EM_COLETA`).
- Tela de coleta: lista dos exames obrigatórios (vindos da tabela de risco) como um checklist.
- Para cada exame: formulário estruturado específico por tipo (ex.: campo numérico para PA sistólica/diastólica; campo para resultado de audiometria por frequência) — **sem campo de texto livre genérico**, para garantir dado estruturado.
- Cada exame salvo registra automaticamente: timestamp e operador responsável (não editável pelo operador — apenas pelo sistema).
- Indicador de progresso "X de Y exames coletados".
- Quando todos os exames obrigatórios estão preenchidos, botão "Enviar para fila médica" fica habilitado; ação muda status para `NA_FILA_MEDICA` e dispara evento para a Tela 2.
- Bloqueio de edição (campos somente leitura com aviso) caso o médico já tenha iniciado a análise (RN2).

#### 2.3.5 Documentos Emitidos
- Lista de ASOs já assinados pelo médico, disponíveis para impressão/download em PDF.
- Botão "Imprimir via impressora local" e "Baixar PDF".
- Busca por paciente/período.

### 2.4 Especificação técnica
- **Tipo de aplicação:** Web SPA (React + TypeScript), responsiva para uso em tablet (comum em recepção de clínica).
- **Comunicação:**
  - REST para CRUD de paciente, exames, agenda, documentos.
  - WebSocket (canal por `clinic_id`) para receber atualização de status em tempo real (ex.: quando médico aceita/conclui atendimento).
- **Entidades manipuladas:** `PATIENT`, `EXAM_REQUEST`, `EXAM_RESULT` (inserção manual, `source = manual`), `CLINIC`, `USER_ACCOUNT` (papel operador).
- **Validações client-side + server-side:** CPF, campos obrigatórios por tipo de exame, duplicidade de cadastro.
- **Permissões:** operador só vê/edita pacientes da própria `clinic_id` (isolamento multi-tenant).
- **Auditoria:** toda inserção/edição de exame gera registro em `AUDIT_LOG`.

---

## 3. Tela 2 — Médico: UI e Especificação Técnica

### 3.1 Objetivo da tela
Interface web usada pelo médico do trabalho para visualizar a fila de pacientes prontos para atendimento, realizar a teleconsulta, revisar os exames coletados e emitir o ASO assinado.

### 3.2 Estrutura de navegação (UI)
- Topo: indicador de disponibilidade do médico (toggle "Disponível" / "Indisponível").
- Sidebar: Fila de Atendimento, Histórico de Atendimentos, Perfil/Credenciais.

### 3.3 Telas/Componentes de UI

#### 3.3.1 Painel de Fila Médica (tela inicial)
- Lista única de pacientes em status `NA_FILA_MEDICA`, oriundos de todas as clínicas em que o médico está credenciado (na Fase 1, sem priorização avançada — apenas ordem FIFO por tempo de entrada na fila).
- Cada item da lista mostra: nome do paciente, clínica de origem, tipo de exame, tempo de espera, indicador "exames completos" (ícone de check).
- Botão "Aceitar paciente" em cada linha — ao clicar, trava o paciente exclusivamente para este médico (muda status para `EM_ATENDIMENTO`, RN5) e abre a Sala de Atendimento.
- Atualização em tempo real via WebSocket (novo paciente entra na fila / paciente aceito por outro médico desaparece da lista de outros médicos).

#### 3.3.2 Sala de Atendimento (Teleconsulta)
Layout em duas colunas:
- **Coluna principal (esquerda):** janela de vídeo chamada (WebRTC) com o paciente; controles padrão de chamada (mudo, câmera, encerrar).
- **Painel lateral (direita), em abas:**
  - Aba "Exames": visualização dos resultados estruturados coletados na clínica (tabela com valores por tipo de exame).
  - Aba "Anamnese": dados preenchidos pelo paciente no app (se aplicável).
  - Aba "Anotações": campo de texto livre para notas clínicas da consulta (criptografado em repouso).
- Indicador de gravação da chamada (se habilitada, com aviso de consentimento exibido ao paciente antes de iniciar).

#### 3.3.3 Formulário de Decisão / Emissão de ASO
Exibido como modal ou seção fixa ao final da Sala de Atendimento:
- Seleção de decisão (radio buttons): `Apto sem restrições` / `Apto com restrições` / `Inapto` / `Inconclusivo`.
- Se "Apto com restrições": campo de categorização (lista pré-definida, ex.: "uso de EPI obrigatório") + campo de texto livre complementar.
- Se "Inapto": campo de justificativa obrigatório + **modal de dupla confirmação** antes de salvar (RN7).
- Se "Inconclusivo": campo para especificar qual exame complementar é necessário; ao confirmar, paciente retorna para fila de coleta na clínica de origem.
- Botão "Gerar minuta do ASO" → exibe pré-visualização do documento (PDF) com dados do paciente, exame, decisão.
- Botão "Assinar e Emitir" → dispara fluxo de assinatura eletrônica com o provedor integrado; ao confirmar a assinatura, status muda para `CONCLUIDO` e documento fica disponível nas Telas 1 e 3.

#### 3.3.4 Histórico de Atendimentos
- Lista de pacientes atendidos (filtrável por período), com acesso à decisão tomada e ao PDF do ASO emitido.

### 3.4 Especificação técnica
- **Tipo de aplicação:** Web SPA (React + TypeScript), também utilizável em formato PWA para acesso facilitado em diferentes dispositivos.
- **Comunicação:**
  - WebSocket (canal por `doctor_id`, com fan-in das clínicas credenciadas) para receber novos pacientes na fila em tempo real.
  - REST para aceitar paciente, registrar decisão, disparar assinatura.
  - Integração com provedor de vídeo (SDK WebRTC) para sala de atendimento.
  - Integração via API com provedor de assinatura eletrônica.
- **Entidades manipuladas:** `QUEUE_ENTRY`, `TELECONSULTATION`, `ASO_DOCUMENT`, leitura de `EXAM_RESULT` e `EXAM_REQUEST`.
- **Permissões:** médico só acessa pacientes de clínicas para as quais está formalmente credenciado (RN9) — validado no backend a cada requisição, não apenas ocultado na UI.
- **Segurança:** recomenda-se MFA para este perfil desde a Fase 1, dado o acesso a dado clínico sensível; criptografia em repouso do campo de anotações clínicas.
- **Auditoria:** todo acesso a exame/prontuário de paciente é logado (RN8).

---

## 4. Tela 3 — Paciente (App): UI e Especificação Técnica

### 4.1 Objetivo da tela
Aplicativo mobile usado pelo funcionário/candidato para se cadastrar e acompanhar o andamento do seu exame ocupacional até a emissão do ASO. Na Fase 1, o app cobre cadastro e acompanhamento de status — sem o fluxo 100% remoto completo (que depende de validações jurídicas, ver documento original §10.5), mas a estrutura de tela já contempla a sala de espera virtual para os casos já liberados como remotos.

### 4.2 Estrutura de navegação (UI)
Navegação inferior (bottom tab bar), padrão mobile:
- **Início** (status do exame atual)
- **Meus Dados**
- **Documentos**
- **Perfil**

### 4.3 Telas/Componentes de UI

#### 4.3.1 Onboarding / Cadastro
- Tela de boas-vindas com opção "Tenho um convite da empresa" (insere código/link recebido) ou "Cadastro próprio" (CPF + dados pessoais).
- Formulário de dados pessoais com validação de CPF.
- Tela de aceite de termos de uso e **consentimento LGPD destacado** (checkbox específico para uso de dados de saúde, separado do aceite geral dos termos).
- Ao concluir, vínculo automático à empresa/função é exibido na tela seguinte (se cadastro via convite).

#### 4.3.2 Tela "Início" (acompanhamento de status)
- Componente central: **linha do tempo vertical** com os marcos: `Cadastrado` → `Exames coletados` → `Na fila` → `Em atendimento` → `Concluído`, com o marco atual destacado.
- Texto contextual abaixo da linha do tempo (ex.: "Seus exames foram coletados. Aguardando início do atendimento médico.").
- Se o exame da função permitir fluxo remoto: botão "Entrar na fila agora" (ver §4.3.4).
- Se exigir presença física: card com endereço/horário da unidade agendada e botão "Ver no mapa".

#### 4.3.3 Meus Dados / Anamnese Digital
- Formulário de questionário de saúde pré-consulta (histórico de doenças, medicações, cirurgias, hábitos) — campos estruturados (múltipla escolha + texto curto onde necessário).
- Opção de upload de exames complementares pré-existentes (foto ou PDF).

#### 4.3.4 Sala de Espera Virtual (para exames remotos liberados)
- Tela de espera com indicador de posição/tempo estimado.
- Notificação push disparada quando o médico aceita o paciente.
- Ao ser chamado: abre automaticamente a tela de vídeo chamada (mesmo provedor WebRTC da Tela 2).

#### 4.3.5 Documentos
- Lista de ASOs emitidos, com botão de download/visualização em PDF.
- Histórico de exames já realizados na plataforma.

#### 4.3.6 Perfil / Privacidade
- Dados cadastrais (edição limitada — CPF não editável).
- Painel de consentimentos: o que foi compartilhado e com quem.
- Opção "Solicitar exclusão/portabilidade de dados" (abre fluxo de solicitação formal, tratado pelo time de compliance).

### 4.4 Especificação técnica
- **Tipo de aplicação:** App mobile nativo cross-platform (React Native ou Flutter), iOS e Android.
- **Comunicação:**
  - REST para cadastro, anamnese, consulta de status, download de documentos.
  - WebSocket/push notification (FCM/APNs) para atualização de status da linha do tempo e chamada para atendimento.
  - SDK de vídeo WebRTC (mesmo provedor da Tela 2) para a sala de espera virtual/teleconsulta.
- **Entidades manipuladas:** `PATIENT` (próprio cadastro), leitura de `EXAM_REQUEST`/`QUEUE_ENTRY` (somente seus próprios registros), leitura de `ASO_DOCUMENT` (apenas resultado final, não prontuário).
- **Permissões:** isolamento total entre pacientes (RN10); paciente nunca acessa dados de outro paciente nem detalhe clínico interno do médico — apenas o resultado final do ASO.
- **Privacidade:** consentimento LGPD granular registrado com timestamp; dados sensíveis de saúde tratados com criptografia em repouso e em trânsito.

---

## 5. Intercomunicação entre as Três Telas (Fase 1)

As três telas não se comunicam diretamente entre si — toda interação passa pelo backend (API + camada de eventos em tempo real), garantindo isolamento de acesso por perfil.

### 5.1 Fluxo de eventos (MVP)

| # | Evento | Origem | Mecanismo | Destino(s) | Efeito |
|---|---|---|---|---|---|
| 1 | Paciente cadastrado | Tela 1 (operador) ou Tela 3 (autocadastro/convite) | REST | Backend (Serviço Core) | Cria `PATIENT` + `EXAM_REQUEST` com status `AGUARDANDO_COLETA` |
| 2 | Check-in realizado | Tela 1 | REST | Backend | Status → `EM_COLETA` |
| 3 | Exames coletados (todos obrigatórios) | Tela 1 | REST | Backend → WebSocket | Status → `NA_FILA_MEDICA`; evento publicado no canal de fila; **Tela 2** recebe o paciente na lista em tempo real; **Tela 3** atualiza a linha do tempo do paciente |
| 4 | Médico aceita paciente | Tela 2 | REST → WebSocket | Backend → Tela 1 e Tela 3 | Status → `EM_ATENDIMENTO`; paciente "trancado" para este médico; Tela 1 atualiza badge de status; Tela 3 recebe push "o médico vai te chamar em breve" |
| 5 | Teleconsulta iniciada | Tela 2 (ou Tela 3, se fluxo remoto) | Sinalização WebRTC | Provedor de vídeo | Sessão de vídeo estabelecida entre Tela 2 e Tela 3 |
| 6 | Decisão registrada + ASO assinado | Tela 2 | REST | Backend → API de assinatura → WebSocket | Status → `CONCLUIDO`; documento disponível; evento notifica Tela 1 (para impressão/entrega física) e Tela 3 (push + disponibilização do PDF) |
| 7 | Decisão "Inconclusivo" | Tela 2 | REST → WebSocket | Tela 1 | Paciente retorna para fila de coleta na clínica de origem, com a pendência especificada visível no Painel de Fila da Tela 1 |

### 5.2 Canais de tempo real (WebSocket)
- Canal por `clinic_id` → consumido pela Tela 1 (mudanças de status dos próprios pacientes).
- Canal por `doctor_id` (com fan-in das clínicas credenciadas) → consumido pela Tela 2 (novos pacientes na fila, liberação de pacientes não aceitos por outro médico).
- Canal por `patient_id` → consumido pela Tela 3 (própria linha do tempo, chamada para atendimento, documento disponível).
- Canal por `company_id` → consumido pela Tela 4 (timeline operacional do fluxo do colaborador).

### 5.3 Garantias necessárias na Fase 1
- Consistência de status: a fila digital (Redis) deve ser espelhada/validada contra o Postgres como fonte de verdade, mesmo no MVP, para evitar paciente "perdido" entre as telas em caso de reinício de serviço.
- Idempotência nas ações críticas (ex.: "aceitar paciente") para evitar dois médicos travando o mesmo paciente em race condition (lock otimista/transação atômica no backend).
- Toda transição de status registrada em `AUDIT_LOG`, permitindo reconstruir o histórico completo de qualquer paciente entre as três telas.

---

## 6. Estados e Transições (Máquina de Estados Simplificada — Fase 1)

```
[Fluxo Empresa]
EXAM_INVITE: enviado
      │ (colaborador abre o link)
      ▼
EXAM_INVITE: aberto
      │ (colaborador conclui cadastro / ou inicia direto)
      ▼
AGUARDANDO_COLETA
      │ (check-in + todos exames obrigatórios inseridos manualmente — Tela 1)
      ▼
EM_COLETA
      │ (todos exames obrigatórios preenchidos — Tela 1)
      ▼
NA_FILA_MEDICA  ──────────────► (visível na Tela 2; Tela 3 mostra "Na fila")
      │ (médico aceita — Tela 2)
      ▼
EM_ATENDIMENTO  ──────────────► (Tela 3 mostra "Em atendimento" + chamada de vídeo)
      │
      ├── Decisão Apto/Apto c/ restrição/Inapto + assinatura ──► CONCLUIDO
      │                                                          (ASO disponível nas 3 telas)
      └── Decisão Inconclusivo ──► volta para EM_COLETA na clínica de origem
                                    (com pendência registrada)
```

Estado adicional transversal: `CANCELADO` (pode ocorrer a partir de qualquer estado anterior a `CONCLUIDO`, sempre com motivo obrigatório registrado pela Tela 1 — RN3).

---

## 7. Limitações Conscientes da Fase 1

Estas limitações são deliberadas para viabilizar o MVP e devem ser comunicadas como tal aos stakeholders, não como falhas de escopo:

- Sem Portal RH: a empresa contratante ainda não tem visibilidade própria — acompanhamento, se necessário, é manual/fora da plataforma nesta fase.
- Sem Backoffice Administrativo: cadastro de clínicas, médicos e tabela de risco é feito diretamente no banco/admin técnico, não por uma interface de gestão dedicada.
- Sem priorização avançada de fila: ordenação puramente por tempo de espera (FIFO), sem SLA diferenciado por contrato ou tipo de exame.
- Inserção de exame 100% manual: nenhuma integração com equipamento (mesmo semi-automática) nesta fase — todos os exames são digitados pelo operador em campos estruturados.
- Assinatura eletrônica simples (não ICP-Brasil) — adequado para a maioria dos casos no MVP, mas pode não atender exigência de clientes corporativos maiores (ver documento original, §10.3 e §12).
- Validação de credencial médica (CRM/RQE) tratada manualmente por verificação humana, fora da interface das três telas.
- O fluxo 100% remoto (Tela 3 → fila direta sem clínica física) só deve ser habilitado para as funções/exames já validados juridicamente como permitidos por telemedicina (ver documento original, §10.5) — ponto de maior risco regulatório do projeto, não tecnológico.
