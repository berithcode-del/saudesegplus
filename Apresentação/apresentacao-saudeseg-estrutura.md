# Apresentação SaúdeSeg+ — Estrutura Mestre
**Uso interno · SaúdeSeg+**
Formato final: PDF, wide (16:9, paisagem)

---

## 1. Regras de Design (extraídas da aplicação real)

Fonte: `app/globals.css` + `design-system.md` do frontend. A apresentação **não cria uma identidade nova** — ela usa os mesmos tokens do produto, para que quem já viu o dashboard reconheça a marca imediatamente.

### 1.1 Paleta (tokens `:root`)
| Token | Valor | Uso na apresentação |
|---|---|---|
| `--bg-app` | `#f8fafc` | Fundo base dos slides |
| `--bg-sidebar` / `--accent-primary` | `#4f46e5` | Cor de marca principal — títulos de destaque, formas geométricas, ícone de capa |
| `--accent-primary-hover` | `#4338ca` | Gradientes, estados de ênfase |
| `--accent-secondary` (âmbar) | `#f59e0b` | Destaques/badges de "atenção" |
| `--accent-teal` | `#0ea5e9` | Elementos informativos, segunda cor de gradiente |
| `--accent-success` | `#22c55e` | Indicadores de "concluído"/valor gerado |
| `--accent-danger` | `#ef4444` | Uso pontual (evitar em slides institucionais) |
| `--text-primary` | `#1e1b4b` | Títulos (roxo quase-preto) |
| `--text-secondary` | `#6b7280` | Corpo de texto |
| `--text-muted` | `#9ca3af` | Legendas, rodapé, numeração de slide |
| `--border-light` | `#e5e7eb` | Divisores, contorno de cards |

Logo (favicon SVG do app): duas formas encaixadas em `#4961a3` e `#76aadb` (33% opacidade) — vira o elemento gráfico de capa e marca d'água discreta no rodapé.

### 1.2 Tipografia
- Família: **Inter** (300–800), mesma do app.
- Títulos de slide: Inter 700–800, `text-primary`, letter-spacing leve negativo (`-0.3px` a `-0.5px`), tamanho grande (equivalente ao "welcome-banner h2" do app, escalado para slide: ~40–52pt em título de abertura de seção, ~28–32pt em título de conteúdo).
- Corpo: Inter 400–500, `text-secondary`, 16–20pt.
- Números/métricas grandes: Inter 800, `text-primary` ou `accent-primary`.

### 1.3 Linguagem visual — "claymorfismo leve" do app
Replicar os padrões já existentes, sem inventar novo estilo:
- **Cards**: fundo branco, `border-radius: 20px`, borda `1px solid var(--border-light)`, sombra suave (`shadow-card`: `0 4px 20px -2px rgba(149,157,165,.15)`) — nunca sombra dura ou flat design puro.
- **Banner/destaque** (padrão `.welcome-banner`): gradiente diagonal suave `linear-gradient(130deg, #eef0ff 0%, #e8f5fe 100%)` com círculo decorativo translúcido no canto — usar em slides de abertura de seção.
- **Badges/pílulas** (padrão `.badge-*` / `.stat-icon-*`): fundo da cor com 12% de opacidade + texto na cor sólida, `border-radius` total (pill). Usar para tags de status, labels de ator (Empresa/Colaborador/Médico/Clínica).
- **Ícones**: sempre outline (heroicons-style), stroke 1.75, nunca emoji — igual ao `.icon` do app.
- **Cantos arredondados generosos** em blocos grandes (o `main-content` do app usa `border-radius: 31px`) — slides de seção podem usar um painel arredondado grande como moldura de conteúdo, ecoando o "encaixe" da sidebar com o conteúdo.

### 1.4 Layout wide (16:9)
- Grid de margem segura: ~64px lateral, ~48px topo/rodapé (proporcional ao `padding: 28px 32px 28px 56px` do `.main-content`, escalado).
- Rodapé fixo em todos os slides de conteúdo: marca d'água do logo (opacidade baixa) + numeração em `text-muted` + "SaúdeSeg+" pequeno.
- Slides de abertura de bloco (capa, abertura de cada uma das 4 seções de ator): fundo cheio na cor `accent-primary` ou gradiente do banner, tipografia branca — mesma lógica de contraste da sidebar roxa do app.
- Slides de conteúdo: fundo `bg-app`, cards brancos flutuando sobre ele — igual à relação sidebar/main-content.

