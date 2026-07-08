# Módulo Agendamentos

## Responsabilidade
Gerenciar a marcação e visualização de exames médicos para colaboradores, integrando empresas e médicos.

## Componentes
- **`AppointmentsTable`**: Listagem de agendamentos com filtros por data, colaborador e status.
- **`ScheduleCalendar`**: Calendário interativo para visualização e marcação de exames.

## Fluxos de Dados
1. **Agendamento**: Seleção de colaborador → Escolha de médico → Definição de data/hora.
2. **Visualização**: Filtros por empresa, colaborador ou médico.

## Interações com Outros Módulos
- **Colaboradores**: Agendamentos são associados a colaboradores específicos.
- **Empresas**: Visualização de agendamentos por empresa.
- **Médicos**: Associação de agendamentos a médicos responsáveis.

## Estado Atual e Gaps
- **Implementado**: Frontend dos componentes `AppointmentsTable` e `ScheduleCalendar`.
- **Gaps**:
  - Falta integração com backend para persistência de dados.
  - Notificações automáticas não estão implementadas.