# Portal Flow (Colaborador) — Specification

## Problem Statement
Implementar o fluxo completo do Colaborador no mobile, espelhando `/p/[token]/*` do web: confirmação de dados, questionário NR-07, envio de documentos (câmera), teleconsulta, e ASO. UI mobile-first do zero (não port 1:1 do web).

## Goals
- [ ] Fluxo completo: token → confirmar → questionário (wizard) → documentos → teleconsulta → ASO
- [ ] Câmera nativa (não `<input type="file">`) com preview e reenvio
- [ ] Rascunho local do questionário (IndexedDB/localforage)
- [ ] Indicador de conexão persistente
- [ ] Touch targets ≥ 48px, CTAs em thumb zone, Material Design 3
- [ ] Erros amigáveis mobile específicos por contexto
- [ ] Consentimento LGPD explícito antes de câmera/documentos

## Out of Scope
| Feature | Reason |
|---------|--------|
| Login JWT do colaborador | Colaborador usa token-link, não JWT |
| Push notifications | Bloco 5 |

## Assumptions
| Assumption | Default | Rationale | Confirmed? |
|------------|---------|-----------|------------|
| Wizard linear por etapas | 1/N indicator | UX mobile, não dashboards | y |
| Câmera via web API ou Capacitor | Iniciar com web API, Capacitor pronto | AD-008 | y |
| offline-first para questionário | IndexedDB rascunho | Saúde ocupacional, rede instável | y |

## Start Gate

- Bloco 3 só inicia após CHECKPOINT-2 em PASS.
- Backend mínimo esperado antes da implementação real:
  - `POST /api/portal/auth` disponível e com erro genérico
  - `GET /api/portal/processo` disponível com `proximaAcao`
  - estratégia de upload de documentos fechada: duas etapas (`/api/upload/document` + `/api/portal/documentos`) ou endpoint único
- A navegação nova deve usar a rota curta oficial `/p/:token/*`; `/portal/:token/*` fica apenas como alias de compatibilidade.

## User Stories

### P1: Entrada por Token ⭐ MVP
**AC**:
1. WHEN `/p/:token` é acessado THEN valida token via `@repo/api-client`
2. WHEN token válido THEN mostra tela de boas-vindas + consentimento LGPD
3. WHEN token inválido THEN mostra erro amigável + opção de reentrar token

### P2: Confirmação de Dados
**AC**:
1. WHEN `/p/:token/confirmar` THEN mostra dados do colaborador (nome, CPF, data nasc)
2. WHEN colaborador confirma THEN persiste e avança para questionário
3. WHEN dados incorretos THEN permite correção inline

### P3: Questionário NR-07 (Wizard)
**AC**:
1. WHEN `/p/:token/questionario` THEN mostra etapa 1/N com uma pergunta por vez
2. WHEN resposta é dada THEN salva em rascunho local (IndexedDB) imediatamente
3. WHEN app fecha e reabre THEN recarrega rascunho da última etapa
4. WHEN todas etapas respondidas THEN envia ao backend (se online) ou enfileira (se offline)
5. WHEN envio offline THEN mostra "salvo localmente, enviando quando voltar online"
6. INDICATOR de progresso: etapa X de Y, barra de progresso visual

### P4: Documentos (Câmera)
**AC**:
1. WHEN `/p/:token/documentos` THEN lista documentos pendentes
2. WHEN captura THEN abre câmera nativa (não input file)
3. WHEN captura feita THEN preview + reenviar antes de confirmar
4. BEFORE captura THEN exibe consentimento LGPD ("vamos usar sua câmera para...")
5. WHEN envio THEN upload via `@repo/api-client`

### P5: Teleconsulta
**AC**:
1. WHEN `/p/:token/teleconsulta` THEN mostra sala de espera com indicador de conexão
2. WHEN médico inicia THEN mostra vídeo (embedded)
3. WHEN conexão cai THEN mostra erro + botão reconectar
4. WHEN teleconsulta termina THEN avança para ASO

### P6: ASO
**AC**:
1. WHEN `/p/:token/aso` THEN mostra ASO gerado (PDF preview ou texto formatado)
2. WHEN ASO assinado THEN finaliza fluxo com confirmação

## Requirement Traceability
| ID | Story | Status |
|----|-------|--------|
| REQ-PORTAL-001 | P1: Token validation | Pending |
| REQ-PORTAL-002 | P1: LGPD consent | Pending |
| REQ-PORTAL-003 | P1: Token inválido | Pending |
| REQ-PORTAL-004 | P2: Confirmar dados | Pending |
| REQ-PORTAL-005 | P2: Correção inline | Pending |
| REQ-PORTAL-006 | P3: Wizard 1/N | Pending |
| REQ-PORTAL-007 | P3: Rascunho IndexedDB | Pending |
| REQ-PORTAL-008 | P3: Recarregar rascunho | Pending |
| REQ-PORTAL-009 | P3: Envio offline queue | Pending |
| REQ-PORTAL-010 | P3: Indicador progresso | Pending |
| REQ-PORTAL-011 | P4: Lista documentos | Pending |
| REQ-PORTAL-012 | P4: Câmera nativa | Pending |
| REQ-PORTAL-013 | P4: Preview reenvio | Pending |
| REQ-PORTAL-014 | P4: LGPD antes câmera | Pending |
| REQ-PORTAL-015 | P5: Sala espera + conexão | Pending |
| REQ-PORTAL-016 | P5: Vídeo embedded | Pending |
| REQ-PORTAL-017 | P5: Reconexão | Pending |
| REQ-PORTAL-018 | P6: ASO preview | Pending |
| REQ-PORTAL-019 | P6: Assinatura ASO | Pending |
