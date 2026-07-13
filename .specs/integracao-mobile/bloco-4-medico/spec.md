# Doctor Flow — Specification

## Problem Statement
Implementar o fluxo do Médico no mobile: fila de atendimento (tempo real via Socket.IO), consulta ativa com motor clínico (exames), e histórico. O médico se beneficia de push mobile ("paciente na fila", "chamada iniciada") mesmo usando desktop para consulta.

## Goals
- [ ] Fila de atendimento em tempo real (Socket.IO com reconexão)
- [ ] Consulta ativa com card lateral de exames (motor clínico)
- [ ] Histórico de consultas (virtualizado)
- [ ] PIN de reentrada rápida (UX, não substitui JWT)
- [ ] Bottom tab bar (Fila / Consulta ativa / Histórico) — Material Design 3
- [ ] Pull-to-refresh na fila
- [ ] Tokens em storage seguro via abstração

## Out of Scope
| Feature | Reason |
|---------|--------|
| Prescrição digital | Escopo futuro |
| Teleconsulta vídeo no mobile | Usar web por ora |

## User Stories

### P1: Fila de Atendimento ⭐ MVP
**AC**:
1. WHEN médico abre `/medico/fila` THEN vê lista de pacientes aguardando
2. WHEN paciente entra na fila THEN lista atualiza em tempo real (Socket.IO)
3. WHEN app volta do background THEN reconecta automaticamente
4. WHEN pull-to-refresh THEN re-busca fila
5. WHEN médico aceita paciente THEN chama endpoint e mova para "Consulta ativa"

### P2: Consulta Ativa
**AC**:
1. WHEN `/medico/consulta/:id` THEN mostra dados do paciente + motor clínico (exames pendentes)
2. WHEN exame é selecionado THEN abre card lateral com detalhes
3. WHEN médico preenche laudo THEN salva via api-client
4. WHEN médico clica "Finalizar consulta" THEN confirma e volta para fila
5. Botão "Finalizar" fixo em thumb zone

### P3: Histórico
**AC**:
1. WHEN `/medico/historico` THEN lista consultas anteriores (virtualizada)
2. WHEN consulta é selecionada THEN mostra detalhes
3. WHEN scroll THEN virtualização funciona sem jank

### P4: Login + PIN
**AC**:
1. WHEN login JWT THEN persiste token em storage seguro
2. WHEN app reabre do background THEN oferece PIN de reentrada rápida
3. WHEN PIN correto THEN restaura sessão sem redigitar email/senha
4. WHEN PIN incorreto 3x THEN pede login completo

## Requirement Traceability
| ID | Story | Status |
|----|-------|--------|
| REQ-DOCTOR-001 | P1: Fila tempo real | Pending |
| REQ-DOCTOR-002 | P1: Atualização Socket.IO | Pending |
| REQ-DOCTOR-003 | P1: Reconexão background | Pending |
| REQ-DOCTOR-004 | P1: Pull-to-refresh | Pending |
| REQ-DOCTOR-005 | P1: Aceitar paciente | Pending |
| REQ-DOCTOR-006 | P2: Consulta + motor clínico | Pending |
| REQ-DOCTOR-007 | P2: Card lateral exames | Pending |
| REQ-DOCTOR-008 | P2: Salvar laudo | Pending |
| REQ-DOCTOR-009 | P2: Finalizar consulta | Pending |
| REQ-DOCTOR-010 | P3: Histórico virtualizado | Pending |
| REQ-DOCTOR-011 | P3: Detalhes consulta | Pending |
| REQ-DOCTOR-012 | P4: Login JWT + storage seguro | Pending |
| REQ-DOCTOR-013 | P4: PIN reentrada | Pending |
| REQ-DOCTOR-014 | P4: Lockout 3 tentativas | Pending |
