# Visão Geral do Projeto

## Resumo Executivo
O **SaudeSeg+** é uma plataforma digital para gestão de saúde ocupacional, focada em simplificar o onboarding de empresas, agendamento de exames médicos e gestão de colaboradores. A solução centraliza processos de saúde e segurança do trabalho, garantindo conformidade com normas regulamentadoras.

## Arquitetura Geral
- **Frontend**: Aplicação web desenvolvida em React.js com TypeScript.
- **Backend**: API em Node.js (NestJS) com banco de dados PostgreSQL.
- **Banco de Dados**: PostgreSQL para armazenamento de dados estruturados.

## Fluxos Principais
1. **Onboarding de Empresas**: Cadastro inicial, upload de documentos e convite de colaboradores.
2. **Agendamentos**: Marcação de exames médicos para colaboradores.
3. **Exames**: Gestão de resultados e emissão de laudos.

## Tecnologias Utilizadas
- **Frontend**: React.js, TypeScript, Tailwind CSS.
- **Backend**: NestJS, TypeORM.
- **Banco de Dados**: PostgreSQL.
- **Autenticação**: JWT.

## Módulos Principais e Estados Atuais
| Módulo          | Estado Atual                          |
|-----------------|---------------------------------------|
| Empresas        | Implementado (com gaps em validações) |
| Colaboradores    | Cadastro via convite em desenvolvimento |
| Agendamentos    | Frontend implementado (sem integração backend) |
| Médicos         | Frontend básico (falta emissão de laudos) |