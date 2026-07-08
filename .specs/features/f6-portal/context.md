# F6 — Portal do Funcionário: Contexto

**Gathered:** 28/06/2026
**Spec:** `.specs/features/f6-portal/spec.md`
**Status:** Ready for implementation

---

## Feature Boundary

Portal web responsivo para o funcionário acompanhar seu processo de exame ocupacional. Acesso via link com token, sem login/senha. Tela única de "próxima ação".

---

## Implementation Decisions

### Videochamada (Q1)

- **Provedor:** Whereby
- Link de sala gerado sob demanda, embed via iframe com permissões câmera/microfone

### Notificação (Q2)

- **Canal:** WhatsApp API
- Envio do link via WhatsApp Business API (integrar futuramente; por enquanto, link é gerado e disponibilizado para a empresa enviar manualmente)

### Revalidação de sessão (Q4)

- **Abordagem:** CPF + data de nascimento redigitados (sem pré-preenchimento)
- SessionToken expira em 4h (sessionStorage), redireciona para `/p/[token]`

### Agent's Discretion

- Lista de documentos obrigatórios (Q3): usar default do spec (`['rg', 'foto']`), extensível via configuração futura
- Layout e identidade visual: seguir especificação (mobile-first, claro, card central)

---

## Specific References

- Documento de produto define "Portal de Processo", não aplicativo convencional
- Fluxos A/B/C conforme spec

---

## Deferred Ideas

- Integração real WhatsApp API (prioridade futura)
- Integração real Whereby (prioridade futura)
- Histórico de múltiplos processos por funcionário (fora do escopo)
