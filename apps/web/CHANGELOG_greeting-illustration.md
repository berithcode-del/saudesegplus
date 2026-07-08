# CHANGELOG — Ilustração do card "Bom dia, Dr(a)."

## Contexto
A ilustração da referência (UiMed) é arte de stock de terceiros — não pode ser
copiada pixel a pixel por direitos autorais. Foi criada uma ilustração
**original**, na mesma composição (médica de jaleco, cabelo ruivo, prancheta,
xícara, folhas decorativas atrás, pílulas flutuando), usando só os tokens de
cor do design system (var(--accent-primary/secondary/teal)).

## Arquivos novos
- `components/dashboard/DoctorIllustration.tsx` — SVG da ilustração, isolado
  em componente próprio (reutilizável em outras telas se precisar, ex. tela
  de login do médico).

## Arquivos modificados
- `components/dashboard/GreetingSection.tsx` — reestruturado para a mesma
  composição da referência: card sem header, texto "Bom dia, Dr(a). {nome}"
  (cor de destaque em âmbar) à esquerda, ilustração ocupando a direita.
  Recebe prop opcional `name` (hoje usa placeholder "Médico(a)" — plugar o
  nome real do médico logado quando o auth estiver disponível na página).

## Pendente
Passar o nome real do médico via prop `name` em
`app/medico/dashboard/page.tsx` quando os dados do médico autenticado
estiverem disponíveis no client.
