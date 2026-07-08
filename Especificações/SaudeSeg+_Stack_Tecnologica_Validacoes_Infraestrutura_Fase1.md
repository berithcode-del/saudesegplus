# SaúdeSeg+ — Stack Tecnológica, Validações e Infraestrutura — Fase 1 (MVP)

**Versão:** 1.0
**Baseado em:** "SaúdeSeg+ — Especificação de Interface (UI) e Técnica das 3 Telas — Fase 1 (MVP)"
**Objetivo deste documento:** detalhar as tecnologias sugeridas, os mecanismos de validação (usuário, paciente, médico) e a infraestrutura necessária para que as três telas funcionem como um sistema integrado, com base nas rotas/eventos definidos no documento de UI.

---

## Sumário
1. Visão Geral da Stack por Camada
2. Backend e API — Detalhamento
3. Sistemas de Validação
4. Autenticação e Controle de Acesso (RBAC)
5. Infraestrutura — Tempo Real (Fila e WebSocket)
6. Infraestrutura — Videochamada (Teleconsulta)
7. Armazenamento e Banco de Dados
8. Assinatura Eletrônica e Geração de Documentos
9. Mensageria/Notificações
10. Observabilidade, Segurança e Compliance
11. Ambientes e Deploy
12. Mapa: Rotas da UI → Componentes de Infraestrutura
13. Checklist de Prontidão para a Fase 1

---

## 1. Visão Geral da Stack por Camada

| Camada | Tecnologia sugerida | Aplica-se a |
|---|---|---|
| App Paciente (mobile) | React Native | Tela 3 |
| Web Médico | React + TypeScript (SPA/PWA) | Tela 2 |
| Web Consultório | React + TypeScript (SPA/PWA) | Tela 1 |
| Backend/API | Node.js + NestJS (TypeScript) | As 3 telas |
| Banco relacional | PostgreSQL | Core do sistema |
| Cache / Fila em tempo real | Redis (sorted sets + pub/sub) | Fila digital |
| Comunicação real-time | Socket.IO sobre WebSocket | As 3 telas |
| Videochamada | WebRTC via provedor gerenciado (Daily.co ou Twilio Video) | Tela 2 + Tela 3 |
| Armazenamento de arquivos | S3 (AWS) com criptografia em repouso | Documentos, exames, ASOs |
| Mensageria assíncrona | Amazon SQS (ou RabbitMQ) | Eventos entre serviços |
| Autenticação | OAuth2/OIDC com JWT (Auth0 ou Keycloak) | As 3 telas |
| Assinatura eletrônica | API de provedor (Clicksign ou D4Sign) | Tela 2 |
| Notificações push/SMS | Firebase Cloud Messaging (push) + provedor SMS/WhatsApp (Twilio/Zenvia) | Tela 3 principalmente |
| Observabilidade | Sentry (erros) + Grafana/Prometheus (métricas) | Todo o sistema |
| Cloud/Infra | AWS (ou GCP/Azure equivalente) | Todo o sistema |

> Justificativa de escolha entre Node/NestJS vs. outras opções: time único full-stack TypeScript reduz fricção entre frontend (React/React Native) e backend, e acelera entrega do MVP. É uma recomendação, não uma imposição — Python/Django é alternativa igualmente válida caso a equipe já tenha esse perfil.

---

## 2. Backend e API — Detalhamento

### 2.1 Organização dos serviços (mesmo em uma só aplicação no MVP)
Mesmo que o MVP rode como um monólito modular (recomendado para reduzir complexidade operacional nesta fase), a separação lógica de módulos deve já existir no código, preparando a futura extração em microsserviços (Fase 3+):

- **Módulo Core:** pacientes, exames, ASO, clínicas, tabela de risco.
- **Módulo Fila:** gestão da fila digital (Redis), regras de aceite/travamento de paciente.
- **Módulo Telemedicina:** sinalização de vídeo, registro de sessão, anotações clínicas.
- **Módulo Identidade:** autenticação, perfis, validação de credenciais.
- **Módulo Notificação:** push, SMS/WhatsApp, e-mail.

