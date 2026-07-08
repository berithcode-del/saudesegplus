# Especificação da Fase 2 - Implementação

## Objetivo
Implementar o **fluxo completo de ponta a ponta** do SaudeSeg+, com **persistência real** em todos os módulos principais e **documentos mocados**. O objetivo é validar a integração entre módulos (Empresas, Colaboradores, Agendamentos/Solicitações, Médicos/Clínica) sem bloqueios relacionados a uploads ou validações de documentos.

---

## Escopo
### Módulos Incluídos
1. **Colaboradores**: Cadastro via convite, validação de token, vínculo com empresa.
2. **Empresas**: Cadastro e persistência, fluxo de solicitações com documentos mocados.
3. **Agendamentos/Solicitações**: CRUD real, vinculação com colaboradores, empresas e médicos.
4. **Médicos/Clínica**: Persistência de dados, recebimento e processamento de solicitações.

### Exclusões
- Upload real de documentos (CNPJ, contrato social, laudos).
- Validação de documentos.
- Emissão de laudos em PDF.
- Notificações automáticas (e-mail/push).

---

## Requisitos Funcionais

### Colaboradores
| ID | Requisito |
|----|-----------|
| F2-REQ-001 | Implementar página de cadastro via convite (token-based). |
| F2-REQ-002 | Validar token de convite no backend e vincular colaborador à empresa. |
| F2-REQ-003 | Redirecionar colaborador para tela de solicitação após cadastro. |

### Empresas
| ID | Requisito |
|----|-----------|
| F2-REQ-004 | Persistir cadastro de empresa no banco de dados. |
| F2-REQ-005 | Implementar fluxo de criação de solicitações (seleção de colaborador → criação no banco). |
| F2-REQ-006 | Exibir campos de documentos como **placeholders** (sem upload real). |

### Agendamentos/Solicitações
| ID | Requisito |
|----|-----------|
| F2-REQ-007 | Implementar CRUD de solicitações/agendamentos (NestJS + PostgreSQL). |
| F2-REQ-008 | Vincular solicitações a colaborador, empresa e médico/clínica. |
| F2-REQ-009 | Refletir status da solicitação (pendente → em atendimento → concluído) no banco. |
| F2-REQ-010 | Consumir dados reais da API nos componentes `AppointmentsTable` e `ScheduleCalendar`. |

### Médicos/Clínica
| ID | Requisito |
|----|-----------|
| F2-REQ-011 | Persistir dados de médicos/clínica e vínculo com solicitações. |
| F2-REQ-012 | Listar solicitações reais (vindas do banco) na tela do médico. |
| F2-REQ-013 | Registrar resultado/laudo de forma simplificada (texto/status). |
| F2-REQ-014 | Atualizar status da solicitação e refletir para empresa/colaborador. |

### Integração entre Módulos
| ID | Requisito |
|----|-----------|
| F2-REQ-015 | Colaborador visualiza status da própria solicitação. |
| F2-REQ-016 | Empresa visualiza status das solicitações dos colaboradores. |
| F2-REQ-017 | Médico/clínica visualiza e atualiza solicitações recebidas. |

---

## Critérios de Aceitação
| ID | Critério |
|----|----------|
| F2-AC-001 | Cadastro de empresa, colaborador e médico/clínica persistidos no banco. |
| F2-AC-002 | Fluxo de convite: token válido redireciona para cadastro, token inválido exibe erro. |
| F2-AC-003 | Solicitações criadas e vinculadas corretamente a colaborador, empresa e médico. |
| F2-AC-004 | Status da solicitação atualizado e refletido em todos os módulos. |
| F2-AC-005 | Componentes `AppointmentsTable` e `ScheduleCalendar` exibem dados reais da API. |
| F2-AC-006 | Documentos exibidos como placeholders (ex.: "documento.pdf") sem upload real. |
| F2-AC-007 | Fluxo completo validado: empresa → colaborador → solicitação → médico → conclusão. |

---

## Restrições
1. **Persistência real obrigatória**: Todos os dados devem ser armazenados no banco (PostgreSQL).
2. **Documentos mocados**: Sem upload ou validação real de arquivos.
3. **Integrações**: Comunicação entre módulos via API (sem mocks nas entidades principais).
4. **Exclusões**: Notificações, uploads e validações de documentos ficam para a Fase 3.