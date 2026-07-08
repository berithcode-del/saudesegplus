# F2 — Telas do Médico: Histórico de Atendimentos

**Prioridade:** 🟡 Alto  
**Frente:** Frontend (backend já existe)  
**Complexidade:** Medium

---

## Contexto

O endpoint `GET /api/medicos/:id/solicitacoes` já retorna todas as solicitações atendidas pelo médico (com dados de paciente, exames, ASO). O frontend do médico tem apenas a tela de fila (`/medico/fila`) e de consulta (`/medico/consulta/[id]`). Não existe tela de histórico.

A rota `/medico` atualmente redireciona para `/medico/fila` — que é correto como home do médico.

---

## Requisitos

**F2-REQ-001** — Nova rota `/medico/historico` listando atendimentos passados do médico.

Colunas da tabela:
- Nome do paciente
- Tipo de exame (`examPurpose`)
- Data do atendimento (`assignedAt`)
- Decisão (`asoDocuments[0].decision` ou "Pendente")
- Status da solicitação
- Botão "Ver detalhes" → abre a tela de consulta em modo leitura

**F2-REQ-002** — Filtros na listagem:
- Por status (`CONCLUIDO`, `EM_ATENDIMENTO_MEDICO`, todos)
- Por data (intervalo: últimos 7 dias / 30 dias / período customizado)

**F2-REQ-003** — A tela de consulta `/medico/consulta/[id]` em modo leitura (quando solicitação já está `CONCLUIDO`):
- Desabilitar o botão "Emitir ASO" se já houver `AsoDocument`
- Exibir a decisão já registrada com data e restrições
- Link para baixar o PDF do ASO (se `pdfUrl` existir)

**F2-REQ-004** — Item de navegação "Histórico" na sidebar do médico (`app/medico/layout.tsx`).

**F2-REQ-005** — Adicionar `apiGetMedicoSolicitacoes(doctorId)` já existe em `api.ts` — verificar que funciona com o endpoint real (B1 adiciona `GET /api/medicos` mas o `/:id/solicitacoes` já existe).

---

## Critérios de Aceite

| ID | Critério |
|----|---------|
| F2-AC-001 | `/medico/historico` lista atendimentos com dados reais do banco |
| F2-AC-002 | Filtro por status funciona (altera a query ou filtra client-side) |
| F2-AC-003 | Solicitação com status CONCLUIDO exibe decisão do ASO na listagem |
| F2-AC-004 | Botão "Ver detalhes" abre `/medico/consulta/[id]` sem permitir nova emissão de ASO |
| F2-AC-005 | Link de download do PDF aparece quando `pdfUrl` está preenchido |

---

## Arquivos afetados

### Frontend
- `app/medico/historico/page.tsx` — nova página
- `app/medico/layout.tsx` — adicionar item "Histórico" na nav
- `app/medico/consulta/[id]/page.tsx` — modo leitura quando CONCLUIDO

