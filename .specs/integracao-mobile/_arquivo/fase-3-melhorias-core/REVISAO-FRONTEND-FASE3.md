# Revisão Frontend — Fase 3

**Data:** 28/06/2026  
**Escopo:** Análise do código atual do frontend (`Front.zip`) contra os requisitos definidos em `Fase3.zip`  
**Método:** Comparação arquivo a arquivo entre a spec de cada feature (F1–F6) e o código entregue

---

## Sumário Executivo

| Feature | Descrição | Status Geral |
|---------|-----------|--------------|
| F1 | Consulta médica com dados reais | ⚠️ Parcial |
| F2 | Histórico de atendimentos do médico | ⚠️ Parcial |
| F3 | Check-in multi-tipo de exame | ❌ Incompleto |
| F4 | Upload de documentos da empresa | ⚠️ Parcial |
| F5 | Configurações de empresa | ⚠️ Parcial |
| F6 | Portal do funcionário | ✅ Majoritariamente correto |

---

## F1 — Consulta Médica com Dados Reais

**Arquivo:** `app/medico/consulta/[id]/page.tsx`

### ✅ O que está correto

- `apiGetSolicitacao(params.id)` é chamado ao montar o componente — dados reais do banco substituem o mock estático.
- Cabeçalho do paciente exibe `name`, `cpf`, `functionCboCode` e `examPurpose` vindos da API.
- Localização da clínica (`clinic.city`, `clinic.state`, `clinic.name`) renderizada.
- Aba Exames renderiza `results[]` dinamicamente via `parsedExams` com `JSON.parse(r.valueJson)`.
- Aba Anamnese: exibe campos reais quando `patient.anamneses[0]` existe; exibe fallback quando vazio.
- Estado de loading presente (`setLoading(true/false)`).
- `decision` e `restrictionNotes` são enviados corretamente no body de `POST /api/aso/generate`.

### ❌ Problemas encontrados

#### F1-REQ-005 — Fila do médico ainda usa campo de texto manual para ID

**Arquivo:** `app/medico/fila/page.tsx`

A spec exige substituir o campo `<input type="text">` por um `<select>` carregado de `GET /api/medicos` via `apiListMedicos()`. O código atual ainda usa `<input>` com `onBlur` para salvar o ID manualmente no `localStorage`. A função `apiListMedicos` existe em `api.ts` mas **não é usada** na tela de fila.

```
// Atual (fila/page.tsx linha ~92)
<input className="form-input" defaultValue={doctorId} onBlur={(e) => handleSaveDoctorId(e.target.value)} />

// Esperado
<select onChange={(e) => handleSaveDoctorId(e.target.value)}>
  {medicos.map(m => <option key={m.id} value={m.id}>{m.name} — CRM {m.crmNumber}/{m.crmState}</option>)}
</select>
```

**Critério afetado:** `F1-AC-005`

---

#### F1-REQ-006 — `apiUpdateSolicitacao` não recebe `decision` e `restrictionNotes`

**Arquivo:** `app/medico/consulta/[id]/page.tsx`, função `handleSign`

O PATCH para atualizar a solicitação como `CONCLUIDO` envia apenas `{ status, laudoTexto }`, mas a spec exige que `decision` e `restrictionNotes` também sejam enviados no body para que o backend possa popular o `AsoDocument` corretamente:

```typescript
// Atual
await apiUpdateSolicitacao(params.id, { status: 'CONCLUIDO', laudoTexto });

// Esperado (F1-REQ-006)
await apiUpdateSolicitacao(params.id, { status: 'CONCLUIDO', laudoTexto, decision, restrictionNotes });
```

Adicionalmente, o tipo de `apiUpdateSolicitacao` em `api.ts` precisa ser atualizado para aceitar esses campos opcionais:

```typescript
// api.ts — assinatura atual
async function apiUpdateSolicitacao(id: string, body: { status: string; laudoTexto?: string })

// api.ts — assinatura esperada
async function apiUpdateSolicitacao(id: string, body: {
  status: string;
  laudoTexto?: string;
  decision?: string;
  restrictionNotes?: string;
})
```

**Critério afetado:** implica em `AsoDocument.decision` nunca ser preenchido via frontend

---

#### F1 — Indicador de "atenção" para valores fora de faixa ausente

A spec (`F1-REQ-002`, `F1-AC-003`) exige indicar visualmente quando um resultado está fora da faixa normal — por exemplo, pressão sistólica > 140 = atenção. A tela renderiza os valores mas não aplica nenhuma lógica de comparação nem marcação visual.

