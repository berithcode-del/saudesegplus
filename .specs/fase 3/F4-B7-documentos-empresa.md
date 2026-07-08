# F4 + B7 — Upload de Documentos da Empresa (PCMSO/PPRA)

**Prioridade:** 🟡 Alto  
**Frentes:** Backend + Frontend  
**Complexidade:** Large

---

## Contexto

A tela `/empresa/documentos` existe mas é mock. O modelo `Company` já tem campos:
- `pcmsoDocumentUrl`, `ppraDocumentUrl`
- `pcmsoValidUntil`, `ppraValidUntil`

O status `DOCUMENTACAO_VENCIDA` já existe no enum `CompanyStatus`. A lógica de verificação de validade e mudança de status é parte desta feature.

---

## Requisitos

### B7 — Backend

**B7-REQ-001** — `POST /api/company/:id/documentos` — upload de documento PCMSO ou PPRA.

```ts
// multipart/form-data
{
  type: 'pcmso' | 'ppra',
  file: File,             // PDF obrigatório
  validUntil: string      // ISO date, ex: "2026-12-31"
}
```

Comportamento:
1. Validar tipo do arquivo (apenas PDF, max 10MB)
2. Salvar arquivo em `uploads/documentos/empresa-:id/` (local, Fase 3) ou S3 (Fase 4)
3. Atualizar `Company.pcmsoDocumentUrl` ou `ppraDocumentUrl` com caminho
4. Atualizar `Company.pcmsoValidUntil` ou `ppraValidUntil`
5. Verificar se ambos os documentos estão válidos; se sim, mudar status para `LIBERADA`

**B7-REQ-002** — `GET /api/company/:id/documentos` — retorna status de ambos os documentos:
```ts
{
  pcmso: { url: string | null, validUntil: Date | null, isValid: boolean },
  ppra: { url: string | null, validUntil: Date | null, isValid: boolean },
}
```
`isValid = validUntil !== null && validUntil > now()`

**B7-REQ-003** — Job de verificação de validade (pode ser simples, executado no startup e diariamente via `setInterval` ou `cron`):
- Para cada empresa com `status = LIBERADA`, verificar se algum documento expirou
- Se sim, atualizar `status = DOCUMENTACAO_VENCIDA` e emitir evento WebSocket para a empresa

**B7-REQ-004** — `GET /api/company/:id/documentos/:tipo` — baixar o documento (servir o arquivo). `tipo` = `pcmso` | `ppra`.

**B7-REQ-005** — Usar `multer` para upload de arquivo (já pode estar no projeto; verificar `package.json`). Se não estiver, adicionar.

### F4 — Frontend

**F4-REQ-001** — Tela `/empresa/documentos` com duas seções: PCMSO e PPRA.

Cada seção mostra:
- Status atual (válido ✅ / expirado ⚠️ / não enviado ❌)
- Data de validade (quando disponível)
- Link para download do documento atual
- Botão "Atualizar documento" → abre modal de upload

**F4-REQ-002** — Modal de upload:
- Input de arquivo (PDF, max 10MB)
- Campo de data de validade (datepicker ou input date)
- Validação client-side antes de enviar
- Progress bar durante upload
- Feedback de sucesso/erro

**F4-REQ-003** — Após upload bem-sucedido, recarregar status dos documentos e refletir mudança de status da empresa (ex: "Documentação completa — empresa liberada").

**F4-REQ-004** — Alerta visível quando algum documento está próximo de vencer (< 30 dias) ou já venceu.

---

## Critérios de Aceite

| ID | Critério |
|----|---------|
| B7-AC-001 | `POST /api/company/:id/documentos` salva arquivo em disco e atualiza URL no banco |
| B7-AC-002 | Upload de arquivo não-PDF retorna 400 |
| B7-AC-003 | Empresa com ambos os documentos válidos tem `status = LIBERADA` após upload |
| B7-AC-004 | `GET /api/company/:id/documentos` retorna `isValid: false` para documento expirado |
| F4-AC-001 | Tela mostra status correto de cada documento carregado do backend |
| F4-AC-002 | Upload de PCMSO via modal salva e exibe o novo documento |
| F4-AC-003 | Alerta de "próximo de vencer" aparece para documentos com validade < 30 dias |

---

## Arquivos afetados

### Backend
- `src/company/company.controller.ts` — adicionar rotas de documentos
- `src/company/company.service.ts` — `uploadDocument()`, `getDocumentStatus()`
- `src/app.module.ts` — configurar `MulterModule`
- `package.json` — verificar/adicionar `multer`, `@types/multer`

### Frontend
- `app/empresa/documentos/page.tsx` — substituir mock por dados reais
- `app/lib/api.ts` — `apiGetDocumentos()`, `apiUploadDocumento()`

