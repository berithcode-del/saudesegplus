# SaúdeSeg+ — Especificação Funcional e Arquitetura Técnica

**Versão:** 1.0 (documento de aprofundamento a partir do briefing inicial)
**Status:** Draft para validação com stakeholders
**Domínio:** Saúde e Segurança do Trabalho (SST) — Telemedicina ocupacional

### Sumário
1. Visão Geral do Produto
2. Glossário
3. Personas e Perfis de Acesso
4. Fluxo Macro do Sistema
5. Tabela de Grau de Risco Ocupacional
6. Especificação Detalhada — Tela 1: Consultório
7. Especificação Detalhada — Tela 2: Médico
8. Especificação Detalhada — Tela 3: Paciente (App)
9. Telas/Portais Adicionais Recomendados
10. Pontos a Explorar e Validar — Aprofundamento
11. Arquitetura Técnica
12. Riscos e Pontos de Validação Prioritários

---

## 1. Visão Geral do Produto

### 1.1 Problema
Empresas precisam realizar exames ocupacionais (admissionais, periódicos, demissionais, mudança de função, retorno ao trabalho) para cumprir o **PCMSO** (Programa de Controle Médico de Saúde Ocupacional, NR-7) e emitir o **ASO** (Atestado de Saúde Ocupacional). Hoje esse processo costuma depender de:
- Agendamento manual e presencial em clínicas físicas;
- Médico do trabalho presente fisicamente ou disponibilidade limitada;
- Pouca rastreabilidade do funil paciente → exame → laudo → ASO;
- Processos redundantes para exames de baixo risco que não exigem exame físico complexo.

### 1.2 Proposta de valor
SaúdeSeg+ é uma plataforma que **desacopla a coleta de dados/exames (presencial, na clínica) da validação médica (remota, via telemedicina)**, permitindo que um médico do trabalho atenda múltiplos pacientes em múltiplas clínicas físicas parceiras sem estar presente em nenhuma delas. O paciente entra numa **fila digital**; médicos online "puxam" pacientes da fila, fazem teleconsulta, avaliam exames já coletados e emitem o ASO digital assinado.

Ganhos:
- Escala: 1 médico atende N clínicas;
- Velocidade: fila digital elimina espera presencial por médico específico;
- Compliance: rastreabilidade completa (LGPD + NR-7) e documentos assinados digitalmente (ICP-Brasil ou similar);
- Custo: clínica física não precisa ter médico do trabalho fixo, só estrutura para coleta de exames.

### 1.3 Tipos de exame ocupacional suportados (NR-7)
| Tipo | Descrição | Pode ser 100% remoto? |
|---|---|---|
| Admissional | Antes do início das atividades | Depende do risco da função (ver §5) |
| Periódico | Durante a vigência do contrato, periodicidade conforme PCMSO | Não (geralmente exige exames complementares) |
| Demissional | No encerramento do contrato | Sim, para a maioria dos cargos de baixo risco |
| Mudança de função | Quando a função muda o grau de exposição a risco | Depende |
| Retorno ao trabalho | Após afastamento ≥ 30 dias | Não (avaliação clínica presencial recomendada) |
| Monitoração pontual | Exposição a agente de risco específico | Não |

> Nota de compliance: a NR-7 e a regulamentação dos Conselhos (CFM) impõem restrições sobre quais avaliações podem ser feitas por telemedicina. Isso deve ser validado juridicamente antes do go-live (ver §11 Riscos).

---

## 2. Glossário

| Termo | Definição |
|---|---|
| ASO | Atestado de Saúde Ocupacional — documento final emitido pelo médico |
| PCMSO | Programa de Controle Médico de Saúde Ocupacional |
| Clínica / Consultório físico | Unidade parceira que coleta exames presencialmente |
| Fila digital | Lista ordenada de pacientes aguardando atendimento médico remoto |
| Profissional de apoio | Operador da clínica (técnico/enfermeiro) que insere dados/exames no sistema |
| Médico do trabalho | Profissional habilitado (CRM + especialização) que valida exames e emite ASO |
| Tenant / Empresa contratante | Empresa que contrata os exames para seus funcionários |
| Risco ocupacional | Classificação do cargo/função conforme exposição a agentes de risco |

---

## 3. Personas e Perfis de Acesso

### 3.1 Persona — Operador de Consultório (Tela 1)
- Recepcionista/técnico de enfermagem da clínica física.
- Não toma decisão clínica; opera CRM, agenda, cadastra paciente, insere resultado de equipamento, coloca paciente na fila, emite documento já assinado pelo médico.

### 3.2 Persona — Médico do Trabalho (Tela 2)
- CRM + RQE em Medicina do Trabalho (ou especialização equivalente).
- Atende remotamente, pode estar logado de qualquer lugar.
- Avalia exames, conduz teleconsulta, assina ASO digitalmente.

