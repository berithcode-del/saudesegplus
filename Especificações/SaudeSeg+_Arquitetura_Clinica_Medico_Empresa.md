# SaúdeSeg+ — Arquitetura Consolidada: Clínica + Médico + Empresa

**Versão:** 1.0
**Natureza deste documento:** consolida as decisões já tomadas nas conversas anteriores e avança o desenho do Painel da Empresa como peça real da arquitetura — não mais como tela "fora de escopo", mas como o quarto componente que precisa ser pensado junto com Clínica e Médico desde já, com as adequações necessárias ao plano inicial (Fase 1) já mapeadas.

---

## Sumário
1. A Estrutura Real: Três Pilares Operacionais + Um Pilar Comercial
2. Decisões Fechadas (respostas às perguntas abertas)
3. Painel da Empresa — Fluxo de Trabalho Completo
4. Painel da Empresa — Especificação de UI
5. Modelo de Dados — Empresa, Convite e Rastreamento de Etapas
6. Adequações Necessárias na Estrutura da Fase 1
7. Intercomunicação Revisada (4 atores)
8. Máquina de Estados Revisada
9. O Que Ainda Fica para Depois (limites conscientes desta rodada)

---

## 1. A Estrutura Real: Três Pilares Operacionais + Um Pilar Comercial

Vale nomear com precisão o que mudou: **Clínica, Médico e Empresa** não têm o mesmo papel entre si, e isso deve guiar como cada painel é desenhado.

- **Clínica e Médico são pilares operacionais** — existem para executar o exame e emitir o documento. Eles giram em torno do paciente individual.
- **Empresa é o pilar comercial/administrativo** — existe para contratar o serviço em lote e administrar colaboradores. Ela não executa nada clinicamente; ela **demanda** execução.
- **O Colaborador (Paciente) é o objeto que circula entre os três** — nasce no Painel da Empresa (quando há convite) ou na Clínica (cadastro direto), passa pelo Médico, e o resultado final retorna tanto para a Empresa (status apto/inapto) quanto para o próprio colaborador (documento).

Essa hierarquia já estava esboçada no documento anterior; aqui ela se torna a base para detalhar o painel que faltava.

---

## 2. Decisões Fechadas (respostas às perguntas abertas)

As quatro perguntas deixadas em aberto no documento anterior agora têm resposta, conforme definido nesta conversa:

| Pergunta | Decisão |
|---|---|
| Quem acessa o Painel da Empresa? | Um único papel: **"Cadastrador"** — pessoa física vinculada à empresa (dono, no caso de empresa pequena, ou gestor de RH, no caso de empresa maior) que faz o cadastro da empresa na plataforma de forma autônoma, sem necessidade de aprovação prévia por um humano da Proxeg para criar a conta (a aprovação ocorre depois, na análise do PCMSO/PPRA). Modelo de autoatendimento, comparável a uma plataforma de emissão de notas fiscais: a pessoa se cadastra, informa e-mail/contato, e passa a operar. **Não há, nesta fase, múltiplos papéis internos da empresa** (ex.: gestor de área separado do RH) — fica registrado como possível evolução futura, não como necessidade agora. |
| Como a empresa é associada a uma clínica? | **Atribuição automática pela clínica mais próxima** da empresa (por CEP/geolocalização), priorizando praticidade para o colaborador. Exceção tratada como caso raro: se houver mais de uma clínica cadastrada na mesma cidade/região, o sistema apresenta a opção de escolha — mas o caminho padrão, na grande maioria dos casos, é atribuição automática sem necessidade de decisão humana. |
| O que acontece se o link expirar sem uso? | **Não há reenvio automático.** A expiração é, propositalmente, um sinal para a empresa: o sistema marca o convite como "expirado/não atendido" no Painel da Empresa, e é a **própria empresa quem decide gerar um novo link**, manualmente. Isso é intencional — a empresa precisa saber que aquele colaborador não cumpriu o prazo (relevante para o próprio controle dela, ex.: admissional não realizado a tempo), não é algo para o sistema "resolver sozinho" silenciosamente. |
| A empresa acompanha o processo em tempo real? | Sim — **decisão nova fechada nesta conversa**: o Painel da Empresa deve ter, por colaborador/exame, um indicador de status "em execução" clicável, que abre uma **linha do tempo de etapas** (ex.: Link enviado → Link aberto → Exame iniciado → ... até a conclusão), dando visibilidade operacional à empresa sem expor dado clínico (ver §4.2 e §9 sobre limites de privacidade). |

