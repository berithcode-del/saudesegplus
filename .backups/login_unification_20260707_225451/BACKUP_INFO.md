# Backup — Unificação das Páginas de Login

**Data:** 2026-07-07 22:54:51
**Motivo:** Unificação das páginas `/empresas/login` e `/login` em uma só, com animação 3D Flip.

## Arquivos incluídos neste backup

| Arquivo original | Backup em |
|------------------|-----------|
| `apps/web/app/login/page.tsx` | `app/login/page.tsx` |
| `apps/web/app/empresas/login/page.tsx` | `app/empresas/login/page.tsx` |

## Como restaurar (PowerShell)

Caso algo dê errado, execute a partir da raiz do projeto:

```powershell
$backup = "E:\BerithCod\SaudeSegPlus\.backups\login_unification_20260707_225451"
Copy-Item -LiteralPath "$backup\app\login\page.tsx" -Destination "E:\BerithCod\SaudeSegPlus\apps\web\app\login\page.tsx" -Force
Copy-Item -LiteralPath "$backup\app\empresas\login\page.tsx" -Destination "E:\BerithCod\SaudeSegPlus\apps\web\app\empresas\login\page.tsx" -Force
```

## Estado atual do projeto

- `/empresas/login`: Form da Empresa com login + cadastro (CNPJ, Razão Social) — `BuildingOfficeIcon` badge verde.
- `/login`: Form Profissional (ADMIN/DOCTOR/OPERATOR) — badge "Acesso Profissional".
- `app/page.tsx` redireciona para `/empresas/login`.

## Próximas mudanças planejadas (a serem aplicadas depois deste backup)

1. Implementar flip 3D em `/empresas/login` com botão "Acesso Profissional" → revela form profissional no flip 180°.
2. Mudar cor do card no modo profissional para `#1e1b4b` (índigo escuro).
3. Substituir `/login/page.tsx` por redirect para `/empresas/login`.
