# Pacote de Atualização — Frontend (Web) — Fase 2 + UI

Cole estes arquivos nos mesmos caminhos da pasta `web/` original (sobrescrevendo
os existentes). Arquivos novos: `app/colaboradores/*`, `app/medico/fila/*`.

---

## 1. Fluxo de cadastro do colaborador — estava quebrado (bloqueador da Fase 2)

A página de cadastro via convite vivia em `pages/colaboradores/signup/` (Pages
Router antigo), enquanto o resto do projeto usa só App Router. Além disso:

- `pages/colaboradores/signup/index.jsx` redirecionava para
  `/colaboradores/signup?token=...` — ou seja, **a própria rota redirecionava
  para si mesma** (loop sem efeito).
- `InviteSignupPage.jsx` enviava `{ token, name, email, cpf, password }` para
  `POST /api/colaboradores`. O backend (corrigido na Fase 2) só aceita
  `{ token, name, password }` — e agora com `ValidationPipe({
  forbidNonWhitelisted: true })`, enviar `email`/`cpf` faz a requisição inteira
  ser rejeitada com 400. (E-mail e CPF já vêm do convite criado pela empresa —
  não fazem sentido sendo digitados de novo.)
- Após cadastrar, redirecionava para `/empresa/solicitacoes` — o painel
  **interno da empresa**, não uma tela do colaborador. Não existia nenhuma
  página para o colaborador ver o status da própria solicitação (F2-REQ-015).
- Dependia de `@repo/ui` (Material-UI-like), pacote não usado em nenhum outro
  lugar do projeto e não listado nas dependências reais.

**Corrigido**: nova página em `app/colaboradores/signup/page.tsx` (App
Router), enviando só os 3 campos esperados, com erro real do backend exibido,
e redirecionando para a nova `app/colaboradores/status/page.tsx`, que lista as
solicitações do colaborador via `GET /api/colaboradores/:id/solicitacoes`.

**Ação manual necessária**: apague a pasta `pages/` inteira — ela só continha
esse fluxo quebrado e não é referenciada por mais nada.

## 2. `apiGetQueue` enviava o `doctorId` num header que o backend nunca lia

```ts
// antes
fetch(`${BACKEND_URL}/api/queue`, { headers: { 'X-Doctor-Id': doctorId } })
```
O backend (mesmo já corrigido na Fase 2 para não usar `@Body()` num GET) lê
`doctorId` via query string. Corrigido para
`/api/queue?doctorId=...` em `app/lib/api.ts`.

## 3. Médico não tinha nenhuma tela real — caía num template de demonstração

`/medico` redirecionava para `/medico/dashboard`, que renderizava
`GreetingSection`/`ScheduleCalendar`/`WeeklyReports`/`AppointmentsTable` — um
template de admin genérico, em inglês, com dados 100% fixos ("David Loid",
"Dr. Smith", links para `/medico/pacientes`, `/medico/agenda` que não
existem). Não consumia o backend em nenhum ponto, violando diretamente
F2-AC-005 (`AppointmentsTable` deveria exibir dados reais).

Como esses componentes (`components/dashboard/*`, `components/layout/Header.tsx`,
`components/layout/Sidebar.tsx`, `components/ui/Card.tsx`) pertenciam a um
segundo design system desconectado (Tailwind genérico) que não combina com o
resto do app (tema roxo/arredondado já usado em empresa/consultório), a opção
mais sã foi **substituir a tela**, não tentar "religar" dados reais num
template que nem visualmente pertence ao produto.

**Corrigido**: `/medico` agora vai para `/medico/fila` (nova página), que
consome `GET /api/queue` e `POST /api/queue/:id/accept` de verdade — ambos já
existiam em `app/lib/api.ts`, mas nunca eram chamados de lugar nenhum. O
layout do médico (`app/medico/layout.tsx`) passou a usar o mesmo `app-shell`
roxo das outras áreas, em vez do Sidebar/Header em inglês.

**Limitação conhecida (sem solução neste pacote)**: como a Fase 2 não inclui
autenticação, a fila precisa que o operador informe manualmente o `ID do
médico` (igual ao painel da empresa, que hoje usa a primeira empresa
cadastrada como atalho). Não existe endpoint para listar médicos
(`GET /api/medicos`) — recomendo essa pequena adição no backend se quiser
eliminar esse campo manual.

**Arquivos órfãos recomendados para exclusão** (substituídos pela fila real,
sem mais nenhum ponto de uso): `app/medico/dashboard/page.tsx`,
`components/dashboard/` (e seus `.test.tsx`), `components/layout/Header.tsx`,
`components/layout/Sidebar.tsx` (e `.test.tsx`), `components/ui/Card.tsx` (e
`.test.tsx`). Junto, dá pra remover `@heroicons/react` e `@repo/ui` do
`package.json` se nada mais os referenciar.

## 4. Tela de consulta do médico chamava o próprio Next.js, não o backend

```ts
// antes — caminho relativo: bate em localhost:3000 (Next), não :3001 (Nest)
fetch('/api/signature/generate', ...)
fetch('/api/aso/generate', ...)
```
Corrigido para usar `BACKEND_URL` (`app/medico/consulta/[id]/page.tsx`). Além
disso, ao concluir a assinatura, a tela agora chama
`PATCH /api/solicitacoes/:id` (novo endpoint da Fase 2) para gravar o status
`CONCLUIDO` e o laudo simplificado — antes nada disso era persistido, então
empresa e colaborador nunca veriam a conclusão real do exame (F2-REQ-014).

