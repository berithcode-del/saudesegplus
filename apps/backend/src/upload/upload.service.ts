import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SupabaseStorageService } from './supabase-storage.service';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: SupabaseStorageService,
  ) {}

  async saveDocument(
    file: Express.Multer.File,
    companyId: string,
    type: string,
    validUntil: string,
  ) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    const { fileUrl, fileName } = await this.storage.uploadDocument(
      file,
      companyId,
      type,
    );

    const doc = await this.prisma.companyDocument.create({
      data: {
        companyId,
        type,
        fileUrl,
        originalName: file.originalname,
        validUntil: validUntil ? new Date(validUntil) : null,
      },
    });

    const updateData: Record<string, any> = {};
    if (type === 'PCMSO') {
      updateData.pcmsoDocumentUrl = fileUrl;
      updateData.pcmsoValidUntil = new Date(validUntil);
    }
    if (type === 'PPRA') {
      updateData.ppraDocumentUrl = fileUrl;
      updateData.ppraValidUntil = new Date(validUntil);
    }
    if (Object.keys(updateData).length > 0) {
      const current = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { status: true },
      });
      if (current?.status === 'CADASTRO_INCOMPLETO') {
        updateData.status = 'EM_ANALISE';
      }
      await this.prisma.company.update({
        where: { id: companyId },
        data: updateData,
      });
    }

    return doc;
  }

  async uploadFile(file: Express.Multer.File) {
    const { fileUrl, fileName } = await this.storage.uploadFile(file);
    return { fileUrl, fileName };
  }

  async listDocuments(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return this.prisma.companyDocument.findMany({
      where: { companyId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async getDocumentFile(companyId: string, fileName: string) {
    if (!/^[0-9a-f-]{36}\.pdf$/i.test(fileName)) {
      throw new NotFoundException('Documento não encontrado');
    }

    const document = await this.prisma.companyDocument.findFirst({
      where: {
        companyId,
        fileUrl: { endsWith: fileName },
      },
    });
    if (!document) throw new NotFoundException('Documento não encontrado');

    try {
      const buffer = await this.storage.downloadFile(
        `documents/${companyId}/${document.type}`,
        fileName,
      );
      return {
        buffer,
        originalName: document.originalName,
      };
    } catch {
      throw new NotFoundException('Documento não encontrado');
    }
  }
}
