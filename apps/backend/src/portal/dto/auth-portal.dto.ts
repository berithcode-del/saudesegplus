import { IsString, IsNotEmpty } from 'class-validator';

export class AuthPortalDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  cpf: string;

  @IsString()
  @IsNotEmpty()
  birthDate: string;
}