### 3.3 Persona — Paciente/Funcionário (Tela 3 — App mobile)
- Funcionário ou candidato a emprego de uma empresa contratante.
- Pode se autocadastrar (exames de baixo risco) ou ser cadastrado pela empresa/clínica.

### 3.4 Persona — Gestor de RH da Empresa Contratante (não mencionado no briefing original, mas necessário)
- Acompanha status de exames dos seus funcionários, recebe ASOs, gerencia PCMSO da empresa, fatura.
- **Recomendação:** adicionar uma 4ª tela/portal Web para RH (ver §9).

### 3.5 Persona — Administrador da Plataforma (operação SaúdeSeg+)
- Gerencia cadastro de clínicas parceiras, médicos, empresas contratantes, tabelas de risco, faturamento global, compliance.
- **Recomendação:** adicionar um Painel Admin/Backoffice (ver §9).

---

## 4. Fluxo Macro do Sistema

```
[Empresa contratante] --solicita exame--> [Paciente é cadastrado]
        |
        v
[Paciente chega na clínica física] --check-in--> [Operador de consultório]
        |
        v
[Coleta de exames presenciais] (PA, audiometria, acuidade visual etc.)
        |
        v
[Operador insere/sincroniza resultados] --> [Paciente entra na FILA DIGITAL]
        |
        v
[Médico online disponível] --aceita paciente da fila-->
        |
        v
[Teleconsulta + análise dos exames]
        |
        +--> [Apto] --> [Emissão do ASO assinado digitalmente]
        |
        +--> [Inapto / Apto com restrições] --> [ASO com restrição + orientação]
        |
        +--> [Necessita exame complementar] --> [Volta para fila / agenda novo exame]
        |
        v
[ASO disponível para: paciente (app), empresa (portal RH), clínica (CRM)]
```

### 4.1 Fluxo alternativo — Exame 100% remoto (baixo risco, ex.: admissional de função administrativa)
```
[Paciente baixa o app] --> [Cadastro + anamnese digital]
        |
        v
[Upload de exames complementares já existentes, se aplicável]
        |
        v
[Entra direto na fila digital, sem precisar ir à clínica física]
        |
        v
[Médico atende via app] --> [Emite ASO remotamente]
```

## 5. Tabela de Grau de Risco Ocupacional

Esse ponto foi marcado como "a explorar" no briefing original. Aprofundando:

### 5.1 Por que isso é crítico
A tabela de risco determina:
1. **Quais exames complementares são obrigatórios** para aquele cargo (ex.: audiometria para quem trabalha exposto a ruído, espirometria para exposição a poeira/produtos químicos);
2. **Se o exame pode ser 100% remoto** ou exige passagem pela clínica física;
3. **Periodicidade** dos exames periódicos (PCMSO varia de 6 meses a 2 anos dependendo do risco);
4. **Precificação** (exames de maior complexidade custam mais).

### 5.2 Estrutura de dados sugerida

**Tabela: `occupational_risk_grade`**

| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| cbo_code | string | Código CBO (Classificação Brasileira de Ocupações) — referência oficial |
| function_name | string | Nome da função (ex.: "Secretária", "Soldador") |
| risk_grade | enum | `BAIXO`, `MEDIO`, `ALTO`, `CRITICO` |
| requires_in_person | boolean | Se exige presença física obrigatória |
| required_exams | array[exam_type_id] | Lista de exames complementares obrigatórios |
| periodic_frequency_months | integer | Periodicidade do exame periódico em meses |
| nr_reference | string | Referência normativa (ex.: "NR-15 Anexo 1 — Ruído") |

**Tabela: `exam_type`**

| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| name | string | Ex.: "Audiometria", "Acuidade Visual", "Hemograma" |
| category | enum | `clinico`, `laboratorial`, `imagem`, `funcional` |
| requires_equipment | boolean | Se depende de equipamento físico |
| equipment_type | string (nullable) | Tipo de equipamento necessário |
| can_be_remote_review | boolean | Se o resultado pode ser só revisado remotamente (já coletado) |
| validity_days | integer | Validade do resultado antes de precisar repetir |

### 5.3 Exemplos de configuração

| Função (CBO) | Grau | Presencial obrigatório? | Exames obrigatórios |
|---|---|---|---|
| Secretária / Administrativo | Baixo | Não | Anamnese, opcionalmente acuidade visual |
| Operador de telemarketing | Baixo | Não | Anamnese, audiometria (exposição a headset, conforme PCMSO) |
| Motorista de empilhadeira | Médio | Sim | Acuidade visual, audiometria, exame clínico ortopédico |
| Soldador | Alto | Sim | Espirometria, audiometria, acuidade visual, exame dermatológico |
| Trabalho em altura | Crítico | Sim | Exame cardiológico, avaliação vestibular, eletrocardiograma |

