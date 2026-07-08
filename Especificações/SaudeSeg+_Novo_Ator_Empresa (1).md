# SaúdeSeg+ — Novo Ator Identificado: Painel da Empresa e Revisão da Arquitetura

**Versão:** 1.0
**Natureza deste documento:** registro de uma revisão estrutural na forma de pensar o produto, levantada durante o planejamento da próxima fase. Não substitui o documento de UI da Fase 1 (que continua válido como está, dado que o MVP já não contempla Portal RH), mas redesenha como esse painel deve ser pensado para a fase em que ele entrar.

---

## 1. O que mudou no raciocínio

Até aqui, o produto vinha sendo pensado a partir de três atores: **Paciente, Médico e Clínica**. A empresa contratante aparecia só como um dado vinculado ao paciente (campo "empresa" no cadastro), não como alguém que efetivamente *usa* a plataforma.

A pergunta levantada agora é estrutural: **a empresa entra como usuária ativa do sistema, com painel próprio — não só como um atributo do paciente.** Isso muda a relação entre as telas: o que antes era "Tela 3 — Paciente" como ponto de entrada único, passa a ter, em alguns casos, um ponto de entrada anterior: a **empresa**.

---

## 2. O quarto ator: Empresa

### 2.1 O que a Empresa faz, na visão levantada
- Cadastro próprio na plataforma, sem necessidade de contato direto com a clínica.
- Upload do PCMSO/PPRA (ou PGR), conforme já registrado no documento anterior — etapa de análise/liberação.
- A partir da liberação, a empresa **gera links de acesso temporário** para cada colaborador, vinculados a um exame específico (admissional, demissional, periódico etc.).
- A empresa consegue, em tese, **resolver boa parte do processo sem falar com a clínica** — exceto quando o tipo de exame exigir presença física por depender de equipamento (ex.: acuidade visual, audiometria), caso em que o colaborador é encaminhado à clínica apenas para aquela etapa específica.

### 2.2 Por que isso é, de fato, um ator novo — e não só "mais uma tela"
A diferença não é cosmética. A empresa tem uma relação com o sistema que nenhum dos três atores anteriores tem:
- Ela não é "atendida" (como o paciente) nem "presta atendimento" (como o médico) nem "opera a coleta" (como a clínica) — ela **administra um lote de colaboradores e contrata o serviço**. É, na prática, o cliente comercial da plataforma, e precisa de uma visão de gestão (quantos colaboradores, em que etapa, quais pendências) que nenhuma das outras telas foi desenhada para entregar.
- Ela é a única, entre os quatro atores, que **opera antes e de forma independente da existência de qualquer paciente específico** — uma empresa pode se cadastrar e ter seu PCMSO analisado sem que nenhum colaborador ainda exista no sistema.

---

## 3. Relação hierárquica entre os painéis (ponto central da revisão)

### 3.1 A ideia levantada, em termos diretos
O Painel da Empresa passa a ser uma **página-mãe**. O acesso do colaborador (o que hoje é tratado como "Tela 3 — Paciente") passa a ser, em determinados cenários, uma **página-filha**, acessada por um link temporário gerado pela empresa — não necessariamente um cadastro espontâneo e independente do colaborador.

Isso não elimina a Tela Paciente como existe hoje — ela continua sendo necessária como conjunto de funcionalidades (cadastro de dados, anamnese, acompanhamento de status, documentos). O que muda é **a origem do acesso**: em vez de o colaborador sempre chegar "do zero" (autocadastro independente), ele pode chegar **a partir de um convite/link já contextualizado pela empresa**, que já vem com função, tipo de exame e vínculo definidos — reduzindo fricção e erro de cadastro.

Isso, na prática, já estava parcialmente previsto: o documento de UI da Fase 1 já mencionava a opção "Tenho um convite da empresa" na tela de onboarding do paciente (§4.3.1). O que esta revisão adiciona é que esse convite agora tem uma origem própria — um painel real de empresa que o gera — e não apenas um campo conceitual a ser preenchido depois.

### 3.2 Dois modelos de acesso do colaborador, que precisam coexistir
| Modelo | Origem do acesso | Quando se aplica |
|---|---|---|
| **Direto** (já previsto na Fase 1) | Colaborador se cadastra por conta própria ou é cadastrado pelo operador na clínica (Tela 1) | Empresas sem painel próprio ainda, ou que preferem que a clínica administre o processo |
| **Via link temporário da empresa** (novo, a desenhar) | Colaborador recebe link gerado pelo Painel da Empresa, já vinculado a função/tipo de exame | Empresas com painel ativo, que preferem administrar o processo internamente, sem intermediar pela clínica |

Os dois modelos não são excludentes — o sistema precisa suportar ambos, porque nem toda empresa cliente vai querer (ou ter porte para) operar seu próprio painel.

### 3.3 Implicação técnica do link temporário
- O link não deve ser um cadastro "aberto" — ele precisa ser **um token de convite com escopo limitado**: vinculado a uma empresa específica, a uma função/CBO específica, a um tipo de exame específico, e com **validade de tempo definida** (ex.: 7 dias), evitando reutilização indevida ou repasse do link para pessoa diferente da convidada.
- Ao acessar o link, o colaborador "cai" diretamente no fluxo de cadastro já contextualizado (sem precisar escolher empresa/função manualmente) — reduzindo erro humano nessa etapa.
- Esse token precisa estar associado, desde a geração, a um e-mail/CPF esperado (se a empresa já souber quem é o convidado), para reduzir ainda mais a chance de uso por pessoa não autorizada — ponto que conecta com a preocupação de segurança/identidade já registrada no documento anterior (§1, sobre autenticação forte), agora também relevante no lado do colaborador, não só do médico.

