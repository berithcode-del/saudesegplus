import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class QuestionarioDto {
  @IsOptional() @IsString() @MaxLength(2000) queixas?: string;
  @IsOptional() @IsString() @MaxLength(2000) doencasPrevias?: string;
  @IsOptional() @IsString() @MaxLength(2000) medicamentosEmUso?: string;
  @IsOptional() @IsString() @MaxLength(2000) alergiasConhecidas?: string;
  @IsOptional() @IsString() @MaxLength(2000) cirurgiasPrevias?: string;
  @IsOptional() @IsString() @MaxLength(2000) observacoes?: string;
  @IsOptional() @IsString() @IsIn(['nao', 'sim', 'ex']) tabagismo?: string;
  @IsOptional() @IsString() @MaxLength(500) tabagismoDetalhe?: string;
  @IsOptional() @IsString() @IsIn(['nao', 'social', 'frequente']) alcool?: string;
  @IsOptional() @IsString() @MaxLength(500) alcoolDetalhe?: string;
  @IsOptional() @IsString() @MaxLength(100) atividadeFisica?: string;
  @IsOptional() @IsString() @MaxLength(100) sono?: string;
  @IsOptional() @IsBoolean() declaracaoVeracidade?: boolean;
}
