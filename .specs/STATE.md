# Project Memory (STATE.md)

## Decisions Log
| ID | Decision | Rationale | Status |
|---|---|---|---|
| AD-001 | Stack Tecnológica MVP | React/TS para Web, React Native/Flutter para app, Node/Python backend, Postgres + Redis | Definido em `SaudeSeg+_Stack_Tecnologica_Validacoes_Infraestrutura_Fase1.md` |
| AD-002 | UI Referência | Utilizar `Uireferencia/UiMed.jpg` como base visual para o MVP | Solicitado pelo usuário no briefing |
| AD-003 | Fila Digital via WebSocket | Atualizações em tempo real com Redis e WebSockets | Evitar polling e melhorar a UX do médico e paciente |
| AD-004 | Assinatura Eletrônica (Fase 1) | Provedor terceiro (Clicksign/D4Sign/Birdid), sem ICP-Brasil no momento | Simplifica o MVP e reduz atrito inicial |
| AD-005 | Inserção de Exames | 100% manual com campos estruturados na Fase 1 | Postergar integrações complexas (IoT/APIs) para Fase 2+ |
| AD-006 | Algoritmo de Fila (Proximidade) | A fila priorizará afinidade regional: mesma cidade > mesma região > mesmo estado > Brasil. | Melhora a segurança clínica, cria confiança e adequa-se à telemedicina |
| AD-007 | Desacoplamento de Credenciamento | Cadastros de médicos e clínicas (MVP) serão geridos via painel admin básico/API (Mock/Seed) sem validação automática. O BD preverá flags de verificação (`verified_at`, `source`) para transição fluida pro futuro sistema de franquias/credenciamento. | Previne retrabalho na Fase 2 e permite testar o fluxo de atendimento agora |

## Handoff Snapshot
- **Current Phase:** Specify (TLC-Spec-Driven)
- **Active Work:** Geração das especificações (spec.md) para as 3 telas do MVP da Fase 1 (Consultório, Médico, Paciente).
- **Next Step:** Validação do usuário (Closure Gate) sobre as especificações geradas, seguida por Design e Tasks.
