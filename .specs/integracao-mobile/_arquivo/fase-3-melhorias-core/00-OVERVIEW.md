# Fase 3 — Visão Geral e Mapa de Features

## Estado atual do projeto

### Stack
- **Backend**: NestJS + Prisma + PostgreSQL + Socket.IO
- **Frontend**: Next.js 14 (App Router) + Tailwind/CSS customizado
- **Auth**: Ainda não implementada (todos os fluxos usam IDs manuais)

### O que está funcionando (Fase 2 concluída)
| Área | Status |
|------|--------|
| Cadastro de empresa | ✅ CRUD com validação e WebSocket |
| Fluxo de convite de colaborador | ✅ token correto, ExamRequest criado, timeline atualizada |
| Check-in direto na clínica | ✅ cria Patient + ExamRequest + ExamResult + QueueEntry |
| Fila médica (GET + accept) | ✅ prioridade geográfica, WebSocket |
| Consulta médica (tela) | ✅ UI com tabs Exames/Anamnese/Notas + decisão ASO |
| Atualização de status (CONCLUIDO) | ✅ via PATCH /api/solicitacoes/:id |
| Painel empresa (tempo real) | ✅ WebSocket emite timeline + invite status |
| Colaborador ver própria solicitação | ✅ GET /api/colaboradores/:id/solicitacoes |

### O que está MOCKADO / incompleto (alvo da Fase 3)
| Área | Lacuna |
|------|--------|
| Consulta médica | Dados do paciente/exames são mock estático (não lê `GET /api/solicitacoes/:id`) |
| ASO | `aso.service.ts` usa Puppeteer mock com `asoDocumentId !== '1'` hardcoded; não salva no banco |
| Assinatura | `signature.service.ts` não persiste nada; sem integração real |
| Upload de documentos empresa | `documentos/page.tsx` é mock (Fase 2 explicitamente excluiu) |
| Config empresa | `configuracoes/page.tsx` é mock |
| Tela do médico — histórico | `GET /api/medicos/:id/solicitacoes` existe mas não é usado no frontend |
| Autenticação | Nenhum fluxo real — IDs informados manualmente |
| App do paciente (mobile/web) | Nenhuma tela implementada; lógica não definida |
| Listagem de médicos | `GET /api/medicos` não existe |
| ExamResult multi-tipo | Check-in salva só `pa` como examType; outros tipos de exame não têm UI |
| Anamnese | Campo mock no frontend; sem modelo no banco e sem endpoint |

---

## Features da Fase 3

### Frente Backend
| ID | Feature | Prioridade |
|----|---------|------------|
| B1 | Dados reais na consulta médica | 🔴 Crítico |
| B2 | ASO real — geração e persistência | 🔴 Crítico |
| B3 | Multi-tipo de exame no check-in | 🟡 Alto |
| B4 | Anamnese — modelo + endpoint | 🟡 Alto |
| B5 | Autenticação JWT | 🟡 Alto |
| B6 | Listagem e busca de médicos | 🟢 Médio |
| B7 | Upload de documentos da empresa (PCMSO/PPRA) | 🟢 Médio |
| B8 | Configurações de empresa | 🟢 Médio |

### Frente Frontend
| ID | Feature | Prioridade |
|----|---------|------------|
| F1 | Consulta médica — dados reais do paciente | 🔴 Crítico |
| F2 | Telas do médico — histórico de atendimentos | 🟡 Alto |
| F3 | Check-in multi-tipo de exame | 🟡 Alto |
| F4 | Upload de documentos da empresa | 🟡 Alto |
| F5 | Configurações de empresa | 🟢 Médio |
| F6 | App do paciente — fluxo completo | 🔴 Crítico (a definir) |

### A Definir (discussão necessária)
| ID | Tema |
|----|------|
| D1 | Fluxo completo do paciente no app |
| D2 | Integração real de assinatura digital |
| D3 | Geração real de PDF do ASO |

---

## Dependências entre features

```
B5 (Auth)
  └─ desbloqueia → todos os fluxos (remove IDs manuais)

B1 (dados reais) + F1 (tela médica real)
  └─ dependem um do outro (mesma feature, dois lados)

B3 (multi-exame) → F3 (check-in multi-exame)
B4 (anamnese) → F1 (tab anamnese com dados reais)
B2 (ASO real) → F1 (fluxo de assinatura funcional)
B7 (upload docs) → F4 (tela de documentos)
B8 (config empresa) → F5 (tela de config)
D1 (decisão paciente) → F6 (app paciente)
```

---

## Ordem recomendada de execução

### Sprint 1 — Fechar o fluxo core (teleconsulta de ponta a ponta)
1. **B1 + F1** — Dados reais na consulta (lê solicitação real do banco)
2. **B4** — Modelo de anamnese
3. **B3 + F3** — Multi-tipo de exame no check-in

### Sprint 2 — Médico e documentos
4. **B2** — ASO real (persistência + PDF)
5. **F2** — Histórico de atendimentos do médico
6. **B7 + F4** — Upload de documentos da empresa

### Sprint 3 — Auth + paciente
7. **B5** — Autenticação JWT
8. **D1** — Decisão de lógica do app do paciente
9. **F6** — App do paciente (após D1)

