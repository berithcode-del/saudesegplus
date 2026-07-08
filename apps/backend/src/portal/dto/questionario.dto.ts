import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class QuestionarioDto {
  @IsOptional()
  @IsString()
  queixas?: string;

  @IsOptional()
  @IsString()
  doencasPrevias?: string;

  @IsOptional()
  @IsString()
  medicamentosEmUso?: string;

  @IsOptional()
  @IsString()
  alergiasConhecidas?: string;

  @IsOptional()
  @IsString()
  cirurgiasPrevias?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsString()
  tabagismo?: string;

  @IsOptional()
  @IsString()
  tabagismoDetalhe?: string;

  @IsOptional()
  @IsString()
  alcool?: string;

  @IsOptional()
  @IsString()
  alcoolDetalhe?: string;

  @IsOptional()
  @IsString()
  atividadeFisica?: string;

  @IsOptional()
  @IsString()
  sono?: string;

  @IsOptional()
  @IsBoolean()
  declaracaoVeracidade?: boolean;
}
