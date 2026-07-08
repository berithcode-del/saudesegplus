# Módulo Médicos

## Responsabilidade
Gerenciar dados de médicos, visualização de consultas agendadas e emissão de laudos.

## Rotas e Componentes Implementados
- **Rotas**:
  - `/medicos` (listagem)
  - `/medicos/[id]` (detalhes)
  - `/medicos/[id]/consultas` (agendamentos)

- **Componentes Principais**:
  - `DoctorAppointmentsList`
  - `AppointmentDetails`

## Fluxos de Dados
1. **Visualização de Consultas**: Listagem de agendamentos por médico.
2. **Detalhes de Consultas**: Visualização de informações do colaborador e histórico médico.

## Interações com Outros Módulos
- **Agendamentos**: Médicos visualizam e gerenciam agendamentos associados.
- **Colaboradores**: Acesso a dados de colaboradores durante consultas.

## Estado Atual e Gaps
- **Implementado**: Frontend básico para listagem e detalhes de consultas.
- **Gaps**:
  - Falta emissão de laudos.
  - Integração com backend para persistência de dados.