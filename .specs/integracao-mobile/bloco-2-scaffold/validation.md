# Mobile Scaffold — Validation (CHECKPOINT-2)

> **Revisor**: `frontend-specialist`
> **Status**: EXECUTADO PARCIALMENTE
> **Veredito**: FAIL (bloqueio de ambiente)

## Critérios

| ID | Critério | Resultado | Evidência |
|----|----------|-----------|-----------|
| C2.1 | Estrutura de pastas completa | PASS | `apps/mobile/src` contém `app`, `routes`, `components`, `hooks`, `lib` |
| C2.2 | Vite com server.host: true | PASS | `apps/mobile/vite.config.ts` |
| C2.3 | react-router com rotas perfil | PASS | `src/app/App.tsx` com `/p/:token/*`, alias `/portal/:token/*`, `/medico/*`, `/consultorio/*` |
| C2.4 | Consome @repo/ui, @repo/api-client, @repo/api-types | PASS | `npm ls --workspace mobile --depth=0` resolve workspaces |
| C2.5 | `npm run build --workspace mobile` passa | FAIL | Build falha por `ERR_MODULE_NOT_FOUND: esbuild` |
| C2.6 | capacitor.config.ts criado | PASS | `apps/mobile/capacitor.config.ts` |
| C2.7 | Touch audit ≥ 48px | PASS | `node scripts/mobile_audit.mjs apps/mobile` |
| C2.8 | Commit atômico por task | PENDING | Workspace atual ainda não está em commits atômicos dedicados ao bloco |

## Spec-Anchored Outcome Check
| AC ID | Asserted outcome | Evidence | PASS/FAIL |
|-------|-------------------|----------|-----------|
| REQ-MOBILE-SCAFFOLD-001 | dev server em 0.0.0.0:5173 | `vite.config.ts` configurado | PASS |
| REQ-MOBILE-SCAFFOLD-002 | build sem erros | `npm run build --workspace mobile` | FAIL |
| REQ-MOBILE-SCAFFOLD-003 | rotas renderizam placeholders | `src/app/App.tsx` + placeholders existentes | PASS |
| REQ-MOBILE-SCAFFOLD-004 | estrutura de pastas | `apps/mobile/src` | PASS |
| REQ-MOBILE-SCAFFOLD-005 | capacitor.config.ts | arquivo presente | PASS |
| REQ-MOBILE-SCAFFOLD-006 | ApiClient provider | `src/app/providers/ApiProvider.tsx` | PASS |
| REQ-MOBILE-SCAFFOLD-007 | M3 theme Roboto | `globals.css` | PASS |
| REQ-MOBILE-SCAFFOLD-008 | viewport-fit cover | `index.html` | PASS |

## Discrimination Sensor
| Fault injetado | Teste detectou? | Resultado |
|----------------|-----------------|-----------|
| Reduzir touch target no checkbox LGPD | Auditoria detectou e o ajuste foi pego pelo script | PASS |

## Gaps → Fix Tasks
- Dependência de bundling ausente no workspace: `esbuild`
- `npm install --workspace mobile esbuild` falhou com `Invalid Version`
- Causa raiz encontrada: `package-lock.json` continha `apps/web/node_modules/@heroicons/react: {}` e o `apps/web/.npmrc` tinha hoist local incompatível com o fluxo atual
- Ajuste aplicado: remoção da entrada vazia do lockfile e neutralização do hoist local do `web`
- Próximo passo: concluir instalação limpa do workspace e revalidar `npm run build --workspace mobile`

## Verdict
- [ ] PASS
- [x] FAIL

## Lessons (auto-distilled on FAIL)
- (preenchido por `scripts/lessons.py`)
