import { IsNotEmpty, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class ValidateInviteDto {
  @IsUUID()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password: string;
}
