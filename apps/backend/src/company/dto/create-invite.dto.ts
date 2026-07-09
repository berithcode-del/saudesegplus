import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateInviteDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/\D/g, '') : value)
  @Matches(/^\d{11}$/, { message: 'CPF invalido' })
  expectedCpf: string;

  @IsEmail()
  @MaxLength(254)
  expectedEmail: string;

  @IsOptional()
  @IsDateString()
  expectedBirthDate?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  roleFunction: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-?\d{2}$/)
  roleFunctionCboCode?: string;

  @IsString()
  @IsIn(['admissional', 'periodico', 'demissional', 'mudanca_funcao', 'retorno'])
  examType: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  collaboratorName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  expiresInDays?: number;
}
