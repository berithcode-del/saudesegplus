# Plano Estruturado — App Mobile Dedicado (`apps/mobile`)

**Contexto analisado:** Backend NestJS (`backend/`) com módulos `auth`, `colaborador`, `medicos`, `portal`, `queue`, `teleconsultation`, `exam-request`, `aso`, `anamnese`, `calendar`, `company`, `clinic-profile`, `financial`, `support` sobre Prisma/PostgreSQL, com `enum Role { ADMIN, OPERATOR, DOCTOR, PATIENT, COMPANY_ADMIN, CLINIC }`. Frontend `web` em Next.js 14 (App Router), já preparado para monorepo (depende de `@repo/ui`, `@repo/eslint-config`, `@repo/typescript-config` via workspace), com client HTTP artesanal em `app/lib/api.ts` (fetch + `localStorage.token` + Socket.IO).

Isso confirma que o projeto **já vive dentro de um monorepo** (provavelmente Turborepo/pnpm ou npm workspaces) — o zip do front é o conteúdo de `apps/web`. Isso é uma vantagem: criar `apps/mobile` é extensão natural, não uma refundação.

---

## 0. Decisão de arquitetura (recomendação)

**Vite + React (SPA), não Next.js `output: export`.**

| Critério | Next.js export | Vite + React SPA |
|---|---|---|
| Rotas dinâmicas por token (`/p/[token]/...`) | Suportado, mas exige cuidado (sem middleware, sem SSR) | Suportado nativamente via `react-router` |
| Tamanho de bundle / boot mobile | Maior (runtime Next mesmo em export) | Menor, mais previsível |
| Uso de `localStorage`/APIs de browser (câmera, geolocalização) | Precisa `'use client'` em tudo | Nativo, sem fricção |
| Caminho para app nativo (Capacitor/Expo wrapper) | Possível, mas Next-export tem restrições conhecidas com Capacitor (roteamento de assets) | Caminho consolidado e documentado |
| Reuso de `@repo/ui`, tipos e DTOs | Igual | Igual |
| Curva/esforço de setup | Menor no início (já conhecem Next) | Ligeiramente maior no início, menor atrito depois |

Como o app mobile é **PWA-first hoje** e **candidato a app nativo amanhã** (push notifications, câmera para documentos, deep link do token enviado por SMS/WhatsApp), Vite evita reescrever depois. Se a equipe preferir manter tudo em Next.js por familiaridade, a alternativa `output: export` funciona igualmente bem — o restante do plano não muda, só o Passo 1.

---

## Passo 1 — Preparar o monorepo para reuso real

Hoje o reuso entre `web` e o futuro `mobile` é zero fora do `@repo/ui`. Antes de criar o app, extrair para pacotes compartilhados:

- **`packages/api-types`** — DTOs e enums espelhados do backend (`Role`, `CompanyStatus`, `InviteStatus`, tipos de request/response de `colaborador`, `medicos`, `portal`, `queue`, `teleconsultation`, `aso`, `anamnese`). Gerados manualmente por ora; considerar depois `zod`/`ts-rest`/OpenAPI para gerar automaticamente do NestJS (Swagger `@nestjs/swagger` + `openapi-typescript`).
- **`packages/api-client`** — camada HTTP única (fetch wrapper com `Authorization: Bearer`, tratamento de erro padronizado, base URL configurável por env) + o hook `useQueue`/Socket.IO, hoje duplicado/implícito em `app/lib/api.ts` e `lib/api.ts` do `web`. Extrair a lógica pura (sem `localStorage` direto) e injetar o storage como dependência, porque mobile pode usar `Capacitor Preferences`/`SecureStorage` em vez de `localStorage`.
- **`packages/ui`** (já existe) — auditar quais componentes são genéricos o suficiente para funcionar em telas pequenas sem retrabalho, e quais são "web-only" (grids largos, tabelas densas do admin).

Resultado: o `web` também passa a consumir `packages/api-client` e `packages/api-types`, eliminando a duplicação `app/lib/api.ts` vs `lib/api.ts` que já existe hoje no próprio front.

---

## Passo 2 — Escopo de perfis para o mobile (priorização)

Nem todo perfil do `enum Role` faz sentido como app mobile dedicado. Recomendação de prioridade:

