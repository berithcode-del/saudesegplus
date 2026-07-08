# 📋 Tarefas para Bloco B – Assinatura e ASO (MED-03 + CON-04)

## Contexto
Implementar integração com provedor de assinatura (Clicksign/D4Sign) e geração de PDF do ASO.

Baseado em:
- **Spec**: MED-03 (Assinatura do ASO) e CON-04 (Emissão do ASO).
- **Referências**: 
  - `apps/web/app/medico/consulta/[id]/page.tsx` (tela do médico).
  - `apps/backend/prisma/schema.prisma` (modelo `AsoDocument`).

---

## 🔧 Tarefas Atômicas

### Backend

#### **MED-03-B-1: Criar `SignatureService`**
- **Descrição**: Serviço para gerar links de assinatura e lidar com webhooks.
  - Método `generateLink(examRequestId: string)` → retorna URL mockada.
  - Método `handleWebhook(payload: any)` → simula confirmação de assinatura.
- **Critérios de Verificação**:
  - `generateLink` retorna URL válida (ex: `https://clicksign.mock/aso?id=1`).
  - Webhook atualiza `AsoDocument.signedAt` (mock).
- **Dependências**: Nenhuma.

---

#### **MED-03-B-2: Criar endpoints de assinatura**
- **Descrição**: Rotas em `apps/backend/src/signature/signature.controller.ts`:
  - `POST /api/signature/generate` → gera link de assinatura.
  - `POST /api/signature/webhook` → recebe confirmação de assinatura.
- **Critérios de Verificação**:
  - `POST /generate` retorna `{ url: "https://..." }`.
  - `POST /webhook` retorna `200 OK` para payload válido.
- **Dependências**: MED-03-B-1.

---

#### **CON-04-B-1: Criar template do ASO**
- **Descrição**: Template HTML em `libs/pdf-template-aso.html`:
  - Campos dinâmicos: `patientName`, `doctorName`, `examDate`, `decision` (APTO/INAPTO).
- **Critérios de Verificação**:
  - Template renderiza dados mockados.
  - Campos obrigatórios presentes.
- **Dependências**: Nenhuma.

---

#### **CON-04-B-2: Criar `AsoService`**
- **Descrição**: Serviço para gerar PDF do ASO:
  - Método `generatePdf(asoDocumentId: string)` → usa `puppeteer` para gerar PDF.
  - Retorna URL mockada (ex: `/aso/mock-aso-id.pdf`).
- **Critérios de Verificação**:
  - PDF gerado com dados do paciente.
  - Arquivo salvo em `AsoDocument.pdfUrl`.
- **Dependências**: CON-04-B-1.

---

#### **CON-04-B-3: Criar endpoint de geração de ASO**
- **Descrição**: Rota `POST /api/aso/generate` em `apps/backend/src/aso/aso.controller.ts`.
- **Critérios de Verificação**:
  - Retorna `201 Created` com `{ pdfUrl: "/aso/1.pdf" }`.
  - Atualiza `AsoDocument` no banco (mock).
- **Dependências**: CON-04-B-2.

---

### Frontend

#### **MED-03-F-1: Adicionar botão "Assinar ASO"**
- **Descrição**: Botão na tela `/medico/consulta/[id]` que:
  - Chama `POST /api/signature/generate` ao clicar.
  - Redireciona para URL de assinatura.
- **Critérios de Verificação**:
  - Botão habilitado apenas se `asoDocumentId` existir.
  - Redirecionamento funcional.
- **Dependências**: MED-03-B-2.

---

#### **MED-03-F-2: Exibir status de assinatura**
- **Descrição**: Status na tela do médico:
  - "Assinatura Pendente" → link clicável.
  - "Assinado em [data]" → exibir PDF.
- **Critérios de Verificação**:
  - Status atualiza após webhook (simular).
  - PDF acessível via link.
- **Dependências**: MED-03-F-1.

---

## ✅ Critérios de Aceite para Bloco B
- [ ] Link de assinatura funcional (mock).
- [ ] Webhook simula confirmação de assinatura.
- [ ] PDF do ASO gerado com dados dinâmicos.
- [ ] Botão "Assinar ASO" na tela do médico.
- [ ] Status de assinatura atualizado em tempo real.