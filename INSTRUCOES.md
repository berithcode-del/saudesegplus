# SaúdeSeg+ — Instruções para Rodar o Projeto

## Pré-requisitos

- Node.js >= 18
- PostgreSQL 15+ rodando na porta 5432
- npm (já incluso com Node.js)

## 1. Configurar o Banco de Dados

O projeto usa PostgreSQL. As credenciais já estão configuradas em:

**`apps/backend/.env`:**
```
DATABASE_URL="postgresql://saudeseg:password123@localhost:5432/saudeseg_db?schema=public"
```

### Criar o usuário e banco (se não existir)

Conecte no PostgreSQL como superusuário (`postgres`) e execute:

```sql
CREATE USER saudeseg WITH PASSWORD 'password123' CREATEDB LOGIN;
CREATE DATABASE saudeseg_db OWNER saudeseg;
```

### Rodar migrations e seed

```bash
cd apps\backend
npx prisma migrate dev
npx prisma db seed
```

> `prisma migrate dev` gera o Prisma Client automaticamente.

## 2. Rodar o Backend (NestJS — porta 3001)

```bash
cd apps\backend

# Desenvolvimento com watch (recomendado)
npm run start:dev

# Ou produção
npm run build
npm run start:prod
```

O backend inicia em **http://localhost:3001**.

### Endpoints disponíveis

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/doctors` | Lista médicos |
| GET | `/api/clinics` | Lista clínicas |
| POST | `/api/auth/login` | Login |
| GET | `/api/queue` | Fila de exames |
| POST | `/api/queue/enqueue` | Adicionar à fila |
| POST | `/api/queue/:id/accept` | Aceitar chamado |

## 3. Rodar o Frontend (Next.js — porta 3000)

```bash
cd apps\web

npm run dev
```

O frontend sobe em **http://localhost:3000**.

A URL do backend é definida em `apps/web/.env.local`:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

## 4. Dados de Seed (Teste)

Após rodar o seed, os seguintes registros estarão disponíveis:

| Email | Papel |
|-------|-------|
| `admin@saudeseg.com` | ADMIN |
| `operator@saudeseg.com` | OPERATOR (Clínica Central SP) |
| `medico.sp@saudeseg.com` | DOCTOR (Dr. João Silva — CRM 111111-SP) |
| `medico.pb@saudeseg.com` | DOCTOR (Dra. Maria Souza — CRM 222222-PB) |

> A senha atual no seed é `hashed_password_mock` (hash mockado). Para testes reais, ajuste o seed para usar um hash bcrypt válido ou implemente a lógica de autenticação.

## 5. Comandos Úteis

```bash
# Rodar tudo com Turbo (monorepo)
turbo dev

# Apenas backend
turbo dev --filter=backend

# Apenas frontend
turbo dev --filter=web
```
