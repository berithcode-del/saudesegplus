# F5 + B8 — Configurações de Empresa

**Prioridade:** 🟢 Médio  
**Frentes:** Backend + Frontend  
**Complexidade:** Medium

---

## Contexto

`/empresa/configuracoes` é mock. O modelo `Company` já tem todos os campos necessários: `razaoSocial`, `nomeFantasia`, `cnpj`, `address`, `cep`, `city`, `state`, `lat`, `lng`, `planType`.

O status da empresa (`CompanyStatus`) afeta o que ela pode fazer na plataforma:
- `CADASTRO_INCOMPLETO` → não pode enviar convites
- `EM_ANALISE` → aguardando aprovação
- `LIBERADA` → acesso completo
- `DOCUMENTACAO_VENCIDA` → convites bloqueados

---

## Requisitos

### B8 — Backend

**B8-REQ-001** — `GET /api/company/:id` já existe. Verificar se retorna todos os campos de configuração (não apenas os básicos).

**B8-REQ-002** — `PATCH /api/company/:id` — atualizar dados da empresa:
```ts
{
  razaoSocial?: string,
  nomeFantasia?: string,
  address?: string,
  cep?: string,
  city?: string,
  state?: string,
}
```
- CNPJ **não** pode ser alterado após cadastro
- Status **não** pode ser alterado pelo próprio COMPANY_ADMIN (apenas ADMIN)

**B8-REQ-003** — Quando `city`/`state` mudarem, recalcular a clínica mais próxima e atualizar `clinicId` (baseado em `lat`/`lng` das clínicas cadastradas). Se coordenadas não disponíveis, usar match por cidade/estado.

**B8-REQ-004** — `GET /api/company/:id/status-check` — retorna checklist de requisitos para liberação:
```ts
{
  hasRazaoSocial: boolean,
  hasPcmso: boolean,
  hasPpra: boolean,
  pcmsoValid: boolean,
  ppraValid: boolean,
  hasClinicAssigned: boolean,
  status: CompanyStatus
}
```

### F5 — Frontend

**F5-REQ-001** — Tela de configurações com formulário de edição dos dados da empresa:
- Campos editáveis: razão social, nome fantasia, endereço, CEP, cidade, estado
- CNPJ e status exibidos como somente leitura
- Botão "Salvar" chama `PATCH /api/company/:id`

**F5-REQ-002** — Widget de status da empresa: exibir `CompanyStatus` com cor e descrição (ex: `LIBERADA` = verde "Empresa liberada para envio de convites").

**F5-REQ-003** — Checklist de requisitos (usando `B8-REQ-004`):
- Documentação PCMSO: ✅/❌ com link para tela de documentos
- Documentação PPRA: ✅/❌ com link para tela de documentos
- Clínica atribuída: ✅/❌

**F5-REQ-004** — Feedback visual após salvar (toast de sucesso/erro).

---

## Critérios de Aceite

| ID | Critério |
|----|---------|
| B8-AC-001 | `PATCH /api/company/:id` atualiza campos permitidos no banco |
| B8-AC-002 | CNPJ não é alterado mesmo se enviado no body |
| B8-AC-003 | `GET /api/company/:id/status-check` reflete estado real dos documentos |
| F5-AC-001 | Formulário carrega dados atuais da empresa do backend |
| F5-AC-002 | Salvar atualiza os dados e exibe confirmação |
| F5-AC-003 | Checklist de requisitos exibe estado correto (documentos válidos vs. não) |

---

## Arquivos afetados

### Backend
- `src/company/company.controller.ts` — adicionar `PATCH /:id`, `GET /:id/status-check`
- `src/company/company.service.ts` — `update()`, `getStatusCheck()`
- `src/company/dto/` — `UpdateCompanyDto`

### Frontend
- `app/empresa/configuracoes/page.tsx` — substituir mock por dados reais