### 2.2 Padrão de API
- REST para operações transacionais (CRUD de paciente, exame, ASO, agenda).
- WebSocket (Socket.IO) para os três canais em tempo real já definidos no documento de UI: por `clinic_id` (Tela 1), por `doctor_id` (Tela 2) e por `patient_id` (Tela 3).
- API Gateway na frente dos módulos, responsável por autenticação, rate-limiting e roteamento — pode ser o próprio NestJS com um módulo de gateway, sem necessidade de um produto de API Gateway dedicado neste estágio.

### 2.3 Versionamento e contratos
- Versionamento de rotas (`/v1/...`) desde o início, para permitir evolução sem quebrar os três clientes (Tela 1, 2 e 3) simultaneamente.
- Contratos de API documentados via OpenAPI/Swagger, gerado automaticamente a partir do NestJS — essencial porque três frontends diferentes consomem a mesma API.

---

## 3. Sistemas de Validação

### 3.1 Validação de Paciente (Tela 1 e Tela 3)
| Validação | Onde ocorre | Tecnologia/Mecanismo |
|---|---|---|
| CPF válido (dígito verificador) | Client-side (Tela 1 e 3) + server-side (obrigatório, nunca confiar só no client) | Biblioteca de validação de CPF (ex.: `cpf-cnpj-validator` no Node) |
| Duplicidade de cadastro | Server-side, ao salvar paciente | Query indexada por CPF + `company_id`; bloqueio ou alerta de "paciente já existe" |
| Campos obrigatórios por tipo de exame | Server-side, ao concluir coleta (Tela 1) | Validação dinâmica com base na tabela `occupational_risk_grade` / `exam_type` — schema de validação gerado a partir da configuração, não hardcoded |
| Consentimento LGPD (Tela 3) | Server-side, bloqueante | Registro obrigatório de aceite com timestamp e versão dos termos antes de liberar uso do app |
| CBO/função informada existe na tabela de risco | Server-side, no cadastro | Validação contra `occupational_risk_grade.cbo_code` |

### 3.2 Validação de Médico (Tela 2)
| Validação | Onde ocorre | Tecnologia/Mecanismo |
|---|---|---|
| CRM ativo (não suspenso) | No credenciamento (fora das 3 telas, processo administrativo na Fase 1) | MVP: verificação manual com upload de documento + checklist humano; preparar campo `credential_validated_at` para futura automação via API do CFM (Fase 3) |
| RQE em Medicina do Trabalho | Mesmo processo acima | Upload de documento + validação humana no MVP |
| Credenciamento por clínica | Antes do médico ver pacientes daquela unidade na fila | Tabela M:N `clinics_authorized`, validada a cada requisição no backend (não apenas filtrada na UI) — implementa RN9 |
| Disponibilidade declarada | Toggle "Disponível/Indisponível" na Tela 2 | Validação de que o médico só recebe pacientes novos enquanto `status = online`; ao ficar indisponível, sistema não atribui novos pacientes (mas não remove os já aceitos) |
| Uma sessão de atendimento ativo por vez | Ao aceitar paciente | Lock otimista/transação atômica no backend (implementa RN5), evitando que o médico assuma dois atendimentos simultâneos na sala de vídeo |

### 3.3 Validação de Operador de Clínica (Tela 1)
| Validação | Onde ocorre | Tecnologia/Mecanismo |
|---|---|---|
| Operador pertence à clínica que está operando | A cada requisição | Checagem de `clinic_id` do usuário autenticado vs. recurso acessado (RBAC + Row-Level Security) |
| Permissão por papel (recepção vs. técnico de coleta) | Nas ações sensíveis (ex.: inserir exame) | RBAC com papéis distintos dentro do perfil "operador" |
| Edição de exame após início de análise médica | Ao tentar editar | Lock otimista (campo `locked_by_doctor_review` ou similar) — implementa RN2 |

### 3.4 Validação cruzada entre as três telas (consistência de fluxo)
- O backend é a única fonte de verdade das transições de status (máquina de estados do documento de UI, §6) — nenhuma tela decide sozinha a transição; todas as ações (check-in, aceitar paciente, emitir ASO) passam por validação de regra de negócio no servidor antes de propagar o evento via WebSocket.
- Toda tentativa de transição inválida (ex.: tentar emitir ASO sem todos os exames coletados) deve ser rejeitada pela API com erro claro, e a UI correspondente deve exibir mensagem amigável — a validação nunca deve depender apenas do frontend "desabilitar o botão".

