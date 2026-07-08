import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty({ message: 'CNPJ é obrigatório' })
  cnpj: string;

  @IsString()
  @IsNotEmpty({ message: 'Razão social é obrigatória' })
  razaoSocial: string;

  @IsOptional()
  @IsString()
  nomeFantasia?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  cep?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  /** E-mail do cadastrador (para criar o UserAccount) */
  @IsEmail({}, { message: 'E-mail de contato inválido' })
  contactEmail: string;

  @IsOptional()
  @IsString()
  password?: string;
}