1. **PATIENT / Colaborador (rota por token, `/p/[token]/...`)** — prioridade máxima. É o público que realmente usa celular no fluxo real: recebe link por SMS/WhatsApp, responde questionário, faz teleconsulta, acompanha ASO. Zero fricção de login (token + CPF + nascimento), ideal para mobile.
2. **DOCTOR (médico)** — prioridade alta. Fila de atendimento, consulta e teleconsulta por vídeo se beneficiam de notificação push mobile ("paciente na fila", "chamada iniciada"), mesmo que o médico também use desktop.
3. **CLINIC (consultório/recepção)** — média prioridade. Check-in de pacientes presenciais é um fluxo de balcão, mobile/tablet ajuda.
4. **COMPANY_ADMIN / OPERATOR / ADMIN** — baixa prioridade para mobile dedicado. São fluxos de gestão, documentos, financeiro — telas densas, melhor em desktop. Manter apenas no `web` por ora (ou, no máximo, uma versão mobile "somente leitura" de notificações/aprovações rápidas, numa fase posterior).

Isso evita construir 6 personas de uma vez e concentra o esforço onde o ganho é real.

---

## Passo 3 — Scaffold do `apps/mobile`

```
apps/mobile/
  src/
    app/                # bootstrap, providers, router
    routes/
      portal/[token]/    # espelha /p/[token]/* do web: questionario, teleconsulta, documentos, confirmar, processo, aso
      medico/             # fila, consulta/[id], historico
      consultorio/        # check-in (fase posterior)
    components/           # componentes mobile-first, não herdados do web 1:1
    hooks/                 # useQueue, useAuthToken, useCamera, useOfflineQueue
    lib/                   # adapters: storage (Capacitor-ready), push, deep-link
  index.html
  vite.config.ts
  capacitor.config.ts     # já deixar preparado, mesmo sem build nativo no início
  package.json            # depende de @repo/ui, @repo/api-client, @repo/api-types
```

Import da mesma API NestJS: reaproveitar `NEXT_PUBLIC_BACKEND_URL`/equivalente via `.env` do Vite (`VITE_BACKEND_URL`), apontando para o mesmo backend que o `web` já usa — nenhuma mudança no backend é necessária nesta etapa.

---

## Passo 4 — UI construída do zero (não portar componente por componente)

A orientação do usuário está correta: **reaproveitar tipos/DTOs/client HTTP, mas desenhar a interface do zero**. Diretrizes:

- **Navegação por perfil**, não por rota genérica: colaborador usa fluxo linear em wizard (etapa 1 de 4, etapa 2 de 4...), médico usa bottom tab bar (Fila / Consulta ativa / Histórico).
- **Telas de uma coisa só por vez** — o padrão do `web` de dashboards com várias seções simultâneas não funciona em tela pequena. Cada etapa do questionário, cada exame, cada ASO em tela cheia com botão de avançar fixo no rodapé (thumb zone).
- **Estado de conexão visível** — como o fluxo depende de Socket.IO (fila, teleconsulta), mobile precisa de indicador persistente de "conectado/reconectando", porque rede celular cai com mais frequência que Wi-Fi de desktop.
- **Câmera nativa para documentos** — em vez de `<input type="file">` (padrão do web), usar captura direta de câmera para envio de documentos/exames, com preview e reenvio antes de confirmar.
- **Componentes de formulário grandes o suficiente para toque** — alvo mínimo de 44×44px, espaçamento maior que o `web`.

---

## Passo 5 — Autenticação e sessão

- **Colaborador**: mesma lógica do backend (token-link + CPF + nascimento), mas persistida em `Capacitor Preferences`/`SecureStorage` em vez de `localStorage` puro — via a abstração criada no Passo 1.
- **Médico/Consultório**: login com JWT como hoje, mas com opção de **PIN de reentrada rápida** no app (não substitui o JWT, é só UX: evita redigitar email/senha toda vez que o app volta do background) — isso é aditivo, não mexe no backend de auth.
- **Deep link do token**: preparar `apps/mobile` para abrir diretamente em `/p/:token` a partir do link enviado por SMS/WhatsApp (Universal Links/App Links quando virar app nativo; funciona nativamente como PWA instalável desde já).

---

## Passo 6 — Tempo real (Socket.IO) adaptado ao ciclo de vida mobile

O hook atual (`useQueue`) assume que a aba está sempre visível. Em mobile:

- Reconectar automaticamente ao voltar do background (`visibilitychange`/Capacitor `App.addListener('resume', ...)`).
- Debate sobre **push notification** para eventos críticos (`TELECONSULTA_INICIADA`, entrada na fila) quando o app está fechado — isso exige Web Push (PWA) ou um wrapper nativo com FCM/APNs. Recomendo: começar com Web Push (funciona em Android/PWA; iOS Safari suporta Web Push desde iOS 16.4, com limitações se não instalado como PWA).

---