### 5.4 Regra de negócio derivada
> **Regra:** o sistema só permite que um paciente entre na fila digital "remota pura" (sem passar pela clínica física) se `requires_in_person = false` para a função/CBO associada ao exame solicitado pela empresa contratante. Caso contrário, o paciente é direcionado obrigatoriamente para check-in presencial.

Essa tabela deve ser **gerenciável pelo Admin da plataforma** (não hardcoded), pois normas da NR mudam e cada empresa contratante pode ter políticas internas mais rígidas que o mínimo legal.

---

## 6. Especificação Detalhada — Tela 1: Consultório (CRM Operacional)

### 6.1 Objetivo
Ferramenta de uso do operador físico da clínica: recepção, cadastro, agendamento, coleta/inserção de exames, controle de fila, emissão de documento final já assinado pelo médico.

### 6.2 Módulos

#### 6.2.1 Cadastro de Paciente
- Dados pessoais: nome completo, CPF, data de nascimento, sexo, telefone, e-mail, endereço.
- Vínculo: empresa contratante, função/cargo (CBO), tipo de exame solicitado.
- Upload de documento de identidade (RG/CNH) — opcional, conforme política da empresa contratante.
- Validação de CPF (algoritmo de dígito verificador) e busca de duplicidade (evitar cadastro duplicado).
- Status inicial: `AGUARDANDO_COLETA`.

#### 6.2.2 Agenda
- Visualização em calendário (dia/semana) de horários disponíveis na unidade.
- Agendamento pode vir de 3 origens: (a) operador cria diretamente, (b) empresa contratante agenda via portal RH, (c) paciente agenda via app (Tela 3).
- Bloqueio de horário por tipo de exame (exames com equipamento exigem slot de sala).
- Notificação automática ao paciente (SMS/WhatsApp/push) de confirmação e lembrete.

#### 6.2.3 Check-in e Coleta de Exames
- Check-in do paciente na chegada (atualiza status para `EM_COLETA`).
- Tela de inserção de resultados por tipo de exame:
  - **Manual:** operador digita valores (ex.: PA: 120/80mmHg).
  - **Semi-automático:** integração com equipamento que exporta arquivo (CSV/PDF) que é anexado e parseado.
  - **Automático (futuro):** integração direta via porta serial/Bluetooth/API do fabricante (ver §10 Integração de Equipamentos).
- Cada exame inserido fica com timestamp e identificação do operador responsável (rastreabilidade/auditoria).
- Ao concluir a coleta de todos os exames obrigatórios da função, paciente é movido para `NA_FILA_MEDICA` (entra na fila digital).

#### 6.2.4 Painel de Fila (visão do consultório)
- Lista de pacientes da própria unidade e seus status: `Aguardando coleta`, `Em coleta`, `Na fila médica`, `Em atendimento`, `Atendido`, `Pendência`.
- Tempo de espera médio exibido.
- Alertas de SLA (ex.: paciente esperando médico há mais de X minutos).

#### 6.2.5 Emissão de Documentos
- Após validação médica, operador pode imprimir/baixar o ASO assinado para entregar fisicamente ao paciente (cópia física, se exigido pela empresa contratante).
- Histórico de documentos emitidos por paciente/empresa.

#### 6.2.6 Financeiro (visão da unidade)
- Valores cobrados por exame realizado, repasse ao médico, relatório de faturamento da unidade.
- Conciliação entre exames realizados x exames faturados à empresa contratante.

#### 6.2.7 Gestão de Equipe
- Cadastro de operadores da unidade (multi-usuário), permissões por papel (recepção vs. técnico de coleta).

### 6.3 Regras de Negócio (Tela 1)
- RN1: Paciente só entra na fila médica após todos os exames obrigatórios (definidos pela tabela de risco) estarem com resultado inserido.
- RN2: Operador não pode editar exame após o médico ter iniciado a análise (lock otimista).
- RN3: Cancelamento de atendimento exige motivo (auditoria).
- RN4: Reagendamento permitido até X horas antes (configurável por unidade).

---

## 7. Especificação Detalhada — Tela 2: Médico (Telemedicina Ocupacional)

### 7.1 Objetivo
Interface do médico do trabalho para gerenciar a fila de pacientes de múltiplas clínicas, realizar teleconsulta, revisar exames e emitir documentos validados.

### 7.2 Módulos

#### 7.2.1 Painel de Fila Médica (multi-clínica)
- Lista unificada de pacientes de **todas as clínicas parceiras** em que o médico está habilitado a atender, ordenada por tempo de espera (FIFO) ou por prioridade (configurável).
- Filtros: por tipo de exame, por unidade, por grau de risco, por empresa contratante.
- Botão "Aceitar paciente" — trava o paciente para aquele médico (evita dois médicos atendendo o mesmo paciente simultaneamente).
- Indicador visual de exames já completos vs. pendentes por paciente.

