import { Transform } from 'class-transformer';
import { IsNotEmpty, IsUUID, Matches } from 'class-validator';

export class AuthPortalDto {
  @IsUUID()
  @IsNotEmpty()
  token: string;

  @Transform(({ value }) => typeof value === 'string' ? value.replace(/\D/g, '') : value)
  @Matches(/^\d{11}$/)
  cpf: string;

  @Matches(/^(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})$/)
  birthDate: string;
}