**Correção sugerida:** Adicionar função `getExamStatus(typeName, key, value)` com regras básicas e aplicar classe/cor ao card do resultado.

---

#### F1 — Botão "Emitir ASO" não verifica se já existe AsoDocument

A spec (`F2-REQ-003`) exige desabilitar o botão quando a solicitação já está `CONCLUIDO` e já possui `asoDocuments`. O código não verifica `solicitacao.status === 'CONCLUIDO'` nem a existência de `asoDocuments[]` para desabilitar a ação de re-emissão.

---

## F2 — Histórico de Atendimentos do Médico

**Arquivo:** `app/medico/historico/page.tsx`

### ✅ O que está correto

- Página existe e busca dados reais via `apiGetMedicoSolicitacoes(doctorId)`.
- Tabela com colunas: paciente, CPF, tipo de exame, data, status, decisão ASO.
- Exibe decisão do ASO (`asoDocuments[0].decision`) com cores corretas.
- Botão "Ver Consulta" navega para `/medico/consulta/{id}`.

### ❌ Problemas encontrados

#### F2-REQ-002 — Filtros de status e data ausentes

A spec exige dois filtros: por status (`CONCLUIDO`, `EM_ATENDIMENTO_MEDICO`, todos) e por intervalo de data (7 dias / 30 dias / customizado). A tela não tem nenhum controle de filtro — exibe todas as solicitações sem possibilidade de refinamento.

**Critério afetado:** `F2-AC-002`

---

#### F2-REQ-004 — Item "Histórico" ausente na sidebar do médico

**Arquivo:** `app/medico/layout.tsx`

A sidebar do médico tem apenas dois itens: **Fila** e **Dashboard**. A spec exige adicionar o item **Histórico** apontando para `/medico/historico`.

```typescript
// Atual
const navItems = [
  { href: '/medico/fila', icon: HeartIcon, label: 'Fila' },
  { href: '/medico/dashboard', icon: ChartBarSquareIcon, label: 'Dashboard' },
];

// Esperado
const navItems = [
  { href: '/medico/fila', icon: HeartIcon, label: 'Fila' },
  { href: '/medico/historico', icon: ClockIcon, label: 'Histórico' },
  { href: '/medico/dashboard', icon: ChartBarSquareIcon, label: 'Dashboard' },
];
```

**Critério afetado:** `F2-AC-001` (a tela existe mas não está acessível pela navegação principal)

---

#### F2-REQ-003 — Modo leitura na tela de consulta não implementado

Quando a solicitação está `CONCLUIDO`, o botão "Emitir ASO" deve ser desabilitado e a decisão já registrada deve ser exibida com data e restrições. Link para download do PDF deve aparecer quando `pdfUrl` existir. Nenhum desses comportamentos está implementado.

**Critério afetado:** `F2-AC-003`, `F2-AC-004`, `F2-AC-005`

---

#### F2 — Histórico ainda usa campo de texto manual para ID do médico

Mesmo problema do F1: o histórico ainda pede o ID do médico via `<input>` manual em vez de reutilizar o `doctorId` já salvo via dropdown (quando F1-REQ-005 for corrigido, o ID ficará no `localStorage` e o histórico pode simplesmente lê-lo sem expor o campo ao usuário).

---

## F3 — Check-in Multi-tipo de Exame

**Arquivo:** `app/consultorio/check-in/page.tsx`

### ✅ O que está correto

- Lista de tipos de exame com campos dinâmicos existe (`EXAM_TYPES` array com `pa`, `audiometria`, `acuidade_visual`).
- Campos renderizados dinamicamente conforme o tipo selecionado.
- Fluxo de steps (patient → exams → confirm) implementado.

### ❌ Problemas encontrados

#### F3-REQ-001 / F3-REQ-002 — Tipos de exame estão hardcoded, não carregados do backend

A spec exige que os tipos de exame sejam carregados de `GET /api/exams/types` via `apiGetExamTypes()`. A função **não existe** em `api.ts` e a lista `EXAM_TYPES` é estática no componente. Isso viola o requisito de que exames obrigatórios sejam pré-marcados conforme o CBO.

**Critérios afetados:** `F3-AC-002`

---

#### F3-REQ-001 — Consulta de exames obrigatórios por CBO ausente

