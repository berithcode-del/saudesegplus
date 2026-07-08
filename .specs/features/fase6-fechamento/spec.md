# Spec: Fase 6 - Fechamento do Fluxo (Primeira Rodada de Testes)

## Visão Geral
Esta feature completa o funcionamento end-to-end da plataforma SaudeSegPlus, garantindo que os fluxos principais (Convite -> Portal -> Fila Médica -> Teleconsulta -> ASO) e o check-in direto funcionem perfeitamente sem mocks (exceto para a sala de vídeo para testes) ou ações manuais no banco.

## Requisitos (Requirements)

### Infraestrutura e Core do Backend
- **REQ-01**: O sistema DEVE garantir a criação de um `QueueEntry` sempre que um `ExamRequest` transicionar para o status `NA_FILA_MEDICA`, independentemente de a origem ser o portal do paciente ou o check-in no consultório. O ideal é centralizar essa lógica.
- **REQ-02**: Um endpoint de mock para criação de salas de teleconsulta DEVE existir (`POST /api/teleconsultation/create-room`) para desbloquear o fluxo de emissão de ASO durante os testes. Este mock DEVE ser isolado via uma variável de ambiente (ex: `USE_MOCK_TELECONSULTATION=true`).
- **REQ-03**: Os endpoints que buscam dados do processo (`GET /api/solicitacoes/:id` e `GET /api/portal/processo`) DEVEM incluir a `hostRoomUrl` e `linkSala` geradas, respectivamente.
- **REQ-04**: O endpoint de autenticação do portal (`POST /api/portal/auth`) DEVE retornar `patientName`, `companyName` e `examPurpose` para uso do frontend.
- **REQ-05**: Ao salvar resultados de exame, o sistema DEVE fazer um fallback automático criando um `ExamType` (via upsert) caso o `examType` solicitado não seja encontrado, prevenindo erros de Foreign Key.
- **REQ-06**: As regras de CORS DEVEM ser configuráveis via variáveis de ambiente para facilitar os testes em rede local (LAN).

### Frontend (Portal e Consultório)
- **REQ-07**: O upload de documentos no portal DEVE coordenar o envio do arquivo e o registro do processo de forma sequencial, marcando os documentos corretamente como enviados.
- **REQ-08**: O questionário do portal DEVE enviar os dados no formato DTO nivelado (flat), ao invés de um objeto aninhado `respostas`.
- **REQ-09**: A barra de progresso do portal DEVE calcular o índice da etapa ativa baseada no array `progresso[]` em vez de um campo string não existente no payload.
- **REQ-10**: O `ExamForm` na interface da clínica DEVE capturar e enviar os valores reais preenchidos como `valueJson` para o backend. A interface também DEVE tratar de forma resiliente objetos `valueJson` vazios antigos no banco.

### Funcionalidades de Tempo Real
- **REQ-11**: A interface médica DEVE exibir um botão "Criar Sala de Teleconsulta". Ao ser clicado, DEVE chamar a API e, após o retorno, habilitar o botão "Emitir ASO".
- **REQ-12**: O painel da empresa DEVE emitir o evento WebSocket `join_company` com o respectivo `companyId` ao carregar a página para receber atualizações em tempo real.
