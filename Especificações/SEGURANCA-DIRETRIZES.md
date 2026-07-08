# Diretrizes de Segurança - SaúdeSeg Plus

Este documento serve como um guia vivo das implementações e políticas de segurança da aplicação. Ele deve ser atualizado conforme o sistema cresce.

## 1. Proteção contra Saturação (Rate Limiting)
- **Implementação Base**: Utilização do `@nestjs/throttler`.
- **Configuração Atual**: 120 requisições por 60 segundos por IP.
- **Objetivo**: Evitar ataques de DDoS de camada 7 (HTTP Flood) e Brute Force em rotas de autenticação sem prejudicar a experiência de Single Page Applications (SPA), que tendem a carregar múltiplos recursos simultaneamente.
- **Evolução Futura**: Criar Throttlers específicos para rotas críticas (ex: `/api/auth/login` restrito a 5 tentativas por minuto).

## 2. Segurança de WebSockets (Socket.io)
- **Implementação Base**: Uso de JWT Authentication no ato da conexão (`auth: { token: '...' }`).
- **Política de Namespaces**: Os sockets são separados por contextos lógicos (`/company`, `/queue`).
- **Guards Restritivos**: Eventos sensíveis (como `join_company` e `accept_patient`) possuem validação estrita. Não basta saber o ID da sala; o token do usuário deve ter permissão explícita de acesso àquele recurso.

## 3. Gestão de Chaves de API e Segredos (Environment)
- **Política Strict**: Nenhuma chave de API real (Daily.co, Resend, AWS, Clicksign, etc.) pode ser "hardcoded" (chumbada) no código fonte ou persistida no GitHub.
- **Frontend vs Backend**: 
  - Variáveis públicas (`NEXT_PUBLIC_`) do frontend jamais podem conter senhas ou tokens secretos, pois ficarão visíveis no bundle enviado ao navegador do cliente.
  - O Backend é a única camada de confiança ("Source of Truth") responsável por assinar requisições com integrações terceiras.

## 4. Autenticação e Autorização (RBAC)
- **JWT Guards**: A aplicação utiliza um `APP_GUARD` global (`JwtAuthGuard`), significando que a abordagem padrão é **Closed by Default** (Tudo é restrito, exceto o que explicitamente receber a anotação `@Public()`).
- **Roles**: Implementar Guards adicionais (`RolesGuard`) para diferenciar privilégios (Paciente, Médico, Clínica Administrativa e Empresa RH).

## 5. Prevenção a Injeção e Validação de Dados
- **ValidationPipe**: Todo o tráfego HTTP de entrada passa pelo `ValidationPipe` do NestJS (`whitelist: true`), descartando dados que não constam no DTO e mitigando ataques de *Mass Assignment*.
- **Prisma ORM**: O acesso ao banco previne naturalmente SQL Injection.

## 6. Prevenção de Saturação por Payloads (Massive Payloads)
- **Implementação Base**: Configuração global do limitador de corpo de requisições no `main.ts` usando `express.json({ limit: '1mb' })` e `express.urlencoded({ limit: '1mb', extended: true })`.
- **Objetivo**: Prevenir que envios maliciosos de formulários com megabytes ou gigabytes de texto tentem travar o parser JSON e estourar a memória do servidor Node.js (V8 Heap Out of Memory).
- **Validação Específica**: Em DTOs com strings (ex: Observações médicas), utilizar o decorator `@MaxLength(1000)` para proibir que strings com dezenas de milhares de caracteres cheguem até o banco de dados.

## 7. Configurações de CORS e Headers (Helmet)
- **CORS Dinâmico**: Habilitado no `main.ts` lendo a variável `CORS_ORIGINS`. Na produção, rejeita chamadas feitas a partir de domínios não autorizados.
- **Evolução Futura**: Integrar biblioteca `Helmet` para configurar headers essenciais de segurança (HSTS, X-Frame-Options, CSP, etc.).
