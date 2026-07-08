# CHANGELOG — Padronização de Design System (Dashboards)

## Contexto
O dashboard do médico estava usando dois sistemas de estilo diferentes ao mesmo tempo: as classes legadas em `globals.css` (`.card`, `.stat-card`, `.badge-*`, `.queue-table` — já alinhadas à paleta UiMed) e componentes novos em `components/dashboard/*` que usavam Tailwind cinza genérico (`bg-white`, `text-gray-900`, `text-indigo-600`). Por isso a tela não batia visualmente com a referência, mesmo a paleta certa já existindo no projeto.

## Arquivos novos
- `components/ui/MetricCard.tsx` — card de métrica (ícone + número), usado pelo `WeeklyReports`.
- `components/ui/StatusBadge.tsx` — única fonte de verdade pro mapeamento status→label→cor das Solicitações. Substitui o dicionário `STATUS_LABEL` que existia só dentro do `AppointmentsTable`.
- `components/ui/DataTable.tsx` — tabela genérica reutilizável (colunas + render por célula).
- `design-system.md` — política de design documentando os componentes-base, quando usar cada um, e o que falta padronizar.

## Arquivos modificados
- `app/globals.css` — adicionadas duas variantes de badge que faltavam (`.badge-info`, `.badge-queued`) pra diferenciar os 5 estágios de uma Solicitação sem colapsar todos em "in-progress".
- `components/ui/Card.tsx` — trocado de `bg-white border-gray-200` (Tailwind genérico) pra usar a classe `.card` + tokens (`var(--text-primary)`, `var(--border-light)` etc.).
- `components/dashboard/WeeklyReports.tsx` — agora monta `MetricCard` em vez de `Card` com `<p className="text-2xl font-bold text-gray-900">` solto.
- `components/dashboard/AppointmentsTable.tsx` — agora usa `DataTable` + `StatusBadge` em vez de `<table className="min-w-full divide-y divide-gray-200">` montada à mão com cores hardcoded (`#f59e0b`, `#3b82f6` etc.).
- `components/dashboard/GreetingSection.tsx` e `components/dashboard/ScheduleCalendar.tsx` — cores e classes trocadas pelos tokens (`var(--accent-primary)`, `var(--text-secondary)` etc.) no lugar de `text-gray-*`/`text-indigo-*`.

## Nenhum arquivo foi excluído
Não há órfãos nesta entrega — os arquivos modificados continuam com o mesmo nome/path, só o conteúdo interno mudou.

## Pendente para a próxima entrega
Ver seção 6 do `design-system.md`: migrar a tabela manual de `app/medico/dashboard/page.tsx` pro `DataTable`, e levar esses mesmos componentes pro dashboard de Empresa e de Clínica quando esses fluxos virarem reais.