---

## 4. Autenticação e Controle de Acesso (RBAC)

### 4.1 Tecnologia sugerida
- **OAuth2/OIDC** com tokens JWT de curta duração + refresh token.
- Provedor: Auth0 (gerenciado, mais rápido para o MVP) ou Keycloak (self-hosted, mais controle/custo menor em escala) — escolha depende de orçamento e preferência por gerenciado vs. próprio.

### 4.2 Perfis (roles) na Fase 1
- `operador_clinica`
- `medico`
- `paciente`

(Perfis `rh` e `admin` ficam para Fase 2/3, conforme roadmap original, mas o modelo de dados já reserva o campo `role` enum para evitar retrabalho.)

### 4.3 Regras de RBAC essenciais
- Paciente: acesso exclusivo aos próprios dados (`patient_id` = usuário autenticado) — isolamento total (RN10).
- Operador: acesso restrito à própria `clinic_id`.
- Médico: acesso restrito às clínicas em `clinics_authorized` e, dentro delas, apenas a pacientes em `NA_FILA_MEDICA` ou já assumidos por ele.
- Toda política de acesso deve ser reforçada no backend (middleware de autorização), nunca apenas na camada de UI.

### 4.4 MFA (Autenticação Multifator)
- Recomendado **obrigatório para o perfil médico** desde a Fase 1, dado o acesso a dado clínico sensível (alinhado ao documento original, §11.4.3).
- Opcional para paciente e operador no MVP, podendo evoluir para obrigatório conforme política de segurança da empresa contratante.
- Tecnologia: TOTP (Google Authenticator/Authy) via biblioteca padrão (ex.: `otplib`) ou nativo do provedor de auth (Auth0/Keycloak já oferecem MFA integrado).

---

## 5. Infraestrutura — Tempo Real (Fila e WebSocket)

### 5.1 Fila digital
- **Redis (sorted sets):** cada entrada da fila é um membro do sorted set com score = timestamp de entrada, permitindo ordenação FIFO eficiente sem necessidade de polling.
- **Persistência do Redis habilitada** (AOF ou snapshot) para que a fila sobreviva a reinício do serviço sem perder paciente.
- **Postgres como fonte de verdade espelhada:** toda alteração de fila grava também na tabela `QUEUE_ENTRY` do Postgres, permitindo reconstrução em caso de falha do Redis (alinhado ao documento original, §11.4.4).

### 5.2 Canais WebSocket (conforme já definidos no documento de UI)
| Canal | Quem assina | Quem publica | Evento típico |
|---|---|---|---|
| `clinic:{clinic_id}` | Tela 1 | Backend (módulo Fila/Telemedicina) | Médico aceitou paciente; ASO emitido; paciente retornado por "inconclusivo" |
| `doctor:{doctor_id}` | Tela 2 | Backend (módulo Fila) | Novo paciente disponível na fila; paciente removido (aceito por outro médico) |
| `patient:{patient_id}` | Tela 3 | Backend (módulo Fila/Telemedicina) | Status avançou na linha do tempo; chamada para atendimento; ASO disponível |

- Implementação: Socket.IO sobre Node/NestJS, com adapter Redis (`socket.io-redis-adapter`) para permitir múltiplas instâncias do backend em paralelo (necessário desde já para suportar autoscaling horizontal, mesmo no MVP).

### 5.3 Resiliência
- Reconexão automática do cliente WebSocket (já nativo no Socket.IO) em caso de queda de rede — relevante para clínicas em regiões com conectividade instável.
- Fallback: se o WebSocket cair, a UI deve manter um polling de baixa frequência (ex.: a cada 30s) como rede de segurança, evitando que o usuário fique com tela desatualizada por tempo indefinido.

---

## 6. Infraestrutura — Videochamada (Teleconsulta)

