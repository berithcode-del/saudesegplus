import { CompanyStatus } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class UpdateAdminDoctorDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() crmNumber?: string;
  @IsOptional() @IsString() crmState?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() specialties?: string;
  @IsOptional() @IsString() rqeNumber?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional()
  @ValidateIf((_o, value) => value !== '')
  @IsEmail()
  contactEmail?: string;
  @IsOptional()
  @ValidateIf((_o, value) => value !== '')
  @IsEmail()
  accessEmail?: string;
}

export class UpdateAdminCompanyDto {
  @IsOptional() @IsString() razaoSocial?: string;
  @IsOptional() @IsString() nomeFantasia?: string;
  @IsOptional() @IsString() cnpj?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() cep?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional()
  @ValidateIf((_o, value) => value !== '')
  @IsEmail()
  contactEmail?: string;
  @IsOptional()
  @ValidateIf((_o, value) => value !== '')
  @IsEmail()
  accessEmail?: string;
  @IsOptional() @IsEnum(CompanyStatus) status?: CompanyStatus;
}

export class UpdateAdminClinicDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() cnpj?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional()
  @ValidateIf((_o, value) => value !== '')
  @IsEmail()
  contactEmail?: string;
  @IsOptional()
  @ValidateIf((_o, value) => value !== '')
  @IsEmail()
  accessEmail?: string;
}
