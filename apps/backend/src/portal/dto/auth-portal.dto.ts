import { Transform } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsUUID, Matches } from 'class-validator';

export class AuthPortalDto {
  @IsUUID()
  @IsNotEmpty()
  token: string;

  @Transform(({ value }) => typeof value === 'string' ? value.replace(/\D/g, '') : value)
  @Matches(/^\d{11}$/)
  cpf: string;

  @IsDateString()
  birthDate: string;
}
