import { IsOptional, IsString } from 'class-validator';

export class ConfirmarDadosDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;
}