> Os dados do paciente e dos exames nesta tela continuam mocados
> (`MOCK_EXAMS`, "Carlos Mendes") — buscar os dados reais via
> `GET /api/solicitacoes/:id` é o próximo passo natural, mas decidi não
> empacotar isso agora para manter este pacote revisável; o endpoint já
> existe e pronto para ser consumido (`apiGetSolicitacao` em `app/lib/api.ts`).

## 5. Formulário de nova solicitação não marcava CPF/e-mail como obrigatórios

`app/empresa/solicitacoes/page.tsx`: o backend sempre exigiu CPF e e-mail
esperados para o convite funcionar (são eles que identificam o colaborador no
cadastro), mas os campos não tinham `required`, e o nome digitado
(`collaboratorName`) nunca era enviado no corpo da requisição. Corrigido.

## 6. UI — alinhamento com a referência visual (UiMed)

- `app/globals.css`: o `app-shell` agora "flutua" com margem sobre o fundo
  lavanda e cantos bem arredondados (28px), como no painel de referência — em
  vez de ocupar a tela ponta a ponta. A sidebar deixou de ser `position:
  fixed` (incompatível com esse efeito) e passou a fazer parte do fluxo
  flex normal.
- **Encaixe arredondado sidebar↔card (ajuste fino pedido depois)**: na
  referência, a sidebar não é só um retângulo colado ao card — ela é um
  bloco roxo com cantos 100% arredondados que avança *por cima* do card
  branco, criando um recorte côncavo (efeito "peça de quebra-cabeça") no
  topo e na base do encaixe. Implementado com `.sidebar` agora sendo um
  elemento independente (`border-radius: 28px` nos 4 cantos,
  `margin-right: -28px` para sobrepor o card) e dois pseudo-elementos
  (`::before`/`::after`) que pintam um quarto de círculo na cor do fundo da
  página exatamente na junção — é o truque clássico de "canto invertido" em
  CSS puro (radial-gradient), sem imagem. `main-content` ganhou padding
  extra à esquerda (`56px`) para o conteúdo não ficar embaixo da sidebar.
  Como não tenho como renderizar o Next.js aqui para conferir pixel a pixel,
  vale um ajuste fino dos números (`28px` de raio/overlap) com o app
  rodando de verdade.
- Itens de navegação no modo recolhido agora são círculos (como os ícones da
  referência), com o item ativo em destaque branco sólido.
- Ícones de estatística (`stat-icon-wrap`) e busca do topo (`topbar-search`)
  ficaram totalmente arredondados (pill), batendo com a referência.
- `app/medico/consulta/[id]/page.tsx` e `app/consultorio/check-in/page.tsx`
  tinham cores de um tema escuro remanescente (`#8892b0`, `#e8eaf6`,
  `rgba(255,255,255,0.07)` em bordas) aplicadas sobre cards brancos —
  resultado: texto e bordas quase invisíveis. Substituídas pelas variáveis do
  tema claro já usadas no resto do app (`var(--text-secondary)`,
  `var(--text-primary)`, `var(--border-light)`). Mesmo ajuste em
  `app/consultorio/page.tsx` e `app/consultorio/exames/[id]/page.tsx`.

## Não alterado (mocado por decisão de escopo da própria Fase 2)

- `app/empresa/documentos/page.tsx` e `app/empresa/configuracoes/page.tsx`:
  spec.md exclui upload real de documentos da Fase 2 (Fase 3) — corretamente
  mocados, não toquei.
- `app/consultorio/page.tsx`, `check-in/page.tsx`, `exames/[id]/page.tsx`:
  continuam com dados mocados (fila de exemplo, paciente "Carlos Mendes",
  envio simulado com `setTimeout`). Diferente do médico, aqui não há um
  "template desconectado" para substituir — é uma tela real só ainda não
  ligada ao backend. Não wireei agora para manter este pacote revisável;
  precisa de: `POST` para criar `Patient`/`ExamRequest` no check-in, e
  `POST /api/exam-results` (ainda não existe no backend — é mock fixo em
  `exams.service.ts`, fora do escopo da Fase 2 conforme a própria spec).

## Arquivos neste pacote

```
app/globals.css
app/lib/api.ts
app/colaboradores/signup/page.tsx          (novo)
app/colaboradores/status/page.tsx          (novo)
app/empresa/solicitacoes/page.tsx
app/medico/layout.tsx
app/medico/page.tsx
app/medico/fila/page.tsx                   (novo)
app/medico/consulta/[id]/page.tsx
app/consultorio/page.tsx
app/consultorio/check-in/page.tsx
app/consultorio/exames/[id]/page.tsx
```

## Recomendado excluir (fora deste pacote, são exclusões e não arquivos)

```
pages/                                  (fluxo de cadastro antigo, quebrado)
app/medico/dashboard/page.tsx
components/dashboard/                   (+ .test.tsx)
components/layout/Header.tsx            (+ .test.tsx)
components/layout/Sidebar.tsx           (+ .test.tsx)
components/ui/Card.tsx                  (+ .test.tsx)
```