---

## 3. Painel da Empresa — Fluxo de Trabalho Completo

### 3.1 Etapa 1 — Cadastro da Empresa (autoatendimento)
1. Cadastrador acessa a plataforma e cria conta: nome do cadastrador, e-mail, telefone, CNPJ da empresa, razão social, endereço (usado depois para o cálculo de clínica mais próxima).
2. Validação automática de CNPJ (consulta a uma API pública de CNPJ, ex.: Receita Federal/BrasilAPI) para confirmar que a empresa existe e está ativa — primeira camada de confiança, antes mesmo da análise documental.
3. Confirmação de e-mail (link de verificação) — padrão básico de segurança para qualquer cadastro de autoatendimento.
4. Conta criada com status `cadastro_incompleto` — empresa já pode navegar no painel, mas ainda não pode convidar colaboradores.

### 3.2 Etapa 2 — Upload e Análise de PCMSO/PPRA (já detalhado no documento anterior, aqui integrado ao fluxo)
1. Cadastrador faz upload do PCMSO e do PPRA/PGR vigentes.
2. Status da empresa muda para `em_analise`.
3. Responsável técnico da Proxeg analisa os documentos (estágio inicial manual, conforme já decidido) e cadastra a relação função → exames para aquela empresa.
4. Sistema atribui automaticamente a **clínica mais próxima** à empresa nesta etapa (ou apresenta opção de escolha, no caso raro de mais de uma clínica na região) — isso já fica resolvido antes mesmo do primeiro convite, para que o fluxo do colaborador já saiba para onde encaminhar quando necessário.
5. Status muda para `liberada`. Cadastrador recebe notificação (e-mail) de que já pode começar a convidar colaboradores.

### 3.3 Etapa 3 — Solicitação de Exame (convite ao colaborador)
1. No Painel da Empresa, Cadastrador clica em "Nova Solicitação de Exame".
2. Preenche: nome do colaborador, CPF, e-mail/telefone, função (selecionada de uma lista já vinda da análise do PCMSO daquela empresa — não digitada livremente), tipo de exame (admissional/periódico/demissional/etc.).
3. Sistema já calcula, com base na função selecionada, **quais exames serão necessários** e quais deles são "resolvíveis remotamente" vs. "exigem clínica" (conforme lógica já definida no documento anterior, §4).
4. Sistema gera o **link de convite** (token com escopo, ver §5.2) e o envia automaticamente ao colaborador (e-mail e/ou SMS/WhatsApp).
5. Card do colaborador aparece no Painel da Empresa com status inicial `link_enviado`.

### 3.4 Etapa 4 — Acompanhamento (o que muda nesta rodada)
1. Cadastrador acompanha, na lista principal do painel, um indicador de status resumido por colaborador.
2. Ao clicar em um colaborador específico, abre-se a **linha do tempo de etapas** (detalhada em §4.2) — visibilidade operacional sem detalhe clínico.
3. Caso o link expire sem uso, o card passa para status `convite_expirado`, e a ação disponível é "Gerar novo convite" (manual, conforme decisão em §2).
4. Ao final do processo, o card mostra o resultado consolidado: `apto`, `apto_com_restricao`, `inapto`, com acesso ao ASO final (PDF) — sem detalhe da decisão clínica granular.

### 3.5 Etapa 5 — Renovação Documental (recorrente)
1. Sistema monitora a validade do PCMSO/PPRA cadastrado.
2. Próximo do vencimento (ex.: 30 dias antes), notifica o Cadastrador para reenvio.
3. Se vencer sem renovação, status da empresa muda para `documentacao_vencida` — novas solicitações de exame ficam bloqueadas até a reanálise (exames já em andamento não são interrompidos, apenas novos convites ficam suspensos).

