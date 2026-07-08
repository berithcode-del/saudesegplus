# Política de Design System — SaúdeSeg+

## 1. Princípio central

**Existe uma única fonte de cor/espaçamento/sombra: as CSS variables em `app/globals.css` (`:root`).**
Nenhum componente de dashboard deve usar cor Tailwind genérica (`gray-900`, `indigo-600` etc.) — sempre `var(--accent-primary)`, `var(--text-primary)`, ou a classe utilitária que já embrulha esses tokens (`.card`, `.stat-card`, `.badge-*`, `.queue-table`).

Motivo: hoje existiam dois sistemas paralelos (classes legadas `.card`/`.badge`/`.queue-table` vs. componentes novos em Tailwind cinza puro). Isso é o que fazia o dashboard do médico parecer "sem cor" mesmo com a paleta UiMed já definida.

## 2. Componentes-base (`components/ui/`)

| Componente | Responsabilidade | Classe CSS que encapsula |
|---|---|---|
| `Card` | Container padrão com header opcional (ícone+título) | `.card` |
| `MetricCard` | Card de métrica: ícone com badge colorido + número grande | `.stat-card`, `.stat-icon-*` |
| `StatusBadge` | Pílula de status de Solicitação/ASO — única fonte de verdade do mapeamento status→label→cor | `.badge`, `.badge-*` |
| `DataTable` | Tabela genérica (colunas + linhas + render por célula) | `.queue-table` |

**Regra:** qualquer tela nova de empresa/médico/clínica que precise de card de número, tabela ou badge de status **usa esses componentes**, nunca reimplementa estilo inline.

## 3. Componentes de dashboard (`components/dashboard/`)

Hoje específicos do médico, mas construídos para reuso:

- `GreetingSection` — card de boas-vindas com ilustração SVG mocada
- `ScheduleCalendar` — calendário mensal com indicador de dia com agendamento e pill no dia atual
- `WeeklyReports` — grid de `MetricCard`
- `AppointmentsTable` — `DataTable` + `StatusBadge` aplicados a Solicitações

Quando o dashboard de Empresa e de Clínica forem migrados pro fluxo real, eles devem **importar esses mesmos componentes**, passando dados diferentes — não duplicar a UI.

## 4. Mapeamento de status (única fonte de verdade)

Vive em `components/ui/StatusBadge.tsx`. Se um novo status de `Solicitacao` for criado no backend, ele entra **só ali** (e na classe `.badge-*` correspondente em `globals.css`, se precisar de cor nova). Nenhuma outra tela deve ter seu próprio dicionário de status.

| Status (backend) | Label exibido | Classe |
|---|---|---|
| `AGUARDANDO_COLETA` | Aguardando Coleta | `.badge-waiting` (âmbar) |
| `EM_COLETA` | Em Coleta | `.badge-info` (azul/teal) |
| `NA_FILA_MEDICA` | Na Fila Médica | `.badge-queued` (violeta) |
| `EM_ATENDIMENTO_MEDICO` | Em Atendimento | `.badge-in-progress` (roxo primário) |
| `CONCLUIDO` | Concluído | `.badge-done` (verde) |
| `CANCELADO` | Cancelado | `.badge-cancelled` (vermelho) |

## 5. Cores de ícone do `MetricCard`

4 variantes disponíveis, sempre nessa ordem de uso preferencial pra manter ritmo visual: `purple` (métrica principal/total) → `orange` (atenção/em andamento) → `teal` (informativo) → `green` (sucesso/concluído).

## 6. O que falta padronizar (próximos passos)

1. Migrar `app/medico/dashboard/page.tsx` para usar `DataTable`/`StatusBadge` na tabela "Minhas Solicitações" (hoje ainda tem `<table className="queue-table">` montada à mão).
2. Construir/migrar dashboards de Empresa e Clínica reusando `MetricCard`, `DataTable`, `ScheduleCalendar`, `StatusBadge`.
3. Avaliar se cabe um `ChartCard` (gráfico de barras estilo UiMed) pra alguma métrica — só criar se houver caso de uso real, não por simetria com a referência.
4. Adicionar testes (`.test.tsx`) pros 3 novos componentes-base, seguindo o padrão já usado nos arquivos `*.test.tsx` existentes.