#### 7.2.2 Sala de Atendimento (Teleconsulta)
- Videochamada (WebRTC) com o paciente.
- Painel lateral com:
  - Anamnese pré-preenchida (se aplicável, vinda do app do paciente);
  - Histórico de exames anteriores do mesmo paciente (se já atendido antes na plataforma);
  - Resultados dos exames coletados na unidade física (visualização de PDF/imagem/dados estruturados);
  - Campo de anotação clínica livre.
- Gravação da chamada (opcional, com consentimento — relevante para auditoria/defesa médico-legal).

#### 7.2.3 Avaliação e Decisão
- Formulário de decisão final:
  - **Apto sem restrições**
  - **Apto com restrições** (campo de texto livre + categorização, ex.: "uso de EPI obrigatório", "restrição a trabalho noturno")
  - **Inapto** (com justificativa obrigatória)
  - **Inconclusivo / necessita exame complementar** (sistema retorna paciente para fila de coleta com a pendência especificada)
- Geração automática da minuta do ASO a partir da decisão + dados do paciente + exames.
- Assinatura digital do médico (ver §10.3 — Assinatura Eletrônica).

#### 7.2.4 Histórico e Produtividade
- Lista de pacientes atendidos pelo médico (dia/semana/mês).
- Valor a receber por atendimento realizado (se modelo de remuneração for por atendimento) — ver §6.2.6/Financeiro.
- Exportação de relatório para fins fiscais (RPA/Pessoa Jurídica).

#### 7.2.5 Disponibilidade/Escala
- Médico define janelas de disponibilidade (online/offline).
- Sistema só direciona pacientes da fila para médicos com status "disponível".

### 7.3 Regras de Negócio (Tela 2)
- RN5: Um médico só pode assumir um paciente por vez na sala de atendimento ativo (mas pode ter outros "aceitos" em espera).
- RN6: ASO só pode ser emitido após assinatura digital válida.
- RN7: Decisão "Inapto" exige dupla confirmação (modal de confirmação) por ser uma decisão de alto impacto.
- RN8: Todo acesso a dados de exame de um paciente é logado (auditoria LGPD).
- RN9: Médico só visualiza pacientes de clínicas/empresas para as quais está formalmente credenciado (evita acesso indevido a dados de saúde).

---

## 8. Especificação Detalhada — Tela 3: Paciente (App Mobile)

### 8.1 Objetivo
App para o funcionário/candidato se cadastrar, acompanhar status do exame, e — quando aplicável — realizar todo o processo remotamente.

### 8.2 Módulos

#### 8.2.1 Onboarding e Cadastro
- Cadastro via CPF + dados pessoais, ou convite direto da empresa (link/código enviado por e-mail/SMS).
- Vínculo automático à empresa contratante e à função/cargo informada (puxa a tabela de risco automaticamente).
- Aceite de termos de uso e consentimento LGPD (uso de dados de saúde é dado sensível, exige consentimento explícito e granular).

#### 8.2.2 Anamnese Digital
- Questionário de saúde pré-consulta (histórico de doenças, medicações em uso, cirurgias, hábitos).
- Pode incluir upload de exames complementares pré-existentes (ex.: paciente já tem um hemograma recente de outro laboratório).

#### 8.2.3 Agendamento
- Paciente visualiza se o exame requer ida à clínica física ou pode ser 100% remoto (baseado na tabela de risco).
- Se remoto: escolhe horário ou entra direto na fila digital.
- Se presencial: escolhe unidade física mais próxima (geolocalização) e horário.

#### 8.2.4 Acompanhamento de Status
- Linha do tempo visual: `Cadastrado` → `Exames coletados` → `Na fila` → `Em atendimento` → `Concluído`.
- Notificação push quando entra em atendimento ("o médico vai te chamar em breve").

#### 8.2.5 Sala de Espera Virtual / Teleconsulta
- Para exames remotos: paciente entra em uma "sala de espera" e é chamado via push quando o médico aceita.
- Vídeo chamada (mesmo provedor WebRTC da Tela 2).

#### 8.2.6 Documentos
- Visualização e download do ASO assinado (PDF).
- Histórico de todos os exames já realizados na plataforma.

#### 8.2.7 Privacidade e Consentimento (LGPD)
- Painel de consentimentos dados (o que foi compartilhado, com quem — empresa, médico, clínica).
- Opção de solicitar exclusão/portabilidade de dados (direito do titular, LGPD Art. 18).

### 8.3 Regras de Negócio (Tela 3)
- RN10: Paciente só pode ver seus próprios dados (isolamento total entre pacientes).
- RN11: Empresa contratante recebe apenas o **resultado final** (apto/inapto/restrição) — **não** tem acesso ao prontuário clínico detalhado, conforme sigilo médico e LGPD (ver §11).
- RN12: Cadastro sem vínculo a empresa contratante (autocadastro espontâneo) só é permitido se a plataforma oferecer também atendimento B2C — a ser decidido como modelo de negócio.

