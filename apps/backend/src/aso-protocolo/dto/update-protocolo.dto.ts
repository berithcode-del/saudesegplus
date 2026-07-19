import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusProtocolo, TipoExame } from '@prisma/client';

export class UpdateProtocoloDto {
  @ApiProperty({ enum: StatusProtocolo, required: false })
  @IsOptional()
  @IsEnum(StatusProtocolo)
  status?: StatusProtocolo;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  medicoId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  pacienteId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  clinicaId?: string;

  @ApiProperty({ enum: TipoExame, required: false })
  @IsOptional()
  @IsEnum(TipoExame)
  tipoExame?: TipoExame;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiProperty({ required: false, type: 'array', items: { type: 'object' } })
  @IsOptional()
  documentos?: Array<{ id: string; tipo: string; url: string; data: string; descricao?: string }>;
}