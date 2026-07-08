# 📋 Status das Especificações — SaudeSegPlus

## Resumo da Situação

A rodada de **6 fases de especificação** (Spec-Driven) gerou o material base para as **3 telas do MVP da Fase 1**. A análise abaixo compara o que foi **especificado** com o que foi **implementado** no código.

---

## ✅ O que foi Especificado (`.specs/`)

| Tela | Arquivo | Requisitos Cobertos |
|---|---|---|
| **Tela 1 – Consultório** | `tela1-consultorio/spec.md` | CON-01 (Check-in), CON-02 (Exames), CON-03 (Fila), CON-04 (ASO) |
| **Tela 2 – Médico** | `tela2-medico/spec.md` | MED-01 (Fila Global), MED-02 (Teleconsulta), MED-03 (ASO+Assinatura) |
| **Tela 3 – Paciente** | `tela3-paciente/spec.md` | PAC-01 (Onboarding/LGPD), PAC-02 (Status), PAC-03 (Vídeo), PAC-04 (Documentos) |
| **Tela 4 – Empresa** | `tela4-empresa/spec.md` | EMP-01 (Onboarding Empresa), EMP-02 (Convites), EMP-03 (Dashboard e Documentos) |

---

## 🏗️ O que foi Implementado (código)

### Web (`apps/web`)
| Rota | Tela | Spec Coberta |
|---|---|---|
| `/consultorio` (page.tsx, 5KB) | Tela 1 – Painel + Fila | CON-03 ✅ |
| `/consultorio/check-in` (page.tsx, 8.5KB) | Tela 1 – Check-in de pacientes | CON-01 ✅ |
| `/medico` (page.tsx, 9KB) | Tela 2 – Fila Global Médico | MED-01 ✅ |
| `/medico/consulta/[id]` (page.tsx, 11KB) | Tela 2 – Sala de Teleconsulta | MED-02 ✅ |

### Mobile (`apps/mobile`)
| Tela | Spec Coberta |
|---|---|
| `consultorio/index.tsx` (6KB) | Tela 1 – Visão mobile |
| `consultorio/check-in.tsx` (9KB) | Tela 1 – Check-in mobile |
| `medico/index.tsx` (6.7KB) | Tela 2 – Fila médico mobile |
| `medico/consulta/[id].tsx` (7.9KB) | Tela 2 – Consulta médico mobile |

### Backend (`apps/backend`)
| Módulo | Spec Coberta |
|---|---|
| `queue/queue.gateway.ts` | WebSocket (CON-03, MED-01) ✅ |
| `queue/queue.service.ts` (3KB) | Lógica de fila + proximidade regional (AD-006) ✅ |
| `queue/queue.controller.ts` | REST endpoints da fila ✅ |
| `prisma/schema.prisma` (6.2KB) | Schema com flags `verified_at` (AD-007) ✅ |
| `prisma/seed.ts` | Dados de teste (mock/seed conforme AD-007) ✅ |

---

## ⚠️ Gaps Identificados — O que **NÃO** foi implementado ainda

| Requisito | Spec | Status |
|---|---|---|
| **Inserção de Exames Estruturados** | CON-02 | ❌ Sem rota/página específica |
| **Emissão Física do ASO (PDF)** | CON-04 (P2) | ❌ Não implementado |
| **Decisão e Assinatura do ASO** | MED-03 | ❌ Não há integração com provedor de assinatura (Clicksign/D4Sign) |
| **Tela 3 – App do Paciente** | PAC-01 ao PAC-04 | ❌ Somente telas de consultório/médico no mobile; **nenhuma tela de paciente** |
| **Tela 4 – Painel da Empresa** | EMP-01 ao EMP-03 | ❌ Nenhuma tela criada (escopo recém-adicionado) |
| **Push Notifications** | PAC-03 | ❌ FCM/APNs não configurado |
| **LGPD / Consentimento Explícito** | PAC-01 | ❌ Não há fluxo de aceite de termos |

---

## 🎯 Diagnóstico: Precisa de nova rodada de specs?

### Especificações: **COMPLETAS** para o escopo definido
As 3 specs (`spec.md`) cobrem todos os requisitos P1 do MVP com critérios de aceite bem definidos. **Não é necessário gerar novas specs para o que já foi planejado.**

### Implementação: **INCOMPLETA** — faltam ~40% das features

> [!IMPORTANT]
> As especificações **já estão prontas e aprovadas**. O que está faltando é a **implementação**, não mais especificação.

**Próximos blocos de implementação sugeridos (por prioridade):**

1. **Bloco A – Exames Estruturados (CON-02)**
   - Página web `/consultorio/exames/[id]`
   - Formulário estruturado por tipo de exame (PA, audiometria, etc.)
   - Botão "Enviar para fila médica" habilitado ao concluir

2. **Bloco B – Assinatura e ASO (MED-03 + CON-04)**
   - Integração com API Clicksign/D4Sign
   - Geração de PDF do ASO
   - Endpoint de webhook para receber confirmação de assinatura

3. **Bloco C – App do Paciente (PAC-01 a PAC-04)**
   - Telas de onboarding + consentimento LGPD
   - Linha do tempo de status
   - Sala de espera virtual + vídeo
   - Download do ASO

4. **Bloco D – Push Notifications**
   - Configuração FCM/APNs
   - Disparador no backend ao mudar status do paciente

---

## 📊 Resumo Visual

```
ESPECIFICAÇÕES
Tela 1 (Consultório): ██████████ 100% concluída
Tela 2 (Médico):      ██████████ 100% concluída
Tela 3 (Paciente):    ██████████ 100% concluída
Tela 4 (Empresa):     ██████████ 100% concluída

IMPLEMENTAÇÃO
Tela 1 (Consultório): ████████░░  ~60% (falta exames + ASO)
Tela 2 (Médico):      ██████░░░░  ~60% (falta assinatura + PDF)
Tela 3 (Paciente):    ░░░░░░░░░░   ~0% (nenhuma tela criada)
Tela 4 (Empresa):     ░░░░░░░░░░   ~0% (nenhuma tela criada)
Backend:              ████████░░  ~70% (falta assinatura + push)
```