Ao preencher o campo `functionCboCode`, a spec exige chamar `GET /api/exams/required?cboCode=XXXX` e exibir alerta com os exames necessários. O componente não realiza nenhuma chamada ao preencher esse campo.

A função `apiGetRequiredExams(cboCode)` **não existe** em `api.ts`.

**Critério afetado:** `F3-AC-001`, `F3-AC-005`

---

#### F3-REQ-002 — Seleção de múltiplos exames por checkboxes ausente

A spec exige uma seção de checkboxes para selecionar múltiplos tipos de exame, com os obrigatórios pré-marcados e não desabilitáveis. O check-in atual tem apenas um `<select>` que permite escolher **um único tipo** por vez.

**Critério afetado:** `F3-AC-003`

---

#### F3-REQ-004 — Submissão não usa formato multi-resultado

O body enviado ao `POST /api/exams` usa o formato antigo `{ examRequestId, examType, valueJson }` com um único resultado. A spec (B3-REQ-003) define o novo formato `{ examRequestId, results: [{ examType, valueJson }] }` para suportar múltiplos exames. Enquanto o backend mantém compatibilidade retroativa, o frontend não aproveita a capacidade multi-exame.

**Critério afetado:** `F3-AC-004`

---

#### F3-REQ-003 — Tipos `peso_altura` e `glicemia` ausentes

A spec define campos para `peso_altura` (Peso kg, Altura cm) e `glicemia` (Valor mg/dL). O array `EXAM_TYPES` no componente não inclui esses dois tipos.

---

## F4 — Upload de Documentos da Empresa

**Arquivo:** `app/empresa/documentos/page.tsx`

### ✅ O que está correto

- Tela não é mais mock — realiza chamadas reais à API.
- Upload de arquivo via `multipart/form-data` com tipo (PCMSO/PPRA).
- Seções separadas por tipo de documento.
- Link de visualização/download do documento existente.
- Botão "Atualizar Documento" / "Enviar Documento" conforme estado.

### ❌ Problemas encontrados

#### F4-REQ-001 / F4-REQ-002 — Campo `validUntil` ausente no upload

A spec exige que o upload inclua a data de validade do documento (`validUntil`) para que o backend atualize `pcmsoValidUntil` / `ppraValidUntil` e calcule `isValid`. O formulário de upload atual envia apenas `file`, `companyId` e `type` — sem data de validade. Sem esse campo:

- O backend não consegue calcular `isValid`
- A empresa nunca transita para `status = LIBERADA`
- O job de verificação de vencimento (`B7-REQ-003`) não tem dado para trabalhar

**Critério afetado:** `B7-AC-003`, `F4-AC-002`

---

#### F4-REQ-001 — Status `isValid` / data de validade não exibidos

A spec exige exibir: status (válido ✅ / expirado ⚠️ / não enviado ❌) e data de validade de cada documento. A tela mostra apenas se o documento existe ou não, com badge fixo "Válido" sem verificar a data de expiração real. O endpoint deveria ser `GET /api/company/:id/documentos` retornando `{ isValid, validUntil }`, mas o código chama `GET /api/upload/documents/:companyId` — endpoint diferente da spec.

**Critério afetado:** `F4-AC-001`, `F4-AC-003`

---

#### F4-REQ-004 — Alerta de "próximo de vencer" ausente

A spec exige alerta visível quando documento está com validade < 30 dias ou vencido. Não implementado.

**Critério afetado:** `F4-AC-003`

---

#### F4-REQ-003 — Feedback de mudança de status da empresa após upload ausente

Após upload bem-sucedido, a spec exige refletir a mudança de status da empresa (ex: "Documentação completa — empresa liberada"). A tela apenas recarrega a lista de documentos.

---

## F5 — Configurações de Empresa

**Arquivo:** `app/empresa/configuracoes/page.tsx`

### ✅ O que está correto

- Carrega dados reais de `GET /api/company/:id`.
- Campos editáveis: nome fantasia, CEP, cidade, estado.
- CNPJ exibido como somente leitura (`disabled`).
- Toast de sucesso após salvar (`setSaved(true)`).

### ❌ Problemas encontrados

#### F5-REQ-001 — Método HTTP incorreto: `PUT` em vez de `PATCH`

O `handleSave` usa `method: 'PUT'`. A spec (B8-REQ-002) define `PATCH /api/company/:id`. O backend pode não ter o método `PUT` mapeado para esse endpoint.

```typescript
// Atual
method: 'PUT',

// Esperado
method: 'PATCH',
```

---

