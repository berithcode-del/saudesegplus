# Bloco 6 — Assinatura do ASO

## Goal
Exigir um PIN pessoal seguro para a assinatura mocada e preencher o ASO com os dados profissionais, ocupacionais e exames realizados.

## Tasks
- [ ] Adicionar `Doctor.signaturePin` e migration → verificar com Prisma validate/generate.
- [ ] Criar cadastro autenticado de PIN com senha atual → verificar validação de senha e formato de 4 dígitos.
- [ ] Vincular geração, assinatura e PDF ao médico autenticado → verificar rejeição de acesso a documento alheio.
- [ ] Validar PIN na assinatura com limite de tentativas → verificar mensagens de PIN ausente/incorreto.
- [ ] Hidratar todos os placeholders usados no template → verificar ausência de placeholders residuais no HTML.
- [ ] Criar formulário de PIN e modal de assinatura → verificar feedback de erro e envio do PIN.
- [ ] Rodar lint, tipos, build e testes relevantes.

## Done When
- [ ] O PIN nunca é armazenado nem retornado em texto puro.
- [ ] Um ASO só pode ser assinado pelo médico autenticado que o gerou.
- [ ] Nome do médico, função/CBO e exames aparecem no PDF.
