# Tela 2: Médico (Telemedicina) Specification

## Problem Statement
Médicos do trabalho precisam de uma interface para puxar pacientes da fila, revisar exames estruturados, conduzir teleconsultas e assinar o ASO (Atestado de Saúde Ocupacional) digitalmente, de forma remota, segura e legalmente válida.

## Goals
- [ ] Disponibilizar uma fila única global com pacientes de todo o Brasil para os médicos credenciados na plataforma.
- [ ] Integrar sala de vídeo (WebRTC) e visualização de exames na mesma tela.
- [ ] Garantir que 100% dos ASOs emitidos tenham assinatura eletrônica integrada.

## Out of Scope
| Feature | Reason |
|---|---|
| Assinatura ICP-Brasil | MVP foca em assinatura eletrônica avançada via provedor terceiro. |
| Escala de priorização por SLA/Contrato | O algoritmo de priorização será focado puramente na proximidade regional (cidade/estado/país). |
| Plataforma de Credenciamento Médico / Validação CFM | Para os testes do MVP, o cadastro do médico será manual via Admin/API simples. O banco de dados terá campos como `verified_at` para plugar o sistema externo futuro sem truncar a transição. |

---

## Assumptions & Open Questions
| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| Provedor de Vídeo | Provedor WebRTC gerenciado (Daily.co ou similar) | Reduz tempo do MVP | Y |
| Gravação de vídeo | Será opcional, dependente de consentimento na Tela 3 | Reduz riscos jurídicos (LGPD/Sigilo) | N |
| Autenticação Médica | MFA obrigatório será implementado depois | Fase 1 usa senha forte, MFA pode ser add-on | N |
| Visualização UX | Design segue `UiMed.jpg` | Solicitação do briefing | Y |

**Open questions:** none — all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Fila Médica Global da Plataforma ⭐ MVP
**User Story**: Como médico credenciado na plataforma (home office), eu quero ver uma fila única com todos os pacientes do Brasil prontos para atendimento.
**Why P1**: É o ponto de entrada do funil de telemedicina em larga escala.
**Acceptance Criteria**:
1. WHEN acesso o sistema THEN system SHALL carregar todos os pacientes em `NA_FILA_MEDICA` da plataforma, ordenados ativamente por proximidade regional em relação ao meu local de atuação (mesma cidade > mesma região > mesmo estado > resto do Brasil).
2. WHEN eu clico em "Aceitar paciente" THEN system SHALL travar o paciente para mim, mudar status para `EM_ATENDIMENTO` e notificar todos os clientes via WebSocket.
3. WHEN outro médico aceitar um paciente simultaneamente THEN system SHALL exibir erro informando que paciente não está mais disponível (lock otimista).
**Independent Test**: Logar com 2 médicos, o primeiro aceita o paciente, a fila do segundo atualiza ocultando o paciente.

### P1: Sala de Teleconsulta e Análise ⭐ MVP
**User Story**: Como médico, eu quero ver os exames estruturados e conduzir a chamada de vídeo com o paciente simultaneamente na mesma tela.
**Why P1**: Reduzir a troca de janelas e o tempo médio de consulta.
**Acceptance Criteria**:
1. WHEN aceito o paciente THEN system SHALL abrir layout de duas colunas: vídeo (esquerda) e abas de exames/anamnese/anotações (direita).
2. WHEN clico em Iniciar Chamada THEN system SHALL conectar a sessão WebRTC com o paciente.
3. WHEN digito anotações clínicas THEN system SHALL salvar o texto criptografado em repouso no banco de dados.
**Independent Test**: Mockar sessão WebRTC, garantir que abas de exames exibem os JSONs parseados corretamente.

### P1: Decisão e Assinatura do ASO ⭐ MVP
**User Story**: Como médico, eu quero registrar a decisão (Apto/Inapto/Restrição), gerar o ASO e assiná-lo digitalmente para finalizar o atendimento.
**Why P1**: Core do produto — emissão do atestado válido.
**Acceptance Criteria**:
1. WHEN seleciono "Inapto" e clico em salvar THEN system SHALL exigir justificativa e apresentar modal de dupla confirmação.
2. WHEN seleciono "Inconclusivo" THEN system SHALL exigir indicação da pendência e devolver o paciente para `EM_COLETA`.
3. WHEN clico em "Assinar e Emitir" (decisão conclusiva) THEN system SHALL gerar PDF com dados do ASO e abrir fluxo/API do provedor de assinatura eletrônica.
4. WHEN a assinatura for concluída THEN system SHALL atualizar status para `CONCLUIDO` e notificar Tela 1 e Tela 3.
**Independent Test**: Realizar fluxo até emissão, interceptar chamada da API de assinatura e verificar se o status foi para CONCLUIDO e o PDF armazenado (S3).

---

## Requirement Traceability
| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| MED-01 | P1: Fila Multi-clínica | Specify | Pending |
| MED-02 | P1: Sala de Teleconsulta | Specify | Pending |
| MED-03 | P1: Decisão e Assinatura | Specify | Pending |

## Success Criteria
- [ ] Qualquer médico credenciado na plataforma consegue puxar e atender um paciente de qualquer clínica do Brasil.
- [ ] Tempo de resposta de atualização da fila não ultrapassa 1s.
- [ ] PDF do ASO gerado está no padrão normativo (NR-7) com link/QR de validação de assinatura.
