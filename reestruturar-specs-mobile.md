# Reestruturação .specs — Retomar Bloco 2→3

## Goal
Limpar e padronizar a pasta `.specs/integracao-mobile/`, remover duplicatas e lixo, preparar ambiente para validação do Bloco 2 e início do Bloco 3.

## Tasks

### Fase A: Limpeza de Duplicatas
- [ ] **A1**: Remover `.specs/STATE.md`, `.specs/LESSONS.md`, `.specs/CHECKPOINTS.md` (duplicatas da raiz — fonte de verdade é `integracao-mobile/`)
  → Verificar: `ls .specs/*.md` mostra só arquivos não-duplicados

### Fase B: Migrar .specs/features/ para integracao-mobile/
- [ ] **B1**: Mover `.specs/features/api-types/spec.md` → `.specs/integracao-mobile/bloco-1-reuso/spec-api-types.md`
- [ ] **B2**: Mover `.specs/features/api-types/validation.md` → `.specs/integracao-mobile/bloco-1-reuso/validation-api-types.md`
- [ ] **B3**: Mover `.specs/features/api-client/spec.md` → `.specs/integracao-mobile/bloco-1-reuso/spec-api-client.md`
- [ ] **B4**: Mover `.specs/features/api-client/validation.md` → `.specs/integracao-mobile/bloco-1-reuso/validation-api-client.md`
- [ ] **B5**: Mover `.specs/features/api-client/design.md` → `.specs/integracao-mobile/bloco-1-reuso/design-api-client.md`
- [ ] **B6**: Mover `.specs/features/api-types/tasks.md` + `.specs/features/api-client/tasks.md` → `.specs/integracao-mobile/bloco-1-reuso/tasks-bloco1.md`
- [ ] **B7**: Criar `.specs/integracao-mobile/bloco-1-reuso/README.md` com índice do bloco 1
- [ ] **B8**: Remover pasta `.specs/features/` vazia

### Fase C: Arquivar fases antigas
- [ ] **C1**: Criar `.specs/integracao-mobile/_arquivo/` (prefixo `_` para indicar往事)
- [ ] **C2**: Mover `fase-2/` → `_arquivo/fase-2-fluxo-completo/`
- [ ] **C3**: Mover `fase-3/` → `_arquivo/fase-3-melhorias-core/`
- [ ] **C4**: Mover `fase-4/` → `_arquivo/fase-4-producao/`
- [ ] **C5**: Mover `fase5-correcoes-fluxo/` → `_arquivo/fase-5-correcoes/`
- [ ] **C6**: Mover `fase6-fechamento/` → `_arquivo/fase-6-fechamento/`
- [ ] **C7**: Mover `f6-portal/` → `_arquivo/f6-portal-detalhes/`
- [ ] **C8**: Criar `_arquivo/README.md` explicando que são fases do ciclo anterior ao sistema de blocos

### Fase D: Atualizar estado do Bloco 2
- [ ] **D1**: Atualizar `bloco-2-scaffold/validation.md` — marcar status como "AGUARDANDO EXECUÇÃO" (já está, confirmar)
- [ ] **D2**: Atualizar `ACOMPANHAMENTO_MOBILE.md` — confirmar que TASK-MOBILE-SCAFFOLD-009 (`.env` + README) é a única pendente
- [ ] **D3**: Verificar se `apps/mobile/` tem `.env.example` e `README.md` — se não, criar (é a última task do Bloco 2)

### Fase E: Preparar ambiente para Bloco 3
- [ ] **E1**: Confirmar que `bloco-3-portal/spec.md`, `tasks.md`, `validation.md` estão completos e prontos
- [ ] **E2**: Confirmar que `apps/mobile/src/routes/portal/[token]/` tem as 7 sub-rotas scaffold
- [ ] **E3**: Verificar que `@repo/api-client` e `@repo/api-types` estão instalados em `apps/mobile/package.json`

### Fase F: Verificação Final
- [ ] **F1**: Rodar `pnpm --filter mobile build` — deve passar sem erros
- [ ] **F2**: Listar estrutura final: `ls -R .specs/integracao-mobile/` — confirmar limpeza
- [ ] **F3**: Atualizar `ACOMPANHAMENTO_MOBILE.md` seção "Estrutura de Pastas" com a nova árvore

## Done When
- [ ] Nenhuma duplicata entre `.specs/` raiz e `integracao-mobile/`
- [ ] `.specs/features/` removida (conteúdo migrado para `bloco-1-reuso/`)
- [ ] Fases antigas em `_arquivo/` com README explicativo
- [ ] Bloco 2 pronto para validação (CHECKPOINT-2)
- [ ] Bloco 3 pronto para iniciar assim que C2 passar
- [ ] `pnpm --filter mobile build` passa

## Notas
- **LESSON-001**: Escopo mobile é EXCLUSIVO para `apps/mobile/`. Mudanças em `packages/*` ou `apps/web/*` devem ser requestadas ao usuário.
- A reestruturação é só em `.specs/` — nenhum código mobile é alterado nesta tarefa.
