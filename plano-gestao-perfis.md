# Gestão simples de perfis

## Objetivo
Permitir a atualização dos contatos usados no dia a dia, mantendo dados cadastrais bloqueados nos perfis de médico, empresa e clínica. Correções cadastrais serão feitas diretamente pelo administrador.

## Experiência nos perfis
- Dados cadastrais aparecem apenas para consulta, sem campo de edição.
- Telefone, e-mail de contato e outros dados operacionais permitidos ficam editáveis.
- O rodapé exibe: “Para alterar informações cadastrais, entre em contato com o administrador da plataforma.”
- Não haverá fluxo interno de solicitação, aprovação ou envio de documentos nesta fase.

## Permissões

### Médico
- Editáveis: telefone, e-mail de contato, cidade e estado.
- Somente leitura: nome, CRM, estado do CRM, RQE e e-mail de acesso.

### Empresa
- Editáveis: telefone, e-mail de contato, endereço, CEP, cidade, estado e nome fantasia.
- Somente leitura: CNPJ e razão social.

### Clínica
- Editáveis: telefone, e-mail de contato, endereço, cidade e estado.
- Somente leitura: CNPJ, razão social/nome cadastral e e-mail de acesso.

### Administrador
- Pode editar todos os dados de médicos, empresas e clínicas.
- Pode corrigir e-mail de acesso, CRM, RQE, CNPJ, razão social e demais campos cadastrais.
- O sistema deve validar duplicidade de e-mail, CRM e CNPJ antes de salvar.

## Tarefas
- [x] Adicionar telefone e e-mail de contato ao perfil do médico no banco e na API. Verificar: médico consulta e atualiza ambos.
- [x] Criar contratos explícitos de edição para cada tipo de perfil. Verificar: a API ignora ou rejeita campos não permitidos.
- [x] Remover a edição de CNPJ e razão social do perfil da empresa. Verificar: aparecem como informação, sem controle editável.
- [x] Confirmar CNPJ e nome cadastral como somente leitura no perfil da clínica. Verificar: apenas contatos e endereço são enviados ao salvar.
- [x] Manter CRM, RQE, nome e e-mail de acesso somente leitura no perfil médico. Verificar: somente contatos, cidade e estado são enviados.
- [x] Adicionar o aviso de contato com o administrador no rodapé dos três perfis. Verificar: mensagem aparece junto aos dados cadastrais bloqueados.
- [x] Completar a edição administrativa de médicos com telefone, e-mails, CRM, RQE e dados pessoais. Verificar: alterações persistem nas tabelas corretas.
- [x] Completar a edição administrativa de empresas com telefone, e-mails, CNPJ, razão social e endereço. Verificar: alterações persistem e duplicidades são bloqueadas.
- [x] Completar a edição administrativa de clínicas com telefone, e-mails, CNPJ, nome e endereço. Verificar: alterações persistem e duplicidades são bloqueadas.
- [x] Testar permissões, validações, compilação e os três fluxos de edição. Verificar: perfis comuns não alteram dados bloqueados nem por chamada direta.

## Ordem recomendada
1. Banco e APIs.
2. Perfis de médico, empresa e clínica.
3. Telas administrativas.
4. Validações e testes.

## Concluído quando
- [x] Contatos podem ser mantidos atualizados pelo próprio perfil.
- [x] Dados cadastrais não possuem edição fora do painel administrativo.
- [x] O administrador consegue editar todos os campos necessários.
- [x] E-mail, CRM e CNPJ não aceitam duplicidade.