---

## 9. Telas/Portais Adicionais Recomendados (não previstos no briefing original)

O briefing definiu 3 telas, mas para o sistema funcionar de forma completa como produto comercial, recomenda-se avaliar dois componentes adicionais:

### 9.1 Portal RH (Empresa Contratante) — Web
**Por quê:** a empresa que paga pelos exames precisa de visibilidade e controle, sem depender de e-mail/planilha.
- Cadastro em lote de funcionários (importação CSV).
- Acompanhamento de status de exames de todos os funcionários (dashboard).
- Download de ASOs e relatório de PCMSO consolidado (para fiscalização do Ministério do Trabalho/auditoria).
- Alertas de exames periódicos vencendo (proativo — evita multa por não conformidade).
- Faturamento e notas fiscais.
- **Sem acesso a dados clínicos detalhados** — só ao resultado final, por questão de sigilo médico.

### 9.2 Backoffice Administrativo (Operação SaúdeSeg+) — Web
**Por quê:** alguém precisa gerenciar o cadastro de clínicas, médicos, tabela de risco, e ter visão consolidada de todo o negócio.
- Cadastro/credenciamento de clínicas parceiras e médicos (validação de CRM via API do CFM, ver §10.4).
- Gestão da tabela de grau de risco (§5) e tipos de exame.
- Métricas de negócio: tempo médio de fila, SLA por unidade, taxa de aptidão/inaptidão, faturamento consolidado.
- Gestão de disputas/reclamações.
- Auditoria de logs de acesso a dados sensíveis (compliance LGPD).

> Sem esses dois portais, o sistema fica operacionalmente incompleto: a clínica e o médico têm ferramenta, mas quem paga (empresa) e quem opera o negócio (SaúdeSeg+) não têm visibilidade.

---

## 10. Pontos a Explorar e Validar — Aprofundamento

### 10.1 Integração de Equipamentos

Aprofundando o ponto já levantado no briefing, existem 3 estratégias possíveis, **não mutuamente exclusivas** — a recomendação é suportar as três em paralelo, pois nem toda clínica parceira terá o mesmo nível de maturidade tecnológica:

| Estratégia | Como funciona | Esforço de implementação | Confiabilidade do dado |
|---|---|---|---|
| **Manual** | Operador lê o display do equipamento e digita no sistema | Baixo (já é o MVP natural) | Baixa (erro humano) |
| **Semi-automática** | Equipamento exporta arquivo (PDF/CSV/DICOM) que é importado e parseado pelo sistema | Médio | Média/Alta |
| **Automática (IoT/API)** | Integração direta via SDK do fabricante, porta serial, Bluetooth, ou API própria do equipamento | Alto (cada fabricante tem protocolo próprio) | Alta |

**Recomendação de fases:**
- **MVP (Fase 1):** manual, com campos estruturados por tipo de exame (não texto livre) para já preparar a migração futura para automático.
- **Fase 2:** semi-automática para os equipamentos mais comuns (audiômetros e espirômetros costumam exportar PDF padronizado).
- **Fase 3:** parcerias diretas com 2-3 fabricantes de equipamento mais usados no setor (avaliar fabricantes nacionais como Bioset/Contronic para SST) para integração via API.

**Padrão técnico a considerar:** avaliar suporte a **HL7 FHIR** (padrão internacional de interoperabilidade em saúde) para os resultados estruturados — facilita integração futura com laboratórios parceiros e equipamentos modernos.

### 10.2 Laboratórios Parceiros
- Para exames laboratoriais (hemograma, glicemia etc.), a integração pode ser via:
  - Recebimento de PDF/laudo por e-mail ou API do laboratório parceiro, anexado ao prontuário do paciente.
  - Webhook do laboratório notificando quando resultado fica pronto (evita polling manual).
- Mesmo modelo de dados do §5.2 (`exam_type` com `category = laboratorial`).

### 10.3 Assinatura Digital / Eletrônica do Documento
Ponto crítico de compliance, não mencionado no briefing original mas essencial:
- O ASO precisa ter valor jurídico. Opções:
  - **Certificado Digital ICP-Brasil (e-CPF do médico)** — maior validade jurídica, mas exige que o médico tenha certificado próprio (custo e fricção de adoção).
  - **Assinatura eletrônica avançada via provedor (ex.: DocuSign, Clicksign, D4Sign, Birdid)** — mais simples de integrar, validade jurídica conforme MP 2.200-2 (mesmo sem ICP-Brasil, se houver autenticação forte e trilha de auditoria).
- Recomendação: MVP com provedor de assinatura eletrônica (mais rápido de integrar via API), com plano de evolução para ICP-Brasil se exigido por clientes corporativos maiores ou por auditoria do Ministério do Trabalho.

