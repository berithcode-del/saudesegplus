import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateCompanyDto {
  @IsOptional() @IsString() @MaxLength(150) nomeFantasia?: string;
  @IsOptional() @IsString() @MaxLength(250) address?: string;

  @IsOptional()
  @ValidateIf((_object, value) => value !== '')
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/\D/g, '') : value,
  )
  @Matches(/^\d{8}$/)
  cep?: string;

  @IsOptional() @IsString() @MaxLength(100) city?: string;
  @IsOptional()
  @ValidateIf((_object, value) => value !== '')
  @IsString()
  @Matches(/^[A-Za-z]{2}$/)
  state?: string;

  @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @IsOptional()
  @ValidateIf((_object, value) => value !== '')
  @IsEmail()
  @MaxLength(254)
  contactEmail?: string;

}
