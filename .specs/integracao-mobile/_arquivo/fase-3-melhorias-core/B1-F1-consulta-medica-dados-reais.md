# B1 + F1 — Consulta Médica com Dados Reais

**Prioridade:** 🔴 Crítico  
**Frentes:** Backend + Frontend (inseparáveis)  
**Complexidade:** Large

---

## Contexto

A tela `/medico/consulta/[id]` existe e tem boa UI, mas todos os dados são mock estático:

```ts
// app/medico/consulta/[id]/page.tsx — estado atual
const MOCK_EXAMS = [
  { label: 'Pressão Sistólica', value: '120 mmHg', status: 'normal' },
  // ...
];
// "Carlos Mendes", CPF fixo, localização fixa
```

O endpoint `GET /api/solicitacoes/:id` já existe no backend e retorna dados reais (incluindo `results`, `patient`, `clinic`, `invite.company`). A função `apiGetSolicitacao(id)` já existe em `api.ts` mas **nunca é chamada**.

A aba **Anamnese** também é mock (`<p>Queixas: Nenhuma relatada</p>`). Depende da feature B4 para ter dados reais, mas a tab deve existir e mostrar estado correto mesmo antes disso.

---

## Requisitos

### B1 — Backend

**B1-REQ-001** — `GET /api/solicitacoes/:id` deve retornar, além do que já retorna:
- `patient` completo (name, cpf, birthDate, phone, functionCboCode)
- `results[]` com `type.name`, `valueJson` (parseado), `collectedAt`
- `clinic` (name, city, state)
- `invite.company.razaoSocial` (quando origin = convite)
- `asoDocuments[]` (se já existirem)
- `teleconsultations[]` da request (para saber se já houve chamada)

**B1-REQ-002** — Os `ExamResult.valueJson` são salvos como `string` (JSON.stringify). O endpoint deve parsear antes de retornar (ou documentar que o cliente parseia). Definir qual lado é responsável. **Decisão recomendada: backend parseia.**

**B1-REQ-003** — Quando `GET /api/solicitacoes/:id` for chamado pelo médico durante a consulta, deve registrar evento `EM_ATENDIMENTO_MEDICO` na timeline (se ainda não registrado).

**B1-REQ-004** — Adicionar `GET /api/medicos` (lista de médicos ativos) para eliminar o campo "ID do médico" manual na fila. Retorna: `id`, `name`, `crmNumber`, `crmState`, `status`, `city`, `state`.

### F1 — Frontend

**F1-REQ-001** — `ConsultaPage` deve chamar `apiGetSolicitacao(params.id)` ao montar e usar os dados retornados para:
- Cabeçalho do paciente: `name`, `cpf`, `functionCboCode`, `examPurpose`
- Localização: `clinic.city`, `clinic.state`
- Nome da empresa (quando `source === 'convite_empresa'`)

**F1-REQ-002** — Aba **Exames**: renderizar `results[]` dinamicamente. Cada item: `type.name` como label, `valueJson` como valores (pode ser múltiplos campos por resultado). Indicar status (`atencao`/`normal`) baseado em regras simples (ex: pressão sistólica > 140 = atenção). Fallback: se `results` estiver vazio, mostrar mensagem "Aguardando resultados de exames."

**F1-REQ-003** — Aba **Anamnese**: se o modelo de anamnese (B4) ainda não existir, mostrar placeholder "Anamnese não coletada nesta solicitação." Quando B4 estiver pronto, renderizar campos reais.

**F1-REQ-004** — Estado de loading enquanto `apiGetSolicitacao` está em andamento. Estado de erro com mensagem legível se o endpoint falhar.

**F1-REQ-005** — A tela da fila `/medico/fila` deve oferecer dropdown de seleção de médico (usando `GET /api/medicos`) em vez do campo de texto manual. O ID continuar sendo salvo em `localStorage` para persistência entre recargas.

**F1-REQ-006** — Ao clicar em "Emitir ASO" e confirmar a decisão, o `PATCH /api/solicitacoes/:id` deve enviar `{ status: 'CONCLUIDO', laudoTexto, decision, restrictionNotes }` — não apenas `laudoTexto` como string concatenada.

---

## Critérios de Aceite

| ID | Critério |
|----|---------|
| F1-AC-001 | Nome do paciente, CPF e empresa exibidos na tela de consulta vêm do banco (não do mock) |
| F1-AC-002 | Lista de exames renderiza os `ExamResult` reais; campo ausente mostra "Aguardando resultados" |
| F1-AC-003 | Indicador de atenção aparece para valores fora de faixa (ex: PA sistólica > 140) |
| F1-AC-004 | Loading spinner visível enquanto dados carregam |
| F1-AC-005 | Fila do médico carrega com dropdown de seleção em vez de campo de texto manual |
| B1-AC-001 | `GET /api/solicitacoes/:id` retorna `results` com `valueJson` já parseado |
| B1-AC-002 | `GET /api/medicos` retorna lista de médicos com `status === 'online' OR 'offline'` |

---

## Gaps e riscos

- **`collectedById` hardcoded como `'system'`** em `exams.service.ts`. Quando auth existir, deve ser o operador logado. Por ora, aceitar `'system'` e ignorar na UI.
- **`ExamType`** pode não existir no banco para `examType = 'pa'` (check-in salva `typeId = 'default'` se não achar). Verificar seed; se necessário, migrar para buscar por `name` e criar se não existir.
- **Teleconsulta (videoSessionId)** continua mock — não há integração WebRTC nesta fase.

---

## Arquivos afetados

### Backend
- `src/exam-request/exam-request.service.ts` — enriquecer `findOne` com includes
- `src/medicos/medicos.controller.ts` — adicionar `GET /` (lista)
- `src/medicos/medicos.service.ts` — adicionar `findAll()`

### Frontend
- `app/medico/consulta/[id]/page.tsx` — remover mocks, adicionar fetch + loading
- `app/medico/fila/page.tsx` — substituir campo texto por dropdown de médicos
- `app/lib/api.ts` — adicionar `apiListMedicos()`

