# Security Hardening Before Production

## Goal
Fechar as principais portas de entrada antes de producao: acesso indevido, abuso de requisicoes, payloads grandes, upload inseguro, dados expostos e rotas de painel sem login.

## Findings Principais
- CRITICO: muitos endpoints sensiveis estao com `@Public()`, incluindo admin, company, financial, upload, queue, exams, calendar e solicitacoes.
- CRITICO: `JWT_SECRET` tem fallback hardcoded (`saudeseg-dev-secret` / `saudeseg_secret_key_2026`), entao producao pode subir com segredo previsivel.
- CRITICO: upload publico grava arquivo em disco sem limite local por rota, sem whitelist completa por tipo, sem extensao segura e sem escopo de dono.
- ALTO: paineis do Next dependem principalmente de token em `localStorage`, sem middleware central protegendo `/admin`, `/empresa`, `/medico` e `/consultorio`.
- ALTO: rate limit global existe, mas e generico (`120/min`) e nao protege de forma especifica login, portal auth, upload, CBO search e convites.
- ALTO: DTOs ainda aceitam strings sem `MaxLength`, `Matches`, enums e normalizacao em varios formularios.
- MEDIO: faltam headers de seguranca (`helmet`, CSP, HSTS, frameguard, nosniff) e CORS/WebSocket ainda tem pontos permissivos.
- MEDIO: arquivos em `/uploads` ficam publicos por URL direta, inclusive documentos e ASOs.

## Tasks
- [ ] Task 1: Inventariar rotas e classificar publico/protegido por papel.
  - Arquivos: `apps/backend/src/**/*controller.ts`
  - Fazer: criar uma matriz `rota -> publico | ADMIN | COMPANY_ADMIN | DOCTOR | CLINIC | PATIENT_PORTAL`.
  - Verify: nenhuma rota com dado operacional/sensivel fica publica sem justificativa.

- [ ] Task 2: Remover `@Public()` de endpoints sensiveis e aplicar RBAC.
  - Prioridade: `admin`, `financial`, `company`, `exam-request`, `queue`, `exams`, `calendar`, `upload`, `aso`, `signature`.
  - Fazer: usar guard global JWT como default, `RolesGuard`/decorator por papel, e validacao de ownership por `profileId`.
  - Verify: chamadas sem token retornam 401; token de empresa nao acessa dados de outra empresa; medico nao altera solicitacao alheia.

- [ ] Task 3: Proteger rotas do frontend com middleware.
  - Arquivos: criar `apps/web/middleware.ts` e revisar layouts/paginas.
  - Fazer: bloquear `/admin`, `/empresa`, `/medico`, `/consultorio` sem sessao; redirecionar por papel; deixar publico apenas `/`, `/login`, `/empresas/login`, `/p/:token/*` controlado pelo portal.
  - Verify: abrir URL direta de painel sem login redireciona; usuario com papel errado nao acessa painel de outro papel.

- [ ] Task 4: Fortalecer JWT, sessao e login.
  - Fazer: exigir `JWT_SECRET` em producao sem fallback, reduzir expiracao conforme perfil, validar `sub/profileId/role`, remover secrets hardcoded, adicionar protecao de brute force no login e portal auth.
  - Verify: app falha ao iniciar em producao sem `JWT_SECRET`; 6 tentativas invalidas de login/auth recebem 429.

- [ ] Task 5: Criar rate limits por rota critica.
  - Arquivos: `app.module.ts`, controllers e possivel decorator custom.
  - Fazer: limites diferentes para login, portal auth, upload, CBO search, convite, relatorios e webhooks.
  - Verify: testes/e2e simulam burst e recebem 429 nas rotas certas sem bloquear uso normal.

- [ ] Task 6: Padronizar DTOs e limites de entrada.
  - Fazer: adicionar `MaxLength`, `MinLength`, `Matches`, `IsEnum`, `IsUUID`, `IsDateString`, `IsUrl` onde couber; normalizar CPF/CNPJ/telefone/UF; trocar `body: any` por DTOs.
  - Verify: payload com campos extras, strings gigantes, UF invalida, CPF/CNPJ malformado e enum invalido retorna 400.

- [ ] Task 7: Endurecer upload e arquivos estaticos.
  - Fazer: `FileInterceptor` com `limits.fileSize`, whitelist de MIME/extensao, nome aleatorio UUID, antivirus/hook futuro, escopo por dono, pasta privada para documentos sensiveis.
  - Verify: arquivo > limite, extensao dupla, MIME incorreto e upload sem permissao retornam erro; documentos nao sao baixaveis sem autorizacao.

- [ ] Task 8: Aplicar headers, CORS e WebSocket seguros.
  - Fazer: instalar/configurar `helmet`, CSP minima, HSTS em producao, `X-Content-Type-Options`, `Referrer-Policy`; remover `origin: '*'` de gateways; usar `CORS_ORIGINS` obrigatorio em producao.
  - Verify: resposta HTTP inclui headers; origem nao permitida falha em REST e WebSocket.

- [ ] Task 9: Tratar erros, logs e exposicao de dados.
  - Fazer: exception filter global com mensagem segura; logs sem CPF/token/senha; respostas sem `passwordHash`, tokens ou dados de outra conta; mascarar CPF/CNPJ no frontend quando apropriado.
  - Verify: erro interno nao vaza stack; busca de entidade inexistente nao revela dados sensiveis; logs nao contem token bearer.

- [ ] Task 10: Criar suite de seguranca pre-producao.
  - Fazer: testes e2e para 401/403/429/400, ownership, upload, portal, admin e financial; adicionar script de audit (`npm audit --workspaces`) e scan de padroes.
  - Verify: `npm run build`, `npm run check-types`, testes e2e de seguranca e audit rodam antes do deploy.

## Done When
- [ ] Zero endpoints sensiveis com `@Public()` sem justificativa documentada.
- [ ] Todas as rotas de painel exigem login e papel correto no frontend e no backend.
- [ ] Uploads tem limite, tipo permitido e autorizacao por dono.
- [ ] Login, portal auth e uploads tem rate limit especifico.
- [ ] DTOs cobrem tamanho, formato e enum das entradas principais.
- [ ] App nao inicia em producao sem secrets obrigatorios.
- [ ] Headers e CORS/WebSocket estao restritos a dominios esperados.
- [ ] Testes de seguranca passam no pipeline local antes do deploy.

## Notes
- O risco mais urgente nao e SQL injection: o Prisma reduz esse vetor. O risco maior e Broken Access Control/IDOR por rotas publicas e filtros por `companyId`, `doctorId` ou `patientId` vindos do cliente.
- O portal `/p/:token` deve continuar publico na primeira etapa, mas apos autenticacao precisa usar apenas `PortalSessionGuard` e nunca confiar em ids enviados pelo cliente.
- O scanner automatico marcou alguns falsos positivos dentro de scripts de skills; nao tratar esses como vulnerabilidades da aplicacao.
