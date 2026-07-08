# B3 + F3 — Multi-tipo de Exame no Check-in da Clínica

**Prioridade:** 🟡 Alto  
**Frentes:** Backend + Frontend  
**Complexidade:** Large

---

## Contexto

O check-in atual (`/consultorio/check-in`) envia **sempre** o tipo `'pa'` (pressão arterial) como único exame. O backend em `exams.service.ts` já tem validação de campos por tipo (`pa`, `audiometria`, `acuidade_visual`), mas a tela não oferece seleção de tipos nem campos dinâmicos.

O modelo `ExamType` no banco define:
- `name`, `category`, `requiresEquipment`, `canBeRemoteReview`, `validityDays`

O modelo `OccupationalRisk` vincula CBO → exames obrigatórios (`requiredExams: String[]`).

---

## Requisitos

### B3 — Backend

**B3-REQ-001** — `GET /api/exams/types` — listar todos os `ExamType` cadastrados.  
Retorna: `{ id, name, category, requiresEquipment, canBeRemoteReview }[]`

**B3-REQ-002** — `GET /api/exams/required?cboCode=XXXX` — dado um CBO, retornar os exames obrigatórios segundo `OccupationalRisk.requiredExams`.  
Retorna: `{ requiredExams: string[], riskGrade: string, requiresInPerson: boolean }`  
Se CBO não existir: retornar `{ requiredExams: [], riskGrade: 'desconhecido', requiresInPerson: false }` (não 404).

**B3-REQ-003** — `POST /api/exams` deve aceitar múltiplos resultados em uma única chamada:
```ts
// Antes (atual)
{ examRequestId, examType, valueJson }

// Depois (proposta)
{ examRequestId, results: [{ examType, valueJson }] }
// Manter compatibilidade com formato antigo (single result) para não quebrar.
```

**B3-REQ-004** — Validação de campos por tipo deve ser extensível. Mover as regras de `requiredFields` para `ExamType` (campo `requiredFields: String[]`) ou manter no service em estrutura de mapa. **Decisão:** manter no service por ora (mapa JS), refatorar para banco na Fase 4.

**B3-REQ-005** — `collectedById` deve aceitar o operador logado. Por ora, aceitar campo opcional no body; se ausente, usar `'system'`.

### F3 — Frontend

**F3-REQ-001** — Passo de dados do paciente: ao preencher `functionCboCode`, chamar `GET /api/exams/required?cboCode=XXXX` e exibir alerta com os exames necessários para aquela função.

**F3-REQ-002** — Novo passo (ou seção) **"Seleção de Exames"** antes dos campos: mostrar checkboxes com todos os tipos de exame (`GET /api/exams/types`). Exames obrigatórios para o CBO pré-marcados e não desabilitáveis.

**F3-REQ-003** — Campos de coleta renderizados **dinamicamente** conforme os exames selecionados. Cada tipo de exame tem seu conjunto de campos:

| ExamType | Campos |
|----------|--------|
| `pa` | Pressão Sistólica, Pressão Diastólica |
| `acuidade_visual` | OD, OE (texto, ex: 20/20) |
| `audiometria` | Via Aérea OD, Via Aérea OE (resultado: Normal/Alterada) |
| `peso_altura` | Peso (kg), Altura (cm) |
| `glicemia` | Valor (mg/dL) |

**F3-REQ-004** — Enviar todos os resultados coletados em uma única requisição (B3-REQ-003) após a etapa de confirmação.

**F3-REQ-005** — Exibir progresso visual (stepper): Dados do Paciente → Exames → Confirmação — já existe como `step` no componente; refinar para incluir o passo de seleção.

---

## Critérios de Aceite

| ID | Critério |
|----|---------|
| F3-AC-001 | Ao digitar CBO válido, exames obrigatórios são exibidos automaticamente |
| F3-AC-002 | Lista de tipos de exame carrega do backend (não hardcoded) |
| F3-AC-003 | Campos de exame mudam conforme os tipos selecionados |
| F3-AC-004 | Submissão cria um `ExamResult` por tipo selecionado no banco |
| F3-AC-005 | CBO sem mapeamento não bloqueia o check-in (aviso, não erro) |
| B3-AC-001 | `GET /api/exams/required?cboCode=7171-10` retorna lista de exames (seed deve ter esse CBO) |
| B3-AC-002 | `POST /api/exams` com array `results` cria múltiplos `ExamResult` |

---

## Dependência de seed

Verificar se `OccupationalRisk` tem dados no seed. Se não houver, adicionar ao menos 3-4 CBOs comuns (ex: 7171-10 pedreiro, 3513-05 técnico de informática, 4110-05 auxiliar administrativo).

---

## Arquivos afetados

### Backend
- `src/exams/exams.controller.ts` — adicionar `GET /types`, `GET /required`
- `src/exams/exams.service.ts` — `findTypes()`, `findRequiredByCode()`, aceitar array em `createExam`
- `prisma/seed-mock.ts` — verificar/adicionar `OccupationalRisk` e `ExamType`

### Frontend
- `app/consultorio/check-in/page.tsx` — refatorar steps, campos dinâmicos
- `app/lib/api.ts` — adicionar `apiGetExamTypes()`, `apiGetRequiredExams(cboCode)`

