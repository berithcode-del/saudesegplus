import { IsString, IsNotEmpty } from 'class-validator';

export class EnviarDocumentoDto {
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;
}
