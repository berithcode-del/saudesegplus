# Tela 3: Paciente (App Mobile) Specification

## Problem Statement
Funcionários/Candidatos precisam de transparência no processo de exame admissional/periódico, com acompanhamento de status em tempo real, capacidade de teleconsulta segura e acesso ao ASO emitido, respeitando rigorosamente a LGPD.

## Goals
- [ ] Permitir acompanhamento de status do exame em tempo real (linha do tempo).
- [ ] Suportar sala de espera virtual e chamada de vídeo nativa ou in-app view.
- [ ] Garantir isolamento total de dados e consentimento explícito.

## Out of Scope
| Feature | Reason |
|---|---|
| Fluxo 100% Remoto (sem clínica) ativo para todos | Fica restrito a aprovações jurídicas de funções de baixo risco (Fase 1 focará no modelo híbrido). |
| Portal RH para Empresa | Será uma aplicação Web separada na Fase 2. |

---

## Assumptions & Open Questions
| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| UX Base | Inspirado nos padrões estéticos do `UiMed.jpg` | Identidade visual única | Y |
| WebRTC no Mobile | SDK de terceiros (ex. Daily/Twilio) no App | Melhor estabilidade no mobile | Y |
| Consentimento LGPD | Termos de aceite específicos para saúde salvos com timestamp no DB | Obrigatório por lei | Y |
| Push Notifications | FCM para Android, APNs para iOS | Padrão da indústria | Y |

**Open questions:** none — all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Cadastro, Consentimento e Onboarding ⭐ MVP
**User Story**: Como paciente, eu quero me cadastrar via convite da empresa e aceitar os termos de consentimento para iniciar meu processo de exame.
**Why P1**: LGPD exige consentimento granular para dados de saúde.
**Acceptance Criteria**:
1. WHEN acesso via link/código de convite THEN system SHALL vincular minha conta à empresa e função predefinidas.
2. WHEN crio a conta THEN system SHALL exibir checkbox obrigatório, destacado, para aceite de compartilhamento de dados sensíveis médicos.
3. WHEN o aceite for dado THEN system SHALL salvar log auditável (timestamp, IP, versão do termo).
**Independent Test**: Passar pelo fluxo de cadastro com convite e verificar tabela `AUDIT_LOG` no DB.

### P1: Linha do Tempo e Status ⭐ MVP
**User Story**: Como paciente, eu quero acompanhar o status atual do meu exame em uma linha do tempo.
**Why P1**: Reduz ansiedade e chamadas para a clínica/RH.
**Acceptance Criteria**:
1. WHEN estou logado na home THEN system SHALL exibir linha do tempo: Cadastrado -> Exames coletados -> Na fila -> Em atendimento -> Concluído.
2. WHEN ocorre mudança de status no backend THEN system SHALL atualizar a tela em tempo real via WebSocket/Push Notification.
**Independent Test**: Alterar status do paciente no DB, verificar se a linha do tempo do App atualiza imediatamente.

### P1: Sala de Espera e Teleconsulta ⭐ MVP
**User Story**: Como paciente aguardando teleconsulta, eu quero ser notificado e entrar na chamada de vídeo pelo próprio app.
**Why P1**: Facilidade de comunicação; evita que paciente perca a vez.
**Acceptance Criteria**:
1. WHEN o médico aceitar meu atendimento THEN system SHALL enviar Push Notification e habilitar botão de "Entrar na Chamada".
2. WHEN clico em Entrar THEN system SHALL requisitar permissões de Câmera/Microfone e conectar ao WebRTC.
3. WHEN a chamada for finalizada pelo médico THEN system SHALL fechar o vídeo e retornar para a Home.
**Independent Test**: Emitir evento de "Médico aceitou", ver o botão habilitar, entrar e verificar prompts do SO para câmera.

### P1: Acesso ao ASO e Histórico ⭐ MVP
**User Story**: Como paciente, eu quero visualizar e baixar meu atestado finalizado.
**Why P1**: É o documento de retorno que ele precisa apresentar/ter para si.
**Acceptance Criteria**:
1. WHEN o médico emite o ASO (status `CONCLUIDO`) THEN system SHALL liberar o PDF na aba de Documentos.
2. WHEN clico no documento THEN system SHALL abrir visualizador PDF nativo ou baixar.
3. WHEN acesso o app THEN system SHALL garantir que NENHUM dado de outros pacientes seja acessível.
**Independent Test**: Finalizar exame no admin, logar no app e tentar baixar o PDF. Tentar forçar download de outro `patient_id` (deve retornar 403).

---

## Requirement Traceability
| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| PAC-01 | P1: Cadastro e Onboarding | Specify | Pending |
| PAC-02 | P1: Status do Exame | Specify | Pending |
| PAC-03 | P1: Teleconsulta | Specify | Pending |
| PAC-04 | P1: Acesso Documentos | Specify | Pending |

## Success Criteria
- [ ] Push Notifications entregues em < 5s após a ação do médico.
- [ ] Paciente consegue navegar no app sem travamentos e abrir o vídeo com estabilidade em redes 4G.
- [ ] Log de consentimento gravado para 100% dos usuários antes de qualquer operação médica.
