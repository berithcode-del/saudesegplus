# Plano de Feature: Tutoriais de Ações (Product Tour / Onboarding)

> Status: 🔄 Rascunho inicial (estruturação)
> Autor: opencode
> Data: 2026-07-07

## 1. Visão Geral

Feature de **onboarding guiado** e **central de tutoriais** para a plataforma web (Next.js 16).

- Ao criar a conta e a plataforma carregar, abre um **tour de boas-vindas** automático.
- O tour é uma **janela branca de cantos arredondados** ancorada aos elementos principais da tela, com **setas de avançar/voltar**, indicador de progresso e botão "Pular".
- Existem **3 variantes de tour** por perfil: **Empresa**, **Clínica** e **Médico**.
- Após o onboarding, os tutoriais permanecem acessíveis em **Configurações**, onde cada grupo pode **re-assistir o tour** e consultar uma **lista de passos / FAQ** para tirar dúvidas.

### Decisões já confirmadas (brainstorming)
| Tópico | Decisão |
|--------|---------|
| Plataforma | Só **Web (Next.js)** |
| Motor do tour | **Componente custom** no pacote `@repo/ui` |
| Estado + textos | **Backend (NestJS API + tabelas)** |
| Configurações | **Re-assistir + FAQ** (conteúdo estático por perfil, servido pelo backend) |

## 2. Arquitetura

```
┌─────────────────────────────────────────────┐
│  apps/web (Next.js 16, React 19, Tailwind v4) │
│                                               │
│  app/<perfil>/...  (empresa, consultorio,     │
│       medico)                                 │
│    └── <Elemento>.tsx  com data-tour="id"     │
│                                               │
│  components/                                  │
│    └── TutorialLauncher (decide se abre auto) │
│                                               │
│  lib/api.ts  ── fetch tutorials/profile       │
│                                               │
│  usa @repo/ui:                                 │
│    ├── <TourProvider>  (contexto + estado)    │
│    ├── <TourPopover>   (janela branca)        │
│    ├── <TourStepDots>  (progresso)            │
│    └── useTour() / useTourStep() (hooks)      │
└───────────────────┬───────────────────────────┘
                    │ REST
                    ▼
┌─────────────────────────────────────────────┐
│  apps/backend (NestJS)                        │
│   ├── tutorials/                              │
│   │    Tutorial entity (perfil, steps JSON)   │
│   │    GET /tutorials/:perfil                 │
│   └── tutorial-progress/                      │
│        TutorialProgress entity (user, perfil) │
│        POST /tutorials/:perfil/complete       │
│        GET  /me/tutorial-progress             │
└─────────────────────────────────────────────┘
```

## 3. Backend (NestJS)

Novo módulo `tutorials` (e sub-entidade `tutorial-progress`).

### 3.1 Entidades
- **Tutorial**
  - `id`
  - `perfil` (enum: `EMPRESA | CLINICA | MEDICO`)
  - `titulo` (ex: "Bem-vindo à SaudeSeg+")
  - `steps: JSON` — array de `{ id, titulo, texto, anchorSelector, posicao }`
  - `faq: JSON` — array de `{ pergunta, resposta }`
  - `ativo: boolean`
- **TutorialProgress**
  - `id`, `userId`, `perfil`, `completedAt`

