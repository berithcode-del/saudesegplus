import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ValidateInviteDto {
  /** Token do convite (campo `token` do ExamInvite, NÃO o id do registro) */
  @IsString()
  @IsNotEmpty({ message: 'Token é obrigatório' })
  token: string;

  /** Nome completo do colaborador */
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  /** Senha para acesso futuro */
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password: string;
}
