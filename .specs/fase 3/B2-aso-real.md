# B2 — ASO Real: Persistência, Geração de PDF e Assinatura

**Prioridade:** 🔴 Crítico  
**Frente:** Backend (com reflexo no Frontend)  
**Complexidade:** Complex (envolve decisão de integração externa)

---

## Contexto

O fluxo atual de emissão do ASO é 100% mock:

```ts
// aso.service.ts — atual
async generatePdf(asoDocumentId: string) {
  if (!asoDocumentId || asoDocumentId !== '1') throw new Error(...);
  // Lê template HTML, usa puppeteer-core, nunca salva no banco
  return { pdfUrl: '/aso/mock-1.pdf' };
}

// signature.service.ts — atual (não lido mas referenciado)
// POST /api/signature/generate → retorna URL mock
// Não persiste nada em AsoDocument
```

O modelo `AsoDocument` existe no banco com:
- `requestId`, `doctorId`, `decision`, `restrictionNotes`
- `pdfUrl`, `signatureProviderId`, `signedAt`, `validUntil`

---

## Questão em Aberto (D2) — Integração de Assinatura

**Decisão necessária antes de implementar:**

> Qual provedor de assinatura digital será usado?
> - Opção A: **Clicksign** (API REST, simples, comum no BR)
> - Opção B: **DocuSign** (mais robusto, mais caro)
> - Opção C: **Assinatura interna simplificada** (hash + chave privada do médico, sem validade jurídica ICP-Brasil — suficiente para MVP)
> - Opção D: **Manter mock até Fase 4**, mas persistir o AsoDocument no banco agora

**Recomendação para Fase 3:** Opção D — persistir tudo no banco com `signatureProviderId = null` e `signedAt = null` (pendente), e emitir o PDF via template HTML + headless browser (já tem Puppeteer no projeto). Integração real de assinatura vai para Fase 4.

---

## Requisitos

### B2-REQ-001 — Persistência do AsoDocument

Ao chamar `POST /api/aso/generate` (ou ao confirmar decisão via `PATCH /api/solicitacoes/:id`), criar/atualizar registro em `AsoDocument`:

```
AsoDocument {
  requestId: string          // ExamRequest.id
  doctorId: string           // Doctor.id do médico que atendeu
  decision: 'APTO' | 'APTO_COM_RESTRICAO' | 'INAPTO'
  restrictionNotes?: string  // quando decision = APTO_COM_RESTRICAO
  pdfUrl?: string            // URL após geração do PDF
  validUntil?: DateTime      // +1 ano por padrão
  signedAt: null             // mock até integração real
}
```

**B2-REQ-002** — `PATCH /api/solicitacoes/:id` deve aceitar os campos:
- `status: string`
- `decision: 'APTO' | 'APTO_COM_RESTRICAO' | 'INAPTO'`
- `restrictionNotes?: string`
- `laudoTexto?: string` (mantido por compatibilidade)

E criar o `AsoDocument` atomicamente na mesma transação.

**B2-REQ-003 — Geração de PDF**

Substituir o mock do `AsoService` por uma implementação real que:
1. Busca o `AsoDocument` com includes (`request.patient`, `request.clinic`, `request.invite.company`, `doctor`)
2. Renderiza template HTML (já existe a estrutura em `libs/pdf-template-aso.html`)
3. Popula todos os campos com dados reais (não mais "Carlos Mendes" hardcoded)
4. Gera PDF via Puppeteer (já é dependência do projeto)
5. Salva o PDF em disco (pasta `uploads/aso/`) ou em storage externo (S3 — Fase 4)
6. Atualiza `AsoDocument.pdfUrl` com o caminho do arquivo

**B2-REQ-004** — Criar endpoint `GET /api/aso/:id` para baixar/servir o PDF gerado.

**B2-REQ-005** — Remover restrição `asoDocumentId !== '1'` do service atual.

**B2-REQ-006** — `validUntil` calculado como: data da consulta + `ExamType.validityDays` (padrão 365). Quando `ExamType` não for identificável, usar 365 dias.

---

## Critérios de Aceite

| ID | Critério |
|----|---------|
| B2-AC-001 | Após `PATCH /api/solicitacoes/:id` com `decision`, existe registro em `AsoDocument` no banco |
| B2-AC-002 | `AsoDocument.decision` reflete o valor enviado (APTO/APTO_COM_RESTRICAO/INAPTO) |
| B2-AC-003 | `GET /api/aso/:asoDocumentId` retorna PDF com dados reais do paciente (não "Carlos Mendes") |
| B2-AC-004 | `AsoDocument.pdfUrl` é preenchido após geração |
| B2-AC-005 | `validUntil` está 365 dias após `createdAt` |
| B2-AC-006 | Fluxo funciona para pacientes criados via check-in direto E via convite de empresa |

---

## Questão em Aberto (D3) — Template HTML do ASO

O arquivo `libs/pdf-template-aso.html` é referenciado no código mas não está nos arquivos enviados. **Verificar se existe no repositório original.** Se não existir, criar template básico com:
- Cabeçalho da clínica
- Dados do paciente
- Tipo e finalidade do exame
- Decisão médica (APTO/INAPTO/RESTRIÇÃO)
- Espaço para assinatura e CRM do médico
- Data de validade

---

## Arquivos afetados

### Backend
- `src/aso/aso.service.ts` — reescrever `generatePdf()` com dados reais
- `src/aso/aso.controller.ts` — adicionar `GET /:id`
- `src/exam-request/exam-request.service.ts` — update com transaction para criar `AsoDocument`
- `src/signature/signature.service.ts` — persistir `AsoDocument` antes de retornar URL

