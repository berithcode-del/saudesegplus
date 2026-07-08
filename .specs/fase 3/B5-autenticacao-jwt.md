# B5 — Autenticação JWT

**Prioridade:** 🟡 Alto  
**Frente:** Backend + Frontend  
**Complexidade:** Large

---

## Contexto

Nenhum endpoint do sistema tem autenticação. O médico identifica sua fila digitando o próprio ID manualmente. A empresa não tem login real. O `apiLogin()` existe em `api.ts` mas chama `POST /api/auth/login` que **não existe no backend**.

O modelo `UserAccount` já tem `email` e `passwordHash`, e roles (`ADMIN`, `OPERATOR`, `DOCTOR`, `PATIENT`, `COMPANY_ADMIN`).

---

## Decisão de Escopo

Implementar autenticação **por role** com JWT, sem OAuth externo. Fluxos protegidos:
- `DOCTOR` → rotas `/api/medicos/*`, `/api/queue/*`, `/api/solicitacoes/*`
- `OPERATOR` → rotas `/api/exams/*`, `/api/queue/enqueue`
- `COMPANY_ADMIN` → rotas `/api/company/*`
- `PATIENT` → rota `/api/colaboradores/:id/solicitacoes`

---

## Requisitos

### Backend

**B5-REQ-001** — Novo módulo `auth/`:
- `POST /api/auth/login` — recebe `{ email, password }`, retorna `{ accessToken, user: { id, role, profileId } }`
- `POST /api/auth/refresh` (opcional nesta fase)
- Token JWT com payload: `{ sub: userId, role: Role, profileId: string }`
  - `profileId` = ID do `Doctor`, `Operator`, `CompanyAdmin` ou `Patient` conforme role

**B5-REQ-002** — `JwtAuthGuard` aplicado globalmente via `APP_GUARD`. Rotas públicas decoradas com `@Public()`:
- `POST /api/auth/login`
- `POST /api/colaboradores` (cadastro via convite — paciente ainda sem conta)
- `GET /api/company` (verificação de empresa — pode precisar de proteção no futuro)

**B5-REQ-003** — `RolesGuard` para endpoints sensíveis:
- `POST /api/exams/*` → `OPERATOR` ou `ADMIN`
- `GET /api/queue`, `POST /api/queue/:id/accept` → `DOCTOR` ou `ADMIN`
- `GET /api/company/*`, `POST /api/company/*` → `COMPANY_ADMIN` ou `ADMIN`
- `GET /api/solicitacoes` → `DOCTOR`, `OPERATOR`, `COMPANY_ADMIN`, `ADMIN`
- `PATCH /api/solicitacoes/:id` → `DOCTOR` ou `ADMIN`

**B5-REQ-004** — `GET /api/auth/me` — retorna dados do usuário logado a partir do token. Usado pelo frontend para restaurar sessão.

**B5-REQ-005** — Hash de senha com `bcrypt`. O seed deve gerar senhas com hash. Senhas padrão do seed (para desenvolvimento): `Doctor123!`, `Operator123!`, etc.

### Frontend

**B5-REQ-006** — Página de login `/login` com campos de e-mail e senha. Após login bem-sucedido, salvar token em `httpOnly cookie` ou `localStorage` (decisão: `localStorage` para simplicidade no MVP, migrar para cookie na Fase 4).

**B5-REQ-007** — Middleware Next.js para proteger rotas por prefixo:
- `/medico/*` → requer role `DOCTOR`
- `/consultorio/*` → requer role `OPERATOR`
- `/empresa/*` → requer role `COMPANY_ADMIN`
- `/paciente/*` → requer role `PATIENT`

**B5-REQ-008** — Todas as chamadas em `api.ts` devem incluir `Authorization: Bearer <token>` no header.

**B5-REQ-009** — Eliminar campos manuais de ID (médico na fila, empresa no painel) — usar `profileId` do token JWT decodificado.

---

## Critérios de Aceite

| ID | Critério |
|----|---------|
| B5-AC-001 | `POST /api/auth/login` com credenciais válidas retorna JWT |
| B5-AC-002 | `POST /api/auth/login` com senha errada retorna 401 |
| B5-AC-003 | `GET /api/queue` sem token retorna 401 |
| B5-AC-004 | `GET /api/queue` com token de OPERATOR retorna 403 |
| B5-AC-005 | `GET /api/queue` com token de DOCTOR retorna 200 |
| B5-AC-006 | Frontend redireciona para `/login` quando token ausente ou expirado |
| B5-AC-007 | Fila do médico usa `doctorId` do token (sem campo manual) |
| B5-AC-008 | Painel da empresa usa `companyId` do token (sem hardcode) |

---

## Dependências do seed

O `seed-mock.ts` deve criar usuários com senha hasheada para cada role:
- 1x DOCTOR com email/senha documentados
- 1x OPERATOR com email/senha documentados
- 1x COMPANY_ADMIN com email/senha documentados

---

## Arquivos afetados

### Backend
- `src/auth/` — novo módulo (auth.controller, auth.service, auth.module, jwt.strategy, roles.guard, jwt-auth.guard, decorators)
- `src/app.module.ts` — registrar AuthModule, APP_GUARD
- `package.json` — adicionar `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`
- `prisma/seed-mock.ts` — senhas hasheadas

### Frontend
- `app/login/page.tsx` — nova página
- `middleware.ts` — proteção de rotas por role
- `app/lib/api.ts` — adicionar token em todos os headers
- `app/lib/auth.ts` — novo helper (getToken, setToken, clearToken, decodeToken)