### 3.2 Endpoints
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/tutorials/:perfil` | Retorna tour + FAQ do perfil (usado no onboarding e em configurações) |
| `GET` | `/me/tutorial-progress` | Retorna se o usuário já completou/pulou o tour |
| `POST` | `/tutorials/:perfil/complete` | Marca como visto (body: `{ skipped: boolean }`) |

### 3.3 Regras
- Conteúdo é **seedado por perfil** (admin não edita nesta fase).
- O tour automático só abre se `tutorial-progress` não existir para o usuário/perfil.

## 4. Frontend — Componente `@repo/ui`

Criar em `packages/ui/src/`:
- `tour/tour-provider.tsx` — contexto global, carrega tutorial do perfil, gerencia step atual, `next/prev/skip/complete`. Agora com inteligência de rotas (`next/navigation`): se o próximo passo exigir uma página diferente, ele navega (via `router.push(route)`) automaticamente.
- `tour/tour-popover.tsx` — Janela adaptável: 
  1. Se tiver `anchorSelector`: uma janela estilo popover, ancorada aos elementos, com "spotlight" (fundo com buraco) no elemento.
  2. Se NÃO tiver `anchorSelector`: age como um **Modal Central de Boas Vindas**, com fundo escurecido total, suporte a ilustrações maiores e textos estendidos.
- `tour/tour-step-dots.tsx` — indicador de progresso (ex: "1 de 5").
- `tour/tour-nav.tsx` — botões **Voltar** / **Avançar** (setas via `@heroicons/react`).
- `tour/use-tour.ts` — hook de consumo.
- `tour/index.ts` — barrel export.

### Comportamento da janela
- Branca, `rounded-2xl`, sombra suave, setas ◀ ▶.
- Posicionamento: calcula retângulo do `anchorSelector` e coloca o popover no lado indicado (`posicao`). Se não houver, fica `50% 50%` (centro).
- Fecha com ESC e com clique fora (no overlay).
- Acessível: `role="dialog"`, foco preso, `aria-live` para o texto.

## 5. Integração nas áreas por perfil

Em cada área, os elementos-chave recebem `data-tour="<id>"` (âncoras passivas, o popover busca no DOM).

| Perfil | Área (`app/`) | Passos sugeridos do tour (Agora suportam `route: string`) |
|--------|--------------|--------------------------|
| Empresa | `/empresa` | Boas-vindas (Centro) → Meu painel → Colaboradores → Solicitações de exame → Configurações |
| Clínica | `/consultorio` | Boas-vindas (Centro) → Check-in → Pacientes → Exames → Financeiro |
| Médico | `/medico` | Boas-vindas (Centro) → Fila de consultas → Consulta → Histórico → Configurações |

### Launcher automático
- `components/TutorialLauncher.tsx` (client) montado no layout do perfil.
- No carregamento: busca `GET /me/tutorial-progress`; se não completo, busca `GET /tutorials/:perfil` e abre `<TourProvider>` no step 0.

## 6. Configurações (re-assistir + FAQ)

- **Empresa**: `app/empresa/configuracoes`
- **Médico**: `app/medico/configurac`
- **Clínica**: criar `app/consultorio/configuracoes` (ou adicionar seção em área existente)

Adicionar bloco **"Tutoriais e Dúvidas"**:
- Botão **"Refazer tutorial de boas-vindas"** → reabre o tour.
- Lista de **FAQ** (pergunta/resposta) vinda de `GET /tutorials/:perfil` (campo `faq`).
- Itens expansíveis (accordion) usando componente de `card` já existente em `@repo/ui`.

## 7. Conteúdo dos tutoriais (seed)

Definir JSON de steps + FAQ por perfil (textos reais a produzir com o product owner). Estrutura exemplo:
```json
{
  "perfil": "EMPRESA",
  "titulo": "Bem-vindo à SaudeSeg+",
  "steps": [
    { "id": "painel", "titulo": "Seu painel", "texto": "...", "anchorSelector": "[data-tour='painel']", "posicao": "bottom" }
  ],
  "faq": [ { "pergunta": "...", "resposta": "..." } ]
}
```

## 8. Critérios de Aceitação

- [ ] Tour abre automaticamente no 1º login de cada perfil.
- [ ] Não abre mais após `complete` (mesmo recarregando).
- [ ] Popover: branco, cantos arredondados, setas avançar/voltar, ESC fecha, foco preso.
- [ ] 3 variantes distintas (empresa/clínica/médico) com âncoras reais.
- [ ] Configurações de cada perfil tem "refazer tutorial" + FAQ.
- [ ] Acessível (teclado, aria) e responsivo.
- [ ] Testes: `use-tour` (estado next/prev/skip) em `apps/web` (Jest) e type-check do `@repo/ui`.

## 9. Ordem de implementação (tarefas)

1. **Backend**: módulo `tutorials` (entities, seed dos 3 perfis, endpoints GET/POST progress).
2. **@repo/ui**: `TourProvider`, `TourPopover`, `TourStepDots`, `TourNav`, `useTour`.
3. **Web**: `lib/api.ts` (helpers de fetch) + hook `useTutorial(perfil)`.
4. **Web**: `TutorialLauncher` + âncoras `data-tour` nas 3 áreas.
5. **Web**: bloco de Configurações (refazer + FAQ) nos 3 perfis.
6. **Testes** + lint + `check-types` em `@repo/ui` e `apps/web`.
7. **Validação** manual: cada perfil abre tour, completa, e5reabre em configurações.

## 10. Próximos passos sugeridos
- Validar os **textos reais** dos steps/FAQ com o product owner (issue de conteúdo).
- Confirmar se clínica terá rota própria de configurações ou reaproveita `/consultorio`.
- Decidir ícone/ilustração da tela de boas-vindas (usar `Logo.svg` do `@repo/ui`?).
