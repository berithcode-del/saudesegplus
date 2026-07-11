# Regras do Agent — apps/mobile

## Regra #1: Escopo Exclusivo (LESSON-001)

**O agent SÓ pode criar/editar/deletar arquivos dentro de `apps/mobile/`.**

### O que NÃO pode fazer:
- Editar `package.json` raiz
- Editar `turbo.json`
- Criar/modificar pacotes em `packages/*`
- Alterar `apps/web/*`
- Alterar `.npmrc`, `.gitignore` raiz
- Rodar `npm install` na raiz

### Exceção: `.specs/` (liberado em 2026-07-10)
- Pode criar, editar, mover e deletar arquivos em `.specs/`
- Especialmente `.specs/integracao-mobile/` (controle de specs do mobile)

### O que FAZ quando precisa de algo fora:
1. Para com a tarefa
2. Escreve uma solicitação clara ao usuário com:
   - O que precisa ser alterado
   - Em qual arquivo
   - O conteúdo exato da mudança
   - Por que é necessário
3. Aguarda o usuário confirmar que fez a alteração
4. Continua a tarefa

### Exemplo de solicitação:
```
PRECISO QUE FAÇA NO PROJETO RAIZ:
- Arquivo: package.json (raiz)
- Adicionar em "workspaces": ["apps/*", "packages/*", "apps/mobile"]
- Motivo: O turbo precisa reconhecer o novo app mobile
```
