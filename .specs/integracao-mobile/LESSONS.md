# LESSONS.md — Lições Aprendidas

## Confirmed
<!-- Format: LESSON-NNN: Descrição (Evidência: arquivo, teste, commit) -->

- **LESSON-001**: Escopo do agent mobile é `apps/mobile/` + `.specs/`. Qualquer alteração fora dessas pastas (ex: `packages/*`, `apps/web/*`, `package.json` raiz, `turbo.json`) DEVE ser solicitada ao usuário com especificações claras. `.specs/` foi liberado em 2026-07-10 para gerenciamento de specs do mobile. (Evidência: regra definida pelo usuário em 2026-07-10, atualizada em 2026-07-10)

## Candidates
<!-- Format: LESSON-NNN: Descrição (Em avaliação) -->

- **LESSON-002**: npm monorepo com `packageManager: npm@11.12.1` pode apresentar erro `Invalid Version` ao instalar dependências em workspaces. Abordagem: implementar código primeiro, resolver ambiente de build/teste separadamente. (Em avaliação — observado em 2026-07-10)
- **LESSON-003**: Backend `GET /api/portal/preview/:token` retorna `{ empresaNome, tipoExame, expirado }` mas frontend esperava `{ collaboratorName, companyName }`. Sempre verificar contratos de API entre backend e frontend antes de implementar hooks. (Em avaliação — corrigido em 2026-07-10)
- **LESSON-004**: `localforage` não inclui type declarations nativas. Criar `shims/localforage.d.ts` com interface completa quando usar em projeto TypeScript. (Em avaliação — corrigido em 2026-07-10)

---

## Como usar

1. **Falha em checkpoint**: O revisor documenta o gap em `validation.md` da feature.
2. **Auto-distillação**: `python3 scripts/lessons.py add --feature <name> --gap "<descrição>"` cria um candidate.
3. **Promoção**: Após 2 confirmações em features diferentes, vira Confirmed.
4. **Consulta**: `python3 scripts/lessons.py list --status confirmed` (no início de cada bloco).

## Regras (da skill tlc-spec-driven)

- Confirmed lessons são carregadas no início de cada Specify/Design.
- Candidates permanecem em avaliação até promoção.
- Nunca hand-editar `LESSONS.md` — usar `scripts/lessons.py`.
- `lessons.json` é o estado canônico (machine-owned).