### 10.4 Validação de Credenciais Médicas
- Antes de um médico poder atender, validar:
  - CRM ativo (não suspenso) — via consulta ao **CFM (Conselho Federal de Medicina)** ou portais estaduais de CRM.
  - RQE em Medicina do Trabalho (Registro de Qualificação de Especialista) — para garantir que o profissional pode legalmente emitir ASO.
- Esse processo pode ser manual no MVP (upload de documentos + verificação humana pelo Backoffice) e evoluir para automatizado via scraping/API pública do CFM, se disponível.

### 10.5 Telemedicina — Enquadramento Regulatório
- Validar com assessoria jurídica especializada em direito médico/sanitário:
  - Quais exames ocupacionais o **CFM permite** realizar 100% por telemedicina (Resolução CFM sobre Telemedicina, pós-pandemia).
  - Se a emissão de ASO sem exame clínico físico completo é juridicamente válida para todos os graus de risco ou só para os de baixo risco.
- Este é o ponto de **maior risco regulatório do produto** e deve ser validado **antes** de qualquer lançamento comercial, não depois.

### 10.6 LGPD e Dados Sensíveis de Saúde
- Dados de saúde são "dados sensíveis" pela LGPD (Art. 5º, II) — exigem:
  - Consentimento específico e destacado (não pode estar genérico nos termos de uso);
  - Relatório de Impacto à Proteção de Dados (RIPD) recomendado dado o volume de dados sensíveis;
  - Política de retenção e descarte de dados (por quanto tempo o prontuário fica armazenado — geralmente prontuário médico tem retenção mínima de 20 anos no Brasil, conforme CFM, o que impacta arquitetura de armazenamento);
  - Logs de acesso e trilha de auditoria completa (quem acessou qual dado, quando, por quê).
- Necessário nomear um **DPO (Data Protection Officer / Encarregado de Dados)**.

### 10.7 Modelo de Precificação e Remuneração do Médico
A ser validado com o negócio:
- Empresa contratante paga por exame realizado (modelo mais comum no setor) ou por assinatura mensal (SaaS para PCMSO completo)?
- Médico é remunerado por atendimento (fee-per-service) ou por hora disponível na plataforma?
- Clínica física recebe comissão por paciente atendido, ou taxa fixa de parceria?

### 10.8 Fila Digital — Algoritmo de Priorização
O briefing menciona "fila digital" mas não detalha a lógica. Pontos a decidir:
- FIFO puro (ordem de chegada) ou priorização por:
  - Tempo de espera já acumulado;
  - Tipo de exame (demissional pode ter SLA legal mais curto que admissional);
  - Plano/contrato da empresa (empresas com SLA premium furam fila)?
- Balanceamento entre médicos: round-robin, ou paciente escolhe (caso queira médico específico já conhecido)?
- O que acontece se nenhum médico estiver disponível (fila trava)? Necessário SLA e fallback (ex.: acionar médico de plantão, ou agendar para depois).

---

## 11. Arquitetura Técnica

### 11.1 Visão Geral da Arquitetura

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  App Paciente    │   │  Web Médico      │   │  Web Consultório │
│  (Mobile)        │   │  (PWA/SPA)       │   │  (PWA/SPA)        │
└────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │                      │                       │
         └──────────────┬───────┴───────────────────────┘
                         │ HTTPS / REST + WebSocket
                ┌────────▼─────────┐
                │   API Gateway      │
                │  (Auth, Rate-limit) │
                └────────┬─────────┘
                         │
        ┌────────────────┼────────────────────┐
        │                │                    │
┌───────▼──────┐ ┌───────▼───────┐  ┌─────────▼─────────┐
│ Serviço Core   │ │ Serviço Fila   │  │ Serviço Telemedicina│
│ (Pacientes,    │ │ Digital        │  │ (WebRTC signaling,  │
│ Exames, ASO)   │ │ (Realtime)     │  │ gravação)            │
└───────┬──────┘ └───────┬───────┘  └─────────┬─────────┘
        │                │                    │
        └────────┬───────┴────────────────────┘
                 │
       ┌─────────▼──────────┐
       │  Banco de Dados      │
       │  PostgreSQL (core)   │
       │  + Redis (fila/cache)│
       └─────────┬──────────┘
                 │
   ┌─────────────┼──────────────────────────┐
   │             │                          │
┌──▼───┐   ┌─────▼──────┐         ┌─────────▼─────────┐
│Storage│   │ Fila/Mensag.│         │ Integrações Externas│
│(S3 -  │   │ (eventos:   │         │ - Assinatura digital │
│docs,  │   │ paciente    │         │ - Equipamentos        │
│exames)│   │ entra/sai   │         │ - Laboratórios        │
└──────┘   │ da fila)    │         │ - CFM (validação CRM) │
           └────────────┘         │ - SMS/WhatsApp/Push   │
                                   │ - Gateway de pagamento │
                                   └────────────────────────┘
