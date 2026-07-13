# Fase 5 - Correções de Fluxo e Furos Lógicos

## Problem Statement

O ciclo de vida completo de um exame ocupacional (da empresa ao ASO) apresenta furos lógicos e jornadas desconexas identificadas no documento `FLUXO-APLICACAO-SAUDESEG.md`. Atualmente, o funcionário não recebe o convite criado pela empresa, existem duas jornadas paralelas de paciente, o check-in na clínica não se vincula ao convite, e a decisão médica não é gravada corretamente no ASO.

## Goals

- [x] Garantir a entrega (ou exibição) do link do convite gerado para o funcionário.
- [x] Unificar a jornada do paciente para usar exclusivamente o portal `/p/:token`.
- [x] Vincular corretamente o check-in na clínica ao `ExamInvite` original do portal.
- [x] Resolver furos críticos no fluxo médico (decisão no ASO, sala de teleconsulta).

## Out of Scope

| Feature     | Reason         |
| ----------- | -------------- |
| Disparo real de e-mail | Será resolvido via funcionalidade de workers/filas do backend posteriormente; na Fase 5 garantiremos que a empresa possa copiar o link. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Jornada do funcionário | Rota canônica será exclusivamente `/p/:token`. Rota `/colaboradores/signup` fica deprecada. | Solução recomendada em D-01 no documento de análise. Evita bifurcação do usuário. | N |
| Identificação no Check-in | Clínica fará busca por CPF para iniciar o processo. | Mais simples e viável, não exige infraestrutura extra de QR Code (Opção A em D-02). | N |
| Momento da anamnese | O funcionário preenche a anamnese via portal antes de ir à clínica. | O portal atual já possui este passo no roteamento do paciente. | N |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Entrega do Convite e Acesso Seguro ⭐ MVP

**User Story**: Como uma Empresa, eu quero poder copiar o link do convite criado para que eu possa enviar manualmente ao funcionário.

**Why P1**: Furo crítico F-01 (Sem o link, o funcionário nunca entra no portal).

**Acceptance Criteria**:
1. WHEN o convite é criado com sucesso THEN o sistema SHALL exibir um modal com o link copiável `/p/:token`.
2. WHEN o funcionário acessa o link `/p/:token` THEN o sistema SHALL exibir o nome da empresa e tipo de exame na tela de boas-vindas antes de pedir dados, consumindo `GET /api/portal/preview/:token`.

**Independent Test**: Criar convite, copiar o link, abrir aba anônima e verificar se a tela de preview exibe corretamente os dados.

---

### P2: Vinculação de Check-in ao Convite ⭐ MVP

**User Story**: Como uma Recepcionista (Clínica), eu quero buscar o convite do funcionário pelo CPF para que o check-in seja vinculado à solicitação correta da empresa.

**Why P2**: Furo crítico F-03 e F-04.

**Acceptance Criteria**:
1. WHEN a recepcionista digita um CPF no check-in THEN o sistema SHALL buscar e carregar os dados do `ExamInvite` existente.
2. WHEN o check-in é concluído THEN o `ExamRequest` criado SHALL estar vinculado ao `inviteId`.

**Independent Test**: Realizar check-in com um CPF que possui convite; verificar no painel da empresa se a solicitação avança.

---

### P3: Registro da Decisão Médica e ASO ⭐ MVP

**User Story**: Como um Médico, eu quero que minha decisão (Apto, Inapto, etc.) e minhas restrições sejam salvas corretamente para que o ASO gerado seja válido.

**Why P1**: Furo crítico F-05.

**Acceptance Criteria**:
1. WHEN o médico conclui a consulta THEN o sistema SHALL enviar `decision` e `restrictionNotes` no `PATCH /api/solicitacoes/:id`.
2. WHEN o funcionário baixa o ASO THEN o documento SHALL refletir a decisão correta.

**Independent Test**: Fazer uma consulta médica, definir Apto com restrição, e verificar se os dados constam no download do PDF.

---

### P4: Criação de Sala de Teleconsulta ⭐ MVP

**User Story**: Como um Médico, eu quero poder criar a sala de teleconsulta pela interface para que o paciente possa entrar nela.

**Why P1**: Furo crítico F-06.

**Acceptance Criteria**:
1. WHEN o médico atende uma solicitação de teleconsulta THEN o sistema SHALL exibir o botão "Criar Sala de Vídeo".
2. WHEN o médico clica no botão THEN o sistema SHALL criar a sala via `POST /api/teleconsultation/create-room`.

**Independent Test**: Atender paciente de teleconsulta, clicar em Criar Sala e verificar se o link foi gerado e propagado.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| FEAT-501 | P1: Link do Convite | Tasks | Pending |
| FEAT-502 | P1: Preview do Convite | Tasks | Pending |
| FEAT-503 | P2: Check-in via CPF | Tasks | Pending |
| FEAT-504 | P3: Decisão Médica ASO | Tasks | Pending |
| FEAT-505 | P4: Sala de Teleconsulta | Tasks | Pending |

**Coverage:** 5 total, 5 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] A empresa consegue enviar o link de acesso ao funcionário.
- [ ] O processo iniciado na clínica reflete na timeline da empresa (check-in vinculado).
- [ ] O PDF do ASO exibe a decisão (Apto/Inapto).
- [ ] Pacientes de teleconsulta conseguem acessar a sala após a criação pelo médico.
