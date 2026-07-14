import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  Body,
  UseGuards,
  BadRequestException,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CompanyScopeGuard } from '../auth/company-scope.guard';
import { PortalSessionGuard } from '../portal/portal-session.guard';
import { Public } from '../auth/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

const PDF_MIME_TYPES = new Set(['application/pdf']);
const PORTAL_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

function allowMimeTypes(allowed: Set<string>) {
  return (_request: unknown, file: Express.Multer.File, callback: (error: Error | null, accept: boolean) => void) => {
    if (!allowed.has(file.mimetype)) {
      callback(new BadRequestException('Tipo de arquivo nao permitido'), false);
      return;
    }
    callback(null, true);
  };
}

@Controller('api/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('document')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Roles('ADMIN', 'COMPANY_ADMIN')
  @UseGuards(CompanyScopeGuard)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    fileFilter: allowMimeTypes(PDF_MIME_TYPES),
  }))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('companyId') companyId: string,
    @Body('type') type: string,
    @Body('validUntil') validUntil: string,
  ) {
    const normalizedType = type?.trim().toUpperCase() === 'PGR' ? 'PPRA' : type?.trim().toUpperCase();

    if (!file) {
      return { success: false, message: 'Arquivo nao enviado' };
    }
    if (!normalizedType || !['PCMSO', 'PPRA'].includes(normalizedType)) {
      return { success: false, message: 'Tipo deve ser PCMSO, PPRA ou PGR' };
    }
    if (file.mimetype !== 'application/pdf') {
      return { success: false, message: 'Apenas arquivos PDF sao aceitos para documentos' };
    }

    const doc = await this.uploadService.saveDocument(file, companyId, normalizedType, validUntil);
    return { success: true, data: doc };
  }

  @Public()
  @Post('file')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(PortalSessionGuard)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 8 * 1024 * 1024, files: 1 },
    fileFilter: allowMimeTypes(PORTAL_MIME_TYPES),
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { success: false, message: 'Arquivo nao enviado' };
    }
    const data = await this.uploadService.uploadFile(file);
    return { success: true, ...data };
  }

  @Post('exam-file')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Roles('ADMIN', 'CLINIC', 'OPERATOR')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 8 * 1024 * 1024, files: 1 },
    fileFilter: allowMimeTypes(PORTAL_MIME_TYPES),
  }))
  async uploadExamFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { success: false, message: 'Arquivo nao enviado' };
    }
    const data = await this.uploadService.uploadFile(file);
    return { success: true, ...data };
  }

  @Get('documents/:companyId')
  @Roles('ADMIN', 'COMPANY_ADMIN')
  @UseGuards(CompanyScopeGuard)
  async listDocuments(@Param('companyId') companyId: string) {
    const docs = await this.uploadService.listDocuments(companyId);
    return { success: true, data: docs };
  }

  @Get('documents/:companyId/file/:fileName')
  @Roles('ADMIN', 'COMPANY_ADMIN')
  @UseGuards(CompanyScopeGuard)
  async downloadDocument(
    @Param('companyId') companyId: string,
    @Param('fileName') fileName: string,
    @Res() response: Response,
  ) {
    const file = await this.uploadService.getDocumentFile(companyId, fileName);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${file.originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}"`,
    );
    response.send(file.buffer);
  }
}