```

### 11.2 Stack Tecnológica Sugerida

| Camada | Opção recomendada | Justificativa |
|---|---|---|
| App Paciente (mobile) | React Native ou Flutter | Single codebase iOS/Android, equipe única |
| Web Médico / Web Consultório | React + TypeScript (SPA) | Reuso de componentes, ecossistema maduro |
| Backend / API | Node.js (NestJS) **ou** Python (Django/FastAPI) | NestJS se equipe já é JS full-stack; Django se há necessidade de ecossistema de saúde mais maduro em Python (ex.: bibliotecas HL7 FHIR) |
| Banco de dados relacional | PostgreSQL | Suporte robusto a JSON (dados de exame variáveis), confiabilidade transacional (importante em saúde) |
| Cache / Fila digital em tempo real | Redis (estruturas de fila + pub/sub) | Baixa latência, ideal para fila e notificação em tempo real |
| Comunicação em tempo real | WebSocket (Socket.IO ou nativo) | Necessário para atualização de status da fila e chamadas de vídeo |
| Vídeo chamada | WebRTC com provedor gerenciado (Daily.co, Twilio Video, ou Agora) | Evita reinventar infraestrutura de sinalização/TURN/STUN; provedores gerenciados aceleram MVP |
| Armazenamento de arquivos | S3 (AWS) ou equivalente, com criptografia em repouso | Documentos médicos exigem armazenamento seguro e auditável |
| Mensageria assíncrona/eventos | RabbitMQ ou Amazon SQS | Desacopla serviços (ex.: emissão de ASO dispara evento para notificação) |
| Autenticação | OAuth2/OIDC (ex.: Auth0, Keycloak, ou implementação própria com JWT) | Multi-perfil (paciente, médico, operador, RH, admin) exige RBAC robusto |
| Assinatura digital | Integração via API com provedor (Clicksign, D4Sign, ou Birdid) | Ver §10.3 |
| Infraestrutura/Cloud | AWS, GCP ou Azure (qualquer um com certificações de compliance em saúde) | Necessário avaliar certificações HIPAA-like / ISO 27001 do provedor |
| Observabilidade | Datadog, Grafana+Prometheus, ou Sentry para erros | Essencial em sistema de saúde — qualquer falha precisa ser detectada rápido |

> **Nota:** a escolha entre Node/NestJS vs Python/Django depende mais da equipe disponível do que de limitação técnica — ambos atendem bem o caso de uso.

### 11.3 Modelo de Dados (Entidades Principais)

```
COMPANY (empresa contratante)
 ├── id, name, cnpj, plan_type, created_at

EMPLOYEE / PATIENT
 ├── id, company_id (FK, nullable se B2C), cpf, name, birth_date,
 │   function_cbo_code (FK -> occupational_risk_grade), phone, email,
 │   status (enum), created_at

OCCUPATIONAL_RISK_GRADE  [detalhado em §5.2]
EXAM_TYPE                [detalhado em §5.2]

EXAM_REQUEST (solicitação de exame — admissional/periódico/demissional)
 ├── id, patient_id (FK), company_id (FK), exam_purpose (enum:
 │   admissional/periodico/demissional/mudanca_funcao/retorno),
 │   status (enum: AGUARDANDO_COLETA, EM_COLETA, NA_FILA_MEDICA,
 │   EM_ATENDIMENTO, CONCLUIDO, CANCELADO),
 │   clinic_id (FK, nullable se 100% remoto), created_at, updated_at

EXAM_RESULT (resultado individual de cada exame complementar)
 ├── id, exam_request_id (FK), exam_type_id (FK), value_structured (JSON),
 │   attachment_url (nullable), collected_by_user_id (FK operador),
 │   collected_at, source (enum: manual/semi_auto/auto)

QUEUE_ENTRY (fila digital)
 ├── id, exam_request_id (FK), entered_queue_at, priority_score,
 │   assigned_doctor_id (FK, nullable), assigned_at, status

TELECONSULTATION
 ├── id, exam_request_id (FK), doctor_id (FK), started_at, ended_at,
 │   video_session_id, recording_url (nullable), clinical_notes (texto, criptografado)

ASO_DOCUMENT
 ├── id, exam_request_id (FK), doctor_id (FK), decision (enum:
 │   apto/apto_com_restricao/inapto/inconclusivo),
 │   restriction_notes (nullable), pdf_url, signature_provider_id,
 │   signed_at, valid_until

CLINIC (unidade física parceira)
 ├── id, name, cnpj, address, lat, lng, active

DOCTOR
 ├── id, name, crm_number, crm_state, rqe_number, specialties,
 │   credential_validated_at, status (online/offline), clinics_authorized (M:N)

