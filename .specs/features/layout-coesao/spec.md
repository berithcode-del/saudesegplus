# 📋 Especificação: Bloco B1 – Coesão de Layout

## Contexto
Refatorar o layout do app web (`apps/web`) para seguir padrões **clean, moderno e sofisticado**, alinhado ao nicho de medicina, usando como referência a [Image 1] (dashboard médico).

---

## Requisitos Funcionais (RF)

### **RF-01: Estrutura de Grid**
- Layout deve seguir **grid de 12 colunas** (desktop) e **pilha vertical** (mobile ≤ 768px).
- Margens: `24px` (desktop), `16px` (mobile).

### **RF-02: Paleta de Cores**
| Elemento          | Cor HEX   | Uso                                  |
|-------------------|-----------|--------------------------------------|
| Primária          | `#6B46C1` | Header, sidebar, botões principais   |
| Secundária        | `#3B82F6` | Accentos, links, ícones ativos        |
| Fundo              | `#F9FAFB` | Background do dashboard              |
| Texto principal   | `#1F2937` | Títulos e textos                      |
| Texto secundário  | `#6B7280` | Subtítulos, labels                    |
| Bordas/Card        | `#E5E7EB` | Divisores, bordas de cards            |

### **RF-03: Tipografia**
- Fonte: `Inter` (já instalada).
- Hierarquia:
  - **Títulos**: `font-bold`, `text-xl` (18–24px).
  - **Corpo**: `font-normal`, `text-sm` (14px) ou `text-base` (16px).
  - **Destaque**: `font-semibold`, cor `#1F2937`.

### **RF-04: Componentes Reutilizáveis**
- **Sidebar**: Fixa à esquerda (largura `250px`).
- **Header**: Topo com breadcrumb, avatar e nome do médico.
- **Card**: Elevação `shadow-sm`, bordas `rounded-lg` (8px), padding `16px`.

### **RF-05: Dashboard (Quadrantes)**
| Quadrante         | Posição       | Conteúdo                                                                 | Estilo                          |
|-------------------|---------------|--------------------------------------------------------------------------|---------------------------------|
| **Saudação**      | Topo esquerdo | Texto "Good Morning, [Nome]" + ilustração                              | Fundo branco, bordas `8px`      |
| **Agenda**        | Topo direito  | Calendário semanal (dias e horários)                                     | Card com cabeçalho roxo claro   |
| **Relatórios**    | Meio           | Cards para métricas (Total Patients, Phone Calls, Appointments, Mail)    | Grid de 4 colunas (desktop)     |
| **Tabela**        | Inferior       | Lista de agendamentos com colunas: Nome, Local, Data, Horário, Status   | Tabela com zebra-striping       |

---

## Requisitos Não Funcionais (RNF)

### **RNF-01: Responsividade**
- Mobile (≤ 768px):
  - Sidebar recolhe para ícones.
  - Grid vira pilha vertical.
  - Cards ocupam 100% da largura.

### **RNF-02: Acessibilidade**
- Contraste mínimo **4.5:1** (AA).
- Labels semânticos para todos os elementos interativos.
- Navegação por teclado (foco visível).

### **RNF-03: Performance**
- Ícones: SVG inline ou via `heroicons`.
- Imagens: Lazy loading + otimização (ex: `next/image`).
- Estilos: Usar `tailwindcss` (evitar CSS personalizado).

---

## Critérios de Aceite (CA)

### **CA-01: Componentes Implementados**
- `Sidebar`, `Header`, e `Card` criados e reutilizáveis.
- Props funcionais (ex: `Card` aceita `title`, `icon`, `children`).

### **CA-02: Dashboard Funcional**
- Quadrantes renderizam corretamente em desktop (1280px+) e mobile.
- Dados mockados exibidos (ex: agenda, relatórios).

### **CA-03: Consistência Visual**
- Paleta de cores aplicada em todos os componentes.
- Tipografia respeita hierarquia.
- Espaçamentos padronizados (`8px`, `16px`, `24px`).

### **CA-04: Testes Automatizados**
- Validação de acessibilidade (ferramenta como `axe-core`).
- Responsividade testada em breakpoints `375px`, `768px`, `1280px`.

---

## Referências
- [Image 1]: Dashboard médico moderno.
- Biblioteca de ícones: [Heroicons](https://heroicons.com/).
- Framework: `tailwindcss` (já configurado no projeto).