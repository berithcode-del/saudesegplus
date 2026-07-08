# SaúdeSeg+ — Especificação de Interface e Funcional — Tela 4 (Painel da Empresa)

**Versão:** 1.0
**Contexto:** Este documento detalha a Tela 4, introduzida na revisão arquitetural. A Empresa atua como o quarto ator da plataforma, gerenciando convites, cadastros de funcionários e documentações (PCMSO/PPRA).

---

## 1. Objetivo da Tela

Interface web (Dashboard) de autoatendimento para o "Cadastrador" (gestor/RH da empresa cliente). Através desse painel, a empresa insere seus dados, faz upload dos laudos exigidos e convida colaboradores para exames sem a necessidade de intervenção imediata da clínica, exceto para as etapas presenciais dos exames.

---

## 2. Estrutura de Navegação (UI)

Layout padrão com barra lateral fixa (sidebar) e área principal.

**Sidebar:**
- Dashboard (Painel Geral)
- Solicitações de Exame (Colaboradores)
- Documentos (PCMSO/PPRA)
- Configurações (Dados da Empresa)

---

## 3. Fluxos de Uso e Componentes

### 3.1 EMP-01: Onboarding e Cadastro da Empresa
**Descrição:** Processo de criação da conta de empresa na plataforma.
- **Passo 1:** O cadastrador insere e-mail, telefone, e CNPJ.
- **Passo 2:** Validação automática de CNPJ via API pública.
- **Passo 3:** O usuário acessa a tela de "Documentos" para envio inicial de PCMSO e PPRA/PGR.
- **Status Inicial:** A empresa inicia como `cadastro_incompleto` e transita para `em_analise` ao fazer o upload dos documentos, e depois `liberada` quando a equipe médica da clínica valida.

### 3.2 EMP-02: Geração de Convites (Solicitação de Exame)
**Descrição:** Criação de um link temporário para o funcionário realizar seu exame.
- O botão "Nova Solicitação de Exame" abre um formulário.
- **Campos:** Nome do colaborador, CPF (ou e-mail), Função (CBO mapeado nos documentos) e Tipo de Exame (admissional, periódico, etc.).
- **Processamento:** O sistema pré-calcula os exames exigidos e divide entre "remotos" e "presenciais" (indicando a clínica atribuída automaticamente pela geolocalização da empresa).
- **Saída:** Um token de convite (`EXAM_INVITE`) é gerado, enviado ao paciente e passa a constar na lista de solicitações.

### 3.3 EMP-03: Dashboard e Acompanhamento de Status
**Descrição:** Visão de gestão (quantos colaboradores, em que etapa).
- **Lista de Solicitações:** Tabela exibindo os colaboradores, função, exame, e *status* (Convite enviado, Convite aberto, Exame em andamento, Concluído).
- **Timeline de Eventos:** Ao clicar em um card de colaborador, um painel lateral exibe uma linha do tempo (e.g. `Link enviado`, `Link aberto`, `Exame iniciado`, `Concluído`).
- **Privacidade:** A timeline e os resultados exibem apenas progressões operacionais e o parecer final (Apto/Inapto), mantendo sigilo de todos os dados e prontuários médicos.
- **Convites expirados:** Caso o prazo (ex: 7 dias) expire, a empresa deve gerar um novo convite manualmente, o sistema não reenvia.

---

## 4. Requisitos Técnicos e Integração

- **Banco de Dados (Prisma):** Necessita do enum `Role.COMPANY_ADMIN`, da tabela `Company` expandida, da nova tabela de token `ExamInvite` e eventos `ExamTimelineEvent`.
- **WebSocket:** Canal `company:{id}` para atualizar a timeline em tempo real conforme as transições da máquina de estado ocorrem na Clínica/Médico.
- **Segurança:** Sem MFA obrigatório nesta fase para a Empresa. Acesso baseado em JWT. Apenas o "Cadastrador" tem acesso (papel único por empresa).