### 6.1 Provedor gerenciado (recomendado, não construir WebRTC do zero)
- Opções: Daily.co, Twilio Video ou Agora — qualquer uma resolve sinalização, NAT traversal (STUN/TURN) e escalabilidade sem que a equipe precise mantê-los.
- Critério de escolha: comparar custo por minuto, suporte a gravação nativa (necessário para auditoria médico-legal) e qualidade de SDK para React/React Native.

### 6.2 Integração com as telas
- Tela 2 (médico) e Tela 3 (paciente) usam o mesmo SDK do provedor escolhido, garantindo compatibilidade.
- Sessão de vídeo é criada pelo backend no momento em que o médico aceita o paciente (evento já mapeado no documento de UI, §5.1, item 4) — o backend gera um `video_session_id` único e o distribui para ambos os clientes via REST/WebSocket.

### 6.3 Gravação (opcional, com consentimento)
- Se habilitada: gravação armazenada no S3 (mesmo bucket de documentos, com política de retenção própria), vinculada ao registro `TELECONSULTATION.recording_url`.
- Consentimento explícito do paciente deve ser solicitado e registrado antes do início da gravação (tela de aviso na Tela 3, com aceite logado).

### 6.4 Fallback de conectividade
- Implementar verificação de qualidade de rede antes/durante a chamada (a maioria dos SDKs gerenciados já oferece isso nativamente).
- Recomenda-se, como rede de segurança operacional (não necessariamente técnica no MVP), ter um número de contato telefônico alternativo cadastrado, para o caso de falha total de conectividade em clínicas de regiões remotas.

---

## 7. Armazenamento e Banco de Dados

### 7.1 PostgreSQL (banco relacional principal)
- Hospedagem: serviço gerenciado (ex.: Amazon RDS para PostgreSQL) para reduzir esforço operacional no MVP.
- Suporte a colunas JSON/JSONB para `exam_result.value_structured`, dado que diferentes tipos de exame têm estruturas de dado distintas.
- **Row-Level Security (RLS)** habilitado desde o início para reforçar isolamento multi-tenant por `clinic_id`/`company_id`, como camada extra de proteção além da lógica de aplicação.

### 7.2 Redis
- Hospedagem: serviço gerenciado (ex.: Amazon ElastiCache para Redis).
- Uso: fila digital (sorted sets), cache de sessão, pub/sub para WebSocket entre instâncias do backend.

### 7.3 Armazenamento de arquivos (S3)
- Buckets segregados por tipo de conteúdo: documentos de identidade, resultados de exame (anexos), ASOs gerados (PDF), gravações de teleconsulta (se habilitado).
- Criptografia em repouso (SSE-S3 ou SSE-KMS) obrigatória, dado que são dados de saúde.
- URLs de acesso geradas como *signed URLs* de curta duração — nenhum arquivo deve ser publicamente acessível por URL fixa.

### 7.4 Backup e retenção
- Backup automático diário do Postgres, com retenção mínima compatível com a política de prontuário médico (referência: 20 anos no Brasil, conforme apontado no documento original, §10.6) — decisão final de retenção depende de validação jurídica, mas a infraestrutura de backup deve já ser projetada para retenção de longo prazo, não apagamento automático por padrão.

---

## 8. Assinatura Eletrônica e Geração de Documentos

### 8.1 Geração do PDF do ASO
- Biblioteca de geração de PDF no backend (ex.: `pdf-lib` ou serviço de template como Carbone/PDFMonkey) a partir de um template padronizado, preenchido com dados do paciente, exame e decisão médica.

### 8.2 Assinatura eletrônica
- Integração via API REST com provedor terceiro (Clicksign ou D4Sign, conforme já indicado no documento de UI) — fluxo:
  1. Backend gera o PDF da minuta do ASO.
  2. Backend chama a API do provedor para solicitar assinatura do médico autenticado.
  3. Provedor retorna documento assinado + trilha de auditoria (quem assinou, quando, IP).
  4. Backend salva `signature_provider_id`, `signed_at` e armazena o PDF final assinado no S3.
- Importante: a integração deve ser feita via webhook do provedor (notificação assíncrona de "documento assinado"), não por polling, para evitar atraso na disponibilização do ASO nas Telas 1 e 3.

