# Módulo Empresas

## Responsabilidade
Gerenciar o cadastro de empresas, incluindo onboarding, convites de colaboradores e upload de documentos obrigatórios.

## Estrutura de Componentes e Rotas
- **Rotas**:
  - `/empresas` (listagem)
  - `/empresas/[id]` (detalhes)
  - `/empresas/onboarding` (cadastro inicial)

- **Componentes Principais**:
  - `CompanyOnboardingForm`
  - `CompanyDocumentsUpload`
  - `EmployeesInviteTable`

## Fluxos de Dados
1. **Onboarding**: Cadastro inicial → Upload de documentos → Convite de colaboradores.
2. **Convites**: Envio de e-mails para colaboradores com link de cadastro.
3. **Upload de Documentos**: Validação de arquivos (CNPJ, contrato social, etc.).

## Interações com Outras Funcionalidades
- **Colaboradores**: Cadastro via convites gerados pelo módulo Empresas.
- **Agendamentos**: Empresas podem visualizar agendamentos de seus colaboradores.

## Estado Atual e Gaps
- **Implementado**: Onboarding básico, upload de documentos.
- **Gaps**: Validação de documentos, notificações automáticas para convites.