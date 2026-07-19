import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusProtocolo, TipoExame } from '@prisma/client';

export class CreateProtocoloDto {
  @ApiProperty({ example: 'empresa_123' })
  @IsUUID()
  empresaId: string;

  @ApiProperty({ example: 'clinica_456' })
  @IsOptional()
  @IsUUID()
  clinicaId?: string;

  @ApiProperty({ example: 'paciente_789' })
  @IsUUID()
  pacienteId: string;

  @ApiProperty({ enum: TipoExame, example: TipoExame.ADMISSIONAL })
  @IsEnum(TipoExame)
  tipoExame: TipoExame;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observacoes?: string;
}