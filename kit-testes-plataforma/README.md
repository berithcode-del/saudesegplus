# Kit de testes - SaudeSeg+

Este kit foi criado para testar a plataforma ponta a ponta em ambiente de homologacao/producao inicial, sem usar dados reais de pacientes.

Use estes dados apenas para teste. Os CPFs, CNPJs, e-mails e telefones abaixo sao ficticios.

## Credenciais e perfis

### Administrador

Use o administrador criado no ambiente para cadastrar/aprovar os outros perfis.

- Perfil: ADMIN
- E-mail: admin@saudeseg.com
- Senha: usar a senha temporaria informada fora deste arquivo
- Acao obrigatoria: trocar a senha temporaria assim que a tela de troca estiver disponivel para ADMIN

### Medico mock

- Perfil: DOCTOR
- Nome: Dra. Marina Azevedo Lima
- E-mail: marina.azevedo.teste@saudesegplus.com
- Senha sugerida: TesteMedico@2026
- CPF ficticio: 381.904.720-19
- CRM: 123456-SP
- RQE: 98765
- Especialidade: Medicina do Trabalho
- Telefone: (11) 98888-1100
- Cidade/UF: Sao Paulo/SP
- Status esperado: precisa ficar aprovado/verificado para conseguir acessar a fila e emitir ASO
- PIN de assinatura sugerido: 246810

### Clinica/consultorio mock

- Perfil: CLINIC
- Nome: Clinica Vida Ocupacional Teste
- CNPJ ficticio: 41.582.930/0001-07
- E-mail de acesso: clinica.teste@saudesegplus.com
- Senha sugerida: TesteClinica@2026
- Telefone: (11) 3333-2200
- Endereco: Rua dos Testes, 120 - Centro
- Cidade/UF: Sao Paulo/SP

### Operador da clinica mock

- Perfil: OPERATOR
- Nome: Rafael Operador Santos
- E-mail: operador.clinica.teste@saudesegplus.com
- Senha sugerida: TesteOperador@2026
- Clinica vinculada: Clinica Vida Ocupacional Teste

### Empresa mock

- Perfil: COMPANY_ADMIN
- Razao social: Metalurgica Horizonte Seguro LTDA
- Nome fantasia: Horizonte Seguro
- CNPJ ficticio: 52.718.406/0001-33
- E-mail de acesso: empresa.teste@saudesegplus.com
- Senha sugerida: TesteEmpresa@2026
- Responsavel: Paula Fernandes Costa
- Telefone: (11) 94444-5500
- Endereco: Avenida Industrial, 450 - Galpao 3
- Cidade/UF: Guarulhos/SP
- Plano: Empresarial teste
- Status esperado: liberada/aprovada pelo ADMIN antes de convidar colaboradores

## Funcionarios mock

### Funcionario 1 - baixo risco

- Nome: Ana Paula Ribeiro
- CPF ficticio: 742.316.890-04
- Data de nascimento: 1992-04-18
- E-mail: ana.ribeiro.teste@saudesegplus.com
- Telefone: (11) 97777-1001
- Funcao: Escriturario
- CBO: 4110-05
- Tipo de exame: Admissional
- Exames esperados pelo CBO: acuidade_visual

### Funcionario 2 - medio risco

- Nome: Bruno Martins Oliveira
- CPF ficticio: 165.839.420-77
- Data de nascimento: 1987-09-03
- E-mail: bruno.oliveira.teste@saudesegplus.com
- Telefone: (11) 97777-1002
- Funcao: Tecnico em Seguranca do Trabalho
- CBO: 3221-05
- Tipo de exame: Periodico
- Exames esperados pelo CBO: audiometria, espirometria, acuidade_visual, eletrocardiograma

### Funcionario 3 - alto risco

- Nome: Carla Souza Mendes
- CPF ficticio: 509.274.681-55
- Data de nascimento: 1984-12-27
- E-mail: carla.mendes.teste@saudesegplus.com
- Telefone: (11) 97777-1003
- Funcao: Soldador
- CBO: 7232-10
- Tipo de exame: Mudanca de risco
- Exames esperados pelo CBO: audiometria, espirometria, acuidade_visual, radiografia_torax, eletrocardiograma

## PDFs para upload

Os exames dos colaboradores ficam em:

```text
kit-testes-plataforma/pdfs-exames/
```

Lista criada:

- 01-audiometria.pdf
- 02-acuidade-visual.pdf
- 03-espirometria.pdf
- 04-eletrocardiograma-ecg.pdf
- 05-eletroencefalograma-eeg.pdf
- 06-exames-laboratoriais.pdf
- 07-radiografia-torax.pdf
- 08-avaliacao-psicossocial.pdf
- 09-glicemia.pdf
- 10-aso-teste.pdf
- 11-documento-identificacao.pdf
- 12-pcmso-empresa.pdf
- 13-ppra-pgr-empresa.pdf

Os documentos obrigatorios da empresa tambem foram separados em:

```text
kit-testes-plataforma/documentos-empresa/
```

Lista criada para testar upload documental da empresa:

- empresa-pcmso.pdf
- empresa-ppra.pdf

## Roteiro de teste sugerido

1. Entrar como ADMIN.
2. Criar/aprovar a clinica mock.
3. Criar/aprovar o medico mock.
4. Criar a empresa mock e liberar a empresa.
5. Fazer upload dos documentos da empresa usando `documentos-empresa/empresa-pcmso.pdf` e `documentos-empresa/empresa-ppra.pdf`.
6. Entrar como empresa e criar convites para os 3 funcionarios.
7. Abrir cada convite como funcionario e preencher os dados solicitados.
8. Confirmar se o CBO de cada funcionario puxa os exames obrigatorios corretos.
9. Entrar como clinica/operador e registrar os exames usando os PDFs deste kit.
10. Confirmar se cada arquivo aparece no historico do funcionario e na visao do medico.
11. Entrar como medico, revisar exames/anamnese e emitir ASO.
12. Confirmar se a empresa consegue visualizar ASO emitido.
13. Confirmar se a parte financeira registra receita/repasse quando ASO e emitido.

## Pontos que voce pode estar esquecendo de testar

- Troca de senha do ADMIN apos usar senha temporaria.
- CORS entre Vercel e Railway apos novo deploy.
- Upload de PDF e upload de imagem, se a tela aceitar ambos.
- Download/visualizacao do PDF anexado pelo medico.
- Fluxo de funcionario com CBO baixo risco, medio risco e alto risco.
- Fluxo de exame adicional usando a opcao "outros".
- Aprovacao/verificacao do medico antes de ele tentar acessar fila.
- Vinculo da empresa com uma clinica.
- Regras de permissao: empresa nao deve ver dados de outra empresa.
- Logs do Railway em erro 500.
- Seed/migrations do Supabase alinhados com o Prisma antes de criar dados reais.

## Observacoes de seguranca

- Nao use estes e-mails/senhas em producao real.
- Troque qualquer senha temporaria assim que terminar o teste.
- Nao envie documentos reais de funcionarios durante esta fase.
- Depois dos testes, limpe dados mock antes de iniciar operacao oficial.