---

## 4. Painel da Empresa — Especificação de UI

### 4.1 Estrutura de navegação
Sidebar:
- Painel Geral (visão consolidada)
- Colaboradores / Solicitações de Exame
- Documentos da Empresa (PCMSO/PPRA, status de validade)
- Configurações (dados cadastrais, clínica associada)

### 4.2 Painel Geral / Lista de Colaboradores
- Tabela com colunas: Nome do colaborador, Função, Tipo de exame, Status (badge), Data da solicitação.
- Badges de status: `Convite enviado` (cinza), `Convite aberto` (azul), `Exame em andamento` (amarelo), `Concluído — Apto` (verde), `Concluído — Inapto` (vermelho), `Convite expirado` (laranja, com ação "Gerar novo convite").
- **Ao clicar em um colaborador com status "em andamento" ou "concluído":** abre painel lateral (drawer) com a **linha do tempo de etapas**, conforme pedido nesta conversa:
  ```
  ● Link enviado          — 24/06 09:12
  ● Link aberto           — 24/06 14:05
  ● Cadastro concluído    — 24/06 14:11
  ● Exame iniciado        — 25/06 08:30
  ○ Em atendimento médico
  ○ Concluído
  ```
  - Etapas já ocorridas aparecem preenchidas com data/hora; etapas futuras aparecem vazias, na mesma lógica visual da linha do tempo já desenhada para a Tela 3 do colaborador (documento de UI da Fase 1, §4.3.2) — mantendo consistência visual entre os dois painéis.
  - **Nenhum dado clínico aparece nessa linha do tempo** — apenas eventos operacionais de progresso (ver §9, limite de privacidade).
- Botão de ação rápida "Nova Solicitação de Exame" sempre visível no topo da lista.

### 4.3 Tela "Nova Solicitação de Exame" (formulário)
- Campo de busca/seleção de função (vinda da base função→exame já analisada para aquela empresa) — não é texto livre, é lista controlada.
- Campos de dados do colaborador (nome, CPF, contato).
- Pré-visualização automática: "Este colaborador precisará realizar: [lista de exames], dos quais [X] podem ser feitos remotamente e [Y] exigem comparecimento à clínica [nome da clínica associada]." — transparência imediata para o Cadastrador antes mesmo de enviar o convite.
- Botão "Enviar convite".

### 4.4 Tela "Documentos da Empresa"
- Card do PCMSO com data de upload, status (`em_analise`/`liberada`/`vencido`) e data de validade.
- Card do PPRA/PGR, mesma estrutura.
- Botão "Reenviar documento atualizado" (habilitado a partir de X dias antes do vencimento).
- Histórico de versões anteriores (auditoria — qual regra função→exame valia em qual período, conforme já definido no documento anterior, §3.5.1).

### 4.5 Onboarding inicial do Cadastrador (primeiro acesso)
- Fluxo guiado em poucas etapas: (1) dados da empresa e CNPJ, (2) upload de PCMSO/PPRA, (3) tela de "aguardando análise" com prazo estimado de retorno — deixando claro que o painel já pode ser explorado, mas que solicitações de exame só ficam liberadas após a análise.

---

## 5. Modelo de Dados — Empresa, Convite e Rastreamento de Etapas

### 5.1 Entidade `COMPANY`
| Campo | Observação |
|---|---|
| `id` | — |
| `cnpj` | validado via API pública no cadastro |
| `razao_social`, `nome_fantasia` | — |
| `endereco` / `geolocalizacao` | usado para cálculo de clínica mais próxima |
| `registrar_user_id` | vínculo com o Cadastrador (conta de acesso) |
| `clinic_id_associada` | resultado da atribuição automática (ou escolha manual no caso raro de múltiplas clínicas) |
| `status` | `cadastro_incompleto` \| `em_analise` \| `liberada` \| `documentacao_vencida` |
| `pcmso_document_id`, `ppra_document_id` | referência aos documentos vigentes (ver §5.2 do documento anterior) |

