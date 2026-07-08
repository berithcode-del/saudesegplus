# CHANGELOG — Ilustrações reais no card "Bom dia, Dr(a)."

## Contexto
Você forneceu duas ilustrações originais (line-art, médico e médica com
xícara/café) para substituir o SVG genérico gerado na entrega anterior.

## Arquivos novos
- `public/illustrations/doctor-male.png`
- `public/illustrations/doctor-female.png`

## Arquivos modificados
- `components/dashboard/GreetingSection.tsx` — agora usa `next/image` pra
  renderizar a ilustração real, com nova prop `gender?: 'male' | 'female'`
  (default `'female'`) além da prop `name` já existente.

## Arquivo removido (órfão da entrega anterior)
- `components/dashboard/DoctorIllustration.tsx` — o SVG gerado anteriormente
  não é mais usado e pode ser deletado do projeto.

## Pendente
- Plugar `gender` real do médico autenticado (hoje hardcoded como
  `'female'` no default) quando o cadastro do médico tiver esse campo.
- Decidir se o azul do jaleco nas ilustrações fica como acento secundário
  do design system ou se vale recolorir pra `var(--accent-primary)` (roxo)
  pra bater 100% com o resto da paleta.
