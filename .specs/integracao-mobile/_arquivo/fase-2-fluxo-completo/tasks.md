# Tarefas da Fase 2 - Implementação

## Colaboradores

### Tarefa 1: Implementar página de cadastro via convite
- **ID**: F2-TASK-001
- **Módulo**: Colaboradores
- **Descrição**: Criar página `InviteSignupPage` para cadastro via token.
- **Dependências**: Backend de validação de token (F2-TASK-002).
- **Critério de Verificação**: Página funcional, token inválido exibe erro, token válido redireciona para cadastro.

### Tarefa 2: Validar token de convite no backend
- **ID**: F2-TASK-002
- **Módulo**: Colaboradores
- **Descrição**: Implementar endpoint `POST /colaboradores` para validação de token e criação de colaborador.
- **Dependências**: Schema `colaboradores` (F2-REQ-008).
- **Critério de Verificação**: Token válido cria colaborador e vincula à empresa; token inválido retorna erro.

### Tarefa 3: Redirecionar para solicitação após cadastro
- **ID**: F2-TASK-003
- **Módulo**: Colaboradores
- **Descrição**: Após cadastro, redirecionar colaborador para `CompanyDashboard` ou `RequestForm`.
- **Dependências**: Página `RequestForm` (F2-TASK-007).
- **Critério de Verificação**: Redirecionamento funcional e dados do colaborador carregados.

---

## Empresas

### Tarefa 4: Persistir cadastro de empresa
- **ID**: F2-TASK-004
- **Módulo**: Empresas
- **Descrição**: Implementar endpoint `POST /empresas` e schema `empresas`.
- **Dependências**: Banco PostgreSQL configurado.
- **Critério de Verificação**: Empresa criada e persistida no banco.

### Tarefa 5: Implementar fluxo de criação de solicitações
- **ID**: F2-TASK-005
- **Módulo**: Empresas
- **Descrição**: Criar componente `RequestForm` e endpoint `POST /empresas/:id/solicitacoes`.
- **Dependências**: Schema `solicitacoes` (F2-REQ-008).
- **Critério de Verificação**: Solicitação criada e vinculada a colaborador/empresa.

### Tarefa 6: Exibir documentos como placeholders
- **ID**: F2-TASK-006
- **Módulo**: Empresas
- **Descrição**: Campos de documentos exibem "documento.pdf" sem upload real.
- **Dependências**: Componente `RequestForm` (F2-TASK-005).
- **Critério de Verificação**: Campos exibidos corretamente, sem funcionalidade de upload.

---

## Agendamentos/Solicitações

### Tarefa 7: Implementar CRUD de solicitações
- **ID**: F2-TASK-007
- **Módulo**: Agendamentos/Solicitações
- **Descrição**: Criar endpoints `GET /solicitacoes` e `PATCH /solicitacoes/:id`.
- **Dependências**: Schema `solicitacoes` (F2-REQ-008).
- **Critério de Verificação**: Solicitações criadas, listadas e atualizadas no banco.

### Tarefa 8: Vincular solicitações a colaborador, empresa e médico
- **ID**: F2-TASK-008
- **Módulo**: Agendamentos/Solicitações
- **Descrição**: Garantir que `solicitacoes` tenha chaves estrangeiras para `colaboradores`, `empresas` e `medicos`.
- **Dependências**: Schemas `colaboradores`, `empresas`, `medicos` (F2-REQ-008).
- **Critério de Verificação**: Solicitações vinculadas corretamente nos registros do banco.

### Tarefa 9: Atualizar componentes para dados reais
- **ID**: F2-TASK-009
- **Módulo**: Agendamentos/Solicitações
- **Descrição**: `AppointmentsTable` e `ScheduleCalendar` consomem `GET /solicitacoes`.
- **Dependências**: Endpoint `GET /solicitacoes` (F2-TASK-007).
- **Critério de Verificação**: Componentes exibem dados reais da API.

---

## Médicos/Clínica

### Tarefa 10: Persistir dados de médicos e clínicas
- **ID**: F2-TASK-010
- **Módulo**: Médicos/Clínica
- **Descrição**: Criar schemas `medicos` e `clinicas`.
- **Dependências**: Banco PostgreSQL configurado.
- **Critério de Verificação**: Médicos e clínicas persistidos no banco.

### Tarefa 11: Listar solicitações reais para médico
- **ID**: F2-TASK-011
- **Módulo**: Médicos/Clínica
- **Descrição**: Implementar endpoint `GET /medicos/:id/solicitacoes` e componente `DoctorDashboard`.
- **Dependências**: Schema `solicitacoes` (F2-REQ-008).
- **Critério de Verificação**: `DoctorDashboard` exibe solicitações reais.

### Tarefa 12: Registrar resultado/laudo simplificado
- **ID**: F2-TASK-012
- **Módulo**: Médicos/Clínica
- **Descrição**: Implementar endpoint `PATCH /solicitacoes/:id` para atualizar status e laudo (texto).
- **Dependências**: Endpoint `PATCH /solicitacoes/:id` (F2-TASK-007).
- **Critério de Verificação**: Status e laudo atualizados no banco.

### Tarefa 13: Refletir atualização para empresa/colaborador
- **ID**: F2-TASK-013
- **Módulo**: Médicos/Clínica
- **Descrição**: Garantir que `CompanyDashboard` e `EmployeeDashboard` exibam status atualizado.
- **Dependências**: Componentes `CompanyDashboard` e `EmployeeDashboard`.
- **Critério de Verificação**: Status refletido em tempo real.
