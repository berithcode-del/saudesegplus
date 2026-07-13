# API Types Specification

## Problem Statement
Extrair tipos compartilhados (DTOs e enums) do backend para reuso entre os módulos `web` e `mobile` do monorepo. Evitar duplicação de definições e garantir consistência entre plataformas.

## Goals
- [ ] Tipos centralizados e reutilizáveis entre `web` e `mobile`
- [ ] Consumo sem erros de compilação em `web` (CRITÉRIO BLOQUEANTE)
- [ ] Mapeamento claro entre endpoints e tipos para rastreabilidade

## Out of Scope
| Feature | Reason |
|---------|--------|
| Validação runtime dos tipos | Será feita com `zod` em outro escopo |
| Tipos exclusivos do frontend | Apenas tipos compartilhados |

---

## Assumptions & Open Questions
| Assumption / decision | Chosen default | Rationale | Confirmed? |
|-----------------------|----------------|-----------|-----------|
| Localização: `.specs/features/api-types` | `.specs/features/api-types` | Padrão TLC | y |
| Uso de `zod` para validação | Não | Escopo separado | y |

**Open questions:** none.

---

## User Stories

### P1: Tipos Compartilhados ⭐ MVP
**User Story**: Como desenvolvedor, quero tipos centralizados (DTOs e enums) para reuso entre `web` e `mobile`, garantindo consistência.

**Why P1**: Evita duplicação e erros de sincronia.

**Acceptance Criteria**:
1. WHEN tipos são extraídos do backend THEN devem ser organizados em `.specs/features/api-types/types`
2. WHEN `web` consome os tipos THEN não deve haver erros de compilação
3. WHEN novos tipos são adicionados THEN devem seguir o padrão de IDs rastreáveis

**Independent Test**: Verificar compilação em `web` após consumo.

---

### P2: Mapeamento de Endpoints
**User Story**: Como desenvolvedor, quero mapear cada endpoint para seus tipos associados (request/response), facilitando manutenção.

**Why P2**: Melhora rastreabilidade e documentação.

**Acceptance Criteria**:
1. WHEN um endpoint é analisado THEN seus tipos devem ser associados a IDs únicos

**Independent Test**: VerificarIDs em `spec.md` e código.

---

## Edge Cases
- WHEN tipos incluem campos opcionais THEN devem ser claramente documentados
- WHEN há breaking changes em tipos THEN devem ser versionados

---

## Requirement Traceability
| Requirement ID | Story | Phase | Status |
|----------------|-------|-------|--------|
| REQ-API-TYPES-001 | P1: Tipos Compartilhados | Specify | Pending |
| REQ-API-TYPES-002 | P1: Tipos Compartilhados | - | Pending |
| REQ-API-TYPES-003 | P1: Tipos Compartilhados | - | Pending |
| REQ-API-TYPES-004 | P2: Mapeamento de Endpoints | - | Pending |

**IDs format**: `REQ-API-TYPES-NNN`

---

## Success Criteria
- [ ] `web` compila sem erros após consumo dos tipos
- [ ] Todos os tipos estão mapeados para IDs rastreáveis