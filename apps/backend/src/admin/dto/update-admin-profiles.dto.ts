import { Transform } from 'class-transformer';
import { CompanyStatus, DataEnvironment } from '@prisma/client';
import {
  IsEmail,
  IsIn,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

function trimRequired(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

function trimOptional(value: unknown) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function lowercaseEmail(value: unknown) {
  const trimmed = trimOptional(value);
  return typeof trimmed === 'string' ? trimmed.toLowerCase() : trimmed;
}

function onlyDigits(value: unknown) {
  if (typeof value !== 'string') return value;
  return value.replace(/\D/g, '');
}

function optionalDigits(value: unknown) {
  const digits = onlyDigits(value);
  return typeof digits === 'string' && digits.length > 0 ? digits : undefined;
}

function uppercaseUf(value: unknown) {
  const trimmed = trimOptional(value);
  return typeof trimmed === 'string' ? trimmed.toUpperCase() : trimmed;
}

export class CreateAdminCompanyDto {
  @Transform(({ value }) => trimRequired(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  razaoSocial: string;

  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nomeFantasia?: string;

  @Transform(({ value }) => onlyDigits(value))
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{14}$/, { message: 'CNPJ invalido' })
  cnpj: string;

  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @Transform(({ value }) => optionalDigits(value))
  @IsOptional()
  @IsString()
  @Matches(/^\d{8}$/, { message: 'CEP invalido' })
  cep?: string;

  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @Transform(({ value }) => uppercaseUf(value))
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'UF invalida' })
  state?: string;

  @Transform(({ value }) => lowercaseEmail(value))
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsEnum(DataEnvironment)
  environment?: DataEnvironment;
}

export class CreateAdminClinicDto {
  @Transform(({ value }) => trimRequired(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @Transform(({ value }) => onlyDigits(value))
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{14}$/, { message: 'CNPJ invalido' })
  cnpj: string;

  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @Transform(({ value }) => uppercaseUf(value))
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'UF invalida' })
  state?: string;

  @Transform(({ value }) => lowercaseEmail(value))
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsEnum(DataEnvironment)
  environment?: DataEnvironment;
}

export class CreateAdminDoctorDto {
  @Transform(({ value }) => trimRequired(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsIn(['male', 'female'])
  gender?: string;

  @Transform(({ value }) => trimRequired(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  crmNumber: string;

  @Transform(({ value }) => uppercaseUf(value))
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{2}$/, { message: 'UF do CRM invalida' })
  crmState: string;

  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @Transform(({ value }) => uppercaseUf(value))
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'UF invalida' })
  state?: string;

  @Transform(({ value }) => trimOptional(value))
  @IsOptional()
  @IsString()
  @MaxLength(200)
  specialties?: string;

  @Transform(({ value }) => lowercaseEmail(value))
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsEnum(DataEnvironment)
  environment?: DataEnvironment;
}

export class UpdateAdminDoctorDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsIn(['male', 'female']) gender?: string;
  @IsOptional() @IsString() @MaxLength(20) crmNumber?: string;
  @IsOptional() @IsString() @MaxLength(2) crmState?: string;
  @IsOptional() @IsString() @MaxLength(100) city?: string;
  @IsOptional() @IsString() @MaxLength(2) state?: string;
  @IsOptional() @IsString() @MaxLength(200) specialties?: string;
  @IsOptional() @IsString() @MaxLength(20) rqeNumber?: string;
  @IsOptional() @IsString() @MaxLength(15) phone?: string;
  @IsOptional()
  @ValidateIf((_o, value) => value !== '')
  @IsEmail()
  @MaxLength(254)
  contactEmail?: string;
  @IsOptional()
  @ValidateIf((_o, value) => value !== '')
  @IsEmail()
  @MaxLength(254)
  accessEmail?: string;
}

export class UpdateAdminCompanyDto {
  @IsOptional() @IsString() @MaxLength(150) razaoSocial?: string;
  @IsOptional() @IsString() @MaxLength(100) nomeFantasia?: string;
  @IsOptional() @IsString() @MaxLength(18) cnpj?: string;
  @IsOptional() @IsString() @MaxLength(200) address?: string;
  @IsOptional() @IsString() @MaxLength(9) cep?: string;
  @IsOptional() @IsString() @MaxLength(100) city?: string;
  @IsOptional() @IsString() @MaxLength(2) state?: string;
  @IsOptional() @IsString() @MaxLength(15) phone?: string;
  @IsOptional()
  @ValidateIf((_o, value) => value !== '')
  @IsEmail()
  @MaxLength(254)
  contactEmail?: string;
  @IsOptional()
  @ValidateIf((_o, value) => value !== '')
  @IsEmail()
  @MaxLength(254)
  accessEmail?: string;
  @IsOptional() @IsEnum(CompanyStatus) status?: CompanyStatus;
}

export class UpdateAdminClinicDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsString() @MaxLength(18) cnpj?: string;
  @IsOptional() @IsString() @MaxLength(200) address?: string;
  @IsOptional() @IsString() @MaxLength(100) city?: string;
  @IsOptional() @IsString() @MaxLength(2) state?: string;
  @IsOptional() @IsString() @MaxLength(15) phone?: string;
  @IsOptional()
  @ValidateIf((_o, value) => value !== '')
  @IsEmail()
  @MaxLength(254)
  contactEmail?: string;
  @IsOptional()
  @ValidateIf((_o, value) => value !== '')
  @IsEmail()
  @MaxLength(254)
  accessEmail?: string;
}

export class SetMatrizClinicDto {
  @IsBoolean()
  setAsMatriz: boolean;
}
