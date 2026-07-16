import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class QuestionarioDto {
  @IsOptional() @IsString() @MaxLength(2000) queixas?: string;
  @IsOptional() @IsString() @MaxLength(2000) doencasPrevias?: string;
  @IsOptional() @IsString() @MaxLength(2000) medicamentosEmUso?: string;
  @IsOptional() @IsString() @MaxLength(2000) alergiasConhecidas?: string;
  @IsOptional() @IsString() @MaxLength(2000) cirurgiasPrevias?: string;
  @IsOptional() @IsString() @MaxLength(2000) observacoes?: string;
  @IsOptional() @IsString() @IsIn(['nao', 'ex_fumante', 'fumante']) tabagismo?: string;
  @ValidateIf((o) => o.tabagismo === 'ex_fumante' || o.tabagismo === 'fumante')
  @IsString() @IsNotEmpty() @MaxLength(500) tabagismoDetalhe?: string;
  @IsOptional() @IsString() @IsIn(['nao', 'social', 'frequente']) alcool?: string;
  @IsOptional() @IsString() @MaxLength(500) alcoolDetalhe?: string;
  @IsOptional() @IsString() @IsIn(['nao_informado', 'nao', 'ocasional', 'regular']) atividadeFisica?: string;
  @IsOptional() @IsString() @MaxLength(100) sono?: string;
  @IsBoolean() declaracaoVeracidade!: boolean;
}