USER_ACCOUNT (genérico para login — paciente, operador, médico, RH, admin)
 ├── id, role (enum), email, password_hash, mfa_enabled, last_login_at

AUDIT_LOG
 ├── id, user_id (FK), action, resource_type, resource_id, timestamp, ip_address
```

### 11.4 Pontos de Atenção Arquitetural

#### 11.4.1 Multi-tenancy
- O sistema é multi-tenant por natureza (várias empresas contratantes, várias clínicas, vários médicos).
- Recomenda-se **isolamento lógico** (todas as tabelas com `company_id`/`clinic_id` e políticas de Row-Level Security no PostgreSQL) em vez de banco separado por tenant — mais simples de manter no estágio inicial, com possibilidade de evoluir para isolamento físico para clientes enterprise que exigirem.

#### 11.4.2 Tempo real (fila digital)
- A fila digital deve ser implementada com **Redis (sorted sets)** para ordenação eficiente por prioridade/tempo de espera, com WebSocket notificando médicos e pacientes em tempo real sobre mudanças de posição/status — evita polling constante do frontend.

#### 11.4.3 Segurança de dados de saúde
- Criptografia em repouso (at-rest) para todos os campos de dados clínicos sensíveis (`clinical_notes`, `exam_result.value_structured`).
- Criptografia em trânsito (TLS 1.2+) em toda comunicação.
- Segregação de acesso: serviço de "Core" que lida com dados clínicos deve ter API interna separada do serviço que lida com dados financeiros/RH, para limitar superfície de exposição.
- MFA obrigatório para perfis médico e admin (dados de saúde justificam camada extra de autenticação).

#### 11.4.4 Disponibilidade e Resiliência
- A teleconsulta é o ponto mais crítico de UX — recomenda-se fallback automático: se WebRTC falhar, oferecer reconexão automática ou fallback para ligação telefônica tradicional (relevante em zonas de conectividade instável, comum em algumas regiões/clínicas do interior).
- A fila digital deve sobreviver a reinício de serviço sem perder pacientes na fila (Redis com persistência habilitada, ou fila espelhada também no Postgres como fonte de verdade).

#### 11.4.5 Integração de equipamentos (arquitetura)
- Para a fase de integração semi-automática (§10.1), recomenda-se um **serviço de ingestão de arquivos** dedicado: clínica faz upload de PDF/CSV do equipamento → serviço de parsing (OCR para PDFs não estruturados, parser direto para CSV) → grava em `exam_result.value_structured` → dispara evento de "exame coletado".
- Para integração automática futura (Fase 3), avaliar arquitetura de **gateway IoT local** na clínica (mini-servidor/appliance que fala com os equipamentos via protocolo proprietário e expõe uma API REST padronizada para a nuvem) — evita expor cada equipamento físico diretamente à internet.

### 11.5 Roadmap Técnico Sugerido (Fases)

| Fase | Escopo | 
|---|---|
| **MVP** | Tela Consultório (cadastro, agenda, inserção manual de exame), Tela Médico (fila simples + teleconsulta + emissão ASO com assinatura eletrônica básica), Tela Paciente (cadastro + acompanhamento de status). Banco único, sem multi-região. |
| **Fase 2** | Portal RH, integração semi-automática de equipamentos (upload + parsing), integração com 1-2 laboratórios parceiros, validação manual de CRM. |
| **Fase 3** | Backoffice administrativo completo, fila digital com priorização avançada, integração automática de equipamentos (gateway IoT), assinatura ICP-Brasil opcional, validação automatizada de CRM via API do CFM. |
| **Fase 4** | Multi-região/alta disponibilidade, BI/analytics avançado para empresas contratantes, expansão para novos tipos de exame/especialidades. |

---

## 12. Riscos e Pontos de Validação Prioritários

Antes de avançar para desenvolvimento, os seguintes pontos devem ser validados com especialistas (jurídico/regulatório e médico):

1. **Validação jurídica do enquadramento de telemedicina ocupacional** — quais exames podem legalmente ser 100% remotos segundo CFM (maior risco do projeto).
2. **Definição final da tabela de risco** com um médico do trabalho consultor (a tabela do §5 é um ponto de partida, não definitiva).
3. **Modelo de assinatura digital** a ser adotado (eletrônica simples vs. ICP-Brasil) — validar com clientes-alvo (empresas grandes podem exigir ICP-Brasil).
4. **Política de retenção de dados clínicos** (mínimo legal de guarda de prontuário) e adequação à LGPD, incluindo nomeação de DPO.
5. **Modelo de precificação/remuneração** (médico, clínica, plataforma) — impacta diretamente o desenho do módulo financeiro.
6. **Disponibilidade de médicos online** suficiente para evitar fila travada — risco operacional que pode comprometer a experiência mesmo com produto tecnicamente pronto.