### 8.3 Disponibilização do documento final
- Após confirmação da assinatura, o backend publica o evento já mapeado no documento de UI (§5.1, item 6), liberando o PDF para download na Tela 1 (impressão/entrega física) e na Tela 3 (visualização/download pelo paciente).

---

## 9. Mensageria/Notificações

| Canal | Tecnologia sugerida | Uso principal |
|---|---|---|
| Push notification (app) | Firebase Cloud Messaging (FCM) para Android/iOS via React Native | Avisos de status na Tela 3 (ex.: "o médico vai te chamar em breve") |
| SMS/WhatsApp | Twilio ou Zenvia | Confirmação/lembrete de agendamento (Tela 1 → paciente) |
| E-mail | Provedor transacional (ex.: SendGrid ou Amazon SES) | Confirmações de cadastro, convite de paciente, recibo de documento emitido |
| Eventos internos assíncronos | Amazon SQS (fila simples) ou RabbitMQ | Desacoplar disparo de notificação da transação principal (ex.: emissão de ASO dispara evento de notificação sem travar a resposta da API) |

---

## 10. Observabilidade, Segurança e Compliance

### 10.1 Observabilidade
- **Logs centralizados:** estruturados (JSON), enviados para um serviço central (ex.: CloudWatch Logs ou Grafana Loki).
- **Métricas:** Prometheus + Grafana para métricas de negócio e técnicas (tempo médio de fila, latência de API, taxa de erro).
- **Rastreamento de erros:** Sentry, com alerta automático para erros críticos (ex.: falha na emissão de ASO).
- **Alertas de SLA da fila:** métrica dedicada de tempo de espera por paciente, com alerta configurável (já referenciado na UI da Tela 1).

### 10.2 Segurança de dados de saúde
- TLS 1.2+ obrigatório em toda comunicação (frontend ↔ backend ↔ integrações externas).
- Criptografia em repouso para todos os campos clínicos sensíveis (`clinical_notes`, `exam_result.value_structured`) — pode ser feita a nível de aplicação (campo criptografado antes de gravar) além da criptografia de disco do banco.
- Segregação lógica entre dados clínicos e dados financeiros/RH (preparando já a futura separação física de serviços, conforme roadmap de Fases 2+).
- MFA obrigatório para médico (já detalhado em §4.4).

### 10.3 Compliance (LGPD)
- Consentimento específico e granular registrado (não embutido em termos genéricos) — implementado na Tela 3, validado no backend (já detalhado em §3.1).
- Logs de auditoria completos (`AUDIT_LOG`): quem acessou qual dado, quando, de qual IP — implementado via middleware no backend, aplicado a toda rota que toca dado de paciente/exame/ASO.
- Necessidade de nomeação de DPO e elaboração de RIPD — processo organizacional, não técnico, mas a infraestrutura de logs/auditoria descrita aqui é pré-requisito técnico para viabilizar essas obrigações.

---

## 11. Ambientes e Deploy

### 11.1 Ambientes recomendados
- **Desenvolvimento:** ambiente isolado, com dados sintéticos (nunca dado real de paciente).
- **Homologação/Staging:** réplica de produção em menor escala, usada para validação antes de cada release — essencial em sistema de saúde, dado o impacto de qualquer erro.
- **Produção:** ambiente com alta disponibilidade básica (múltiplas instâncias do backend atrás de load balancer), mesmo no MVP.

### 11.2 Infraestrutura como código
- Recomenda-se Terraform (ou equivalente) para provisionar a infraestrutura (RDS, ElastiCache, S3, instâncias do backend) desde o início, evitando configuração manual não rastreável — importante para auditoria futura.

### 11.3 CI/CD
- Pipeline de integração contínua (ex.: GitHub Actions) executando testes automatizados antes de cada deploy, com etapas obrigatórias de:
  - Testes unitários e de integração do backend (especialmente das regras de validação descritas em §3).
  - Lint/type-check do TypeScript (frontend e backend).
  - Deploy automatizado para staging, com promoção manual para produção (gate de aprovação humana, dado o domínio sensível).