## Passo 7 — PWA agora, wrapper nativo depois (roadmap de distribuição)

1. **Fase mobile-1**: PWA instalável (`manifest.json`, service worker, ícone, splash) — cobre Android bem, iOS parcialmente.
2. **Fase mobile-2**: avaliar Capacitor (reaproveita 100% do código Vite/React) para gerar app nativo Android/iOS quando push notification e câmera nativa completa forem requisito não negociável (comum em telemedicina para lembrete de teleconsulta).
3. Não recomendo Expo/React Native puro agora — exigiria reescrever a UI em componentes RN, perdendo o reuso de `@repo/ui` que é web (DOM/Tailwind). Capacitor mantém o mesmo código web rodando em WebView nativa.

---

## Passo 8 — Testes em dispositivo real (ligado ao gap já mapeado)

A nota já registrada no projeto — **configuração de rede LAN necessária para testes em dispositivo** — se aplica igualmente ao `apps/mobile`:

- `vite.config.ts` com `server.host: true` para expor na LAN.
- Backend NestJS já precisa aceitar CORS do IP da máquina de desenvolvimento (checar `main.ts`/CORS config do backend).
- Documentar no `README` do `apps/mobile` o passo a passo de "abrir no celular físico via Wi-Fi da mesma rede", já que isso é fricção recorrente em setup de app mobile.

---

## Passo 9 — Faseamento sugerido (encaixando nas fases já em andamento, 3–5)

| Fase | Entregável mobile | Depende de |
|---|---|---|
| **M1** | `packages/api-client` + `packages/api-types` extraídos e usados pelo `web` (sem quebrar nada) | — |
| **M2** | Scaffold `apps/mobile` + fluxo completo do **colaborador** (`/p/:token/*`): confirmar, questionário, documentos, teleconsulta, ASO | Correção do **TASK-5-01** (QueueEntry) e **TASK-5-12** (formato do questionário) no backend, já mapeados — o mobile herda o mesmo bug se não forem corrigidos antes |
| **M3** | Fluxo do **médico**: fila, consulta ativa (com o card lateral do motor clínico dentro da aba de exames, conforme já corrigido no design), histórico | **TASK-5-03** (endpoint de criação de sala de teleconsulta) |
| **M4** | PWA completo (instalável, offline básico para questionário, push web) | M2 + M3 estáveis |
| **M5** | Avaliação/prototipagem Capacitor para loja de apps (opcional, decisão de produto) | M4 |

Isso é intencional: o mobile do **colaborador** não deve ser construído sobre os bugs de fila/questionário ainda abertos — senão o app novo nasce reproduzindo o mesmo defeito documentado no `web`.

---

## Aprimoramentos além do escopo mínimo (recomendações adicionais)

- **Camada de erro amigável mobile**: o `web` hoje provavelmente mostra erros técnicos ou toasts genéricos; em mobile, com usuários leigos (colaboradores) preenchendo questionário de saúde ocupacional, vale investir em mensagens de erro específicas por contexto (ex.: "sem conexão, suas respostas foram salvas localmente e serão enviadas quando a internet voltar").
- **Rascunho local do questionário** — salvar progresso localmente (IndexedDB/Capacitor Storage) a cada etapa, para o colaborador não perder respostas se o app fechar ou a rede cair no meio do NR-07.
- **Acessibilidade e leitura em voz alta** (opcional, mas relevante em saúde ocupacional): parte do público pode ter baixa alfabetização digital — considerar suporte a texto grande e, no médio prazo, leitura por voz das perguntas do questionário.
- **Consentimento LGPD explícito na tela mobile** — já que o dispositivo é pessoal do colaborador, reforçar telas claras de consentimento antes da captura de câmera/documentos.

---

## Resumo executivo

1. Confirmar que o front já está em monorepo (workspace `@repo/*`) — extrair `packages/api-client` e `packages/api-types` primeiro, sem tocar em UI.
2. Criar `apps/mobile` em **Vite + React** (recomendado sobre Next export) com rota espelhando `/p/[token]/*`.
3. Priorizar **Colaborador → Médico → Consultório**, deixando Admin/Empresa/Financeiro fora do mobile por ora.
4. UI desenhada do zero, mobile-first, reaproveitando só tipos/DTOs/client HTTP.
5. Resolver os bugs de Fase 5 já mapeados (TASK-5-01, TASK-5-03, TASK-5-12) **antes ou em paralelo** ao M2/M3, para o app novo não herdar os mesmos defeitos.
6. PWA primeiro, Capacitor depois, se push/câmera nativa virarem requisito duro.
