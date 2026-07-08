# SaudeSeg+ — Plano de Implementação Fase 2

## Objetivo da Fase 2

Fazer o **fluxo completo funcionar de ponta a ponta**, com dados reais entre os módulos (persistência de backend, integrações reais), mas com **documentos mocados** (upload/validação de documentos fica para a Fase 3 — não é bloqueador aqui).

Fluxo-alvo a validar no final da fase:

```
Empresa se cadastra
   → Empresa abre uma solicitação (de exame/atendimento)
   → Solicitação aparece para o médico/clínica
   → Médico/clínica processa o atendimento
   → Resultado/laudo é registrado (ainda que de forma simplificada)
```

**Premissa explícita:** documentos (CNPJ, contrato social, atestados, laudos em PDF etc.) são **mocados** nesta fase — não há upload real, nem validação real de arquivo. O objetivo é não deixar a parte documental travar o teste do fluxo.

---

## Decisão de escopo

- ✅ Incluído na Fase 2: fluxo real de Empresas → Colaboradores → Agendamentos/Solicitações → Médicos/Clínica
- ✅ Incluído: persistência de backend para todos os módulos acima
- ✅ Incluído: dados mocados onde já estavam mocados (mantém-se como está)
- ❌ Fora da Fase 2 (vai para Fase 3): upload real de documentos, validação de documentos (CNPJ, contrato social, laudos em arquivo)
- ⚠️ Documentos aparecem na interface apenas como **placeholders/mock** (ex.: "documento.pdf" fixo, sem upload real)

---

## Plano por módulo

### 1. Colaboradores — Cadastro via Convite (bloqueador crítico)
**Por quê primeiro:** sem colaborador cadastrado, não existe solicitação, não existe fluxo.

- [ ] Implementar página de cadastro via convite (hoje não existe)
- [ ] Backend: validar token do convite, criar colaborador, vincular à empresa
- [ ] Direcionar colaborador para tela de solicitação/agendamento após cadastro

### 2. Empresas — Solicitação (fluxo real, documento mocado)
- [ ] Backend de persistência para cadastro de empresa (se ainda não houver)
- [ ] Fluxo de "abrir solicitação": empresa seleciona colaborador → cria solicitação real no banco
- [ ] Upload de documentos: manter como **mock** (campo na UI, sem persistência de arquivo real)
- [ ] Notificação de convite: pode ser mock/log no console nesta fase (não é o foco)

### 3. Agendamentos/Solicitações — Persistência real
- [ ] Backend: CRUD de solicitações/agendamentos (NestJS + PostgreSQL)
- [ ] Vincular solicitação a colaborador, empresa e médico/clínica
- [ ] `AppointmentsTable` e `ScheduleCalendar` passam a consumir dados reais da API
- [ ] Status da solicitação (ex.: pendente → em atendimento → concluído) refletido no banco

### 4. Médicos/Clínica — Recebimento e atendimento real
- [ ] Backend: persistência de médicos/clínica e vínculo com solicitações
- [ ] Tela do médico passa a listar solicitações reais (vindas do banco, não mock)
- [ ] Fluxo de atendimento: médico abre a solicitação, registra resultado/laudo de forma simplificada (texto/status — **sem upload de arquivo de laudo ainda**, isso é Fase 3)
- [ ] Atualização de status da solicitação refletida para empresa/colaborador

### 5. Integração entre módulos
- [ ] Colaborador consegue ver status da própria solicitação
- [ ] Empresa consegue ver status das solicitações dos seus colaboradores
- [ ] Médico/clínica consegue ver e atualizar solicitações recebidas

---

## Fora de escopo nesta fase (confirmado)

| Item | Motivo | Quando |
|---|---|---|
| Upload real de documentos (CNPJ, contrato social) | Não é bloqueador para testar o fluxo | Fase 3 |
| Validação de documentos | Depende do upload real | Fase 3 |
| Emissão de laudo em PDF | Pode ser registrado como dado simplificado por ora | Fase 3 |
| Notificações automáticas (e-mail/push) | Não essencial para validar o fluxo internamente | Fase 3 (ou backlog) |

---

## Critério de sucesso da Fase 2

A Fase 2 estará concluída quando for possível, **sem dados mocados nas entidades principais** (empresa, colaborador, solicitação, médico):

1. Cadastrar uma empresa
2. Empresa convidar e cadastrar um colaborador
3. Empresa/colaborador abrir uma solicitação
4. Solicitação aparecer para o médico/clínica correta
5. Médico/clínica visualizar e concluir o atendimento
6. Status final refletido para empresa e colaborador

Documentos permanecem mocados durante todo esse fluxo, sem impedir nenhuma etapa.
