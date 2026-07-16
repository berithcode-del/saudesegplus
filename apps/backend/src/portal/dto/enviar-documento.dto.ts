import { IsIn, IsNotEmpty, IsUrl, MaxLength } from 'class-validator';

export class EnviarDocumentoDto {
  @IsNotEmpty()
  @IsIn(['rg', 'cnh', 'foto', 'outro'])
  tipo: string;

  @IsNotEmpty()
  @MaxLength(1000)
  @IsUrl({ require_protocol: true })
  fileUrl: string;
}
