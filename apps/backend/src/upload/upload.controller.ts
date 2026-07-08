import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Public()
  @Post('document')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('companyId') companyId: string,
    @Body('type') type: string,
    @Body('validUntil') validUntil: string,
  ) {
    if (!file) {
      return { success: false, message: 'Arquivo não enviado' };
    }
    if (!type || !['PCMSO', 'PPRA'].includes(type)) {
      return { success: false, message: 'Tipo deve ser PCMSO ou PPRA' };
    }
    if (file.mimetype !== 'application/pdf') {
      return { success: false, message: 'Apenas arquivos PDF são aceitos para documentos' };
    }
    const doc = await this.uploadService.saveDocument(file, companyId, type, validUntil);
    return { success: true, data: doc };
  }

  @Public()
  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { success: false, message: 'Arquivo não enviado' };
    }
    const data = await this.uploadService.uploadFile(file);
    return { success: true, ...data };
  }

  @Public()
  @Get('documents/:companyId')
  async listDocuments(@Param('companyId') companyId: string) {
    const docs = await this.uploadService.listDocuments(companyId);
    return { success: true, data: docs };
  }
}