---

## 4. Fluxo "sem contato com a clínica", exceto exames que dependem de equipamento

### 4.1 O que isso implica logicamente
Esse ponto introduz, de fato, uma bifurcação que ainda não existia claramente nos documentos anteriores: **nem todo exame precisa de presença física**, e o sistema precisa saber diferenciar isso por tipo de exame (não por colaborador ou por empresa) — alguns exames podem ser resolvidos remotamente (anamnese, teleconsulta, avaliação médica) e outros exigem ida à clínica por depender de equipamento específico (acuidade visual, audiometria, e outros que a base de regras de exame, já discutida no documento anterior, deve indicar).

### 4.2 Consequência para o fluxo do colaborador
Isso reforça e dá mais concretude a algo que já estava esboçado na Tela 3 (Sala de Espera Virtual, §4.3.4 do documento de UI), mas que agora ganha uma lógica de decisão mais clara:
- Ao classificar os exames exigidos para aquela função (vindo da base função→exame da empresa), o sistema já separa, exame por exame: **"resolvido remoto"** vs. **"exige clínica"**.
- O colaborador, pelo link da empresa, já vê desde o início: quais etapas ele resolve por conta própria (anamnese, teleconsulta) e para quais ele vai precisar comparecer a uma unidade — e, neste segundo caso, o sistema precisa indicar a clínica designada (que pode ser escolhida pela empresa entre as parceiras, ou sugerida pela plataforma por proximidade).
- Isso significa que **a clínica, nesse modelo, deixa de ser obrigatoriamente o ponto de entrada do processo** (como é hoje na Fase 1) e passa a ser **acionada pontualmente, só para a etapa que exige presença física** — uma mudança relevante na forma como a Tela 1 (Consultório) vai precisar registrar colaboradores que chegam "no meio do processo", e não do zero.

### 4.3 O que isso muda na Tela 1 (Consultório), a registrar para quando essa fase for desenhada
- A Tela 1 vai precisar lidar com pacientes que **chegam já com parte do processo concluída** (cadastro feito, anamnese feita, talvez até decisão parcial do médico já registrada remotamente) — ou seja, o check-in na clínica não é mais necessariamente "o início", pode ser "uma etapa no meio".
- Isso aponta para a necessidade de a Tela 1 mostrar, ao buscar um colaborador, **um resumo do que já foi feito remotamente** antes de iniciar a etapa presencial — para o operador não tratar esse caso como um cadastro novo.

---

## 5. O que isso muda na arquitetura geral (resumo para decisão futura)

- **Quatro atores, não três:** Empresa, Paciente/Colaborador, Médico, Clínica — cada um com seu próprio painel, mas com uma relação hierárquica entre Empresa e Paciente (mãe/filha) que não existe entre os outros pares.
- **Painel da Empresa precisa ser desenhado como uma tela própria** (não estava no documento de UI da Fase 1, que tratava isso como fora de escopo do MVP) — passa a ser uma prioridade clara de roadmap, possivelmente antes mesmo de outras funcionalidades de Fase 2 já listadas, dado que ela é pré-requisito de várias outras ideias discutidas (PCMSO/PPRA, links de convite).
- **A clínica passa de "ponto de entrada único" para "ponto de entrada condicional"** — só obrigatória quando o tipo de exame exigir presença física por equipamento. Isso tem impacto direto na máquina de estados do paciente (documento de UI, §6), que precisará de um caminho alternativo de entrada que não comece necessariamente em `AGUARDANDO_COLETA` na clínica.
- **O conceito de "convite"** já existente na Tela 3 (Fase 1) precisa evoluir de um campo simples para um sistema de tokens com escopo, validade e vínculo de identidade — não é um ajuste pequeno, é uma peça de infraestrutura nova.

---

## 6. Perguntas abertas para quando esta frente for priorizada

Estas não são decisões a tomar agora — são os pontos que vão precisar de resposta quando o Painel da Empresa entrar em desenho de UI/técnico, para não ficar pra trás:

1. Quem dentro da empresa acessa o painel — só RH, ou também gestores de área que precisam abrir admissionais para suas próprias equipes? Isso define se o painel precisa de papéis internos (RBAC dentro da própria empresa) desde o início.
2. Como a empresa escolhe/é associada a uma clínica parceira para os exames que exigem presença física — é uma escolha livre, uma indicação por proximidade geográfica, ou uma clínica fixa por contrato?
3. O que acontece se o colaborador não usar o link dentro da validade — reenvio automático, ou a empresa precisa gerar um novo manualmente?
4. A decisão médica "parcial" (feita remotamente, antes da etapa presencial) fica visível para a empresa antes da conclusão total do ASO, ou a empresa só vê o resultado final, como já é hoje? Isso tem implicação direta de privacidade/LGPD — dado clínico parcial não deveria, em princípio, ser visível para a empresa, só o resultado final de apto/inapto.