### 5.2 Entidade `EXAM_INVITE` (o "link de convite")
| Campo | Observação |
|---|---|
| `id` / `token` | token único, não sequencial (evitar adivinhação) |
| `company_id` | empresa de origem |
| `expected_cpf` ou `expected_email` | vínculo de identidade esperado, conforme já definido no documento anterior (§3.3) |
| `role_function` | função/CBO, usada para já calcular os exames exigidos |
| `exam_type` | admissional/periódico/demissional/etc. |
| `status` | `enviado` \| `aberto` \| `expirado` \| `concluido` |
| `expires_at` | validade (ex.: 7 dias) |
| `sent_at`, `opened_at` | timestamps usados para a linha do tempo no painel |

### 5.3 Entidade `EXAM_TIMELINE_EVENT` (suporte à linha do tempo do §4.2)
Tabela de eventos simples, append-only, vinculada ao `EXAM_INVITE`/`EXAM_REQUEST`:
| Campo | Observação |
|---|---|
| `id` | — |
| `exam_request_id` | vínculo ao processo do colaborador |
| `event_type` | enum: `link_enviado`, `link_aberto`, `cadastro_concluido`, `exame_iniciado`, `em_atendimento_medico`, `concluido` |
| `occurred_at` | timestamp |

Esta tabela é gerada automaticamente pelo backend a cada transição relevante (não é preenchida manualmente) — cada evento de negócio já mapeado nos documentos anteriores (ex.: "Exames coletados" na Tela 1) passa a também gravar um `EXAM_TIMELINE_EVENT`, que alimenta exclusivamente a visualização do Painel da Empresa, sem expor o dado clínico em si.

---

## 6. Adequações Necessárias na Estrutura da Fase 1

Estas são as mudanças que precisam ser feitas no que já foi especificado para o MVP, para comportar o que foi decidido nesta conversa, sem quebrar o que já existe:

### 6.1 Banco de dados
- Adicionar as entidades `COMPANY`, `EXAM_INVITE` e `EXAM_TIMELINE_EVENT`, ainda na Fase 1 (mesmo que o Painel da Empresa em si só seja construído depois) — **recomendação prática:** já gravar os eventos de timeline desde o MVP, mesmo sem painel para exibi-los, porque é mais barato instrumentar agora do que reconstruir histórico depois.
- O campo "empresa" do cadastro de paciente (hoje um campo simples de texto/autocomplete na Tela 1, conforme documento de UI original §2.3.2) precisa migrar para uma referência real (`company_id`) à nova entidade `COMPANY` — ajuste de schema, não de conceito.

### 6.2 Tela 1 (Consultório)
- Passa a precisar exibir, ao buscar um colaborador, se ele chegou **via convite de empresa** (com link para ver o que já foi preenchido remotamente) ou **via cadastro direto na clínica** — conforme já antecipado no documento anterior (§4.3).
- Nenhuma mudança estrutural grande é necessária na Fase 1 propriamente dita, já que o MVP não tem ainda fluxo remoto liberado em escala — mas o campo de origem do cadastro (`source: convite_empresa | direto`) já deve existir desde já no modelo de dados.

### 6.3 Tela 2 (Médico) e Tela 3 (Paciente)
- Sem mudança funcional nesta rodada — o médico continua vendo o mesmo painel de fila; o colaborador continua com a mesma experiência de acompanhamento, só que agora pode ter chegado por um convite de empresa (ponto já coberto na Fase 1, §4.3.1: "Tenho um convite da empresa").

### 6.4 Autenticação
- Novo papel (`role`) a adicionar ao sistema de identidade já especificado: `cadastrador_empresa` — autoatendimento, sem MFA obrigatório nesta fase (diferente do médico, que já tem MFA obrigatório definido) — pode ser revisado depois, mas não é prioridade igual à do médico, já que o Cadastrador não assina documento médico-legal.

---

## 7. Intercomunicação Revisada (4 atores)

Adicionando à tabela de eventos já existente no documento de UI da Fase 1 (§5.1):

