import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateInviteDto {
  /**
   * CPF do colaborador esperado (vincula o token a uma identidade).
   * Obrigatório: sem ele, o cadastro do colaborador falha mais tarde
   * (ColaboradorService exige CPF e e-mail do convite).
   */
  @IsString()
  @IsNotEmpty({ message: 'CPF do colaborador é obrigatório' })
  expectedCpf: string;

  /** E-mail do colaborador para envio do link — obrigatório (ver acima) */
  @IsEmail({}, { message: 'E-mail do colaborador inválido' })
  expectedEmail: string;

  /** Data de Nascimento do colaborador */
  @IsOptional()
  @IsString()
  expectedBirthDate?: string;

  /** Código CBO da função do colaborador (vindo da análise do PCMSO) */
  @IsString()
  @IsNotEmpty({ message: 'Função (CBO) é obrigatória' })
  roleFunction: string;

  /** Código numérico CBO (ex: "7232-10"), extraído da tabela OccupationalRisk */
  @IsOptional()
  @IsString()
  roleFunctionCboCode?: string;

  /** Tipo de exame: admissional | periodico | demissional | mudanca_funcao | retorno */
  @IsString()
  @IsNotEmpty({ message: 'Tipo de exame é obrigatório' })
  examType: string;

  /** Nome do colaborador (opcional, para exibição no painel) */
  @IsOptional()
  @IsString()
  collaboratorName?: string;

  /** Validade do convite em dias (padrão: 7) */
  @IsOptional()
  @IsInt()
  @Min(1)
  expiresInDays?: number;
}
