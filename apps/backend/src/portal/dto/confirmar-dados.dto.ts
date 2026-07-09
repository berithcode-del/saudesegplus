import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class ConfirmarDadosDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;
}
