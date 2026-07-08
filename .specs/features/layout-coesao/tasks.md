# 📋 Tarefas: Bloco B1 – Coesão de Layout

## Contexto
Implementar a reestruturação do layout do app web (`apps/web`) conforme specs (`spec.md`) e design (`design.md`).

---

## Tarefas Atômicas

### **Frontend**

#### **TASK-01: Criar componente `Sidebar`**
- **Descrição**: Criar componente `Sidebar` em `apps/web/components/layout/Sidebar.tsx`.
  - Links: Dashboard, Patients, Calendar, Reports.
  - Avatar do médico mockado.
- **Critérios de Aceite**:
  - Renderiza sem erros em desktop/mobile.
  - Links funcionais (simular navegação).
  - Estilos aplicados conforme design.

---

#### **TASK-02: Criar componente `Header`**
- **Descrição**: Criar componente `Header` em `apps/web/components/layout/Header.tsx`.
  - Conteúdo: Search, breadcrumb, avatar + nome.
- **Critérios de Aceite**:
  - Search bar funcional (sem backend).
  - Avatar exibido corretamente.

---

#### **TASK-03: Criar componente `Card`**
- **Descrição**: Criar componente reutilizável `Card` em `apps/web/components/ui/Card.tsx`.
  - Props: `title`, `icon`, `children`, `footer`.
- **Critérios de Aceite**:
  - Aceita todas as props sem erros.
  - Estilos aplicados (shadow, border-radius).

---

#### **TASK-04: Criar componente `GreetingSection`**
- **Descrição**: Componente para quadrante de saudação (`apps/web/components/dashboard/GreetingSection.tsx`).
  - Ilustração SVG estática.
- **Critérios de Aceite**:
  - Texto dinâmico (`Dr. {name}`).
  - Responsivo (4 colunas desktop).

---

#### **TASK-05: Criar componente `ScheduleCalendar`**
- **Descrição**: Calendário semanal em `apps/web/components/dashboard/ScheduleCalendar.tsx`.
  - Dados mockados (ex: 25 Jun marcada).
- **Critérios de Aceite**:
  - Navegação entre meses.
  - Dia atual destacado.

---

#### **TASK-06: Criar componente `WeeklyReports`**
- **Descrição**: Grid de cards para métricas (`apps/web/components/dashboard/WeeklyReports.tsx`).
  - Cards: Total Patients, Phone Calls, Appointments, Unread Mail.
- **Critérios de Aceite**:
  - Valores mockados exibidos.
  - Grid responsivo (4 colunas desktop).

---

#### **TASK-07: Criar componente `AppointmentsTable`**
- **Descrição**: Tabela de agendamentos (`apps/web/components/dashboard/AppointmentsTable.tsx`).
  - Colunas: Nome, Local, Data, Horário, Status.
- **Critérios de Aceite**:
  - Zebra-striping aplicado.
  - Status com badges coloridos.

---

#### **TASK-08: Integrar componentes na página `/medico`**
- **Descrição**: Reestruturar `apps/web/app/medico/page.tsx` para usar os novos componentes.
  - Grid conforme design (desktop/mobile).
- **Critérios de Aceite**:
  - Dashboard renderiza sem erros.
  - Responsividade testada.

---

### **Testes**

#### **TASK-09: Testar responsividade**
- **Descrição**: Verificar layout em breakpoints `375px`, `768px`, `1280px`.
  - Corrigir overlaps ou quebras.
- **Critérios de Aceite**:
  - Sem elementos sobrepostos.
  - Conteúdo legível em mobile.

---

#### **TASK-10: Validar acessibilidade**
- **Descrição**: Usar `axe-core` ou `eslint-plugin-jsx-a11y` para validar acessibilidade.
  - Corrigir issues detectados.
- **Critérios de Aceite**:
  - Contraste mínimo 4.5:1.
  - Labels semânticos para inputs.

---

## Critérios de Aceite Gerais
- [ ] Todos os componentes implementados e reutilizáveis.
- [ ] Dashboard funcional em desktop/mobile.
- [ ] Paleta de cores aplicada consistentemente.
- [ ] Testes de responsividade e acessibilidade aprovados.