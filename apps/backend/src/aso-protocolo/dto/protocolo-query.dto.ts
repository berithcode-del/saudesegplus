import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusProtocolo, TipoExame } from '@prisma/client';

export class ProtocoloQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  numeroProtocolo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  empresaId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  clinicaId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  pacienteId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  medicoId?: string;

  @ApiProperty({ enum: StatusProtocolo, required: false })
  @IsOptional()
  @IsEnum(StatusProtocolo)
  status?: StatusProtocolo;

  @ApiProperty({ enum: TipoExame, required: false })
  @IsOptional()
  @IsEnum(TipoExame)
  tipoExame?: TipoExame;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dataInicio?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dataFim?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  limit?: number = 20;
}