| # | Evento | Origem | Destino(s) | Efeito |
|---|---|---|---|---|
| 8 | Empresa envia convite | Painel da Empresa | Backend → colaborador (e-mail/SMS) | `EXAM_INVITE` criado com status `enviado`; evento `link_enviado` gravado |
| 9 | Colaborador abre o link | Link de convite (navegador/app) | Backend → Painel da Empresa | `EXAM_INVITE.status = aberto`; evento `link_aberto` gravado; card do colaborador atualiza em tempo real no painel (WebSocket por `company_id`) |
| 10 | Colaborador conclui cadastro via convite | Tela 3 (fluxo "via convite") | Backend → Painel da Empresa | Evento `cadastro_concluido` gravado; processo segue normalmente pela máquina de estados já existente (Fase 1, §6) |
| 11 | Qualquer transição de status do colaborador (coleta, fila, atendimento, conclusão) | Telas 1/2 (já mapeado na Fase 1) | Backend → Painel da Empresa (adicional) | Grava `EXAM_TIMELINE_EVENT` correspondente; painel da empresa atualiza a linha do tempo em tempo real, sem expor dado clínico |
| 12 | Convite expira sem uso | Job agendado no backend (verifica `expires_at`) | Painel da Empresa | `EXAM_INVITE.status = expirado`; card muda para "Convite expirado"; **nenhum reenvio automático** (decisão fechada em §2) |

Novo canal WebSocket: `company:{company_id}` — consumido pelo Painel da Empresa, simétrico aos canais já existentes (`clinic:{id}`, `doctor:{id}`, `patient:{id}`).

---

## 8. Máquina de Estados Revisada

A máquina de estados do colaborador (Fase 1, §6) ganha um estado anterior, específico para quem entra via convite de empresa:

```
[Empresa: status liberada]
        │
        ▼
EXAM_INVITE: enviado
        │ (colaborador abre o link)
        ▼
EXAM_INVITE: aberto
        │ (colaborador conclui cadastro)
        ▼
AGUARDANDO_COLETA  ──► (segue exatamente a máquina de estados já definida na Fase 1)
        │
       ...
        ▼
CONCLUIDO

Caminho alternativo, a qualquer momento antes de "aberto":
EXAM_INVITE: enviado ──(expires_at atingido sem abertura)──► EXAM_INVITE: expirado
                                                                  │
                                                    (empresa gera novo convite, manual)
                                                                  ▼
                                                          EXAM_INVITE: enviado (novo)
```

Importante: a máquina de estados clínica do colaborador (`AGUARDANDO_COLETA` → ... → `CONCLUIDO`) **não muda** — o que muda é que agora ela pode ser precedida por um estágio de convite, que é gerenciado pela Empresa, não pela Clínica.

---

## 9. O Que Ainda Fica para Depois (limites conscientes desta rodada)

- **Múltiplos papéis internos da empresa** (gestor de área separado do RH) — fechado como não-necessário agora; modelo atual é um único papel "Cadastrador" por empresa. Se isso for necessário depois, é extensão de RBAC, não redesenho.
- **Privacidade da linha do tempo:** ficou definido que a linha do tempo no Painel da Empresa mostra **apenas progresso operacional** (link enviado, aberto, exame iniciado, concluído), nunca dado clínico (resultado de exame, anotação médica, decisão antes da conclusão) — isso é coerente com a preocupação de LGPD já levantada no documento anterior (§6, pergunta 4) e fica registrado aqui como decisão de design, não apenas como pergunta em aberto.
- **Escolha manual de clínica em cidades com mais de uma unidade** — tratado como caso raro; a interface para esse cenário específico (tela de seleção) ainda precisa ser desenhada quando o número de clínicas parceiras justificar.
- **Pagamento/faturamento da Empresa pelo serviço prestado** — não foi mencionado nesta rodada, mas é um componente que naturalmente vai aparecer junto com o Painel da Empresa (cobrança por exame, por colaborador, ou por contrato) — fica registrado como lacuna a tratar quando o modelo comercial for definido, já que este documento cobriu apenas o fluxo operacional.
