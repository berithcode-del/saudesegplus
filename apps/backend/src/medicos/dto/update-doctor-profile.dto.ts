import { IsEmail, IsOptional, IsString, ValidateIf } from 'class-validator';

export class UpdateDoctorProfileDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @ValidateIf((_object, value) => value !== '')
  @IsEmail()
  contactEmail?: string;
}
