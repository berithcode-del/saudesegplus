# Bloco 6 — Assinatura do ASO

## Goal
Exigir um PIN pessoal seguro para a assinatura mocada e preencher o ASO com os dados profissionais, ocupacionais e exames realizados.

## Tasks
- [x] Adicionar `Doctor.signaturePin` e migration → verificar com Prisma validate/generate.
- [x] Criar cadastro autenticado de PIN com senha atual → verificar validação de senha e formato de 4 dígitos.
- [x] Vincular geração, assinatura e PDF ao médico autenticado → verificar rejeição de acesso a documento alheio.
- [x] Validar PIN na assinatura com limite de tentativas → verificar mensagens de PIN ausente/incorreto.
- [x] Hidratar todos os placeholders usados no template → verificar ausência de placeholders residuais no HTML.
- [x] Criar formulário de PIN e modal de assinatura → verificar feedback de erro e envio do PIN.
- [x] Rodar lint, tipos, build e testes relevantes.

## Done When
- [x] O PIN nunca é armazenado nem retornado em texto puro.
- [x] Um ASO só pode ser assinado pelo médico autenticado que o gerou.
- [x] Nome do médico, função/CBO e exames aparecem no PDF.