### 11.4 Escalabilidade inicial
- Backend stateless (sessão via JWT, não em memória local) para permitir múltiplas instâncias atrás de load balancer desde o MVP.
- Adapter Redis no WebSocket (já mencionado em §5.2) é o que torna essa escalabilidade horizontal possível sem perder mensagens em tempo real entre instâncias.

---

## 12. Mapa: Rotas da UI → Componentes de Infraestrutura

| Ação na UI (documento de especificação de interface) | Rota/Mecanismo | Componente de infraestrutura envolvido |
|---|---|---|
| Cadastro de paciente (Tela 1/3) | `POST /v1/patients` | Postgres (Core), validação CPF/duplicidade |
| Verificação de duplicidade (Tela 1) | `GET /v1/patients/search?cpf=` | Postgres (índice por CPF) |
| Inserção de exame manual (Tela 1) | `POST /v1/exam-requests/{id}/results` | Postgres, validação por schema de `exam_type` |
| Envio para fila médica (Tela 1) | `POST /v1/exam-requests/{id}/enqueue` | Redis (sorted set) + Postgres (espelho) + WebSocket `doctor:{id}` |
| Painel de fila médica (Tela 2) | WebSocket `doctor:{doctor_id}` + `GET /v1/queue` | Redis + Postgres |
| Aceitar paciente (Tela 2) | `POST /v1/queue/{id}/accept` | Lock transacional Postgres + WebSocket `clinic:{id}` e `patient:{id}` |
| Iniciar teleconsulta (Tela 2/3) | Sinalização SDK WebRTC | Provedor de vídeo gerenciado (Daily/Twilio/Agora) |
| Registrar decisão/ASO (Tela 2) | `POST /v1/exam-requests/{id}/decision` | Postgres + geração de PDF + API de assinatura eletrônica |
| Webhook de assinatura concluída | `POST /webhooks/signature-provider` | Backend → S3 (armazenamento do PDF assinado) → WebSocket `clinic:{id}` e `patient:{id}` |
| Download de ASO (Tela 1/3) | `GET /v1/aso-documents/{id}/download` | S3 (signed URL) |
| Acompanhamento de status (Tela 3) | WebSocket `patient:{patient_id}` | Redis pub/sub + Postgres |
| Notificação de chamada (Tela 3) | Push via FCM | Firebase Cloud Messaging |
| Confirmação/lembrete de agendamento (Tela 1 → paciente) | Evento assíncrono | SQS/RabbitMQ → SMS/WhatsApp (Twilio/Zenvia) |

---

## 13. Checklist de Prontidão para a Fase 1

- [ ] Backend modular (NestJS) com módulos Core, Fila, Telemedicina, Identidade, Notificação separados logicamente.
- [ ] Postgres com RLS habilitado por `clinic_id`/`company_id`.
- [ ] Redis com persistência habilitada e adapter para WebSocket multi-instância.
- [ ] Autenticação OAuth2/OIDC com JWT, papéis `operador_clinica`, `medico`, `paciente`.
- [ ] MFA habilitado obrigatoriamente para o perfil médico.
- [ ] Integração com provedor de vídeo WebRTC gerenciado, com sinalização disparada pelo backend.
- [ ] Integração com provedor de assinatura eletrônica via API + webhook.
- [ ] S3 com criptografia em repouso e *signed URLs* para todos os documentos/anexos.
- [ ] Validação de CPF, duplicidade e schema de exame implementada no backend (não só no client).
- [ ] RBAC reforçado no backend para todas as rotas sensíveis (não apenas ocultação na UI).
- [ ] Auditoria (`AUDIT_LOG`) cobrindo toda ação sobre paciente, exame e ASO.
- [ ] Pipeline de CI/CD com testes automatizados e gate manual para produção.
- [ ] Observabilidade mínima (logs centralizados, métricas, rastreamento de erro) ativa antes do go-live.

> Nota final: este documento cobre a infraestrutura e validações **técnicas**. Os pontos de validação **jurídica/regulatória** (enquadramento de telemedicina ocupacional, modelo de assinatura digital exigido por clientes grandes, retenção legal de prontuário) seguem sendo pré-requisitos de negócio, já listados no documento funcional original (§12 — Riscos e Pontos de Validação Prioritários), e não são substituídos por nenhuma decisão técnica aqui descrita.