#### F5-REQ-001 — Campos `razaoSocial` e `address` ausentes do formulário

A spec define os seguintes campos editáveis: `razaoSocial`, `nomeFantasia`, `address`, `cep`, `city`, `state`. O formulário atual omite `razaoSocial` e `address`. O campo `status` da empresa também não é exibido (era esperado como somente leitura, F5-REQ-002).

---

#### F5-REQ-002 — Widget de status da empresa ausente

A spec exige exibir o `CompanyStatus` com cor e descrição (ex: `LIBERADA` = verde). Não implementado.

**Critério afetado:** `F5-AC-003`

---

#### F5-REQ-003 — Checklist de requisitos ausente

A spec exige consumir `GET /api/company/:id/status-check` e exibir checklist de PCMSO, PPRA e clínica atribuída. Não implementado.

**Critério afetado:** `F5-AC-003`

---

## F6 — Portal do Funcionário

**Arquivos:** `app/p/[token]/` (todas as rotas)

### ✅ O que está correto

- Estrutura de rotas completa: `/p/[token]`, `/processo`, `/confirmar`, `/documentos`, `/questionario`, `/teleconsulta`, `/aso`.
- Tela de validação de identidade: CPF com máscara, data de nascimento, sem campo de senha.
- `POST /api/portal/auth` com `{ token, cpf, birthDate }` correto.
- `sessionToken` armazenado em `sessionStorage` (não `localStorage`).
- Tela `/processo`: polling de 30 segundos via `setInterval`.
- Barra de progresso com etapas (Cadastro → Documentos → Questionário → Exames → Médico → ASO).
- Questionário wizard passo a passo com linguagem simples, barra de progresso interna, botão Voltar.
- Layout mobile-first, sem sidebar, sem header complexo.
- Redirecionamento para revalidação quando `sessionToken` expirado (`portal/layout.tsx`).

### ❌ Problemas encontrados

#### F6-F-REQ-002 — Tela de boas-vindas (primeira visita) ausente

A spec exige uma tela/modal de boas-vindas após autenticação bem-sucedida, exibindo: nome do funcionário, empresa, tipo do exame, prazo de conclusão e botão "Iniciar processo". O fluxo atual redireciona diretamente para `/processo` após o login sem nenhuma tela intermediária de onboarding.

**Critério afetado:** implica em UX sem contextualização inicial para o funcionário

---

#### F6-F-REQ-003 — Card de próxima ação não exibe endereço da clínica com link para Maps

A spec exige que, quando a próxima ação for `COMPARECER_CLINICA`, o endereço da clínica apareça com link para Google Maps. A tela `/processo` renderiza o endereço como texto simples (`clinica.endereco`) sem link.

---

#### F6-F-REQ-011 — Mensagem de token expirado não diferencia "link expirado" de "dados incorretos"

A tela de validação exibe mensagem genérica de erro. A spec exige mensagem específica para link expirado: "Este link não está mais disponível. Entre em contato com a empresa." A distinção deve vir do código HTTP/body da resposta do backend.

---

#### F6 — `middleware.ts` ausente

A spec lista `middleware.ts` como arquivo afetado para garantir que rotas `/p/*` fiquem fora da proteção de role padrão. O arquivo não existe no projeto. Se houver middleware de autenticação em outro ponto da aplicação, as rotas do portal podem ser bloqueadas indevidamente.

---

## Itens Faltantes em `api.ts`

Funções definidas na spec mas ausentes no arquivo `app/lib/api.ts`:

| Função | Endpoint | Feature |
|--------|----------|---------|
| `apiGetExamTypes()` | `GET /api/exams/types` | F3 |
| `apiGetRequiredExams(cboCode)` | `GET /api/exams/required?cboCode=` | F3 |
| `apiGetDocumentos(companyId)` | `GET /api/company/:id/documentos` | F4 |
| `apiUploadDocumento(companyId, formData)` | `POST /api/company/:id/documentos` | F4 |
| `apiGetCompanyStatusCheck(companyId)` | `GET /api/company/:id/status-check` | F5 |

---

## Tabela de Critérios de Aceite

