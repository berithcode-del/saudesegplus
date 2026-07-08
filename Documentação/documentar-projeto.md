---
description: Gera documentação completa do estado atual do projeto, página por página, com fluxo de dados/informação, comparando o que foi construído com o que estava previsto, e produz um plano de gaps/próximos passos.
argument-hint: [escopo opcional, ex: "apenas módulo financeiro" ou vazio para tudo]
---

# Documentação Comparativa do Projeto

Você vai produzir um relatório de auditoria técnica do projeto atual. Escopo solicitado pelo usuário: $ARGUMENTS (se vazio, considere o projeto inteiro).

## Passo 1 — Levantamento do que existe (fonte: código real)
1. Mapeie a árvore de pastas relevante (rotas/páginas, componentes, services, models, migrations, endpoints de API).
2. Para CADA página/rota/tela encontrada, documente:
   - Caminho do arquivo e rota associada
   - Responsabilidade da página (o que ela faz, na prática, lendo o código — não suposição)
   - Componentes/seções que ela renderiza
   - De onde vêm os dados (API, store local, mock, hardcoded)
   - Para onde os dados vão (submit, mutação, side-effects, eventos disparados)
   - Estado atual: funcional / parcial / placeholder / quebrado (baseie-se em evidência: TODOs, dados mockados, chamadas comentadas, etc.)
3. Monte o fluxo de dados ponta a ponta: Frontend → API → Service/Controller → Banco/External. Use diagrama (mermaid) quando possível.
4. Liste entidades/modelos de dados reais (schema atual) e relacionamentos.

## Passo 2 — Levantamento do que foi previsto
1. Procure documentos de planejamento: README, /docs, specs, board de tarefas, PRDs, comentários de design, issues fechadas/abertas.
2. Se não houver documentação formal, pergunte ao usuário pelo escopo original ou pelos requisitos (não invente requisitos).
3. Liste os módulos/páginas/fluxos que deveriam existir segundo esse planejamento.

## Passo 3 — Comparação (Gap Analysis)
Para cada módulo/página, produza uma tabela:

| Módulo/Página | Previsto | Construído | Status | Gap (o que falta) |
|---|---|---|---|---|

Classifique cada gap em: Crítico (bloqueia uso) / Importante (limita uso) / Polimento (cosmético).

## Passo 4 — Plano de próximos passos
1. Ordene os gaps por dependência técnica (o que precisa existir antes de outra coisa) e não só por importância.
2. Para cada item, estime esforço relativo (P/M/G) e o tipo de trabalho (infraestrutura, backend, frontend, integração, dados de teste).
3. Aponte explicitamente onde dados mockados estão sendo usados como se fossem reais (isso é um gap de infraestrutura, não só de dados).

## Passo 5 — Entrega
Gere o resultado como um arquivo Markdown em `/docs/auditoria-{data}.md` (ou na pasta de docs do projeto), estruturado assim:

```
# Auditoria do Projeto — {data}
## 1. Resumo executivo (5-8 linhas)
## 2. Mapa de páginas e fluxos (real)
## 3. Mapa de dados (schema + integrações reais)
## 4. Comparação previsto x construído (tabela)
## 5. Gaps priorizados
## 6. Próximos passos recomendados (com estimativa)
## 7. Anexo: diagramas de fluxo (mermaid)
```

Regras importantes:
- Nunca presuma que algo "deve estar funcionando" — confirme lendo o código.
- Separe claramente "dado real" de "dado mockado" em todo o relatório; isso é central para a decisão de infraestrutura.
- Se faltar contexto de planejamento, pare e pergunte antes de inventar requisitos.