---

## 2. Estrutura de Conteúdo (14 slides)

**Público:** uso interno SaúdeSeg+.
**Tom do bloco 2 (fluxo):** amigável, não técnico — fala de benefício e experiência, não de schema/endpoint.

### Bloco A — Visão (slides 1–5)

**Slide 1 — Capa**
- Logo SaúdeSeg+ (forma do favicon) + wordmark
- Título: "SaúdeSeg+"
- Subtítulo: posicionamento em uma linha (ex.: gestão de saúde ocupacional, do convite ao ASO, em um só lugar)
- Rodapé: SaúdeSeg+ · [mês/ano]
- (opcional, letra miúda: "desenvolvido por BerithCode" — única citação da desenvolvedora, sem repetir nos demais slides)

**Slide 2 — O problema hoje**
- 3–4 dores reais do processo de saúde ocupacional (planilhas soltas, papel, retrabalho entre empresa/clínica/médico, falta de visibilidade de status de ASO/exame)
- Formato: cards curtos, um problema por card

**Slide 3 — Nossa visão**
- O que a SaúdeSeg+ quer que a saúde ocupacional seja: processo único, rastreável, sem retrabalho, todo mundo (empresa, colaborador, médico) vendo o mesmo status em tempo real
- Frase-âncora grande (estilo `welcome-banner h2`)

**Slide 4 — A solução SaúdeSeg+**
- Proposta de valor em uma frase + 3 pilares (ex.: Centralização, Rastreabilidade, Agilidade)
- Cada pilar como card com ícone outline

**Slide 5 — Quem participa**
- Apresentação dos 4 atores (Empresa, Colaborador, Médico, Clínica) como preparação para o Bloco B — cada um como uma pílula/badge colorida, sem entrar em detalhe ainda

### Bloco B — Como a plataforma funciona (slides 6–13)
*Uma tela dedicada por ator, tom não técnico.*

**Slide 6 — Abertura de bloco: "Como funciona, na prática"**
- Slide de transição (fundo cheio roxo, estilo capa de seção) anunciando que a seguir vem o passo a passo por perspectiva de cada ator

**Slide 7 — Empresa: o que ela faz**
- Jornada simples em 3 passos (cadastra colaboradores → acompanha exames → recebe ASO) — sem falar em token/API

**Slide 8 — Empresa: o que ela ganha**
- Benefícios (visão consolidada do time, menos e-mail/planilha, conformidade mais simples)

**Slide 9 — Colaborador: o que ele faz**
- Recebe convite → confirma dados → acompanha status do próprio exame

**Slide 10 — Colaborador: o que ele ganha**
- Clareza sobre onde está seu exame, menos ida repetida, comunicação direta

**Slide 11 — Médico/Clínica: o que fazem**
- Recebem a solicitação já organizada → atendem → registram resultado/ASO

**Slide 12 — Médico/Clínica: o que ganham**
- Agenda organizada, menos trabalho administrativo, histórico do paciente à mão

**Slide 13 — O ciclo fechado**
- Diagrama único e simples: Empresa → Colaborador → Médico/Clínica → ASO → volta pra Empresa, com status visível em cada ponta
- (Esse é o único diagrama técnico-visual do bloco B — resume tudo que os slides 7–12 explicaram em texto)

### Bloco C — Encerramento (slide 14)

**Slide 14 — O valor que isso gera para a SaúdeSeg+**
- Como esse produto gera valor de negócio (retenção de empresas-cliente, dado estruturado para expansão futura — ex. billing, novos módulos, base para Fase 3)
- Fechamento com chamada para próxima conversa/decisão
- Rodapé/crédito discreto: plataforma desenvolvida por BerithCode (única segunda menção do documento, em corpo pequeno)

---

## 3. Próximos passos
1. Você revisa essa estrutura e eu ajusto tópicos/ordem.
2. Depois eu escrevo o **conteúdo final de texto de cada slide** (títulos, bullets, microcopy) neste mesmo markdown, mantendo a estrutura acima.
3. Só then a gente parte para gerar o PDF (wide) aplicando essas regras de design.
