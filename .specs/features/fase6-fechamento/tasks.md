# Tasks: Fase 6 - Fechamento

## Fase 1: Infraestrutura e Core do Backend

- [ ] **TSK-01**: Centralizar a criação de `QueueEntry` ao mudar o status para `NA_FILA_MEDICA`. (Referência: REQ-01)
  - **Critério de Aceitação**: Chamadas para `GET /api/queue` listam o paciente logo após a mudança de status.
- [ ] **TSK-02**: Criar endpoint `POST /api/teleconsultation/create-room` (mockado, controlado por variável de ambiente). (Referência: REQ-02)
  - **Critério de Aceitação**: O endpoint retorna uma `hostRoomUrl` válida.
- [ ] **TSK-03**: Atualizar as respostas de `GET /api/solicitacoes/:id` e `GET /api/portal/processo` para incluir `hostRoomUrl`/`linkSala`. (Referência: REQ-03)
  - **Critério de Aceitação**: O JSON retornado contém os links da sala de teleconsulta.
- [ ] **TSK-04**: Atualizar `POST /api/portal/auth` para retornar `patientName`, `companyName` e `examPurpose`. (Referência: REQ-04)
  - **Critério de Aceitação**: Os dados estão presentes no response de login e são armazenados pelo frontend.
- [ ] **TSK-05**: Implementar `upsert` na criação de `ExamResult` para o `ExamType`. (Referência: REQ-05)
  - **Critério de Aceitação**: Salvar resultado com um `examType` desconhecido não gera erro no banco e salva com sucesso.
- [ ] **TSK-06**: Configurar CORS via variável `.env` em vez de IPs fixos no código. (Referência: REQ-06)
  - **Critério de Aceitação**: Requisições originadas de um IP de LAN (ex: acesso pelo celular na mesma wifi) funcionam sem erro de CORS.

## Fase 2: Correções Críticas do Frontend (Portal & Consultório)

- [ ] **TSK-07**: Refatorar a tela de documentos do portal para coordenar o upload e registro sequencial. (Referência: REQ-07)
  - **Critério de Aceitação**: Após o upload, o documento aparece como "enviado" na interface.
- [ ] **TSK-08**: Ajustar o payload do questionário no portal para enviar propriedades planas. (Referência: REQ-08)
  - **Critério de Aceitação**: API aceita os dados do questionário sem estourar erro 400 de validação de DTO.
- [ ] **TSK-09**: Atualizar o `ExamForm` do consultório para capturar e enviar o `valueJson` real e tratar valores antigos vazios. (Referência: REQ-10)
  - **Critério de Aceitação**: Dados reais de pressão e afins são salvos no banco. A interface não trava com JSON vazio.
- [ ] **TSK-10**: Corrigir a barra de progresso do Portal para ler do array `progresso[]`. (Referência: REQ-09)
  - **Critério de Aceitação**: Barra avança visualmente combinando com o estado real do processo.

## Fase 3: Funcionalidades de Tempo Real (Médico e Empresa)

- [ ] **TSK-11**: Implementar o botão "Criar Sala" na interface médica e exibir os links. (Referência: REQ-11)
  - **Critério de Aceitação**: Clicar em "Criar Sala" consome a API do TSK-02 e habilita o botão "Emitir ASO".
- [ ] **TSK-12**: Emitir evento de socket `join_company` ao carregar painel da empresa. (Referência: REQ-12)
  - **Critério de Aceitação**: Conexão WebSocket para o namespace `/company` emite com sucesso o `join_company`.
