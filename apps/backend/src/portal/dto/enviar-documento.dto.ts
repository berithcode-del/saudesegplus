import { IsIn, IsNotEmpty, Matches, MaxLength } from 'class-validator';

export class EnviarDocumentoDto {
  @IsNotEmpty()
  @IsIn(['rg', 'cnh', 'foto', 'outro'])
  tipo: string;

  @IsNotEmpty()
  @MaxLength(200)
  @Matches(/^\/uploads\/files\/[0-9a-f-]{36}\.(pdf|jpg|png)$/i)
  fileUrl: string;
}
