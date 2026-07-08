# 📋 Tarefas para Bloco A – Exames Estruturados (CON-02)

## Contexto
Implementar a página `/consultorio/exames/[id]` para permitir o registro estruturado de exames (Pressão Arterial, Audiometria, etc.) com validação e envio para fila médica.

Baseado em:
- **Spec**: CON-02 (Exames Estruturados)
- **Referências**: 
  - `apps/web/app/consultorio/check-in/page.tsx` (estrutura de formulários)
  - `apps/backend/prisma/schema.prisma` (modelos `ExamRequest`, `ExamResult`)
  - `apps/backend/src/queue/queue.service.ts` (lógica de fila)

---

## 🔧 Tarefas Atômicas

### Frontend

#### **CON-02-A-1: Criar rota `/consultorio/exames/[id]`**
- **Descrição**: Criar página Next.js em `apps/web/app/consultorio/exames/[id]/page.tsx` para carregar dados do paciente e exames existentes.
- **Critérios de Verificação**:
  - A rota deve ser acessível via `/consultorio/exames/1` (exemplo).
  - Exibir nome do paciente e tipo de exame (ex: "Exames de Carlos Mendes - Admissional").
  - Carregar dados mockados ou via API (simular carregamento).
- **Dependências**: Nenhuma.

---

#### **CON-02-A-2: Criar componente `ExamForm` dinâmico**
- **Descrição**: Implementar componente `ExamForm` que renderiza campos específicos por tipo de exame:
  - **PA (Pressão Arterial)**: `pressao_sistolica`, `pressao_diastolica` (number)
  - **Audiometria**: `via_aerea_od`, `via_aerea_oe`, `via_ossea_od`, `via_ossea_oe` (text)
  - **Acuidade Visual**: `od`, `oe` (text)
- **Critérios de Verificação**:
  - Campos devem ser renderizados conforme `examType` passado via props.
  - Validação de campos obrigatórios (ex: valores numéricos para PA).
  - Exibir erros inline (ex: "Campo obrigatório").
- **Dependências**: Nenhuma.

---

#### **CON-02-A-3: Integrar `ExamForm` à rota `/exames/[id]`**
- **Descrição**: Adicionar `ExamForm` à página criada em **CON-02-A-1**, com suporte a:
  - Carregar exames existentes (simular resposta da API).
  - Exibir botão "Salvar Exames" habilitado apenas após validação.
- **Critérios de Verificação**:
  - Botão "Salvar Exames" inicia desabilitado.
  - Habilita apenas quando todos os campos obrigatórios são preenchidos.
  - Exibir loading state durante salvamento.
- **Dependências**: CON-02-A-1, CON-02-A-2.

---

#### **CON-02-A-4: Criar botão "Enviar para Fila Médica"**
- **Descrição**: Adicionar botão "Enviar para Fila Médica" na página `/exames/[id]` que:
  - Atualiza status do `ExamRequest` para `NA_FILA_MEDICA` via API.
  - Redireciona para `/consultorio` após sucesso.
  - Exibe confirmação (toast) se necessário.
- **Critérios de Verificação**:
  - Botão só habilita após salvar exames.
  - Chamada à API deve retornar sucesso (simular resposta).
  - Redirecionamento funcional.
- **Dependências**: CON-02-A-1, CON-02-A-3.

---

### Backend

#### **CON-02-B-1: Criar endpoint `POST /api/exams`**
- **Descrição**: Implementar endpoint para salvar exames estruturados:
  - Receber `examRequestId`, `examType`, e `valueJson` (campos dinâmicos).
  - Validar campos obrigatórios por `examType`.
  - Criar registro em `ExamResult` com `source: "manual"`.
- **Critérios de Verificação**:
  - Retornar `201 Created` em sucesso.
  - Retornar `400 Bad Request` para dados inválidos.
  - Campos obrigatórios validados (ex: `pressao_sistolica` para PA).
- **Dependências**: Nenhuma.

---

#### **CON-02-B-2: Criar endpoint `POST /api/exams/[id]/send-to-queue`**
- **Descrição**: Implementar endpoint para atualizar status do `ExamRequest` para `NA_FILA_MEDICA`:
  - Verificar se todos os exames obrigatórios foram registrados.
  - Atualizar `status` e `updatedAt` no `ExamRequest`.
  - Emitir evento WebSocket para atualizar filas.
- **Critérios de Verificação**:
  - Retornar `400 Bad Request` se exames obrigatórios faltarem.
  - Retornar `200 OK` em sucesso.
  - Evento WebSocket deve ser recebido em `/consultorio` (simular).
- **Dependências**: CON-02-B-1.

---

## ✅ Critérios de Aceite para Bloco A
- [ ] Página `/consultorio/exames/[id]` funcional com formulário dinâmico.
- [ ] Exames salvos via API (`POST /api/exams`).
- [ ] Botão "Enviar para Fila Médica" habilitado apenas após validação.
- [ ] Status do `ExamRequest` atualizado para `NA_FILA_MEDICA`.
- [ ] Fila médica atualizada em tempo real (simular WebSocket).