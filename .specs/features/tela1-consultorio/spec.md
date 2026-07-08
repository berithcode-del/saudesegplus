# Tela 1: Consultório (CRM Operacional) Specification

## Problem Statement
Operadores de clínicas físicas precisam de uma ferramenta eficiente para cadastrar pacientes, gerenciar agenda, coletar resultados de exames de forma estruturada e colocar os pacientes na fila digital para atendimento médico remoto, tudo de forma rastreável.

## Goals
- [ ] Permitir cadastro e check-in de pacientes em menos de 2 minutos.
- [ ] Garantir que 100% dos exames obrigatórios sejam preenchidos estruturadamente antes de o paciente entrar na fila.
- [ ] Prover visibilidade em tempo real da fila da unidade e do tempo de espera.

## Out of Scope
| Feature | Reason |
|---|---|
| Integração automática/semi-automática com equipamentos | Definido para Fase 2/3 para focar no MVP manual estruturado. |
| Portal da Empresa (RH) | Definido para Fase 2. |
| Agendamento inteligente com SLAs avançados | MVP usa apenas ordenação FIFO baseada na chegada. |
| Sistema de Franquias / Autocadastro de Clínicas | Cadastro no MVP será manual via Admin/API para testes. O modelo de dados já nasce com flags de integração prontas para o futuro sistema de franquias. |

---

## Assumptions & Open Questions
| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| UX/UI Base | Utilizar a imagem `UiMed.jpg` como referência visual | Requisito do briefing | Y |
| Tratamento de cancelamento | Motivo em texto livre será exigido | Auditoria (RN3) | Y |
| Validação de duplicidade | Será baseada apenas no CPF | CPF é único e suficiente para o MVP | N |
| Bloqueio de edição (RN2) | Lock otimista no backend, frontend desabilita inputs se status > `EM_COLETA` | Evitar conflitos com médico | Y |

**Open questions:** none — all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Cadastro e Check-in de Pacientes ⭐ MVP
**User Story**: Como operador de consultório, eu quero cadastrar e realizar check-in de pacientes para que eles possam iniciar o processo de exames.
**Why P1**: Sem pacientes cadastrados, o fluxo não inicia.
**Acceptance Criteria**:
1. WHEN operador preenche CPF válido e dados obrigatórios THEN system SHALL criar paciente e gerar solicitação de exame no status `AGUARDANDO_COLETA`.
2. WHEN operador tenta salvar CPF já existente THEN system SHALL exibir alerta e bloquear duplicação.
3. WHEN operador clica em "Check-in" THEN system SHALL alterar status para `EM_COLETA` e exibir lista de exames obrigatórios baseada no grau de risco do CBO.
**Independent Test**: Criar um paciente fictício, fazer check-in e ver o status mudar na lista.

### P1: Inserção de Exames Estruturados ⭐ MVP
**User Story**: Como operador, eu quero preencher os resultados dos exames coletados para que o paciente fique pronto para a avaliação médica.
**Why P1**: O médico precisa dos dados precisos para emitir o ASO.
**Acceptance Criteria**:
1. WHEN operador preenche os campos estruturados de um exame THEN system SHALL registrar o resultado com timestamp e ID do operador sem permitir texto livre genérico.
2. WHEN todos os exames obrigatórios estiverem preenchidos THEN system SHALL habilitar o botão "Enviar para fila médica".
3. WHEN o botão "Enviar para fila" for clicado THEN system SHALL mudar status para `NA_FILA_MEDICA` e disparar evento via WebSocket.
**Independent Test**: Preencher campos obrigatórios de audiometria/PA, enviar e verificar que o paciente aparece na fila.

### P1: Gestão e Visão de Fila ⭐ MVP
**User Story**: Como operador, eu quero ver o painel de fila em tempo real para monitorar o status dos pacientes da minha unidade.
**Why P1**: Controle operacional da clínica e comunicação com pacientes aguardando.
**Acceptance Criteria**:
1. WHEN houver mudança de status de qualquer paciente da clínica THEN system SHALL atualizar a UI via WebSocket sem refresh.
2. WHEN um paciente exceder o SLA de espera configurado THEN system SHALL exibir um banner visual de alerta.
3. WHEN o médico definir decisão como "Inconclusivo" THEN system SHALL exibir o paciente de volta com a pendência e status `EM_COLETA`.
**Independent Test**: Simular mudança via API e observar a tabela atualizar na tela.

### P2: Emissão Física do ASO
**User Story**: Como operador, eu quero buscar e imprimir o ASO assinado para entregar ao paciente.
**Why P2**: Algumas empresas/pacientes ainda exigem ou preferem a via impressa física na saída da clínica.
**Acceptance Criteria**:
1. WHEN o médico conclui a assinatura THEN system SHALL listar o documento na aba "Documentos Emitidos" da clínica.
2. WHEN o operador clica em Baixar/Imprimir THEN system SHALL prover o PDF final com a assinatura eletrônica validada.
**Independent Test**: Abrir paciente com status `CONCLUIDO` e baixar o PDF com sucesso.

---

## Requirement Traceability
| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| CON-01 | P1: Cadastro e Check-in | Specify | Pending |
| CON-02 | P1: Inserção de Exames | Specify | Pending |
| CON-03 | P1: Gestão de Fila | Specify | Pending |
| CON-04 | P2: Emissão ASO | Specify | Pending |

## Success Criteria
- [ ] Operador consegue cadastrar e colocar paciente na fila em menos de 5 interações na tela.
- [ ] Atualização da tabela de fila ocorre em tempo real (< 1s) após ação do médico na Tela 2.
- [ ] Zero campos de "texto livre" inseridos nos resultados de exames (garantia de dado estruturado).
