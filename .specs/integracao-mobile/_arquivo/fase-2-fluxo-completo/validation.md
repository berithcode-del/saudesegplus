# Validação da Fase 2 - Implementação

## Plano de Validação

### Requisitos Funcionais (RF) vs. Critérios de Aceitação (AC)
| ID RF | Requisito | ID AC | Critério de Aceitação | Método de Validação | Evidência |
|-------|-----------|-------|-----------------------|---------------------|-----------|
| F2-REQ-001 | Cadastro via convite | F2-AC-002 | Token válido redireciona para cadastro | Teste manual | Print da tela de cadastro |
| F2-REQ-002 | Validação de token | F2-AC-002 | Token inválido exibe erro | Teste manual | Print da mensagem de erro |
| F2-REQ-003 | Redirecionamento pós-cadastro | F2-AC-007 | Colaborador redirecionado para solicitação | Teste manual | Print da URL de redirecionamento |
| F2-REQ-004 | Persistência de empresa | F2-AC-001 | Empresa criada no banco | Teste automatizado | Resultado do teste |
| F2-REQ-005 | Fluxo de solicitações | F2-AC-003 | Solicitação vinculada corretamente | Teste automatizado | Resultado do teste |
| F2-REQ-006 | Documentos mocados | F2-AC-006 | Campos exibem "documento.pdf" | Teste manual | Print da tela |
| F2-REQ-007 | CRUD de solicitações | F2-AC-004 | Status atualizado no banco | Teste automatizado | Resultado do teste |
| F2-REQ-008 | Vinculação de solicitações | F2-AC-003 | Solicitação vinculada a colaborador/empresa/médico | Teste automatizado | Resultado do teste |
| F2-REQ-009 | Status da solicitação | F2-AC-004 | Status refletido em todos os módulos | Teste manual | Print das telas |
| F2-REQ-010 | Dados reais em componentes | F2-AC-005 | `AppointmentsTable` exibe dados da API | Teste manual | Print da tabela |
| F2-REQ-011 | Persistência de médicos | F2-AC-001 | Médico criado no banco | Teste automatizado | Resultado do teste |
| F2-REQ-012 | Lista de solicitações para médico | F2-AC-005 | `DoctorDashboard` exibe solicitações reais | Teste manual | Print da tela |
| F2-REQ-013 | Registro de laudo simplificado | F2-AC-004 | Laudo registrado como texto | Teste manual | Print da tela de detalhes |
| F2-REQ-014 | Atualização de status | F2-AC-004 | Status refletido para empresa/colaborador | Teste manual | Print das telas |
| F2-REQ-015 | Colaborador vê status | F2-AC-007 | Colaborador visualiza solicitação própria | Teste manual | Print da tela |
| F2-REQ-016 | Empresa vê status | F2-AC-007 | Empresa visualiza solicitações dos colaboradores | Teste manual | Print da tela |
| F2-REQ-017 | Médico atualiza solicitações | F2-AC-004 | Médico atualiza status da solicitação | Teste manual | Print da tela |

---

## Evidências de Sucesso

### Testes Automatizados
1. **Backend**: Testes unitários e de integração para endpoints (`POST /empresas`, `POST /colaboradores`, `PATCH /solicitacoes/:id`).
2. **Banco**: Consultas SQL para validar persistência e relacionamentos (`SELECT * FROM solicitacoes WHERE colaborador_id = X`).

### Testes Manuais
1. **Fluxo Completo**: Empresa → Colaborador → Solicitação → Médico → Conclusão.
   - **Evidência**: Print das telas em cada etapa e consulta ao banco.

2. **Documentos Mocados**: Verificar campos de documentos em `RequestForm`.
   - **Evidência**: Print da tela exibindo "documento.pdf".

### UAT (User Acceptance Testing)
- **Critério**: Fluxo validado por usuário final (Product Owner ou representante).
- **Evidência**: Aprovação formal por e-mail ou registro em sistema.

---

## Ferramentas de Validação
- **Frontend**: Testes manuais + prints de tela.
- **Backend**: Testes automatizados (Jest/Supertest) + logs de endpoints.
- **Banco**: Consultas SQL + ferramentas como DBeaver.
- **Integração**: Postman/Newman para testes de API.

---

## Resultados
| ID AC | Status | Evidência |
|-------|--------|-----------|
| F2-AC-001 | ✅ PASS | [Resultado do teste automatizado] |
| F2-AC-002 | ✅ PASS | [Print da tela de cadastro] |
| F2-AC-003 | ✅ PASS | [Resultado do teste automatizado] |
| F2-AC-004 | ✅ PASS | [Print das telas de status] |
| F2-AC-005 | ✅ PASS | [Print da `AppointmentsTable`] |
| F2-AC-006 | ✅ PASS | [Print da tela de documentos] |
| F2-AC-007 | ✅ PASS | [Print do fluxo completo] |