| Critério | Descrição | Status |
|----------|-----------|--------|
| F1-AC-001 | Dados do paciente vêm do banco | ✅ |
| F1-AC-002 | Exames reais renderizados; fallback "Aguardando resultados" | ✅ |
| F1-AC-003 | Indicador de atenção para valores fora de faixa | ❌ Não implementado |
| F1-AC-004 | Loading spinner enquanto dados carregam | ✅ |
| F1-AC-005 | Fila com dropdown de médicos em vez de campo de texto | ❌ Não implementado |
| F2-AC-001 | `/medico/historico` lista atendimentos reais | ✅ |
| F2-AC-002 | Filtro por status funciona | ❌ Não implementado |
| F2-AC-003 | Solicitação CONCLUIDO exibe decisão do ASO | ✅ (na listagem) |
| F2-AC-004 | Modo leitura bloqueia re-emissão de ASO | ❌ Não implementado |
| F2-AC-005 | Link de download do PDF quando `pdfUrl` preenchido | ❌ Não implementado |
| F3-AC-001 | CBO preenche exames obrigatórios automaticamente | ❌ Não implementado |
| F3-AC-002 | Lista de exames carregada do backend | ❌ Hardcoded |
| F3-AC-003 | Campos mudam conforme tipos selecionados | ✅ (mas apenas um tipo por vez) |
| F3-AC-004 | Submissão cria múltiplos ExamResult | ❌ Envia um único resultado |
| F3-AC-005 | CBO sem mapeamento não bloqueia o check-in | ✅ (by omission) |
| F4-AC-001 | Tela mostra status correto de cada documento | ⚠️ Sem `isValid` real |
| F4-AC-002 | Upload de PCMSO via modal salva e exibe novo documento | ⚠️ Falta campo `validUntil` |
| F4-AC-003 | Alerta "próximo de vencer" para validade < 30 dias | ❌ Não implementado |
| F5-AC-001 | Formulário carrega dados atuais da empresa | ✅ |
| F5-AC-002 | Salvar atualiza dados e exibe confirmação | ⚠️ Usa PUT em vez de PATCH |
| F5-AC-003 | Checklist de requisitos exibe estado correto | ❌ Não implementado |
| F6-AC-006 | Tela de validação sem campo de senha | ✅ |
| F6-AC-007 | Barra de progresso reflete estado do processo | ✅ |
| F6-AC-008 | Polling de 30s atualiza proximaAcao sem recarregar | ✅ |
| F6-AC-012 | Layout funcional em mobile (375px) | ✅ |

---

## Priorização das Correções

### 🔴 Crítico — Bloqueiam funcionalidade core

1. **F1** — Dropdown de médicos na fila (`F1-REQ-005`) — sem isso o médico precisa saber seu próprio UUID
2. **F1** — `decision` + `restrictionNotes` no PATCH da solicitação (`F1-REQ-006`) — sem isso o `AsoDocument.decision` nunca é preenchido via frontend
3. **F3** — `apiGetExamTypes()` + carregamento dinâmico do backend — types hardcoded bloqueiam evolução do catálogo de exames
4. **F3** — Multi-seleção de exames + formato `results[]` na submissão — feature inteira funciona mas no modo "fase 2" (um exame por vez)

### 🟡 Alto — Requisitos explícitos não entregues

5. **F2** — Item "Histórico" na sidebar do médico (`F2-REQ-004`)
6. **F2** — Filtros de status e data no histórico (`F2-REQ-002`)
7. **F2** — Modo leitura na consulta quando CONCLUIDO (`F2-REQ-003`)
8. **F4** — Campo `validUntil` no upload de documentos (`F4-REQ-002`)
9. **F4** — Endpoint correto `GET /api/company/:id/documentos` com `isValid` real
10. **F5** — Método PATCH em vez de PUT (`F5-REQ-001`)
11. **F5** — Campos `razaoSocial` e `address` no formulário

### 🟢 Médio — UX e completude

12. **F1** — Indicador visual de valores fora de faixa nos exames
13. **F1** — Desabilitar "Emitir ASO" quando solicitação já CONCLUIDO
14. **F3** — Adicionar tipos `peso_altura` e `glicemia` ao array de exames
15. **F3** — Consulta de exames obrigatórios por CBO (`F3-REQ-001`)
16. **F4** — Alerta de "próximo de vencer" (< 30 dias)
17. **F4** — Feedback de mudança de status da empresa após upload
18. **F5** — Widget de status da empresa com cor e descrição
19. **F5** — Checklist de requisitos via `status-check`
20. **F6** — Tela de boas-vindas na primeira visita pós-auth
21. **F6** — Link Google Maps para endereço da clínica
22. **F6** — `middleware.ts` para proteção de rotas `/p/*`
23. **api.ts** — Adicionar as 5 funções ausentes listadas acima
